-- Add license card fields to database
-- Run this in Supabase SQL Editor

-- Add sex and dateOfBirth to orders table
ALTER TABLE "orders" 
ADD COLUMN IF NOT EXISTS "sex" TEXT,
ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE;

-- Add sex, dateOfBirth, fullName, and photo to licenses table
-- (fullName will be computed from firstName + lastName, but storing it for the license card)
ALTER TABLE "licenses"
ADD COLUMN IF NOT EXISTS "sex" TEXT,
ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE,
ADD COLUMN IF NOT EXISTS "fullName" TEXT,
ADD COLUMN IF NOT EXISTS "photo" TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "orders_sex_idx" ON "orders"("sex");
CREATE INDEX IF NOT EXISTS "orders_dateOfBirth_idx" ON "orders"("dateOfBirth");
CREATE INDEX IF NOT EXISTS "licenses_sex_idx" ON "licenses"("sex");
CREATE INDEX IF NOT EXISTS "licenses_dateOfBirth_idx" ON "licenses"("dateOfBirth");
