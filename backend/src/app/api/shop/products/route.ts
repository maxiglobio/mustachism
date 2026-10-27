import { NextResponse } from 'next/server'
import { getPackages, isShopifyConfigured } from '@/lib/shopify'

export const runtime = 'nodejs'
export const revalidate = 300 // prices change rarely; refresh every 5 minutes

/** GET /api/shop/products — the Basic / Pro packages with live Shopify titles and prices. */
export async function GET() {
  if (!isShopifyConfigured()) return NextResponse.json({ configured: false, packages: [] })
  try {
    return NextResponse.json({ configured: true, packages: await getPackages() })
  } catch (err) {
    console.error('[shop/products]', err)
    return NextResponse.json({ configured: true, packages: [], error: 'Shop unavailable' }, { status: 502 })
  }
}
