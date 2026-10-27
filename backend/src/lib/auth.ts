import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { prisma } from './db'

const SESSION_COOKIE_NAME = 'mustashism_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const LOGIN_TOKEN_MAX_AGE = 60 * 15 // 15 minutes

export interface Session {
  userId: string
  email: string
}

/** Mixed into the HMAC so a login link can't be replayed as a session cookie (or vice versa). */
type TokenPurpose = 'session' | 'login'

interface TokenPayload extends Session {
  exp: number
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()
  if (!secret) {
    throw new Error('SESSION_SECRET (or NEXTAUTH_SECRET) must be set to sign sessions')
  }
  return secret
}

function hmac(purpose: TokenPurpose, body: string): Buffer {
  return createHmac('sha256', getSecret()).update(`${purpose}.${body}`).digest()
}

/** `base64url(payload).base64url(hmac)`; the payload carries its own expiry. */
function signToken(purpose: TokenPurpose, session: Session, maxAgeSeconds: number): string {
  const payload: TokenPayload = {
    userId: session.userId,
    email: session.email,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${hmac(purpose, body).toString('base64url')}`
}

/** Valid, unexpired token → session; anything else (incl. legacy unsigned JSON cookies) → null. */
function verifyToken(purpose: TokenPurpose, token: string): Session | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts

  try {
    const expected = hmac(purpose, body)
    const given = Buffer.from(sig, 'base64url')
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      return null
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Partial<TokenPayload>
    if (
      typeof payload.userId !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.exp !== 'number' ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null
    }
    return { userId: payload.userId, email: payload.email }
  } catch {
    return null
  }
}

/**
 * Create a session for a user
 */
export async function createSession(userId: string, email: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, signToken('session', { userId, email }, SESSION_MAX_AGE), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

/**
 * Read session payload from cookies only (no DB). Use for routes that validate
 * the user in the same query as their data to avoid double round-trips.
 * A tampered, expired or legacy unsigned cookie is cleared.
 */
export async function readSessionFromCookies(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie?.value) {
    return null
  }

  const session = verifyToken('session', sessionCookie.value)
  if (!session) {
    try {
      cookieStore.delete(SESSION_COOKIE_NAME)
    } catch {
      /* read-only cookie store (Server Component render) */
    }
  }
  return session
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  const session = await readSessionFromCookies()
  if (!session) {
    return null
  }

  // Verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  })

  if (!user) {
    return null
  }

  return session
}

/**
 * Destroy the current session
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

/**
 * Signed magic-link token (15 min expiry). Not single-use: valid until it expires.
 */
export function createLoginToken(userId: string, email: string): string {
  return signToken('login', { userId, email }, LOGIN_TOKEN_MAX_AGE)
}

export function verifyLoginToken(token: string): Session | null {
  return verifyToken('login', token)
}
