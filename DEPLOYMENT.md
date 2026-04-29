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

Source HTML/CSS/JS: edit `backend/frontend/` (copied to `backend/public/` on `npm run dev` / `npm run build`).

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
| `NEXT_PUBLIC_BASE_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` | For Stripe callbacks |
| `STRIPE_SECRET_KEY` | Stripe secret key (or leave empty for demo mode) | Optional |
| `WAITLIST_ONLY` | Set to `true` for public waitlist mode: homepage shows early-access email signup (see `/api/waitlist`), and `/order.html`, `/license-select.html`, `/personal-info.html` redirect to `/`. Omit or set `false` for the full checkout flow. | Optional |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key — sends the waitlist confirmation email to **new** signups only. If omitted, the API logs a mock email to the server console. | Optional |
| `WAITLIST_EMAIL_FROM` | Sender address, e.g. `MUSTACHISM <waitlist@mustachism.com>`. Must use a domain you [verify in Resend](https://resend.com/docs/dashboard/domains/introduction). If omitted with `RESEND_API_KEY` set, defaults to `MUSTACHISM <onboarding@resend.dev>` (testing only; often limited to your own inbox). | Optional |

**Supabase connection strings:**
- `DATABASE_URL`: Use the "Connection pooling" URI (port 6543)
- `DATABASE_DIRECT_URL`: Use the "Direct connection" URI (port 5432)

### 4. Deploy
Click Deploy. Vercel will:
1. Install dependencies
2. Run `prisma generate`
3. Copy frontend files to public/
4. Build Next.js

### 5. Post-deploy
- Your app will be at `https://your-project.vercel.app`
- The frontend (index.html, etc.) is served from the root
- API routes are at `/api/*`

### Waitlist table (`waitlist_signups`)

After pulling changes that add the waitlist feature, apply the migration against your Supabase database (from `backend/`):

```bash
npx prisma migrate deploy
```

Or run the SQL in `backend/prisma/migrations/20260408120000_waitlist_signups/migration.sql` in the Supabase SQL editor. Emails are stored when visitors submit the homepage form while `WAITLIST_ONLY=true`.

**Git snapshot of the full checkout flow (before waitlist):** annotated tag `v1-full-checkout` and branch `preserve/full-checkout-v1`; push with `git push origin main --tags` and `git push origin preserve/full-checkout-v1` when a remote is configured.
