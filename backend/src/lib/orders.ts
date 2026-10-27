import 'server-only'
import { createHmac } from 'node:crypto'
import { prisma } from './db'
import { sendConfirmationEmail } from './email'

/** How long a number stays reserved while the customer is in Shopify checkout. */
export const RESERVATION_MINUTES = 60

/** Order statuses: pending (form saved) → checkout (number reserved, at Shopify) → processing
 *  (paid, licence issued) | expired (checkout abandoned) | conflict (paid, number lost). */
type OrderMeta = Record<string, unknown> & {
  licenseNumber?: string
  fullName?: string | null
  prefix?: string | null
  sex?: string | null
  dateOfBirth?: string | null
  photo?: string | null
}

/**
 * Reserve a licence number atomically. Returns false if someone else holds it.
 * (updateMany with a status guard is a compare-and-set: only one request can win.)
 */
export async function reserveNumber(number: string) {
  const { count } = await prisma.licenseNumber.updateMany({
    where: { number, status: 'available' },
    data: { status: 'reserved' },
  })
  return count === 1
}

/**
 * Put numbers back on sale when their checkout was abandoned. Called lazily from the licence
 * endpoints and checkout (cheap), plus a daily cron as a backstop.
 */
export async function releaseExpiredReservations() {
  const cutoff = new Date(Date.now() - RESERVATION_MINUTES * 60_000)
  const stale = await prisma.order.findMany({
    where: { status: 'checkout', createdAt: { lt: cutoff } },
    select: { id: true, shippingAddress: true },
    take: 200,
  })
  for (const o of stale) {
    const number = (o.shippingAddress as OrderMeta)?.licenseNumber
    await prisma.$transaction([
      prisma.order.update({ where: { id: o.id }, data: { status: 'expired' } }),
      ...(number
        ? [prisma.licenseNumber.updateMany({ where: { number, status: 'reserved' }, data: { status: 'available' } })]
        : []),
    ])
  }
  return stale.length
}

/**
 * Turn a paid order into an issued licence: create the License row, mark the number taken,
 * advance the order, send the confirmation. Idempotent — safe to call twice for one order.
 */
export async function completeOrder(
  orderId: string,
  payment: { pricePaid?: number; shopify?: Record<string, unknown> } = {},
) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } })
  if (!order) return { ok: false as const, reason: 'order-not-found' }

  const meta = (order.shippingAddress ?? {}) as OrderMeta
  const number = meta.licenseNumber
  if (!number) return { ok: false as const, reason: 'no-number' }

  const existing = await prisma.license.findUnique({ where: { licenseNumber: number } })
  if (existing) {
    if (existing.userId === order.userId) return { ok: true as const, license: existing, order, already: true }
    // Paid, but the number went to someone else (reservation expired and was re-sold).
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'conflict', shippingAddress: { ...meta, ...(payment.shopify ? { shopify: payment.shopify } : {}) } as object },
    })
    console.error(`[orders] conflict: order ${orderId} paid for ${number}, already issued to another user`)
    return { ok: false as const, reason: 'number-taken' }
  }

  const numberRow = await prisma.licenseNumber.findUnique({ where: { number } })

  let dateOfBirth: Date | undefined
  if (meta.dateOfBirth) {
    const d = new Date(meta.dateOfBirth)
    if (!Number.isNaN(d.getTime()) && d.getFullYear() >= 1900 && d.getFullYear() <= 2100) dateOfBirth = d
  }
  const fullName = (meta.fullName || '').toUpperCase() || undefined

  const license = await prisma.$transaction(async (tx) => {
    const created = await tx.license.create({
      data: {
        licenseNumber: number,
        userId: order.userId,
        pricePaid: payment.pricePaid ?? numberRow?.price ?? 0,
        status: 'active',
        ...(fullName && { fullName }),
        ...(meta.photo && { photo: meta.photo }),
        ...(meta.sex && { sex: meta.sex }),
        ...(dateOfBirth && { dateOfBirth }),
      },
    })
    await tx.order.update({
      where: { id: orderId },
      data: {
        licenseId: created.id,
        status: 'processing',
        ...(payment.shopify ? { shippingAddress: { ...meta, shopify: payment.shopify } as object } : {}),
      },
    })
    await tx.licenseNumber.update({ where: { number }, data: { status: 'taken' } })
    return created
  })

  await sendConfirmationEmail({
    to: order.user.email,
    subject: 'Your Mustache Is Officially Licensed',
    licenseNumber: number,
    firstName: order.user.firstName,
    lastName: order.user.lastName,
  }).catch((err) => console.error('[orders] confirmation email failed', err))

  return { ok: true as const, license, order, already: false }
}

/** Signed, unguessable link to an order's photo, for the engraving team in Shopify Admin. */
function photoSecret() {
  return process.env.PHOTO_LINK_SECRET || process.env.SHOPIFY_WEBHOOK_SECRET || ''
}

export function photoSignature(orderId: string) {
  return createHmac('sha256', photoSecret()).update(`photo:${orderId}`).digest('base64url').slice(0, 32)
}

export function photoUrl(orderId: string, origin: string) {
  return `${origin}/api/orders/${orderId}/photo?sig=${photoSignature(orderId)}`
}
