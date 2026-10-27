import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createLoginToken } from '@/lib/auth'
import { getPublicSiteUrl, sendLoginLinkEmail } from '@/lib/email'

export const runtime = 'nodejs'

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

/**
 * Link base comes from config in production, never from the Host header,
 * so a spoofed Host can't make us email a valid token to someone else's domain.
 */
function linkBase(request: NextRequest): string {
  return process.env.NODE_ENV === 'production' ? getPublicSiteUrl() : request.nextUrl.origin
}

/**
 * POST /api/auth/login - email a magic sign-in link.
 * Always answers the same way so the endpoint doesn't reveal which emails hold a license.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim() : ''

    if (!email) {
      const response = NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Only users who hold a license can sign in
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        licenses: { some: {} },
      },
      select: { id: true, email: true },
    })

    if (user) {
      const token = createLoginToken(user.id, user.email)
      const link = `${linkBase(request)}/api/auth/verify?token=${encodeURIComponent(token)}`
      await sendLoginLinkEmail(user.email, link)
    }

    const response = NextResponse.json({ success: true })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error sending login link:', error)
    const response = NextResponse.json(
      { error: 'Failed to send sign-in link' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}
