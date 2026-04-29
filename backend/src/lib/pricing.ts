/**
 * Pricing logic for license numbers
 * Determines if a number is premium and calculates its price
 */

const BASE_PRICE = 49.0
const PREMIUM_MULTIPLIER = 2.5

// Iconic numbers that command premium prices
const ICONIC_NUMBERS = new Set([
  '7', '42', '69', '100', '200', '300', '500', '1000', '2024', '2025'
])

/**
 * Check if a number is a palindrome
 */
function isPalindrome(num: string): boolean {
  const cleaned = num.replace(/^0+/, '') // Remove leading zeros
  return cleaned === cleaned.split('').reverse().join('')
}

/**
 * Check if a number has repeating digits
 */
function hasRepeatingDigits(num: string): boolean {
  const cleaned = num.replace(/^0+/, '') // Remove leading zeros
  // Check for patterns like 777, 8888, 1111
  return /^(\d)\1{2,}$/.test(cleaned)
}

/**
 * Check if a number is "clean" (round numbers like 1000, 1111)
 */
function isCleanNumber(num: string): boolean {
  const cleaned = num.replace(/^0+/, '')
  // Check for numbers like 1000, 2000, 1111, 2222
  return /^[1-9]0{3,}$/.test(cleaned) || /^(\d)\1{3,}$/.test(cleaned)
}

/**
 * Check if a number is iconic
 */
function isIconicNumber(num: string): boolean {
  const cleaned = num.replace(/^0+/, '')
  return ICONIC_NUMBERS.has(cleaned)
}

/**
 * Determine if a license number is premium
 */
export function isPremiumNumber(licenseNumber: string): boolean {
  // Extract number part (M-0001 -> 0001)
  const numPart = licenseNumber.replace('M-', '')
  
  return (
    hasRepeatingDigits(numPart) ||
    isPalindrome(numPart) ||
    isCleanNumber(numPart) ||
    isIconicNumber(numPart)
  )
}

/**
 * Calculate the price for a license number
 */
export function calculatePrice(licenseNumber: string): number {
  if (isPremiumNumber(licenseNumber)) {
    return BASE_PRICE * PREMIUM_MULTIPLIER
  }
  return BASE_PRICE
}

/**
 * Get price tier for a license number
 */
export function getPriceTier(licenseNumber: string): 'standard' | 'premium' {
  return isPremiumNumber(licenseNumber) ? 'premium' : 'standard'
}
