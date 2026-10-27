import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { completeOrder } from '@/lib/orders'
import { verifyWebhook } from '@/lib/shopify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ShopifyOrder = {
  id: number
  name: string
  email?: string
  financial_status?: string
  line_items: Array<{
    variant_id: number
    title: string
    price: string
    properties?: Array<{ name: string; value: string }>
  }>
}

/**
 * POST /api/shopify/webhook — Shopify "Order payment" (orders/paid).
 * Verifies the signature, finds our order via the hidden `_order_id` line property, and issues
 * the licence. Always answers 200 once verified, so Shopify doesn't retry or disable the hook;
 * problems are logged (and conflicts flagged on the order) for manual follow-up.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text()
  if (!verifyWebhook(raw, request.headers.get('x-shopify-hmac-sha256'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const topic = request.headers.get('x-shopify-topic')
  if (topic && topic !== 'orders/paid') return NextResponse.json({ ignored: topic })

  let order: ShopifyOrder
  try {
    order = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 })
  }

  const results = []
  for (const line of order.line_items ?? []) {
    const orderId = line.properties?.find((p) => p.name === '_order_id')?.value
    if (!orderId) continue

    // The paid variant must be the package this order was checked out with.
    const ours = await prisma.order.findUnique({ where: { id: orderId }, select: { shippingAddress: true } })
    const expectedVariant = (ours?.shippingAddress as { variantId?: string } | null)?.variantId
    if (expectedVariant && expectedVariant !== `gid://shopify/ProductVariant/${line.variant_id}`) {
      console.error(`[shopify/webhook] ${order.name}: variant ${line.variant_id} does not match order ${orderId}`)
      results.push({ orderId, ok: false })
      continue
    }

    const result = await completeOrder(orderId, {
      pricePaid: Number(line.price),
      shopify: {
        orderId: order.id,
        orderName: order.name,
        variantId: line.variant_id,
        email: order.email,
        paidAt: new Date().toISOString(),
      },
    })
    if (!result.ok) console.error(`[shopify/webhook] ${order.name}: ${result.reason} (order ${orderId})`)
    results.push({ orderId, ok: result.ok })
  }

  if (!results.length) console.warn(`[shopify/webhook] ${order.name}: no Mustachism line items`)
  return NextResponse.json({ received: true, results })
}
