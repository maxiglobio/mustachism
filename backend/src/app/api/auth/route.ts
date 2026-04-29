import { NextRequest, NextResponse } from 'next/server'
import { getSession, destroySession } from '@/lib/auth'

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      const response = NextResponse.json({ authenticated: false })
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const response = NextResponse.json({
      authenticated: true,
      userId: session.userId,
      email: session.email,
    })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error checking auth:', error)
    const response = NextResponse.json(
      { error: 'Failed to check authentication' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email } = body

    if (action === 'logout') {
      await destroySession()
      return NextResponse.json({ success: true })
    }

    // For demo purposes, we don't need a login endpoint
    // Sessions are created automatically after payment
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in auth:', error)
    return NextResponse.json(
      { error: 'Failed to process auth request' },
      { status: 500 }
    )
  }
}
