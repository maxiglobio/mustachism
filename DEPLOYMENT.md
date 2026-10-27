# Deploy MUSTACHISM (2.0 stack)

## License numbers in Supabase (`NNN-NNN`)

Pool uses **`000-001`** … **`009-999`** (three digits, hyphen, three digits), not `M-0001`.

- **New database:** after migrations, run `npm run db:seed` from `backend/` (see `prisma/seed.ts`).
- **Existing `M-*` data:** one-time migration (requires `DATABASE_URL` or `DATABASE_DIRECT_URL` in `.env`):

```bash
cd MUSTACHISM/backend
npm run db:migrate-license-format
```

Updates `license_numbers`, `licenses.licenseNumber`, and `orders.shippingAddress.licenseNumber`.

## Quick deploy (from backend/)
```bash
cd MUSTACHISM/backend
npx vercel --prod --scope maxims-projects-92fd3574 --yes
```

Pages live in `backend/src/app/` (Next.js App Router); static assets in `backend/public/assets/`.

## Prerequisites
- Vercel account
- Supabase (or PostgreSQL) database
- GitHub repo (optional, for auto-deploy)

## Steps

### 1. Push to GitHub (if not already)
```bash
cd MUSTACHISM
git init  # if new repo
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Import to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. **Root Directory**: Set to `backend` (Vercel will use this as the project root)
4. Framework: Next.js (auto-detected)

### 3. Environment Variables
Add these in Vercel Project Settings → Environment Variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase: use "Connection string" from Project Settings → Database) | Yes |
| `DATABASE_DIRECT_URL` | For Supabase: use "Direct connection" string (bypasses pooler) | For Supabase |
| `NEXT_PUBLIC_BASE_URL` | Your public site URL, e.g. `https://www.mustachism.com`. Also the base of emailed sign-in links in production (falls back to `VERCEL_URL`, then `https://www.mustachism.com`). | For sign-in links and photo links |
| `WAITLIST_ONLY` | Set to `true` for public waitlist mode: homepage shows early-access email signup (see `/api/waitlist`), and `/order`, `/license-select`, `/personal-info` (and their old `.html` URLs) redirect to `/`. The homepage is statically built, so redeploy after changing it. Omit or set `false` for the full checkout flow. | Optional |
| `SESSION_SECRET` | Long random string (e.g. `openssl rand -base64 32`) used to HMAC-sign the `mustashism_session` cookie and the 15-minute magic sign-in links. Falls back to `NEXTAUTH_SECRET` if unset; sign-in fails if neither is set. Changing it logs everyone out. | Yes |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key — sends the waitlist confirmation email to **new** signups and the magic sign-in links from `/login`. If omitted, the API logs a mock email (including the sign-in link) to the server console. | Optional |
| `WAITLIST_EMAIL_FROM` | Sender address, e.g. `MUSTACHISM <waitlist@mustachism.com>`. Must use a domain you [verify in Resend](https://resend.com/docs/dashboard/domains/introduction). If omitted with `RESEND_API_KEY` set, defaults to `MUSTACHISM <onboarding@resend.dev>` (testing only; often limited to your own inbox). | Optional |

| `SHOPIFY_STORE_DOMAIN` | `your-store.myshopify.com` | For checkout |
| `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` | Shopify admin → Sales channels → Headless → your storefront → private access token | For checkout |
| `SHOPIFY_WEBHOOK_SECRET` | Shopify admin → Settings → Notifications → Webhooks → signing secret (webhook: **Order payment**, JSON, `https://www.mustachism.com/api/shopify/webhook`) | For checkout |
| `SHOPIFY_VARIANT_BASIC` / `SHOPIFY_VARIANT_PRO` | Variant IDs of the two packages. Optional: by default the cheapest product is Basic and the most expensive is Pro. Check `/api/shop/products`. | Optional |
| `CRON_SECRET` | Any long random string; protects the daily reservation-cleanup cron | Recommended |
| `ALLOW_DEMO_PAYMENT` | `true` re-enables the no-charge demo payment in production. Leave unset. | No |

### Shopify checkout flow
`/order` → `POST /api/checkout` reserves the licence number in Supabase (60 min) and creates a Shopify cart (line properties: number, name, sex, DOB, class, signed photo link, hidden `_order_id`) → customer pays on Shopify → webhook `orders/paid` → `/api/shopify/webhook` issues the licence and marks the number taken. Unpaid reservations are released automatically. Products must be **published to the Headless sales channel** or the Storefront API won't see them.

**Supabase connection strings:**
- `DATABASE_URL`: Use the "Connection pooling" URI (port 6543)
- `DATABASE_DIRECT_URL`: Use the "Direct connection" URI (port 5432)

### 4. Deploy
Click Deploy. Vercel will:
1. Install dependencies
2. Run `prisma generate`
3. Build Next.js

### 5. Post-deploy
- Your app will be at `https://your-project.vercel.app`
- Pages are served from the root (old `*.html` URLs redirect to clean routes)
- API routes are at `/api/*`

### Waitlist table (`waitlist_signups`)

After pulling changes that add the waitlist feature, apply the migration against your Supabase database (from `backend/`):

```bash
npx prisma migrate deploy
```

Or run the SQL in `backend/prisma/migrations/20260408120000_waitlist_signups/migration.sql` in the Supabase SQL editor. Emails are stored when visitors submit the homepage form while `WAITLIST_ONLY=true`.

**Git snapshot of the full checkout flow (before waitlist):** annotated tag `v1-full-checkout` and branch `preserve/full-checkout-v1`; push with `git push origin main --tags` and `git push origin preserve/full-checkout-v1` when a remote is configured.
