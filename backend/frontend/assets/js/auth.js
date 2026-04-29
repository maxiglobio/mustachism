/**
 * Authentication state management for Mustachism 2.0
 */

let authState = {
  authenticated: false,
  userId: null,
  email: null,
}

/**
 * Check authentication status on page load
 */
async function checkAuthStatus() {
  try {
    const result = await window.API.checkAuth()
    authState = {
      authenticated: result.authenticated || false,
      userId: result.userId || null,
      email: result.email || null,
    }
    
    // Store in localStorage for quick access
    if (authState.authenticated) {
      localStorage.setItem('auth', JSON.stringify(authState))
    } else {
      localStorage.removeItem('auth')
    }

    syncLoginButtonLabel()
    return authState
  } catch (error) {
    console.error('Error checking auth:', error)
    authState = { authenticated: false, userId: null, email: null }
    localStorage.removeItem('auth')
    syncLoginButtonLabel()
    return authState
  }
}

/**
 * Login with email
 */
async function login(email) {
  try {
    const result = await window.API.login(email)
    authState = {
      authenticated: true,
      userId: result.userId,
      email: result.email,
    }
    
    localStorage.setItem('auth', JSON.stringify(authState))
    syncLoginButtonLabel()
    return authState
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

/**
 * Logout
 */
async function logout() {
  try {
    await window.API.logout()
    authState = { authenticated: false, userId: null, email: null }
    localStorage.removeItem('auth')
    syncLoginButtonLabel()
    return authState
  } catch (error) {
    console.error('Logout error:', error)
    // Clear local state even if API call fails
    authState = { authenticated: false, userId: null, email: null }
    localStorage.removeItem('auth')
    syncLoginButtonLabel()
    throw error
  }
}

/**
 * Get current auth state (from memory or localStorage)
 */
function getAuthState() {
  // Try to restore from localStorage if not in memory
  if (!authState.authenticated) {
    try {
      const stored = localStorage.getItem('auth')
      if (stored) {
        authState = JSON.parse(stored)
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  return authState
}

/**
 * Set header login CTA label from current auth (no network).
 * Call right after hydrating authState from localStorage and after server check.
 */
function syncLoginButtonLabel() {
  const el = document.getElementById('login-text')
  if (!el) return
  el.textContent = authState.authenticated ? 'Dashboard' : 'Login'
}

/**
 * Require authentication - redirects to login if not authenticated
 */
function requireAuth() {
  const state = getAuthState()
  if (!state.authenticated) {
    window.location.href = '/login.html'
    return false
  }
  return true
}

/**
 * Initialize auth on page load
 */
async function initAuth() {
  // Try to restore from localStorage first for instant UI update
  try {
    const stored = localStorage.getItem('auth')
    if (stored) {
      authState = JSON.parse(stored)
    }
  } catch (e) {
    // Ignore parse errors
  }

  syncLoginButtonLabel()

  // Then check with server (label already correct from cache; this reconciles session)
  await checkAuthStatus()

  return authState
}

// Export functions
window.Auth = {
  checkAuthStatus,
  login,
  logout,
  getAuthState,
  requireAuth,
  initAuth,
  syncLoginButtonLabel,
}
