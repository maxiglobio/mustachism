import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { photoSignature } from '@/lib/orders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/orders/:id/photo?sig=… — the customer's photo for engraving. Linked from the Shopify
 * order (line property "Photo"); only works with the signature generated for that order.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sig = request.nextUrl.searchParams.get('sig') || ''
  const expected = photoSignature(id)
  const ok =
    !!(process.env.PHOTO_LINK_SECRET || process.env.SHOPIFY_WEBHOOK_SECRET) &&
    sig.length === expected.length &&
    timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  if (!ok) return new NextResponse('Not found', { status: 404 })

  const order = await prisma.order.findUnique({ where: { id }, select: { shippingAddress: true } })
  const photo = (order?.shippingAddress as { photo?: string | null } | null)?.photo
  const match = photo && /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(photo)
  if (!match) return new NextResponse('No photo', { status: 404 })

  return new NextResponse(Buffer.from(match[2], 'base64'), {
    headers: {
      'Content-Type': match[1],
      'Content-Disposition': `inline; filename="mustachism-${id}.${match[1].split('/')[1].replace('jpeg', 'jpg')}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
