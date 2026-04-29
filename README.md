# Mustachism

Static HTML/CSS/JS frontend (`backend/frontend/`) with a Next.js backend API (`backend/`).

## Architecture

- **Frontend**: Static HTML/CSS/JS files (easy to edit directly)
- **Backend**: Next.js API routes (preserved from original project)

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Add environment variables (see `DEPLOYMENT.md`), e.g. create `backend/.env` with `DATABASE_URL`.

4. Generate Prisma client:
```bash
npm run db:generate
```

5. (Optional) Seed the database:
```bash
npm run db:seed
```

6. Start the backend server:
```bash
npm run dev
```

The backend API will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Start the Python dev server:
```bash
python3 server.py
```

The frontend will run on `http://localhost:8000`

### Configuration

#### API Base URL

By default, the frontend connects to `http://localhost:3000/api`. To change this:

1. Edit `frontend/assets/js/api-client.js`
2. Change the `API_BASE_URL` constant:
```javascript
const API_BASE_URL = 'https://your-backend-url.com/api'
```

Or set it via a script tag before loading the API client:
```html
<script>
  window.API_BASE_URL = 'https://your-backend-url.com/api'
</script>
```

#### CORS Configuration

The backend includes CORS middleware in `backend/src/middleware.ts`. To allow requests from your production frontend:

1. Edit `backend/src/middleware.ts`
2. Add your frontend URL to the `allowedOrigins` array:
```typescript
const allowedOrigins = [
  'http://localhost:8000',
  'https://your-frontend-domain.com',
]
```

## Development Workflow

1. **Run app**: From `backend/`, run `npm run dev` (copies `frontend/` → `public/`, starts Next.js).
2. **Edit files**:
   - HTML/CSS/JS: `backend/frontend/` (source of truth)
   - API: `backend/src/app/api/`

## Project Structure

```
MUSTACHISM/
├── backend/
│   ├── frontend/          # Static site source → copied to public/ on dev/build
│   ├── public/            # Served files (including synced frontend)
│   ├── src/app/api/       # Next.js API routes
│   ├── prisma/
│   ├── sql/
│   └── package.json
├── DEPLOYMENT.md
└── README.md
```

## API Endpoints

All API endpoints are prefixed with `/api`:

- `GET /api/auth` - Check authentication status
- `POST /api/auth/login` - Login with email
- `POST /api/auth` (action: 'logout') - Logout
- `GET /api/licenses` - Fetch licenses (with filters)
- `POST /api/licenses` - Check license availability
- `POST /api/orders` - Create order
- `POST /api/payment` - Process payment (mock)
- `POST /api/stripe/checkout` - Create Stripe checkout session
- `GET /api/stripe/success` - Handle Stripe success redirect

## Features

- **Direct HTML Editing**: No build step required, edit HTML files directly
- **Simple Structure**: Flat file hierarchy, easy to navigate
- **Framework-free Frontend**: Pure vanilla JavaScript, no React/Vue overhead
- **Visual Control**: Direct CSS manipulation, no CSS-in-JS
- **Backend Preserved**: All existing logic, database, APIs unchanged
- **Easy Deployment**: Static files + API server separation

## Deployment

### Backend Deployment

Deploy the backend to Vercel (or similar):

1. Navigate to `backend/` directory
2. Run `vercel` or connect via Vercel dashboard
3. Set environment variables in Vercel dashboard
4. Update CORS in `backend/src/middleware.ts` to allow production frontend domain

### Frontend Deployment

Deploy static files to Vercel, Netlify, or any static hosting:

1. Update `API_BASE_URL` in `frontend/assets/js/api-client.js` to production backend URL
2. Deploy the `frontend/` directory as static files
3. Ensure all routes redirect to `index.html` for client-side routing (if needed)

## Notes

- The frontend uses vanilla JavaScript - no build step required
- All API calls use `fetch()` with proper CORS handling
- Authentication uses HTTP-only cookies set by the backend
- Session state is stored in localStorage for quick UI updates
- The mustache sequence animation runs in pure JavaScript
- All styling is in a single CSS file for easy modification
