import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter') || 'all'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let where: any = {}
    
    if (filter === 'available') {
      where.status = 'available'
    } else if (filter === 'premium') {
      where.status = 'available'
      where.priceTier = 'premium'
    } else if (filter === 'taken') {
      where.status = 'taken'
    }

    const licenses = await prisma.licenseNumber.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        number: 'asc',
      },
      // Only select needed fields for better performance
      select: {
        number: true,
        status: true,
        priceTier: true,
        price: true,
      },
    })

    const response = NextResponse.json({ licenses })
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response
  } catch (error: any) {
    console.error('Error fetching licenses:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
    })
    const response = NextResponse.json(
      { 
        error: 'Failed to fetch licenses',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { licenseNumber } = body

    if (!licenseNumber) {
      const response = NextResponse.json(
        { error: 'License number is required' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const license = await prisma.licenseNumber.findUnique({
      where: { number: licenseNumber },
    })

    if (!license) {
      const response = NextResponse.json(
        { error: 'License number not found' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    if (license.status !== 'available') {
      const response = NextResponse.json(
        { error: 'License number is not available' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const response = NextResponse.json({ license })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error checking license:', error)
    const response = NextResponse.json(
      { error: 'Failed to check license' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}
