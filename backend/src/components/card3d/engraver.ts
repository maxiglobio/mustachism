import { LOGO_PATH } from '@/components/layout/Logo'
import { engraveMono, engraveRound, engraveSerif } from './fonts'
import { ETCH_ALBEDO, ETCH_ROUGHNESS, polishField, surfaceFromInk } from './surface'

export interface EngravingData {
  number?: string
  name?: string
  sex?: string
  dob?: string
  issueDate?: string
  licenseClass?: string
  photo?: HTMLImageElement | null
}

/** Texture size used for personal cards (half the 4K master). */
const W = 2048
const H = 1296
/** Layout is measured on the 4096 × 2592 bake. */
const S = W / 4096

type Rect = [x: number, y: number, w: number, h: number]
const r4 = (x0: number, y0: number, x1: number, y1: number): Rect => [
  Math.floor(x0 * S),
  Math.floor(y0 * S),
  Math.ceil((x1 - x0) * S),
  Math.ceil((y1 - y0) * S),
]

/** Erase regions (must match scripts/card-bake/erase.py) and glyph placement. */
const FIELDS = {
  number: { side: 'front', rect: r4(2370, 120, 3110, 290), x: 2375, top: 135, cap: 135, maxW: 720, font: 'mono' },
  name: { side: 'front', rect: r4(1500, 595, 3790, 770), x: 1510, top: 615, cap: 135, maxW: 2260, font: 'mono' },
  sex: { side: 'front', rect: r4(1500, 1045, 1710, 1220), x: 1520, top: 1065, cap: 135, maxW: 180, font: 'mono' },
  dob: { side: 'front', rect: r4(1860, 1045, 3110, 1220), x: 1880, top: 1064, cap: 137, maxW: 1220, font: 'mono' },
  issueDate: { side: 'front', rect: r4(1500, 1470, 2610, 1665), x: 1515, top: 1493, cap: 138, maxW: 1080, font: 'mono' },
  licenseClass: { side: 'front', rect: r4(3370, 2225, 3690, 2535), cx: 3512, top: 2255, cap: 245, font: 'serif' },
  backNumber: { side: 'back', rect: r4(340, 2190, 1345, 2470), x: 368, top: 2232, cap: 208, maxW: 960, font: 'round' },
} as const

const PHOTO = {
  rect: r4(32, 440, 1495, 2075),
  outer: r4(147, 475, 1360, 2040),
  inner: r4(173, 507, 1333, 2013),
}

type Side = { normal: HTMLCanvasElement; ao: HTMLCanvasElement; albedo: HTMLCanvasElement; rough: HTMLCanvasElement }
type SideCtx = {
  n: CanvasRenderingContext2D
  a: CanvasRenderingContext2D
  alb: CanvasRenderingContext2D
  r: CanvasRenderingContext2D
  baseN: ImageData
  baseA: ImageData
  baseInk: ImageData
}
type SideImages = { normal: HTMLImageElement; ao: HTMLImageElement; ink: HTMLImageElement }

const ADVANCE = 0.775 // monospace advance as a fraction of cap height (measured on the master)

export class Engraver {
  front: Side
  back: Side
  private ctx: Record<'front' | 'back', SideCtx>
  private last = new Map<string, unknown>()
  private fontsReady: Promise<void>
  private families = {
    mono: engraveMono.style.fontFamily,
    round: engraveRound.style.fontFamily,
    serif: engraveSerif.style.fontFamily,
  }

  constructor(frontImgs: SideImages, backImgs: SideImages) {
    const mk = (img: HTMLImageElement) => {
      const c = document.createElement('canvas')
      c.width = W
      c.height = H
      const g = c.getContext('2d', { willReadFrequently: true })!
      g.drawImage(img, 0, 0, W, H)
      return { c, g, data: g.getImageData(0, 0, W, H) }
    }
    const side = (imgs: SideImages): [Side, SideCtx] => {
      const n = mk(imgs.normal)
      const a = mk(imgs.ao)
      const surf = surfaceFromInk(imgs.ink, W, H)
      return [
        { normal: n.c, ao: a.c, albedo: surf.albedo, rough: surf.rough },
        { n: n.g, a: a.g, alb: surf.ag, r: surf.rg, baseN: n.data, baseA: a.data, baseInk: surf.inkData },
      ]
    }
    const [front, fctx] = side(frontImgs)
    const [back, bctx] = side(backImgs)
    this.front = front
    this.back = back
    this.ctx = { front: fctx, back: bctx }
    this.fontsReady = Promise.all([
      document.fonts.load(`64px ${this.families.mono}`),
      document.fonts.load(`600 64px ${this.families.round}`),
      document.fonts.load(`64px ${this.families.serif}`),
    ]).then(() => undefined, () => undefined)
  }

