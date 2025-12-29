import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // Calculate date range based on timeRange
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Overview metrics
    const totalIssues = await db.issue.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    })

    const resolvedIssues = await db.issue.count({
      where: {
        createdAt: {
          gte: startDate
        },
        status: 'resolved'
      }
    })

    const issuesWithResolutions = await db.issue.count({
      where: {
        createdAt: {
          gte: startDate
        },
        resolutions: {
          some: {}
        }
      }
    })

    const aiResolutionRate = totalIssues > 0 ? (issuesWithResolutions / totalIssues) * 100 : 0

    // Calculate average resolution time
    const resolvedIssuesWithTime = await db.issue.findMany({
      where: {
        createdAt: {
          gte: startDate
        },
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

    // Average user rating
    const ratings = await db.aiRating.aggregate({
      _avg: {
        rating: true
      },
      where: {
        createdAt: {
          gte: startDate
        },
        rating: {
          not: null
        }
      }
    })

    const avgUserRating = ratings._avg.rating || 0

    // SOP count
    const sopCount = await db.aiSop.count({
      where: {
        generatedAt: {
          gte: startDate
        }
      }
    })

    // Category breakdown
    const categories = await db.issue.groupBy({
      by: ['category'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    })

    const categoryData = await Promise.all(
      categories.map(async (cat) => {
        const resolved = await db.issue.count({
          where: {
            category: cat.category,
            status: 'resolved',
            createdAt: {
              gte: startDate
            }
          }
        })

        const ratingsForCategory = await db.aiRating.aggregate({
          _avg: {
            rating: true
          },
          where: {
            targetType: 'resolution',
            createdAt: {
              gte: startDate
            }
          }
        })

        return {
          name: cat.category,
          count: cat._count.id,
          resolved,
          avgRating: ratingsForCategory._avg.rating || 0
        }
      })
    )

    // Severity breakdown
    const severityData = await Promise.all(
      ['low', 'medium', 'high', 'critical'].map(async (severity) => {
        const count = await db.issue.count({
          where: {
            severity,
            createdAt: {
              gte: startDate
            }
          }
        })

        const resolved = await db.issue.count({
          where: {
            severity,
            status: 'resolved',
            createdAt: {
              gte: startDate
            }
          }
        })

        const resolvedWithTime = await db.issue.findMany({
          where: {
            severity,
            status: 'resolved',
            resolvedAt: {
              not: null
            },
            createdAt: {
              gte: startDate
            }
          },
          select: {
            createdAt: true,
            resolvedAt: true
          }
        })

        let avgTime = 0
        if (resolvedWithTime.length > 0) {
          const totalTime = resolvedWithTime.reduce((sum, issue) => {
            if (issue.resolvedAt) {
              const diffInMs = issue.resolvedAt.getTime() - issue.createdAt.getTime()
              return sum + (diffInMs / (1000 * 60 * 60))
            }
            return sum
          }, 0)
          avgTime = totalTime / resolvedWithTime.length
        }

        return {
          level: severity,
          count,
          resolved,
          avgResolutionTime: Math.round(avgTime * 100) / 100
        }
      })
    )

    // Monthly trends (simplified for demo)
    const months = []
    const currentDate = new Date(startDate)
    
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 0)
      
      const monthName = monthStart.toLocaleString('default', { month: 'short', year: '2-digit' })
      
      const issuesInMonth = await db.issue.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      const resolvedInMonth = await db.issue.count({
        where: {
          resolvedAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      const ratingInMonth = await db.aiRating.aggregate({
        _avg: {
          rating: true
        },
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      months.push({
        month: monthName,
        count: issuesInMonth,
        resolved: resolvedInMonth,
        avgRating: ratingInMonth._avg.rating || 0
      })
    }

    const analyticsData = {
      overview: {
        totalIssues,
        resolvedIssues,
        aiResolutionRate: Math.round(aiResolutionRate * 100) / 100,
        avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
        avgUserRating: Math.round(avgUserRating * 100) / 100,
        sopCount
      },
      trends: {
        issuesByMonth: months.map(m => ({ month: m.month, count: m.count })),
        resolutionsByMonth: months.map(m => ({ month: m.month, count: m.resolved })),
        ratingsByMonth: months.map(m => ({ month: m.month, avgRating: m.avgRating }))
      },
      categories: categoryData,
      severity: severityData,
      aiPerformance: {
        modelUsed: 'gemma3:4b',
        totalResolutions: issuesWithResolutions,
        avgRating: Math.round(avgUserRating * 100) / 100,
        successRate: Math.round((resolvedIssues / totalIssues) * 10000) / 100
      }
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}