# Mustachism

Next.js 15 (App Router) + React 19 + TypeScript site and API, deployed on Vercel from `backend/`.

## Run

```bash
cd backend
npm install
npm run dev        # http://localhost:3000
```

Environment variables: see `DEPLOYMENT.md` (`DATABASE_URL`, `WAITLIST_ONLY`, `RESEND_API_KEY`, …).
Optional: `NEXT_PUBLIC_SITE_URL` (defaults to `https://www.mustachism.com`; used for canonical URLs,
sitemap and Open Graph), `NEXT_PUBLIC_CLARITY_PROJECT_ID` (Microsoft Clarity, production only).

## Structure (`backend/`)

```
src/app/                 routes (pages are server components exporting `metadata`)
  page.tsx               /            home: 3D card hero, USPs, box sequences, statement, manifesto, FAQ
  story/                 /story       codex + chronicle film
  order/                 /order       personalise + live-engraved 3D card + demo payment
  license-select/        /license-select, personal-info/   (3-step legacy flow)
  login/, dashboard/     account
  privacy-policy/, terms-of-service/
  api/                   API routes (unchanged)
  globals.css            the only stylesheet — brand tokens as CSS custom properties
  sitemap.ts, robots.ts, */opengraph-image.tsx
src/components/
  card3d/                three.js steel card: engine, live engraver, surface maps
  motion/                MotionProvider (html.motion gating, reveals, button hover), AmbientShapes
  home/ story/ checkout/ account/ layout/ ui/
src/lib/motion.ts        configureScrollTrigger, isNarrowViewport, onWidthChange
public/assets/card/      baked card mesh + textures
scripts/card-bake/       Blender scripts that produced them
```

Old `*.html` URLs permanently redirect to the clean routes (`next.config.js`).
`backend/frontend/` is the previous static site, kept for reference only — nothing builds from it.

## The 3D card

The Blender master (`3d-card-prod.blend`, ~2M polygons) is far too heavy for the web, so:

1. `sil.py` + `trace.py` render a top-down silhouette and trace the card outline.
2. `bake.py` builds a ~12k-triangle slab from that outline and bakes, from the master:
   tangent-space **normals** (4K), **ambient occlusion** (2K) and **height** (4K).
3. `export_textures.py` writes WebP textures, a **relief** mask (`*-ink-*.webp`: raised areas),
   and **blank** variants with the personal fields removed. The plate renders mirror-polished
   and the relief frosted (`src/components/card3d/surface.ts`) — embossed metal, no paint.

In the browser the order page and dashboard re-engrave name, number, dates, class and an
etched version of the uploaded photo straight into those maps (`engraver.ts`) as you type.

Re-run (needs Blender 3.6+ and `cwebp`):

```bash
B=/Applications/Blender.app/Contents/MacOS/Blender
SRC=path/to/3d-card-prod.blend; OUT=/tmp/card-bake
$B -b "$SRC" --python scripts/card-bake/sil.py -- $OUT && python3 scripts/card-bake/trace.py $OUT/sil.png $OUT/outline.json
for stage in normal height; do $B -b "$SRC" --python scripts/card-bake/bake.py -- $OUT 4096 2592 $stage; done
$B -b "$SRC" --python scripts/card-bake/bake.py -- $OUT 2048 1296 ao
python3 scripts/card-bake/export_textures.py $OUT public/assets/card   # needs Pillow + numpy
npx @gltf-transform/cli meshopt $OUT/card.glb public/assets/card/card.glb
```
