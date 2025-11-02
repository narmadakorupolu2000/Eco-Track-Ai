import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward the request to the FastAPI backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001'
    
    const response = await fetch(`${backendUrl}/api/contact/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      return NextResponse.json(data)
    } else {
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error('Contact form API error:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
}