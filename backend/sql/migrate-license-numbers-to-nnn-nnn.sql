-- =============================================================================
-- Migrate license numbers to NNN-NNN (hyphen): 000 001 / M-0001 → 000-001
-- This is the format the app expects (toLicenseNumber in src/lib/licenses.ts).
-- Safe to re-run: rows already in NNN-NNN are left alone.
-- Run in Supabase: SQL Editor → New query → paste → Run
-- =============================================================================

BEGIN;

-- Pool (primary key = number): space → hyphen
UPDATE license_numbers
SET number = SUBSTRING(number FROM 1 FOR 3) || '-' || SUBSTRING(number FROM 5 FOR 3)
WHERE number ~ '^\d{3} \d{3}$';

UPDATE license_numbers
SET number =
  SUBSTRING(LPAD(REGEXP_REPLACE(number, '^M-', '', 'i'), 6, '0') FROM 1 FOR 3)
  || '-'
  || SUBSTRING(LPAD(REGEXP_REPLACE(number, '^M-', '', 'i'), 6, '0') FROM 4 FOR 3)
WHERE number ~* '^M-\d+$';

-- Issued licenses
UPDATE "licenses"
SET "licenseNumber" = SUBSTRING("licenseNumber" FROM 1 FOR 3) || '-' || SUBSTRING("licenseNumber" FROM 5 FOR 3)
WHERE "licenseNumber" ~ '^\d{3} \d{3}$';

UPDATE "licenses"
SET "licenseNumber" =
  SUBSTRING(LPAD(REGEXP_REPLACE("licenseNumber", '^M-', '', 'i'), 6, '0') FROM 1 FOR 3)
  || '-'
  || SUBSTRING(LPAD(REGEXP_REPLACE("licenseNumber", '^M-', '', 'i'), 6, '0') FROM 4 FOR 3)
WHERE "licenseNumber" ~* '^M-\d+$';

-- Order snapshots
UPDATE "orders"
SET "shippingAddress" = jsonb_set(
  "shippingAddress"::jsonb,
  '{licenseNumber}',
  to_jsonb(
    SUBSTRING("shippingAddress"->>'licenseNumber' FROM 1 FOR 3)
    || '-'
    || SUBSTRING("shippingAddress"->>'licenseNumber' FROM 5 FOR 3)
  ),
  true
)
WHERE "shippingAddress"::jsonb ? 'licenseNumber'
  AND ("shippingAddress"->>'licenseNumber') ~ '^\d{3} \d{3}$';

UPDATE "orders"
SET "shippingAddress" = jsonb_set(
  "shippingAddress"::jsonb,
  '{licenseNumber}',
  to_jsonb(
    SUBSTRING(LPAD(REGEXP_REPLACE("shippingAddress"->>'licenseNumber', '^M-', '', 'i'), 6, '0') FROM 1 FOR 3)
    || '-'
    || SUBSTRING(LPAD(REGEXP_REPLACE("shippingAddress"->>'licenseNumber', '^M-', '', 'i'), 6, '0') FROM 4 FOR 3)
  ),
  true
)
WHERE "shippingAddress"::jsonb ? 'licenseNumber'
  AND ("shippingAddress"->>'licenseNumber') ~* '^M-\d+$';

COMMIT;

-- Check: every row should report 'hyphen'.
SELECT 'license_numbers' AS tbl,
       CASE WHEN number ~ '^\d{3}-\d{3}$' THEN 'hyphen' ELSE 'other' END AS format,
       count(*)
FROM license_numbers GROUP BY 1, 2
UNION ALL
SELECT 'licenses',
       CASE WHEN "licenseNumber" ~ '^\d{3}-\d{3}$' THEN 'hyphen' ELSE 'other' END,
       count(*)
FROM "licenses" GROUP BY 1, 2;
