import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/ollama', '')
  const searchParams = url.searchParams
  
  try {
    const ollamaUrl = `http://localhost:3031${path}?${searchParams.toString()}`
    
    const response = await fetch(ollamaUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Ollama service unavailable' },
        { status: 503 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Ollama proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to Ollama service' },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/ollama', '')
  
  try {
    const body = await request.json()
    const ollamaUrl = `http://localhost:3031${path}`
    
    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.text()
      return NextResponse.json(
        { error: 'Ollama service error', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Ollama proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to Ollama service' },
      { status: 503 }
    )
  }
}