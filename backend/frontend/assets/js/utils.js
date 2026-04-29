/**
 * Utility functions for Mustachism 2.0
 */

/**
 * Format currency to USD
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Canonical display: NNN-NNN (e.g. 000-001). Accepts legacy M-0001 or 6 digits.
 */
function formatLicenseNumber(number) {
  const s = String(number).trim()
  if (/^\d{3}-\d{3}$/.test(s)) return s
  const legacy = s.replace(/^M-?/i, '').replace(/-/g, '')
  if (!/^\d+$/.test(legacy)) return s
  const six = legacy.replace(/^0+/, '') || '0'
  const padded = six.padStart(6, '0')
  return `${padded.slice(0, 3)}-${padded.slice(3, 6)}`
}

/**
 * Six-digit string for sorting/filtering (000-001 -> 000001)
 */
function extractLicenseNumber(licenseNumber) {
  const s = String(licenseNumber).trim()
  const ddd = /^(\d{3})-(\d{3})$/.exec(s)
  if (ddd) return ddd[1] + ddd[2]
  return s.replace(/^M-?/i, '').replace(/-/g, '').padStart(6, '0')
}

/**
 * Show loading state on an element
 */
function showLoading(element, text = 'Loading...') {
  if (!element) return
  
  element.dataset.originalText = element.textContent || element.innerHTML
  element.disabled = true
  element.innerHTML = text
  element.classList.add('loading')
}

/**
 * Hide loading state on an element
 */
function hideLoading(element) {
  if (!element) return
  
  element.disabled = false
  if (element.dataset.originalText) {
    element.innerHTML = element.dataset.originalText
    delete element.dataset.originalText
  }
  element.classList.remove('loading')
}

/**
 * Show error message
 */
function showError(message, container) {
  if (!container) return
  
  const errorDiv = document.createElement('div')
  errorDiv.className = 'error-message'
  errorDiv.textContent = message
  errorDiv.style.cssText = 'color: red; padding: 10px; margin: 10px 0; background: #fee; border: 1px solid #fcc; border-radius: 4px;'
  
  container.insertBefore(errorDiv, container.firstChild)
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    errorDiv.remove()
  }, 5000)
}

/**
 * Show success message
 */
function showSuccess(message, container) {
  if (!container) return
  
  const successDiv = document.createElement('div')
  successDiv.className = 'success-message'
  successDiv.textContent = message
  successDiv.style.cssText = 'color: green; padding: 10px; margin: 10px 0; background: #efe; border: 1px solid #cfc; border-radius: 4px;'
  
  container.insertBefore(successDiv, container.firstChild)
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    successDiv.remove()
  }, 3000)
}

/**
 * Get URL parameter
 */
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search)
  return params.get(name)
}

/**
 * Set URL parameter
 */
function setUrlParam(name, value) {
  const url = new URL(window.location.href)
  url.searchParams.set(name, value)
  window.history.pushState({}, '', url)
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Format number with leading zeros
 */
function padNumber(num, length = 4) {
  return String(num).padStart(length, '0')
}

// Export functions
window.Utils = {
  formatCurrency,
  formatLicenseNumber,
  extractLicenseNumber,
  showLoading,
  hideLoading,
  showError,
  showSuccess,
  getUrlParam,
  setUrlParam,
  isValidEmail,
  debounce,
  padNumber,
}
