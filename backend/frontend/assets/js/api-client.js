/**
 * API Client for Mustachism 2.0
 * Handles all API communication with the backend
 */

function getApiBaseUrl() {
  if (window.API_BASE_URL) return window.API_BASE_URL
  const origin = window.location?.origin || ''
  // When served from file:// or a static server (e.g. port 5500, 8080), the API isn't there
  // Fall back to backend: localhost:3000 (dev) or production URL
  if (!origin || origin === 'null' || origin.startsWith('file:')) {
    return 'http://localhost:3000/api'
  }
  const port = window.location?.port
  if (origin.includes('localhost') && port && port !== '3000') {
    return 'http://localhost:3000/api'
  }
  return `${origin}/api`
}

const API_BASE_URL = getApiBaseUrl()

/**
 * Fetch licenses with optional filters
 */
async function fetchLicenses(filters = {}) {
  const { status = 'available', limit = 100, offset = 0 } = filters
  
  const params = new URLSearchParams({
    filter: status,
    limit: limit.toString(),
    offset: offset.toString(),
  })

  const response = await fetch(`${API_BASE_URL}/licenses?${params}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch licenses' }))
    throw new Error(error.error || 'Failed to fetch licenses')
  }

  return response.json()
}

/**
 * Fetch the next available sequential license (lowest number)
 */
async function fetchNextLicense() {
  const response = await fetch(`${API_BASE_URL}/licenses/next`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch next license' }))
    throw new Error(error.error || 'Failed to fetch next license')
  }

  return response.json()
}

/**
 * Check if a specific license is available
 */
async function checkLicenseAvailability(licenseNumber) {
  const response = await fetch(`${API_BASE_URL}/licenses`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ licenseNumber }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'License check failed' }))
    throw new Error(error.error || 'License check failed')
  }

  return response.json()
}

/**
 * Create an order
 */
async function createOrder(orderData) {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create order' }))
    throw new Error(error.message || error.error || 'Failed to create order')
  }

  return response.json()
}

/**
 * Process payment (mock)
 */
async function processPayment(orderId) {
  const response = await fetch(`${API_BASE_URL}/payment`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Payment failed' }))
    throw new Error(error.details || error.error || 'Payment failed')
  }

  return response.json()
}

/**
 * Create Stripe checkout session
 */
async function createStripeCheckout(orderId) {
  const response = await fetch(`${API_BASE_URL}/stripe/checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create checkout session' }))
    const message = error.details || error.stripeMessage || error.error || 'Failed to create checkout session'
    throw new Error(message)
  }

  return response.json()
}

/**
 * Fetch current user's licenses (requires auth)
 */
async function fetchUserLicenses() {
  const response = await fetch(`${API_BASE_URL}/user/licenses`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      return { licenses: [] }
    }
    const error = await response.json().catch(() => ({ error: 'Failed to fetch licenses' }))
    throw new Error(error.error || 'Failed to fetch licenses')
  }

  return response.json()
}

/**
 * Check authentication status
 */
async function checkAuth() {
  const response = await fetch(`${API_BASE_URL}/auth`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    return { authenticated: false }
  }

  return response.json()
}

/**
 * Login with email
 */
async function login(email) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Login failed' }))
    throw new Error(error.error || 'Login failed')
  }

  return response.json()
}

/**
 * Logout
 */
async function logout() {
  const response = await fetch(`${API_BASE_URL}/auth`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'logout' }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Logout failed' }))
    throw new Error(error.error || 'Logout failed')
  }

  return response.json()
}

// Export functions for use in other scripts
window.API = {
  fetchLicenses,
  fetchNextLicense,
  checkLicenseAvailability,
  createOrder,
  processPayment,
  createStripeCheckout,
  fetchUserLicenses,
  checkAuth,
  login,
  logout,
}
