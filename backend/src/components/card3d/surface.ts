/**
 * Derives the card's surface maps from the relief mask (white = flat plate, black = raised
 * lettering / photo / mark — the "ink" mask exported by scripts/card-bake).
 *
 * Finish: the plate is mirror-polished; the raised relief is the same steel with a frosted,
 * bead-blasted finish (like laser-etched polished steel). Nothing is painted — the relief
 * reads through the normal map plus the polished-vs-frosted contrast in reflections.
 * - albedo: the frosted relief is a darker satin steel, so it reads clearly against the mirror
 * - roughness (G channel): ~0.06 on the plate, ~0.42 on the relief
 */
export const ETCH_ALBEDO = 130
export const ETCH_ROUGHNESS = 108
const PLATE_ROUGHNESS = 15

let polishCache: { w: number; h: number; data: Uint8ClampedArray } | null = null

/** Near-mirror roughness with a faint, very soft polishing haze so reflections don't look CG. */
export function polishField(w: number, h: number) {
  if (polishCache && polishCache.w === w && polishCache.h === h) return polishCache.data
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.fillStyle = `rgb(${PLATE_ROUGHNESS},${PLATE_ROUGHNESS},${PLATE_ROUGHNESS})`
  g.fillRect(0, 0, w, h)
  let seed = 11
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < 14; i++) {
    const r = (0.15 + rand() * 0.35) * w
    const x = rand() * w
    const y = rand() * h
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, 'rgba(40,40,40,0.35)')
    grad.addColorStop(1, 'rgba(40,40,40,0)')
    g.fillStyle = grad
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  const src = g.getImageData(0, 0, w, h).data
  const data = new Uint8ClampedArray(w * h)
  for (let i = 0; i < data.length; i++) data[i] = src[i * 4]
  polishCache = { w, h, data }
  return data
}

/** Builds albedo + roughness canvases from the relief mask. */
export function surfaceFromInk(ink: CanvasImageSource, w: number, h: number) {
  const inkCanvas = document.createElement('canvas')
  inkCanvas.width = w
  inkCanvas.height = h
  const ig = inkCanvas.getContext('2d', { willReadFrequently: true })!
  ig.drawImage(ink, 0, 0, w, h)
  const inkData = ig.getImageData(0, 0, w, h)

  const albedo = document.createElement('canvas')
  const rough = document.createElement('canvas')
  albedo.width = rough.width = w
  albedo.height = rough.height = h
  const ag = albedo.getContext('2d', { willReadFrequently: true })!
  const rg = rough.getContext('2d', { willReadFrequently: true })!
  const a = ag.createImageData(w, h)
  const r = rg.createImageData(w, h)
  const polish = polishField(w, h)
  const d = inkData.data
  for (let i = 0, p = 0; p < polish.length; i += 4, p++) {
    const t = d[i] / 255 // 1 = polished plate, 0 = frosted relief (antialiased edges blend)
    const av = ETCH_ALBEDO + (255 - ETCH_ALBEDO) * t
    a.data[i] = a.data[i + 1] = a.data[i + 2] = av
    a.data[i + 3] = 255
    const rv = ETCH_ROUGHNESS + (polish[p] - ETCH_ROUGHNESS) * t
    r.data[i] = r.data[i + 1] = r.data[i + 2] = rv
    r.data[i + 3] = 255
  }
  ag.putImageData(a, 0, 0)
  rg.putImageData(r, 0, 0)
  return { albedo, rough, ag, rg, inkData }
}
