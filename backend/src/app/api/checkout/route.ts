import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { photoUrl, releaseExpiredReservations, reserveNumber, RESERVATION_MINUTES } from '@/lib/orders'
import { createCheckout, getPackages, isShopifyConfigured, type PackageId } from '@/lib/shopify'
import { isWaitlistOnly } from '@/lib/site-mode'
import { getPublicSiteUrl } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  package?: PackageId
  licenseNumber?: string
  licenseType?: string
  fullName?: string
  prefix?: string
  email?: string
  sex?: string
  dateOfBirth?: string
  photo?: string | null
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

/**
 * POST /api/checkout
 * Reserves the licence number in Supabase, saves the order, and returns a Shopify checkout URL
 * for the chosen package. The Shopify "Order payment" webhook completes the order.
 */
export async function POST(request: NextRequest) {
  if (isWaitlistOnly()) return bad('Ordering is not open yet.', 403)
  if (!isShopifyConfigured()) return bad('Checkout is not configured.', 503)

  const body = (await request.json().catch(() => ({}))) as Body
  const { licenseNumber, fullName, email, sex, dateOfBirth } = body
  const pkgId: PackageId = body.package === 'pro' ? 'pro' : 'basic'
  if (!licenseNumber || !fullName?.trim() || !email?.trim() || !sex || !dateOfBirth) {
    return bad('Please fill in all required fields.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return bad('Please enter a valid email address.')
  if (body.photo && body.photo.length > 7_500_000) return bad('Photo is too large (max 5 MB).')

  const packages = await getPackages().catch(() => [])
  const pkg = packages.find((p) => p.id === pkgId)
  if (!pkg || !pkg.available) return bad('That package is not available right now.', 409)

  await releaseExpiredReservations().catch((err) => console.error('[checkout] release failed', err))
  if (!(await reserveNumber(licenseNumber))) {
    return bad('Sorry — that number was just taken. Please choose another.', 409)
  }

  let orderId: string | null = null
  try {
    const cleanEmail = email.trim().toLowerCase()
    const name = fullName.trim()
    const parts = name.split(/\s+/)
    const user =
      (await prisma.user.findUnique({ where: { email: cleanEmail } })) ??
      (await prisma.user.create({
        data: { email: cleanEmail, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || parts[0] || '' },
      }))

    const cardName = (body.prefix ? `${body.prefix.replace(/\.$/, '')} ${name}` : name).toUpperCase()
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: 'checkout',
        licenseType: body.licenseType || 'A',
        shippingAddress: {
          country: '',
          city: '',
          addressLine: '',
          zip: '',
          licenseNumber,
          fullName: cardName,
          prefix: body.prefix || null,
          sex,
          dateOfBirth,
          photo: body.photo || null,
          package: pkgId,
          variantId: pkg.variantId,
          reservedAt: new Date().toISOString(),
        },
      },
    })

    orderId = order.id
    // Photo link is read by staff in Shopify Admin: build it from config, not the Host header.
    const origin = process.env.NODE_ENV === 'production' ? getPublicSiteUrl() : new URL(request.url).origin
    const cart = await createCheckout({
      variantId: pkg.variantId,
      email: cleanEmail,
      attributes: {
        'License number': licenseNumber,
        'Name on card': cardName,
        Sex: sex,
        'Date of birth': dateOfBirth,
        Class: body.licenseType || 'A',
        Photo: body.photo ? photoUrl(order.id, origin) : 'No photo (logo engraved)',
        _order_id: order.id,
      },
    })

    return NextResponse.json({
      checkoutUrl: cart.checkoutUrl,
      orderId: order.id,
      reservedMinutes: RESERVATION_MINUTES,
    })
  } catch (err) {
    // Give the number back if anything after the reservation failed.
    await prisma.licenseNumber
      .updateMany({ where: { number: licenseNumber, status: 'reserved' }, data: { status: 'available' } })
      .catch(() => undefined)
    if (orderId) await prisma.order.update({ where: { id: orderId }, data: { status: 'expired' } }).catch(() => undefined)
    console.error('[checkout]', err)
    return bad('Could not start checkout. Please try again.', 502)
  }
}
