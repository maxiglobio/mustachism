import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'
import { completeOrder } from '@/lib/orders'

/**
 * POST /api/payment — DEMO ONLY. Issues a licence without taking payment, for local testing
 * of the order flow. Disabled in production (real orders complete via the Shopify webhook)
 * unless ALLOW_DEMO_PAYMENT=true is set explicitly.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_PAYMENT !== 'true') {
    return NextResponse.json({ error: 'Demo payment is disabled.' }, { status: 410 })
  }
  const { orderId } = (await request.json().catch(() => ({}))) as { orderId?: string }
  if (!orderId) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })

  try {
    const result = await completeOrder(orderId)
    if (!result.ok) {
      const status = result.reason === 'order-not-found' ? 404 : 400
      return NextResponse.json({ error: 'License number is not available', reason: result.reason }, { status })
    }
    await createSession(result.order.user.id, result.order.user.email)
    return NextResponse.json({
      success: true,
      licenseId: result.license.id,
      licenseNumber: result.license.licenseNumber,
      alreadyCompleted: result.already,
    })
  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}
