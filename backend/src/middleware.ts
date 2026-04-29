import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CHECKOUT_ENTRY_PATHS = new Set([
  '/order.html',
  '/license-select.html',
  '/personal-info.html',
])

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (process.env.WAITLIST_ONLY === 'true' && CHECKOUT_ENTRY_PATHS.has(path)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Handle CORS for API routes
  if (path.startsWith('/api')) {
    const origin = request.headers.get('origin')
    
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 })
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Max-Age', '86400')
      return response
    }

    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/order.html', '/license-select.html', '/personal-info.html'],
}
