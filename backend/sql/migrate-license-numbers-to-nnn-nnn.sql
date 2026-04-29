-- =============================================================================
-- Migrate license numbers: M-0001 → 000-001 (NNN-NNN)
-- Run in Supabase: SQL Editor → New query → paste → Run
-- =============================================================================
-- Before production: take a backup (Supabase Dashboard → Database → Backups).
-- Runs in one transaction; rolls back on error.
-- Skips rows already in NNN-NNN form or non-M-* values.
-- =============================================================================

BEGIN;

-- Helper expression (repeat inline below): six-digit core from M-123 / M-0001
-- LPAD(..., 6, '0') then split as AAA-BBB

-- 1) Inventory pool (primary key = number)
UPDATE license_numbers
SET number =
  SUBSTRING(LPAD(REGEXP_REPLACE(number, '^M-', '', 'i'), 6, '0'), 1, 3)
  || '-'
  || SUBSTRING(LPAD(REGEXP_REPLACE(number, '^M-', '', 'i'), 6, '0'), 4, 3)
WHERE number ~* '^M-\d+$';

-- 2) Issued licenses
UPDATE "licenses"
SET "licenseNumber" =
  SUBSTRING(LPAD(REGEXP_REPLACE("licenseNumber", '^M-', '', 'i'), 6, '0'), 1, 3)
  || '-'
  || SUBSTRING(LPAD(REGEXP_REPLACE("licenseNumber", '^M-', '', 'i'), 6, '0'), 4, 3)
WHERE "licenseNumber" ~* '^M-\d+$';

-- 3) Orders: license number inside JSON shippingAddress
UPDATE "orders"
SET "shippingAddress" = jsonb_set(
  "shippingAddress"::jsonb,
  '{licenseNumber}',
  to_jsonb(
    SUBSTRING(LPAD(REGEXP_REPLACE("shippingAddress"->>'licenseNumber', '^M-', '', 'i'), 6, '0'), 1, 3)
    || '-'
    || SUBSTRING(LPAD(REGEXP_REPLACE("shippingAddress"->>'licenseNumber', '^M-', '', 'i'), 6, '0'), 4, 3)
  ),
  true
)
WHERE "shippingAddress"::jsonb ? 'licenseNumber'
  AND ("shippingAddress"->>'licenseNumber') ~* '^M-\d+$';

COMMIT;

-- =============================================================================
-- Optional: preview only (do NOT run the BEGIN/COMMIT block above if testing)
-- =============================================================================
-- SELECT
--   number AS old_number,
--   SUBSTRING(LPAD(REGEXP_REPLACE(number, '^M-', '', 'i'), 6, '0'), 1, 3)
--     || '-' ||
--   SUBSTRING(LPAD(REGEXP_REPLACE(number, '^M-', '', 'i'), 6, '0'), 4, 3) AS new_number
-- FROM license_numbers
-- WHERE number ~* '^M-\d+$'
-- LIMIT 50;
