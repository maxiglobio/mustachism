import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { sendWaitlistConfirmationEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function cors(res: NextResponse, request: Request) {
  const origin = request.headers.get('origin')
  res.headers.set('Access-Control-Allow-Origin', origin || '*')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  return res
}

export async function OPTIONS(request: Request) {
  const res = new NextResponse(null, { status: 200 })
  const origin = request.headers.get('origin')
  res.headers.set('Access-Control-Allow-Origin', origin || '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('Access-Control-Max-Age', '86400')
  return res
}

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const s = raw.trim().toLowerCase()
  if (!s || !EMAIL_RE.test(s)) return null
  return s
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = normalizeEmail(body.email)
    if (!email) {
      return cors(
        NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 }),
        request
      )
    }

    let metadata: Prisma.InputJsonValue | undefined
    if (body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)) {
      metadata = body.metadata as Prisma.InputJsonValue
    }

    let isNewSignup = false
    try {
      await prisma.waitlistSignup.create({
        data: {
          email,
          ...(metadata !== undefined ? { metadata } : {}),
        },
      })
      isNewSignup = true
    } catch (e: unknown) {
      const code = e && typeof e === 'object' && 'code' in e ? (e as { code: string }).code : null
      if (code === 'P2002') {
        // Already on the list — same generic success; no duplicate email
      } else {
        throw e
      }
    }

    if (isNewSignup) {
      try {
        await sendWaitlistConfirmationEmail(email)
      } catch (emailErr) {
        console.error('Waitlist confirmation email failed:', emailErr)
      }
    }

    return cors(
      NextResponse.json({
        success: true,
        message: "You're on the list. We'll be in touch.",
      }),
      request
    )
  } catch (error) {
    console.error('Waitlist signup error:', error)
    return cors(
      NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 }),
      request
    )
  }
}
