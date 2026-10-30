import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config()

// Pricing logic (duplicated here for seed script)
const BASE_PRICE = 49.0
const PREMIUM_MULTIPLIER = 2.5
const ICONIC_NUMBERS = new Set(['7', '42', '69', '100', '200', '300', '500', '1000', '2024', '2025'])

function isPalindrome(num: string): boolean {
  const cleaned = num.replace(/^0+/, '')
  return cleaned === cleaned.split('').reverse().join('')
}

function hasRepeatingDigits(num: string): boolean {
  const cleaned = num.replace(/^0+/, '')
  return /^(\d)\1{2,}$/.test(cleaned)
}

function isCleanNumber(num: string): boolean {
  const cleaned = num.replace(/^0+/, '')
  return /^[1-9]0{3,}$/.test(cleaned) || /^(\d)\1{3,}$/.test(cleaned)
}

function isIconicNumber(num: string): boolean {
  const cleaned = num.replace(/^0+/, '')
  return ICONIC_NUMBERS.has(cleaned)
}

/** Digits only for premium rules: 000 001 → 000001, 000-001 / M-0001 legacy */
function numericPartForPremium(licenseNumber: string): string {
  const grouped = /^(\d{3})[-\s](\d{3})$/.exec(licenseNumber.trim())
  if (grouped) return grouped[1] + grouped[2]
  return licenseNumber.replace(/^M-?/i, '').replace(/[-\s]/g, '')
}

function isPremiumNumber(licenseNumber: string): boolean {
  const numPart = numericPartForPremium(licenseNumber)
  return hasRepeatingDigits(numPart) || isPalindrome(numPart) || isCleanNumber(numPart) || isIconicNumber(numPart)
}

function calculatePrice(licenseNumber: string): number {
  return isPremiumNumber(licenseNumber) ? BASE_PRICE * PREMIUM_MULTIPLIER : BASE_PRICE
}

function getPriceTier(licenseNumber: string): 'standard' | 'premium' {
  return isPremiumNumber(licenseNumber) ? 'premium' : 'standard'
}

// Use direct URL for seeding (required for Supabase)
const connectionString = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_DIRECT_URL or DATABASE_URL environment variable is not set')
}
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clear existing license numbers
  await prisma.licenseNumber.deleteMany({})
  console.log('Cleared existing license numbers')

  // Generate 9,999 license numbers: 000 001 … 009 999 (six digits as NNN NNN)
  const licenseNumbers = []
  
  for (let i = 1; i <= 9999; i++) {
    const six = String(i).padStart(6, '0')
    const number = `${six.slice(0, 3)} ${six.slice(3, 6)}`
    const price = calculatePrice(number)
    const priceTier = getPriceTier(number)
    
    // Reserve some numbers for founders/marketing (first 10 and some iconic ones)
    let status: 'available' | 'reserved' | 'taken' = 'available'
    if (i <= 10) {
      status = 'reserved'
    } else if ([42, 69, 100, 777, 1000, 2024].includes(i)) {
      status = 'reserved'
    }

    licenseNumbers.push({
      number,
      status,
      priceTier,
      price,
    })
  }

  // Insert in batches to avoid memory issues
  const batchSize = 1000
  for (let i = 0; i < licenseNumbers.length; i += batchSize) {
    const batch = licenseNumbers.slice(i, i + batchSize)
    await prisma.licenseNumber.createMany({
      data: batch,
      skipDuplicates: true,
    })
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(licenseNumbers.length / batchSize)}`)
  }

  console.log(`✅ Seeded ${licenseNumbers.length} license numbers`)
  
  // Show some stats
  const stats = await prisma.licenseNumber.groupBy({
    by: ['status', 'priceTier'],
    _count: true,
  })
  console.log('\nLicense Number Stats:')
  console.log(JSON.stringify(stats, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