  ready() {
    return this.fontsReady
  }

  update(data: EngravingData) {
    const changed = { front: false, back: false }
    const text = (key: keyof typeof FIELDS, value: string | undefined) => {
      const v = (value ?? '').toUpperCase()
      if (this.last.get(key) === v) return
      this.last.set(key, v)
      this.engraveText(key, v)
      changed[FIELDS[key].side] = true
    }
    text('number', data.number)
    text('backNumber', data.number)
    text('name', data.name)
    text('sex', data.sex)
    text('dob', data.dob)
    text('issueDate', data.issueDate)
    text('licenseClass', data.licenseClass)

    const photo = data.photo ?? null
    if (!this.last.has('photo') || this.last.get('photo') !== photo) {
      this.last.set('photo', photo)
      this.engravePhoto(photo)
      changed.front = true
    }
    return changed
  }

  // ───────────────────────────── text

  private engraveText(key: keyof typeof FIELDS, value: string) {
    const f = FIELDS[key]
    const [rx, ry, rw, rh] = f.rect
    const mask = scratch(rw, rh)
    const g = mask.getContext('2d')!
    g.fillStyle = '#000'
    g.fillRect(0, 0, rw, rh)
    if (value) {
      g.fillStyle = '#fff'
      const cap = f.cap * S
      const top = f.top * S - ry
      const family = this.families[f.font]
      const weight = f.font === 'round' ? '600 ' : ''
      // Size the font so its cap height matches the master exactly.
      g.font = `${weight}100px ${family}`
      const capPer100 = g.measureText('H').actualBoundingBoxAscent || 70
      const size = (cap / capPer100) * 100
      g.font = `${weight}${size}px ${family}`
      g.textBaseline = 'alphabetic'
      const baseline = top + cap

      if ('cx' in f) {
        g.textAlign = 'center'
        g.lineJoin = 'round'
        g.strokeStyle = '#fff'
        g.lineWidth = cap * 0.035
        g.strokeText(value, f.cx * S - rx, baseline)
        g.fillText(value, f.cx * S - rx, baseline)
      } else if (f.font === 'round') {
        g.textAlign = 'left'
        const maxW = f.maxW * S
        const w = g.measureText(value).width
        g.save()
        g.translate(f.x * S - rx, 0)
        if (w > maxW) g.scale(maxW / w, 1)
        g.fillText(value, 0, baseline)
        g.restore()
      } else {
        // Fixed-advance monospace, squeezed if the value is longer than the field.
        g.textAlign = 'center'
        const maxW = f.maxW * S
        let adv = cap * ADVANCE
        if (adv * value.length > maxW) adv = maxW / value.length
        const squeeze = Math.min(1, adv / (cap * ADVANCE))
        const x0 = f.x * S - rx
        // Share Tech Mono is lighter than the master's face; a stroke brings it to weight.
        g.strokeStyle = '#fff'
        g.lineJoin = 'round'
        g.lineWidth = cap * 0.075
        for (let i = 0; i < value.length; i++) {
          const cx = x0 + adv * (i + 0.5)
          g.save()
          g.translate(cx, 0)
          g.scale(squeeze, 1)
          g.strokeText(value[i], 0, baseline)
          g.fillText(value[i], 0, baseline)
          g.restore()
        }
      }
    }
    this.emboss(f.side, f.rect, readMask(g, rw, rh), { radius: 4, strength: 9 })
  }

  // ───────────────────────────── photo

