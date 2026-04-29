import { NextResponse } from 'next/server'
import { isWaitlistOnly } from '@/lib/site-mode'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function cors(res: NextResponse, request: Request) {
  const origin = request.headers.get('origin')
  res.headers.set('Access-Control-Allow-Origin', origin || '*')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  return res
}

export async function OPTIONS(request: Request) {
  const res = new NextResponse(null, { status: 200 })
  const origin = request.headers.get('origin')
  res.headers.set('Access-Control-Allow-Origin', origin || '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('Access-Control-Max-Age', '86400')
  return res
}

export async function GET(request: Request) {
  const body = { waitlistOnly: isWaitlistOnly() }
  return cors(NextResponse.json(body), request)
}
