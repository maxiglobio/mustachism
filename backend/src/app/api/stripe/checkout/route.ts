import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith('sk_test_dummy')) return null
  return new Stripe(key)
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  let orderId: string | undefined
  try {
    const body = await request.json()
    orderId = body.orderId

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order with user info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get license number and price from order metadata
    const shippingAddress = order.shippingAddress as any
    const licenseNumber = shippingAddress?.licenseNumber

    if (!licenseNumber) {
      return NextResponse.json(
        { error: 'License number not found in order' },
        { status: 400 }
      )
    }

    // Get license price
    const licenseNumberRecord = await prisma.licenseNumber.findUnique({
      where: { number: licenseNumber },
    })

    if (!licenseNumberRecord) {
      return NextResponse.json(
        { error: 'License number record not found' },
        { status: 404 }
      )
    }

    const priceInCents = Math.round(licenseNumberRecord.price * 100)

    // Stripe requires minimum 50 cents for USD
    const effectivePriceInCents = Math.max(priceInCents, 50)

    // Demo mode: if Stripe key is not set or is dummy, return mock checkout URL
    const stripe = getStripe()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    if (!stripe) {
      // Return a mock checkout URL that redirects to success (demo mode)
      const response = NextResponse.json({
        url: `${baseUrl}/api/stripe/success?orderId=${orderId}&session_id=mock_session`,
      })
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const successUrl = `${baseUrl}/api/stripe/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/personal-info.html?canceled=true`

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Mustache License ${licenseNumber}`,
              description: `Official Mustache License for ${licenseNumber}`,
            },
            unit_amount: effectivePriceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: order.user.email,
      metadata: {
        orderId: order.id,
        licenseNumber,
      },
    })

    const response = NextResponse.json({ url: session.url })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error: any) {
    console.error('Error creating Stripe checkout:', error)
    const isDev = process.env.NODE_ENV === 'development'

    // In development: fall back to demo mode if Stripe API fails (e.g. invalid/missing key)
    if (isDev && orderId) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const response = NextResponse.json({
        url: `${baseUrl}/api/stripe/success?orderId=${orderId}&session_id=mock_session`,
      })
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const errorMessage = error?.message || 'Failed to create checkout session'
    const stripeMessage = error?.raw?.message || error?.code
    const response = NextResponse.json(
      {
        error: 'Failed to create checkout session',
        ...(isDev && { details: errorMessage, stripeMessage }),
      },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}