  private engravePhoto(img: HTMLImageElement | null) {
    const [rx, ry, rw, rh] = PHOTO.rect
    const c = scratch(rw, rh)
    const g = c.getContext('2d', { willReadFrequently: true })!
    g.fillStyle = '#000'
    g.fillRect(0, 0, rw, rh)

    const [ix, iy, iw, ih] = PHOTO.inner
    const [ox, oy, ow, oh] = PHOTO.outer
    const lineW = Math.max(2, 7 * S * 2)

    let hatch: Float32Array | null = null
    if (img) {
      // Cover-fit the photo into the inner frame, then translate tones into engraved hatching.
      const px = ix - rx + lineW * 2
      const py = iy - ry + lineW * 2
      const pw = iw - lineW * 4
      const ph = ih - lineW * 4
      const tone = scratch(pw, ph)
      const tg = tone.getContext('2d', { willReadFrequently: true })!
      const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight)
      const dw = img.naturalWidth * scale
      const dh = img.naturalHeight * scale
      tg.filter = 'grayscale(1) contrast(1.25)'
      tg.drawImage(img, (pw - dw) / 2, (ph - dh) / 3, dw, dh)
      const td = tg.getImageData(0, 0, pw, ph).data
      // Auto-levels.
      let lo = 255
      let hi = 0
      for (let i = 0; i < td.length; i += 4) {
        const l = td[i] * 0.299 + td[i + 1] * 0.587 + td[i + 2] * 0.114
        if (l < lo) lo = l
        if (l > hi) hi = l
      }
      const range = Math.max(1, hi - lo)
      hatch = new Float32Array(rw * rh)
      const period = 5.2
      const ang = (-28 * Math.PI) / 180
      const sa = Math.sin(ang)
      const ca = Math.cos(ang)
      for (let y = 0; y < ph; y++) {
        for (let x = 0; x < pw; x++) {
          const i = (y * pw + x) * 4
          const l = (td[i] * 0.299 + td[i + 1] * 0.587 + td[i + 2] * 0.114 - lo) / range
          const dark = Math.pow(1 - l, 1.15)
          // Wavy line screen: line thickness grows with darkness.
          const u = x * sa + y * ca + Math.sin(x * 0.045) * 1.6
          const t = Math.abs(((u / period) % 1 + 1) % 1 - 0.5) * 2
          const v = smoothstep(t - 0.18, t + 0.18, dark * 0.92)
          hatch[(y + py) * rw + (x + px)] = v
        }
      }
    }

