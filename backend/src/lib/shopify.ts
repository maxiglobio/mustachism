import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Shopify Storefront API (headless). Server-only: uses the *private* Storefront token from the
 * Headless sales channel, so it never reaches the browser.
 *
 * Env:
 *   SHOPIFY_STORE_DOMAIN               your-store.myshopify.com
 *   SHOPIFY_STOREFRONT_PRIVATE_TOKEN   Headless channel → storefront → private access token
 *   SHOPIFY_WEBHOOK_SECRET             Settings → Notifications → Webhooks → signing secret
 *   SHOPIFY_VARIANT_BASIC / _PRO       optional; variant IDs (numeric or gid). If unset, the two
 *                                      cheapest/priciest products in the store are used.
 */
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-10'

export type PackageId = 'basic' | 'pro'

export interface ShopPackage {
  id: PackageId
  variantId: string // gid://shopify/ProductVariant/…
  productTitle: string
  variantTitle: string
  description: string
  price: number
  currency: string
  available: boolean
}

export function isShopifyConfigured() {
  return !!(process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN)
}

async function storefront<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const res = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Shopify-Storefront-Private-Token': process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as { data?: T; errors?: Array<{ message: string }> }
  if (!res.ok || json.errors?.length) {
    throw new Error(`Shopify ${res.status}: ${json.errors?.map((e) => e.message).join('; ') || res.statusText}`)
  }
  return json.data as T
}

const toGid = (id: string) => (id.startsWith('gid://') ? id : `gid://shopify/ProductVariant/${id}`)

type ProductsQuery = {
  products: {
    nodes: Array<{
      title: string
      description: string
      variants: {
        nodes: Array<{
          id: string
          title: string
          availableForSale: boolean
          price: { amount: string; currencyCode: string }
        }>
      }
    }>
  }
}

/** The two packages sold on the site, with live titles and prices from Shopify. */
export async function getPackages(): Promise<ShopPackage[]> {
  const data = await storefront<ProductsQuery>(`
    query Packages {
      products(first: 20, sortKey: PRICE) {
        nodes {
          title
          description
          variants(first: 10) {
            nodes { id title availableForSale price { amount currencyCode } }
          }
        }
      }
    }`)

  const variants = data.products.nodes.flatMap((p) =>
    p.variants.nodes.map((v) => ({
      variantId: v.id,
      productTitle: p.title,
      variantTitle: v.title,
      description: p.description,
      price: Number(v.price.amount),
      currency: v.price.currencyCode,
      available: v.availableForSale,
    })),
  )

  const pick = (env: string | undefined, fallback: (typeof variants)[number] | undefined) =>
    env ? variants.find((v) => v.variantId === toGid(env)) : fallback

  // Default mapping: cheapest product = basic, most expensive = pro.
  const byPrice = [...variants].sort((a, b) => a.price - b.price)
  const basic = pick(process.env.SHOPIFY_VARIANT_BASIC, byPrice[0])
  const pro = pick(process.env.SHOPIFY_VARIANT_PRO, byPrice[byPrice.length - 1])

  const out: ShopPackage[] = []
  if (basic) out.push({ id: 'basic', ...basic })
  if (pro && pro.variantId !== basic?.variantId) out.push({ id: 'pro', ...pro })
  return out
}

/**
 * Creates a cart with one licence line and returns Shopify's hosted checkout URL.
 * `attributes` become line-item properties on the Shopify order (keys starting with "_" are
 * hidden from the customer but visible to the webhook and in the admin order JSON).
 */
export async function createCheckout(opts: {
  variantId: string
  email?: string
  attributes: Record<string, string>
}) {
  const data = await storefront<{
    cartCreate: {
      cart: { id: string; checkoutUrl: string } | null
      userErrors: Array<{ field: string[] | null; message: string }>
    }
  }>(
    `mutation CreateCart($input: CartInput!) {
      cartCreate(input: $input) {
        cart { id checkoutUrl }
        userErrors { field message }
      }
    }`,
    {
      input: {
        lines: [
          {
            merchandiseId: toGid(opts.variantId),
            quantity: 1,
            attributes: Object.entries(opts.attributes)
              .filter(([, v]) => v)
              .map(([key, value]) => ({ key, value })),
          },
        ],
        ...(opts.email ? { buyerIdentity: { email: opts.email } } : {}),
      },
    },
  )
  const { cart, userErrors } = data.cartCreate
  if (!cart || userErrors.length) throw new Error(userErrors.map((e) => e.message).join('; ') || 'Cart failed')
  return cart
}

/** Verifies Shopify's `X-Shopify-Hmac-Sha256` header against the raw request body. */
export function verifyWebhook(rawBody: string, hmacHeader: string | null) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret || !hmacHeader) return false
  const digest = createHmac('sha256', secret).update(rawBody, 'utf8').digest()
  const given = Buffer.from(hmacHeader, 'base64')
  return given.length === digest.length && timingSafeEqual(given, digest)
}
