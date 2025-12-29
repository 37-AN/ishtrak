import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const sops = await db.aiSop.findMany({
      include: {
        issue: {
          select: {
            id: true,
            title: true,
            category: true,
            severity: true,
            resolvedAt: true
          }
        }
      },
      orderBy: {
        generatedAt: 'desc'
      }
    })

    return NextResponse.json(sops)
  } catch (error) {
    console.error('Failed to fetch SOPs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SOPs' },
      { status: 500 }
    )
  }
}