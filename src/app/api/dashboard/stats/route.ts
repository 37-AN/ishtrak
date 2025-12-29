import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get total issues count
    const totalIssues = await db.issue.count()

    // Get open issues count
    const openIssues = await db.issue.count({
      where: {
        status: 'open'
      }
    })

    // Get resolved issues count
    const resolvedIssues = await db.issue.count({
      where: {
        status: 'resolved'
      }
    })

    // Calculate average resolution time (in hours)
    const resolvedIssuesWithTime = await db.issue.findMany({
      where: {
        status: 'resolved',
        resolvedAt: {
          not: null
        }
      },
      select: {
        createdAt: true,
        resolvedAt: true
      }
    })

    let avgResolutionTime = 0
    if (resolvedIssuesWithTime.length > 0) {
      const totalResolutionTime = resolvedIssuesWithTime.reduce((sum, issue) => {
        if (issue.resolvedAt) {
          const diffInMs = issue.resolvedAt.getTime() - issue.createdAt.getTime()
          return sum + (diffInMs / (1000 * 60 * 60)) // Convert to hours
        }
        return sum
      }, 0)
      avgResolutionTime = totalResolutionTime / resolvedIssuesWithTime.length
    }

    // Calculate AI resolution rate
    const issuesWithResolutions = await db.issue.count({
      where: {
        resolutions: {
          some: {}
        }
      }
    })

    const aiResolutionRate = totalIssues > 0 ? (issuesWithResolutions / totalIssues) * 100 : 0

    // Calculate average user rating
    const ratings = await db.aiRating.aggregate({
      _avg: {
        rating: true
      },
      where: {
        rating: {
          not: null
        }
      }
    })

    const avgUserRating = ratings._avg.rating || 0

    return NextResponse.json({
      totalIssues,
      openIssues,
      resolvedIssues,
      avgResolutionTime: Math.round(avgResolutionTime * 100) / 100, // Round to 2 decimal places
      aiResolutionRate: Math.round(aiResolutionRate * 100) / 100,
      avgUserRating: Math.round(avgUserRating * 100) / 100
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}