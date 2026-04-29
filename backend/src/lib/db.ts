import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  // Use DATABASE_DIRECT_URL for Prisma (required for Supabase)
  const connectionString = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL or DATABASE_DIRECT_URL environment variable is not set')
  }

  // Create connection pool with SSL for Supabase
  // Supabase requires SSL for all connections
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Always use SSL for Supabase
    connectionTimeoutMillis: 10000, // 10 second timeout
    idleTimeoutMillis: 30000,
    max: 10, // Maximum pool size
  })
  
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  // Reuse client in production (Vercel) to avoid new Pool + connect on every cold path
  globalForPrisma.prisma = prisma

  return prisma
}

export const prisma = getPrismaClient()
