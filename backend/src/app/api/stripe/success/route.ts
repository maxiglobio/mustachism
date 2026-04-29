import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { sendConfirmationEmail } from '@/lib/email'

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith('sk_test_dummy')) return null
  return new Stripe(key)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')
    const sessionId = searchParams.get('session_id')

    if (!orderId) {
      return NextResponse.redirect(
        new URL('/license-select.html?error=missing_order', request.url)
      )
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
      },
    })

    if (!order) {
      return NextResponse.redirect(
        new URL('/license-select.html?error=order_not_found', request.url)
      )
    }

    // Verify Stripe session (skip in demo mode)
    const stripe = getStripe()
    if (sessionId && sessionId !== 'mock_session' && stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId as string)
        if (session.payment_status !== 'paid') {
          return NextResponse.redirect(
            new URL('/personal-info.html?error=payment_failed', request.url)
          )
        }
      } catch (error) {
        console.error('Error verifying Stripe session:', error)
        // In demo mode, continue anyway
      }
    }

    // Get license number from order metadata
    const shippingAddress = order.shippingAddress as any
    const licenseNumber = shippingAddress?.licenseNumber

    if (!licenseNumber) {
      return NextResponse.redirect(
        new URL('/license-select.html?error=license_not_found', request.url)
      )
    }

    // Check if license already exists (idempotency)
    const existingLicense = await prisma.license.findUnique({
      where: { licenseNumber },
    })

    if (existingLicense) {
      // License already created, just redirect to dashboard
      await createSession(order.user.id, order.user.email)
      return NextResponse.redirect(
        new URL('/dashboard.html', request.url)
      )
    }

    // Check license availability
    const licenseNumberRecord = await prisma.licenseNumber.findUnique({
      where: { number: licenseNumber },
    })

    if (!licenseNumberRecord || licenseNumberRecord.status !== 'available') {
      return NextResponse.redirect(
        new URL('/license-select.html?error=license_unavailable', request.url)
      )
    }

    // Get order data for license card fields (stored in shippingAddress)
    const orderSex = shippingAddress?.sex
    const orderDateOfBirthRaw = shippingAddress?.dateOfBirth
    const orderPhoto = shippingAddress?.photo
    const orderPrefix = shippingAddress?.prefix
    const orderFullName = shippingAddress?.fullName

    // Validate dateOfBirth - reject invalid years (e.g. 121212)
    let dateOfBirth: Date | undefined
    if (orderDateOfBirthRaw) {
      try {
        const parsed = new Date(orderDateOfBirthRaw)
        if (!isNaN(parsed.getTime())) {
          const year = parsed.getFullYear()
          if (year >= 1900 && year <= 2100) {
            dateOfBirth = parsed
          }
        }
      } catch {
        // Ignore invalid dates
      }
    }
    
    // Use stored fullName with prefix for license card
    let fullName = orderFullName || ''
    if (fullName && orderPrefix && !fullName.startsWith(orderPrefix)) {
      fullName = `${orderPrefix.toUpperCase()} ${fullName.toUpperCase()}`
    } else if (fullName) {
      fullName = fullName.toUpperCase()
    }

    // Create license
    const license = await prisma.license.create({
      data: {
        licenseNumber,
        userId: order.userId,
        pricePaid: licenseNumberRecord.price,
        status: 'active',
        sex: orderSex || undefined,
        dateOfBirth,
        fullName: fullName || undefined,
        photo: orderPhoto || undefined,
      },
    })

    // Update order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        licenseId: license.id,
        status: 'processing',
      },
    })

    // Mark license number as taken
    await prisma.licenseNumber.update({
      where: { number: licenseNumber },
      data: {
        status: 'taken',
      },
    })

    // Create session
    await createSession(order.user.id, order.user.email)

    // Send confirmation email
    await sendConfirmationEmail({
      to: order.user.email,
      subject: 'Your Mustache Is Officially Licensed',
      licenseNumber,
      firstName: order.user.firstName,
      lastName: order.user.lastName,
    })

    // Redirect to dashboard
    return NextResponse.redirect(
      new URL('/dashboard.html', request.url)
    )
  } catch (error) {
    console.error('Error processing Stripe success:', error)
    return NextResponse.redirect(
      new URL('/license-select.html?error=processing_failed', request.url)
    )
  }
}
