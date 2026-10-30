import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toLicenseNumber } from '@/lib/licenses'
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
  let licenseNumber: string | undefined
  let firstName: string | undefined
  let lastName: string | undefined
  
  try {
    const body = await request.json()
    const parsed = body as {
      licenseNumber: string
      licenseType?: 'A' | 'B' | 'L' | 'H'
      fullName?: string
      prefix?: string
      email: string
      shippingAddress: Record<string, unknown>
      sex?: string
      dateOfBirth?: string
      photo?: string
    }
    
    licenseNumber = parsed.licenseNumber
      ? toLicenseNumber(parsed.licenseNumber) || parsed.licenseNumber.trim()
      : undefined
    const { fullName, prefix, email, shippingAddress, licenseType, sex, dateOfBirth, photo } = parsed

    // Validate required fields
    if (!licenseNumber || !fullName || !email) {
      const response = NextResponse.json(
        { error: 'Missing required fields', received: { licenseNumber, fullName, email } },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }
    
    // Extract first and last name from fullName for user creation
    const nameParts = fullName.trim().split(' ')
    const finalFirstName = nameParts[0] || ''
    const finalLastName = nameParts.slice(1).join(' ') || finalFirstName

    // Check if license is available
    const licenseNumberRecord = await prisma.licenseNumber.findUnique({
      where: { number: licenseNumber },
    })

    if (!licenseNumberRecord) {
      const response = NextResponse.json(
        { error: 'License number not found' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    if (licenseNumberRecord.status !== 'available') {
      const response = NextResponse.json(
        { error: 'License number is not available' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Find or create user (email is now required)
    const userEmail = email
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          firstName: finalFirstName,
          lastName: finalLastName,
        },
      })
    }

    // Create order (license will be assigned after payment)
    // Store license number, fullName, prefix, sex, dateOfBirth, photo in shippingAddress JSON (Order model has no dedicated columns)
    try {
      // Construct full name for license card with prefix
      const licenseFullName = prefix ? `${prefix} ${fullName}` : fullName

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          shippingAddress: {
            ...(shippingAddress || { country: '', city: '', addressLine: '', zip: '' }),
            licenseNumber, // Store license number in metadata
            photo: photo || null, // Store photo (base64 or URL)
            fullName: licenseFullName || null, // Store full name for license card
            prefix: prefix || null, // Store prefix
            sex: sex || null, // Store sex (M/F)
            dateOfBirth: dateOfBirth || null, // Store date of birth (ISO string)
          } as any,
          licenseType: licenseType || 'A',
          status: 'pending',
        },
      })

      const response = NextResponse.json({
        orderId: order.id,
        licenseNumber,
        price: licenseNumberRecord.price,
      })
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    } catch (dbError: any) {
      // Check if it's a column error
      if (dbError?.code === 'P2003' || dbError?.message?.includes('column') || dbError?.message?.includes('does not exist')) {
        console.error('Database schema error - licenseType column may be missing:', dbError)
        const response = NextResponse.json(
          { 
            error: 'Database schema error',
            message: 'The licenseType column may be missing. Please run: ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "licenseType" TEXT;',
            details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
          },
          { status: 500 }
        )
        response.headers.set('Access-Control-Allow-Origin', '*')
        return response
      }
      throw dbError // Re-throw to be caught by outer catch
    }

  } catch (error: any) {
    console.error('Error creating order:', error)
    console.error('Error type:', typeof error)
    console.error('Error name:', error?.name)
    console.error('Error code:', error?.code)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorCode = error?.code || 'UNKNOWN_ERROR'
    
    // Check for specific Prisma errors
    if (errorCode === 'P2002') {
      const response = NextResponse.json(
        { error: 'Duplicate entry', message: 'This record already exists' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }
    
    if (errorCode === 'P2025') {
      const response = NextResponse.json(
        { error: 'Record not found', message: errorMessage },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }
    
    // Database connection errors
    if (errorMessage?.includes('connect') || errorMessage?.includes('connection')) {
      const response = NextResponse.json(
        { 
          error: 'Database connection error',
          message: 'Unable to connect to database. Please check your database configuration.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }
    
    // Column/schema errors
    if (errorMessage?.includes('column') || errorMessage?.includes('does not exist') || errorCode?.includes('42P01')) {
      const response = NextResponse.json(
        { 
          error: 'Database schema error',
          message: 'The licenseType column may be missing. Please run: ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "licenseType" TEXT;',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }
    
    const response = NextResponse.json(
      { 
        error: 'Failed to create order',
        message: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred',
        code: process.env.NODE_ENV === 'development' ? errorCode : undefined,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}
