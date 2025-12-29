import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const resolutions = await db.aiResolution.findMany({
      include: {
        issue: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            severity: true,
            status: true
          }
        }
      },
      orderBy: {
        generatedAt: 'desc'
      }
    })

    return NextResponse.json(resolutions)
  } catch (error) {
    console.error('Failed to fetch AI resolutions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI resolutions' },
      { status: 500 }
    )
  }
}