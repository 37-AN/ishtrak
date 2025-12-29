import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolutionId = params.id
    const body = await request.json()
    const { rating, feedback } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Update the resolution with user rating
    const updatedResolution = await db.aiResolution.update({
      where: { id: resolutionId },
      data: {
        userRating: rating,
        userFeedback: feedback || null
      }
    })

    // Create or update knowledge base entry
    if (rating >= 4) {
      // High-rated resolutions go to knowledge base
      const existingKbEntry = await db.knowledgeBase.findFirst({
        where: {
          content: updatedResolution.resolutionText,
          contentType: 'resolution'
        }
      })

      if (existingKbEntry) {
        // Update existing entry
        await db.knowledgeBase.update({
          where: { id: existingKbEntry.id },
          data: {
            usageCount: existingKbEntry.usageCount + 1,
            averageRating: ((existingKbEntry.averageRating * existingKbEntry.usageCount) + rating) / (existingKbEntry.usageCount + 1)
          }
        })
      } else {
        // Create new knowledge base entry
        await db.knowledgeBase.create({
          data: {
            content: updatedResolution.resolutionText,
            contentType: 'resolution',
            averageRating: rating,
            usageCount: 1
          }
        })
      }
    }

    // Create rating record for analytics
    await db.aiRating.create({
      data: {
        userId: 'system-user', // In a real app, this would be the authenticated user ID
        targetType: 'resolution',
        targetId: resolutionId,
        rating,
        feedback: feedback || null
      }
    })

    return NextResponse.json({
      message: 'Rating submitted successfully',
      resolution: updatedResolution
    })
  } catch (error) {
    console.error('Failed to rate resolution:', error)
    return NextResponse.json(
      { error: 'Failed to rate resolution' },
      { status: 500 }
    )
  }
}