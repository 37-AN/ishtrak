import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Simple text similarity function (in production, use proper embeddings)
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/)
  const words2 = text2.toLowerCase().split(/\s+/)
  
  const intersection = words1.filter(word => words2.includes(word))
  const union = [...new Set([...words1, ...words2])]
  
  return intersection.length / union.length
}

// Simple keyword extraction for vector representation
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'after', 'many', 'only', 'some', 'also', 'what', 'when', 'make', 'like', 'into', 'than', 'call', 'come', 'could', 'first', 'work', 'down', 'may', 'should', 'through', 'between', 'must', 'such', 'under', 'well', 'where', 'much', 'before', 'right', 'too', 'any', 'same', 'how', 'look', 'little', 'world', 'very', 'still', 'hand', 'old', 'life', 'tell', 'here', 'show', 'even', 'back', 'think', 'year', 'give', 'take', 'just', 'good', 'most', 'know', 'over', 'great', 'long', 'find', 'where', 'much', 'before', 'right', 'too', 'any', 'same'].includes(word))
  
  // Return unique keywords
  return [...new Set(words)]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, contentType = 'resolution', limit = 5 } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Get relevant knowledge base entries
    const knowledgeBase = await db.knowledgeBase.findMany({
      where: {
        contentType,
        averageRating: {
          gte: 3.5 // Only retrieve highly-rated content
        }
      },
      orderBy: [
        { averageRating: 'desc' },
        { usageCount: 'desc' }
      ],
      take: 50 // Get more entries to analyze
    })

    // Extract keywords from query
    const queryKeywords = extractKeywords(query)

    // Calculate similarity scores
    const scoredEntries = knowledgeBase.map(entry => {
      const contentKeywords = extractKeywords(entry.content)
      const commonKeywords = queryKeywords.filter(keyword => contentKeywords.includes(keyword))
      
      // Calculate similarity based on keyword overlap
      const keywordSimilarity = commonKeywords.length / Math.max(queryKeywords.length, contentKeywords.length)
      
      // Boost score based on rating and usage
      const ratingBoost = entry.averageRating / 5
      const usageBoost = Math.min(entry.usageCount / 10, 1) // Cap at 10 uses
      
      const finalScore = keywordSimilarity * 0.6 + ratingBoost * 0.3 + usageBoost * 0.1
      
      return {
        ...entry,
        similarityScore: finalScore,
        matchedKeywords: commonKeywords
      }
    })

    // Sort by similarity score and return top results
    const relevantEntries = scoredEntries
      .filter(entry => entry.similarityScore > 0.1) // Minimum similarity threshold
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit)

    // Also get related issues for additional context
    const relatedIssues = await db.issue.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query.split(' ').slice(0, 3).join(' '), // Use first 3 words of query
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: query.split(' ').slice(0, 3).join(' '),
              mode: 'insensitive'
            }
          },
          {
            category: {
              contains: query.split(' ')[0],
              mode: 'insensitive'
            }
          }
        ],
        status: 'resolved'
      },
      include: {
        resolutions: {
          where: {
            userRating: {
              gte: 4
            }
          },
          take: 1
        }
      },
      take: 3
    })

    // Update usage count for retrieved entries
    await Promise.all(
      relevantEntries.map(entry =>
        db.knowledgeBase.update({
          where: { id: entry.id },
          data: {
            usageCount: {
              increment: 1
            }
          }
        })
      )
    )

    return NextResponse.json({
      relevantEntries: relevantEntries.map(entry => ({
        id: entry.id,
        content: entry.content,
        contentType: entry.contentType,
        averageRating: entry.averageRating,
        similarityScore: Math.round(entry.similarityScore * 100) / 100,
        matchedKeywords: entry.matchedKeywords
      })),
      relatedIssues: relatedIssues.map(issue => ({
        id: issue.id,
        title: issue.title,
        category: issue.category,
        severity: issue.severity,
        resolution: issue.resolutions[0]?.resolutionText || null
      })),
      queryKeywords
    })
  } catch (error) {
    console.error('Failed to retrieve relevant content:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve relevant content' },
      { status: 500 }
    )
  }
}