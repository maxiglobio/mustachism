/**
 * One-time migration: 000 001 / M-0001 → 000-001 (NNN-NNN, the format the app expects).
 * Run from backend/ in a terminal (not the Supabase SQL editor): npm run db:migrate-license-format
 * Requires DATABASE_DIRECT_URL or DATABASE_URL.
 */
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_DIRECT_URL or DATABASE_URL is required')
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function toHyphenFormat(old: string): string | null {
  const trimmed = old.trim()
  if (/^\d{3}-\d{3}$/.test(trimmed)) return null
  const spaced = /^(\d{3}) (\d{3})$/.exec(trimmed)
  if (spaced) return `${spaced[1]}-${spaced[2]}`
  const m = trimmed.match(/^M-(\d{1,6})$/i)
  if (!m) return null
  const i = parseInt(m[1], 10)
  if (i < 1 || i > 999999) return null
  const six = String(i).padStart(6, '0')
  return `${six.slice(0, 3)}-${six.slice(3, 6)}`
}

async function main() {
  const spacedCount = await prisma.licenseNumber.count({
    where: { number: { contains: ' ' } },
  })
  console.log(`license_numbers rows containing a space: ${spacedCount}`)

  const numbers = await prisma.licenseNumber.findMany({ select: { number: true } })
  const map = new Map<string, string>()
  for (const { number } of numbers) {
    const next = toHyphenFormat(number)
    if (next) map.set(number, next)
  }

  console.log(`license_numbers rows to rename: ${map.size}`)
  if (map.size === 0) {
    const sample = await prisma.licenseNumber.findMany({ take: 3, select: { number: true } })
    console.log('Nothing to migrate. Sample:', sample.map((r) => r.number))
    return
  }

  await prisma.$transaction(
    async (tx) => {
      for (const [oldNum, newNum] of map) {
        const exists = await tx.licenseNumber.findUnique({ where: { number: newNum } })
        if (exists) {
          throw new Error(`Target number already exists: ${newNum} (from ${oldNum})`)
        }
      }

      for (const [oldNum, newNum] of map) {
        await tx.licenseNumber.update({
          where: { number: oldNum },
          data: { number: newNum },
        })
      }

      const licenses = await tx.license.findMany({ select: { id: true, licenseNumber: true } })
      for (const lic of licenses) {
        const next = toHyphenFormat(lic.licenseNumber)
        if (!next) continue
        await tx.license.update({
          where: { id: lic.id },
          data: { licenseNumber: next },
        })
      }

      const orders = await tx.order.findMany({ select: { id: true, shippingAddress: true } })
      for (const o of orders) {
        const sa = o.shippingAddress as Record<string, unknown> | null
        if (!sa || typeof sa !== 'object') continue
        const raw = sa.licenseNumber
        if (typeof raw !== 'string') continue
        const next = toHyphenFormat(raw)
        if (!next) continue
        await tx.order.update({
          where: { id: o.id },
          data: {
            shippingAddress: { ...sa, licenseNumber: next } as object,
          },
        })
      }
    },
    { maxWait: 60000, timeout: 300000 },
  )

  const sample = await prisma.licenseNumber.findMany({ take: 5, orderBy: { number: 'asc' } })
  console.log('Migration complete. Sample:', sample.map((r) => r.number))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
