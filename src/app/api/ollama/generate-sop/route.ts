import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const ollamaResponse = await fetch('http://localhost:3031/generate-sop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!ollamaResponse.ok) {
      const errorData = await ollamaResponse.text()
      return NextResponse.json(
        { error: 'Ollama service error', details: errorData },
        { status: ollamaResponse.status }
      )
    }

    const data = await ollamaResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Ollama SOP generation error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to Ollama service' },
      { status: 503 }
    )
  }
}