    // Frame + optional placeholder mark.
    g.strokeStyle = '#fff'
    g.lineWidth = lineW * 1.6
    g.strokeRect(ox - rx, oy - ry, ow, oh)
    g.lineWidth = lineW
    g.strokeRect(ix - rx, iy - ry, iw, ih)
    if (!img) {
      const p = new Path2D(LOGO_PATH)
      const markW = iw * 0.56
      const k = markW / 683
      g.save()
      g.translate(ix - rx + (iw - markW) / 2, iy - ry + ih / 2 - (375 * k) / 2)
      g.scale(k, k)
      g.fillStyle = '#fff'
      g.fill(p)
      g.restore()
    }
    const mask = readMask(g, rw, rh)
    if (hatch) this.emboss('front', PHOTO.rect, maxMask(mask, hatch), { radius: 1, strength: 6 })
    else this.emboss('front', PHOTO.rect, mask, { radius: 3, strength: 8 })
  }

  // ───────────────────────────── core

  /**
   * Turns a 0..1 coverage mask into a raised, rounded relief: writes tangent-space normals and
   * a contact-shadow AO into the region, restoring the untouched base everywhere else.
   */
  private emboss(
    side: 'front' | 'back',
    rect: Rect,
    mask: Float32Array,
    { radius, strength }: { radius: number; strength: number },
  ) {
    const [rx, ry, rw, rh] = rect
    const s = this.ctx[side]
    const height = boxBlur(boxBlur(mask, rw, rh, radius), rw, rh, Math.max(1, radius - 1))
    const shadow = boxBlur(mask, rw, rh, radius * 3)
    for (let i = 0; i < height.length; i++) height[i] = smoothstep(0.08, 0.92, height[i])

    const outN = s.n.createImageData(rw, rh)
    const outA = s.a.createImageData(rw, rh)
    const outAlb = s.alb.createImageData(rw, rh)
    const outR = s.r.createImageData(rw, rh)
    const bN = s.baseN.data
    const bA = s.baseA.data
    const bI = s.baseInk.data
    const polish = polishField(W, H)
    for (let y = 0; y < rh; y++) {
      for (let x = 0; x < rw; x++) {
        const i = y * rw + x
        const o = i * 4
        const b = ((ry + y) * W + (rx + x)) * 4
        const hL = height[y * rw + Math.max(0, x - 1)]
        const hR = height[y * rw + Math.min(rw - 1, x + 1)]
        const hU = height[Math.max(0, y - 1) * rw + x]
        const hD = height[Math.min(rh - 1, y + 1) * rw + x]
        const dx = (hR - hL) * 0.5
        const dy = (hD - hU) * 0.5
        const h = height[i]
        if (h < 0.002 && Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005) {
          outN.data[o] = bN[b]
          outN.data[o + 1] = bN[b + 1]
          outN.data[o + 2] = bN[b + 2]
        } else {
          let nx = -strength * dx
          let ny = strength * dy
          let nz = 1
          const len = Math.hypot(nx, ny, nz)
          nx /= len
          ny /= len
          nz /= len
          outN.data[o] = (nx * 0.5 + 0.5) * 255
          outN.data[o + 1] = (ny * 0.5 + 0.5) * 255
          outN.data[o + 2] = (nz * 0.5 + 0.5) * 255
        }
        outN.data[o + 3] = 255
        const occl = Math.max(0, shadow[i] - h) * 0.55
        const a = bA[b] * (1 - occl)
        outA.data[o] = outA.data[o + 1] = outA.data[o + 2] = a
        outA.data[o + 3] = 255
        // Raised relief gets the frosted finish; the plate stays mirror-polished.
        const steel = Math.min(bI[b] / 255, 1 - smoothstep(0.3, 0.6, h))
        outAlb.data[o] = outAlb.data[o + 1] = outAlb.data[o + 2] = ETCH_ALBEDO + (255 - ETCH_ALBEDO) * steel
        outAlb.data[o + 3] = 255
        const pr = polish[(ry + y) * W + (rx + x)]
        outR.data[o] = outR.data[o + 1] = outR.data[o + 2] = ETCH_ROUGHNESS + (pr - ETCH_ROUGHNESS) * steel
        outR.data[o + 3] = 255
      }
    }
    s.n.putImageData(outN, rx, ry)
    s.a.putImageData(outA, rx, ry)
    s.alb.putImageData(outAlb, rx, ry)
    s.r.putImageData(outR, rx, ry)
  }
}

// ───────────────────────────── utils

const scratchPool = new Map<string, HTMLCanvasElement>()
function scratch(w: number, h: number) {
  const key = `${w}x${h}`
  let c = scratchPool.get(key)
  if (!c) {
    c = document.createElement('canvas')
    c.width = w
    c.height = h
    scratchPool.set(key, c)
  }
  return c
}

function readMask(g: CanvasRenderingContext2D, w: number, h: number) {
  const d = g.getImageData(0, 0, w, h).data
  const m = new Float32Array(w * h)
  for (let i = 0; i < m.length; i++) m[i] = d[i * 4] / 255
  return m
}

function maxMask(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(a.length)
  for (let i = 0; i < a.length; i++) out[i] = Math.max(a[i], b[i])
  return out
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

/** Separable box blur (one pass each way). */
function boxBlur(src: Float32Array, w: number, h: number, r: number) {
  if (r < 1) return src.slice()
  const tmp = new Float32Array(src.length)
  const out = new Float32Array(src.length)
  const norm = 1 / (r * 2 + 1)
  for (let y = 0; y < h; y++) {
    let acc = 0
    const row = y * w
    for (let x = -r; x <= r; x++) acc += src[row + Math.min(w - 1, Math.max(0, x))]
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc * norm
      acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)]
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x]
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc * norm
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]
    }
  }
  return out
}
