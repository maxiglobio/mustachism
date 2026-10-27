import { NextRequest, NextResponse } from 'next/server'
import { releaseExpiredReservations } from '@/lib/orders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Daily backstop (vercel.json cron). Reservations are also released lazily on every checkout. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const released = await releaseExpiredReservations()
  return NextResponse.json({ released })
}
