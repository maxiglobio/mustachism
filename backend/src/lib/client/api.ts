'use client'

export type LicenseStatus = 'available' | 'reserved' | 'taken'

export interface LicenseNumber {
  number: string
  status: LicenseStatus
  priceTier: 'standard' | 'premium'
  price: number
}

export interface UserLicense {
  id: string
  licenseNumber: string
  status: string
  issueDate: string | null
  pricePaid: number | null
  fullName: string | null
  sex?: string | null
  dateOfBirth?: string | null
}

export interface OrderInput {
  licenseNumber: string
  fullName: string
  prefix?: string
  email: string
  licenseType: string
  sex: string
  dateOfBirth: string
  photo: string | null
  shippingAddress: { country: string; city: string; addressLine: string; zip: string }
}

export type PackageId = 'basic' | 'pro'

export interface ShopPackage {
  id: PackageId
  variantId: string
  productTitle: string
  variantTitle: string
  description: string
  price: number
  currency: string
  available: boolean
}

export interface AuthState {
  authenticated: boolean
  userId: string | null
  email: string | null
}

async function request<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {}
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...rest,
    body: json === undefined ? rest.body : JSON.stringify(json),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.details || data.message || data.error || `Request failed (${res.status})`
    const err = new Error(msg) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return data as T
}

export const api = {
  fetchLicenses({ status = 'available', limit = 100, offset = 0 } = {}) {
    const q = new URLSearchParams({ filter: status, limit: String(limit), offset: String(offset) })
    return request<{ licenses: LicenseNumber[] }>(`/licenses?${q}`)
  },
  fetchNextLicense() {
    return request<{ license: LicenseNumber }>('/licenses/next')
  },
  /** Resolves with the license if it exists and is available, otherwise null. */
  async checkLicense(number: string) {
    try {
      const r = await request<{ license: LicenseNumber }>('/licenses', { method: 'POST', json: { licenseNumber: number } })
      return r.license
    } catch {
      return null
    }
  },
  createOrder(order: OrderInput) {
    return request<{ orderId: string; licenseNumber: string; price: number }>('/orders', {
      method: 'POST',
      json: order,
    })
  },
  /** Live Basic / Pro packages from Shopify (configured: false when the shop isn't connected). */
  getPackages() {
    return request<{ configured: boolean; packages: ShopPackage[] }>('/shop/products')
  },
  /** Reserves the number and returns Shopify's hosted checkout URL. */
  startCheckout(order: OrderInput & { package: PackageId }) {
    return request<{ checkoutUrl: string; orderId: string; reservedMinutes: number }>('/checkout', {
      method: 'POST',
      json: order,
    })
  },
  processPayment(orderId: string) {
    return request<unknown>('/payment', { method: 'POST', json: { orderId } })
  },
  async fetchUserLicenses() {
    try {
      return await request<{ licenses: UserLicense[] }>('/user/licenses')
    } catch (err) {
      if ((err as { status?: number }).status === 401) return { licenses: [] as UserLicense[] }
      throw err
    }
  },
  submitWaitlist(email: string) {
    return request<{ success: boolean; message?: string }>('/waitlist', { method: 'POST', json: { email } })
  },
  async checkAuth(): Promise<AuthState> {
    try {
      const r = await request<Partial<AuthState>>('/auth')
      return { authenticated: !!r.authenticated, userId: r.userId ?? null, email: r.email ?? null }
    } catch {
      return { authenticated: false, userId: null, email: null }
    }
  },
  login(email: string) {
    return request<{ success: boolean }>('/auth/login', { method: 'POST', json: { email } })
  },
  logout() {
    return request<unknown>('/auth', { method: 'POST', json: { action: 'logout' } })
  },
}
