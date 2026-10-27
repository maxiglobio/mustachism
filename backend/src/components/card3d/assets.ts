const BASE = '/assets/card'

export const CARD_ASSETS = {
  model: `${BASE}/card.glb`,
  poster: `${BASE}/poster.webp`,
  /** Full engraving (sample holder), for showcase renders. */
  lo: {
    frontNormal: `${BASE}/front-normal-2k.webp`,
    frontAo: `${BASE}/front-ao-2k.webp`,
    backNormal: `${BASE}/back-normal-2k.webp`,
    backAo: `${BASE}/back-ao-2k.webp`,
    frontInk: `${BASE}/front-ink-2k.webp`,
    backInk: `${BASE}/back-ink-2k.webp`,
  },
  hi: {
    frontNormal: `${BASE}/front-normal-4k.webp`,
    frontAo: `${BASE}/front-ao-2k.webp`,
    backNormal: `${BASE}/back-normal-4k.webp`,
    backAo: `${BASE}/back-ao-2k.webp`,
    frontInk: `${BASE}/front-ink-2k.webp`,
    backInk: `${BASE}/back-ink-2k.webp`,
  },
  /** Personal fields erased — re-engraved live in the browser. */
  blank: {
    frontNormal: `${BASE}/front-normal-blank.webp`,
    frontAo: `${BASE}/front-ao-blank.webp`,
    backNormal: `${BASE}/back-normal-blank.webp`,
    backAo: `${BASE}/back-ao-blank.webp`,
    frontInk: `${BASE}/front-ink-blank.webp`,
    backInk: `${BASE}/back-ink-blank.webp`,
  },
} as const
