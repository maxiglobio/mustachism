import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { sendConfirmationEmail } from '@/lib/email'

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
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order with user and license number info
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

    // Get license number from order metadata (stored in shippingAddress)
    const shippingAddress = order.shippingAddress as any
    const licenseNumber = shippingAddress?.licenseNumber || body.licenseNumber

    if (!licenseNumber) {
      return NextResponse.json(
        { error: 'License number is required' },
        { status: 400 }
      )
    }

    // Idempotency: if license already exists, just create session and return success
    const existingLicense = await prisma.license.findUnique({
      where: { licenseNumber },
    })

    if (existingLicense) {
      await createSession(order.user.id, order.user.email)
      const response = NextResponse.json({
        success: true,
        licenseId: existingLicense.id,
        licenseNumber,
        alreadyCompleted: true,
      })
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Check license availability
    const licenseNumberRecord = await prisma.licenseNumber.findUnique({
      where: { number: licenseNumber },
    })

    if (!licenseNumberRecord || licenseNumberRecord.status !== 'available') {
      return NextResponse.json(
        { error: 'License number is not available' },
        { status: 400 }
      )
    }

    // Get order data for license card (stored in shippingAddress)
    const orderPhoto = shippingAddress?.photo
    const orderPrefix = shippingAddress?.prefix
    const orderFullName = shippingAddress?.fullName
    const orderSex = shippingAddress?.sex
    const orderDateOfBirthRaw = shippingAddress?.dateOfBirth

    // Parse dateOfBirth - reject invalid or unreasonable dates (e.g. year 121212)
    let dateOfBirth: Date | undefined
    if (orderDateOfBirthRaw) {
      try {
        const parsed = new Date(orderDateOfBirthRaw)
        if (!isNaN(parsed.getTime())) {
          const year = parsed.getFullYear()
          // Only accept reasonable birth years (1900-2100)
          if (year >= 1900 && year <= 2100) {
            dateOfBirth = parsed
          }
        }
      } catch {
        // Ignore invalid dates
      }
    }

    let fullName = orderFullName || ''
    if (fullName && orderPrefix && !fullName.startsWith(orderPrefix)) {
      fullName = `${orderPrefix.toUpperCase()} ${fullName.toUpperCase()}`
    } else if (fullName) {
      fullName = fullName.toUpperCase()
    }

    // Create license in Supabase (via Prisma)
    const license = await prisma.license.create({
      data: {
        licenseNumber,
        userId: order.userId,
        pricePaid: licenseNumberRecord.price,
        status: 'active',
        ...(fullName && { fullName }),
        ...(orderPhoto && { photo: orderPhoto }),
        ...(orderSex && { sex: orderSex }),
        ...(dateOfBirth && { dateOfBirth }),
      },
    })

    // Update order with license ID
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

    // Send confirmation email (mock)
    await sendConfirmationEmail({
      to: order.user.email,
      subject: 'Your Mustache Is Officially Licensed',
      licenseNumber,
      firstName: order.user.firstName,
      lastName: order.user.lastName,
    })

    const response = NextResponse.json({
      success: true,
      licenseId: license.id,
      licenseNumber,
    })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error: any) {
    console.error('Error processing payment:', error)
    const isDev = process.env.NODE_ENV === 'development'
    const response = NextResponse.json(
      {
        error: 'Failed to process payment',
        ...(isDev && { details: error?.message }),
      },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}
