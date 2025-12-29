import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = params.id

    // Update issue status to resolved
    const updatedIssue = await db.issue.update({
      where: { id: issueId },
      data: {
        status: 'resolved',
        resolvedAt: new Date()
      }
    })

    // Trigger SOP generation in background
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/generate-sop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ issueId }),
    }).catch(err => console.error('Failed to generate SOP:', err))

    return NextResponse.json({
      issue: updatedIssue,
      message: 'Issue resolved successfully'
    })
  } catch (error) {
    console.error('Failed to resolve issue:', error)
    return NextResponse.json(
      { error: 'Failed to resolve issue' },
      { status: 500 }
    )
  }
}