import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSession, verifyLoginToken } from '@/lib/auth'

export const runtime = 'nodejs'

/**
 * GET /api/auth/verify?token=… - magic-link target: sets the signed session and lands on the dashboard.
 */
export async function GET(request: NextRequest) {
  const fail = () => NextResponse.redirect(new URL('/login?error=link', request.url))

  try {
    const token = request.nextUrl.searchParams.get('token')
    const claim = token ? verifyLoginToken(token) : null
    if (!claim) return fail()

    const user = await prisma.user.findUnique({
      where: { id: claim.userId },
      select: { id: true, email: true },
    })
    if (!user || user.email !== claim.email) return fail()

    await createSession(user.id, user.email)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Error verifying login link:', error)
    return fail()
  }
}
