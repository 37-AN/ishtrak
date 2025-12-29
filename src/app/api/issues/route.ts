import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const issues = await db.issue.findMany({
      include: {
        reporter: {
          select: {
            name: true,
            email: true
          }
        },
        resolutions: {
          select: {
            id: true,
            resolutionText: true,
            userRating: true,
            generatedAt: true
          }
        },
        sops: {
          select: {
            id: true,
            sopText: true,
            userRating: true,
            generatedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the frontend interface
    const transformedIssues = issues.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      category: issue.category,
      severity: issue.severity,
      environment: issue.environment,
      systemAffected: issue.systemAffected,
      status: issue.status,
      reporterName: issue.reporter?.name || 'Unknown',
      reporterEmail: issue.reporter?.email || 'unknown@example.com',
      createdAt: issue.createdAt.toISOString(),
      resolvedAt: issue.resolvedAt?.toISOString(),
      resolutions: issue.resolutions,
      sops: issue.sops
    }))

    return NextResponse.json(transformedIssues)
  } catch (error) {
    console.error('Failed to fetch issues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      category,
      severity,
      environment,
      systemAffected,
      reporterName,
      reporterEmail
    } = body

    // Validate required fields
    if (!title || !description || !category || !severity || !environment || !systemAffected || !reporterName || !reporterEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { email: reporterEmail }
    })

    if (!user) {
      user = await db.user.create({
        data: {
          email: reporterEmail,
          name: reporterName
        }
      })
    } else if (!user.name) {
      // Update user name if it's missing
      user = await db.user.update({
        where: { id: user.id },
        data: { name: reporterName }
      })
    }

    // Create the issue
    const issue = await db.issue.create({
      data: {
        title,
        description,
        category,
        severity,
        environment,
        systemAffected,
        status: 'open',
        reporterId: user.id
      },
      include: {
        reporter: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      issueId: issue.id,
      message: 'Issue created successfully'
    })
  } catch (error) {
    console.error('Failed to create issue:', error)
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    )
  }
}