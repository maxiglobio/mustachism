# Vercel API Routes 404 – Troubleshooting

## Current Status

The deployed app at https://backend-one-fawn-32.vercel.app serves static pages (index, license-select, etc.) but **all API routes return 404** (`/api/licenses`, `/api/auth`, etc.). This affects both the production deployment and local testing when using the deployed URL.

## Local Development Workaround

To run the app locally with a working API:

1. Start the backend:
   ```bash
   cd MUSTACHISM-2.0/backend
   npm run dev
   ```

2. Open http://localhost:3000/license-select.html in your browser.

3. If you're serving the frontend from a different port (e.g. Live Server on 5500), the api-client will automatically fall back to `http://localhost:3000/api` – ensure the backend is running on port 3000.

## Vercel Deployment Issue

- **Symptom**: API routes return 404 on Vercel; static files work.
- **Tested**: Simple health endpoint (no DB), middleware removal, `runtime`/`dynamic` exports – all still 404.
- **Likely cause**: Next.js 16 + Vercel routing or deployment configuration.

## Next Steps to Try

1. **Vercel Dashboard**: In Project Settings → General, verify Framework Preset is "Next.js" and Root Directory is correct.

2. **Git-based deploy**: Deploy via GitHub integration instead of CLI – sometimes behaves differently.

3. **Vercel support**: If the above don’t help, contact Vercel support with deployment logs and this description.

4. **Alternative hosting**: Consider Railway, Render, or Fly.io if the issue persists.
