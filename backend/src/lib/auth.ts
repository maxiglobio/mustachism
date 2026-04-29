import { cookies } from 'next/headers'
import { prisma } from './db'

const SESSION_COOKIE_NAME = 'mustashism_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface Session {
  userId: string
  email: string
}

/**
 * Create a session for a user
 */
export async function createSession(userId: string, email: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify({ userId, email }), {
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
 */
export async function readSessionFromCookies(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie?.value) {
    return null
  }

  try {
    return JSON.parse(sessionCookie.value) as Session
  } catch {
    return null
  }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
  
  if (!sessionCookie?.value) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value) as Session
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })
    
    if (!user) {
      return null
    }
    
    return session
  } catch {
    return null
  }
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
