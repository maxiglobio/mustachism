import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { releaseExpiredReservations } from '@/lib/orders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/licenses/next
 * Returns the first available license (lowest number, status = available)
 */
export async function GET() {
  try {
    await releaseExpiredReservations().catch((err) => console.error('[licenses/next] release failed', err))
    const license = await prisma.licenseNumber.findFirst({
      where: { status: 'available' },
      orderBy: { number: 'asc' },
      select: {
        number: true,
        price: true,
        priceTier: true,
      },
    })

    if (!license) {
      const response = NextResponse.json(
        { error: 'No available licenses' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const response = NextResponse.json({ license })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error fetching next license:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch next license' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
