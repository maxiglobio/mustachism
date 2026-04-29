import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { readSessionFromCookies } from '@/lib/auth'

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

/**
 * GET /api/user/licenses - Fetch current user's licenses (requires auth)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await readSessionFromCookies()

    if (!session?.userId) {
      const response = NextResponse.json(
        { error: 'Unauthorized', licenses: [] },
        { status: 401 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Single query: verify user exists and load licenses (skip `photo` — can be huge base64)
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        licenses: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            licenseNumber: true,
            status: true,
            issueDate: true,
            pricePaid: true,
            fullName: true,
          },
        },
      },
    })

    if (!user) {
      const response = NextResponse.json(
        { error: 'Unauthorized', licenses: [] },
        { status: 401 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const response = NextResponse.json({ licenses: user.licenses })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error fetching user licenses:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch licenses', licenses: [] },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}
