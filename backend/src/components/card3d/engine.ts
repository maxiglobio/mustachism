import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { CARD_ASSETS } from './assets'
import { Engraver, type EngravingData } from './engraver'
import { surfaceFromInk } from './surface'

export type CardMode = 'showcase' | 'personal'

export interface CardEngineOptions {
  mode: CardMode
  /** Drag / tap / keyboard control. */
  interactive: boolean
  /** Hover tilt follows the pointer across this element (defaults to the container). */
  hoverTarget?: HTMLElement | null
  /** Receives drag / tap / keyboard input (defaults to the container). Lets a full-screen
   *  card layer stay pointer-transparent while a slot in the page handles interaction. */
  pointerTarget?: HTMLElement | null
  /** Idle sway, flips, scroll pose. False renders a still, final pose. */
  animate: boolean
  /** Gentle idle sway (continuous rendering). Defaults to on for mouse devices, off for touch. */
  idle?: boolean
  /** Start angle (radians around Y). */
  initialYaw?: number
  onReady?: () => void
  onError?: (err: unknown) => void
}

const TAU = Math.PI * 2
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const damp = (from: number, to: number, lambda: number, dt: number) =>
  from + (to - from) * (1 - Math.exp(-lambda * dt))

/** Scale applied to the GLB (it is modelled in metres: 92 × 58 mm). */
const MODEL_SCALE = 10

/**
 * Real-time steel license card. The mesh is ~12k triangles; the 2M-polygon engraving from
 * the Blender master is baked into normal + AO maps, so it renders smoothly on phones.
 */
export class LicenseCardEngine {
  private renderer!: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50)
  private pivot = new THREE.Group()
  private card = new THREE.Group()
  private frontMat?: THREE.MeshStandardMaterial
  private backMat?: THREE.MeshStandardMaterial
  private engraver?: Engraver
  private pendingEngraving: EngravingData | null = null

  private raf = 0
  private clock = new THREE.Clock()
  private visible = true
  private idle = false
  private lastRender = 0
  private paused = false
  /** Screen-space offset of the card from the canvas centre, in CSS pixels. */
  private layout = { x: 0, y: 0 }
  private pageVisible = true
  private disposed = false
  private ready = false
  private dirty = true
  private cleanups: Array<() => void> = []

  // Pose state
  private yaw = 0
  private pitch = 0
  private vYaw = 0
  private vPitch = 0
  private hoverX = 0
  private hoverY = 0
  private hoverTX = 0
  private hoverTY = 0
  private gyroX = 0
  private gyroY = 0
  private scroll = { yaw: 0, pitch: 0, roll: 0, y: 0, scale: 1 }
  /** Choreographed offset for the homepage intro (tumbling fly-in). */
  private intro = { yaw: 0, pitch: 0, roll: 0 }
  /** Scroll-driven "feature camera": turn the card and keep (fx, fy) — a point on the card in
   *  card units (width 0.92 × height 0.58, origin at centre, +y up) — centred while zooming. */
  private feature = { yaw: 0, pitch: 0, roll: 0, fx: 0, fy: 0, zoom: 1 }
  private focusVec = new THREE.Vector3()
  private dragging = false
  private flipping = false
  private flipFrom = 0
  private flipTo = 0
  private flipT = 1
  private time = 0

  constructor(
    private container: HTMLElement,
    private canvas: HTMLCanvasElement,
    private opts: CardEngineOptions,
  ) {
    this.yaw = opts.initialYaw ?? 0
    this.idle =
      opts.animate && (opts.idle ?? !matchMedia('(hover: none), (pointer: coarse)').matches)
  }

  async init() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch (err) {
      this.opts.onError?.(err)
      return
    }
    const r = this.renderer
    r.outputColorSpace = THREE.SRGBColorSpace
    r.toneMapping = THREE.NeutralToneMapping
    r.toneMappingExposure = 1.05
    r.setClearColor(0x000000, 0)

    this.scene.environment = buildStudioEnvironment(r)
    this.scene.add(this.pivot)
    this.pivot.add(this.card)

    this.resize()
    this.bindLifecycle()
    if (this.opts.interactive) this.bindInteraction()

    try {
      await this.loadCard(matchMedia('(hover: none), (pointer: coarse)').matches)
    } catch (err) {
      this.opts.onError?.(err)
      return
    }
    if (this.disposed) return
    this.ready = true
    this.renderFrame(0)
    this.opts.onReady?.()
    this.loop()
  }

  // ───────────────────────────── assets

  private async loadCard(touch: boolean) {
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(CARD_ASSETS.model)
    if (this.disposed) return
    const wantHigh = !touch && this.container.clientWidth * (window.devicePixelRatio || 1) > 1300
    const tex = new THREE.TextureLoader()
    const load = (url: string) =>
      tex.loadAsync(url).then((t) => {
        t.flipY = false
        t.colorSpace = THREE.NoColorSpace
        t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
        return t
      })

    const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
    const canvasTex = (c: HTMLCanvasElement, color = false) => {
      const t = new THREE.CanvasTexture(c)
      t.flipY = false
      t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
      t.anisotropy = maxAniso
      return t
    }
    type Side = { normal: THREE.Texture; ao: THREE.Texture; albedo: THREE.Texture; rough: THREE.Texture }
    let front: Side
    let back: Side

    if (this.opts.mode === 'personal') {
      const b = CARD_ASSETS.blank
      const [fn, fa, fi, bn, ba, bi] = await Promise.all(
        [b.frontNormal, b.frontAo, b.frontInk, b.backNormal, b.backAo, b.backInk].map(loadImage),
      )
      this.engraver = new Engraver({ normal: fn, ao: fa, ink: fi }, { normal: bn, ao: ba, ink: bi })
      await this.engraver.ready()
      const side = (c: Engraver['front']): Side => ({
        normal: canvasTex(c.normal),
        ao: canvasTex(c.ao),
        albedo: canvasTex(c.albedo, true),
        rough: canvasTex(c.rough),
      })
      front = side(this.engraver.front)
      back = side(this.engraver.back)
    } else {
      const set = wantHigh ? CARD_ASSETS.hi : CARD_ASSETS.lo
      const [fn, fa, bn, ba, fi, bi] = await Promise.all([
        load(set.frontNormal),
        load(set.frontAo),
        load(set.backNormal),
        load(set.backAo),
        loadImage(set.frontInk),
        loadImage(set.backInk),
      ])
      const fs = surfaceFromInk(fi, fi.naturalWidth, fi.naturalHeight)
      const bs = surfaceFromInk(bi, bi.naturalWidth, bi.naturalHeight)
      front = { normal: fn, ao: fa, albedo: canvasTex(fs.albedo, true), rough: canvasTex(fs.rough) }
      back = { normal: bn, ao: ba, albedo: canvasTex(bs.albedo, true), rough: canvasTex(bs.rough) }
    }
    if (this.disposed) return

    const base: THREE.MeshStandardMaterialParameters = {
      // Polished stainless: near-white specular, roughness comes from the map (plate ≈ 0.06).
      color: new THREE.Color(0xeceef1),
      metalness: 1,
      roughness: 1,
      envMapIntensity: 1.05,
    }
    const faceMat = (t: Side) =>
      new THREE.MeshStandardMaterial({
        ...base,
        normalMap: t.normal,
        normalScale: new THREE.Vector2(1.35, 1.35),
        aoMap: t.ao,
        aoMapIntensity: 0.85,
        map: t.albedo,
        roughnessMap: t.rough,
      })
    this.frontMat = faceMat(front)
    this.backMat = faceMat(back)
    const edgeMat = new THREE.MeshStandardMaterial({ ...base, roughness: 0.07 })

    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const name = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material)?.name ?? ''
      mesh.material = name.startsWith('front') ? this.frontMat! : name.startsWith('back') ? this.backMat! : edgeMat
    })

    const model = gltf.scene
    model.scale.setScalar(MODEL_SCALE)
    const box = new THREE.Box3().setFromObject(model)
    model.position.sub(box.getCenter(new THREE.Vector3()))
    this.card.add(model)
    this.fit()

    if (this.pendingEngraving) this.setEngraving(this.pendingEngraving)
  }

  // ───────────────────────────── public API

  /** Live personalisation (personal mode). Cheap: only dirty fields are re-engraved. */
  setEngraving(data: EngravingData) {
    if (!this.engraver || !this.frontMat || !this.backMat) {
      this.pendingEngraving = data
      return
    }
    const changed = this.engraver.update(data)
    const refresh = (m: THREE.MeshStandardMaterial) =>
      [m.normalMap, m.aoMap, m.map, m.roughnessMap].forEach((t) => t && (t.needsUpdate = true))
    if (changed.front) refresh(this.frontMat)
    if (changed.back) refresh(this.backMat)
    this.dirty = true
  }

  /** Scroll-driven pose offset, 0 → 1. */
  /** Intro choreography offset (radians), driven by GSAP from the page. */
  setIntroPose(pose: Partial<typeof this.intro>) {
    if (assignChanged(this.intro, pose)) this.dirty = true
  }

  /** Move the card on screen (CSS px from the canvas centre, +y down). */
  setLayout(layout: Partial<typeof this.layout>) {
    if (assignChanged(this.layout, layout)) this.dirty = true
  }

  /** Stop rendering while the card is off screen (e.g. a full-screen layer scrolled past). */
  setPaused(paused: boolean) {
    if (paused === this.paused) return
    this.paused = paused
    if (!paused) {
      this.clock.getDelta()
      this.dirty = true
      this.loop()
    }
  }

  /** World units per CSS pixel at the card's depth. */
  worldPerPx() {
    const visibleH = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2) * this.camera.position.z
    return visibleH / Math.max(1, this.container.clientHeight)
  }

  /** On-screen card width in CSS px at zoom 1. */
  cardPxWidth() {
    return (0.92 * 1) / this.worldPerPx()
  }

  setFeaturePose(pose: Partial<typeof this.feature>) {
    if (assignChanged(this.feature, pose)) this.dirty = true
  }

  setScrollPose(pose: Partial<typeof this.scroll>) {
    if (assignChanged(this.scroll, pose)) this.dirty = true
  }

  /** Turn the card over (front ↔ back). */
  flip(direction = 1) {
    const rest = Math.round(this.yaw / Math.PI) * Math.PI
    this.flipFrom = this.yaw
    this.flipTo = rest + Math.PI * direction
    this.flipT = this.opts.animate ? 0 : 1
    if (!this.opts.animate) this.yaw = this.flipTo
    this.flipping = this.opts.animate
    this.vYaw = 0
    this.dirty = true
  }

  /** Show a specific face. */
  showFace(face: 'front' | 'back') {
    const facingBack = Math.round(this.yaw / Math.PI) % 2 !== 0
    if ((face === 'back') !== facingBack) this.flip()
  }

  async enableGyro() {
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    if (typeof DOE?.requestPermission === 'function') {
      const res = await DOE.requestPermission().catch(() => 'denied')
      if (res !== 'granted') return false
    }
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      this.gyroX = clamp(e.gamma / 40, -1, 1) * 0.45
      this.gyroY = clamp((e.beta - 50) / 40, -1, 1) * 0.3
      this.dirty = true
    }
    window.addEventListener('deviceorientation', onOrient)
    this.cleanups.push(() => window.removeEventListener('deviceorientation', onOrient))
    return true
  }

  /** Dev aid: render now and return the frame as a data URL. */
  snapshot() {
    this.step(0)
    this.renderer.render(this.scene, this.camera)
    return this.canvas.toDataURL('image/png')
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.cleanups.forEach((fn) => fn())
    this.cleanups = []
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.geometry.dispose()
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial
        ;[mat.normalMap, mat.aoMap, mat.map, mat.roughnessMap].forEach((t) => t?.dispose())
        mat.dispose()
      })
    })
    this.scene.environment?.dispose()
    this.renderer?.dispose()
  }

  // ───────────────────────────── lifecycle

  private bindLifecycle() {
    const ro = new ResizeObserver(() => {
      this.resize()
      this.dirty = true
    })
    ro.observe(this.container)
    const io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting
      if (this.visible) this.loop()
    })
    io.observe(this.container)
    const onVis = () => {
      this.pageVisible = document.visibilityState === 'visible'
      if (this.pageVisible) {
        this.clock.getDelta()
        this.loop()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    this.cleanups.push(
      () => ro.disconnect(),
      () => io.disconnect(),
      () => document.removeEventListener('visibilitychange', onVis),
    )
  }

  private resize() {
    const w = Math.max(1, this.container.clientWidth)
    const h = Math.max(1, this.container.clientHeight)
    // Cap the drawing buffer: phones get ≤1.5× and ~1.7 MP, desktops ≤2× and ~4 MP. A full-screen
    // card layer at native density would otherwise burn fill-rate for no visible gain.
    const touch = matchMedia('(hover: none), (pointer: coarse)').matches
    const budget = touch ? 1.7e6 : 4e6
    const dpr = Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 2, Math.sqrt(budget / (w * h)))
    this.renderer.setPixelRatio(Math.max(1, dpr))
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.fit()
  }

  /** Frame the card so it fills ~82% of the limiting dimension at any aspect. */
  private fit() {
    const cardW = 0.92 * 1.12 // allow for tilt
    const cardH = 0.58 * 1.25
    const vFov = THREE.MathUtils.degToRad(this.camera.fov)
    const distH = cardH / 2 / Math.tan(vFov / 2)
    const distW = cardW / 2 / (Math.tan(vFov / 2) * this.camera.aspect)
    this.camera.position.set(0, 0, Math.max(distH, distW) / 0.86)
    this.camera.lookAt(0, 0, 0)
  }

  // ───────────────────────────── interaction

  private bindInteraction() {
    const el = this.opts.pointerTarget ?? this.container
    let lastX = 0
    let lastY = 0
    let lastT = 0
    let startX = 0
    let startY = 0
    let downT = 0
    let moved = false
    let pointerId = -1

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return
      pointerId = e.pointerId
      this.dragging = true
      this.flipping = false
      moved = false
      startX = lastX = e.clientX
      startY = lastY = e.clientY
      downT = lastT = performance.now()
      this.vYaw = 0
      this.vPitch = 0
      el.classList.add('is-grabbing')
    }
    const move = (e: PointerEvent) => {
      if (!this.dragging || e.pointerId !== pointerId) return
      const now = performance.now()
      const dt = Math.max(1, now - lastT) / 1000
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) > 6) {
        moved = true
        try {
          el.setPointerCapture(pointerId)
        } catch {
          /* pointer already released */
        }
      }
      if (!moved) return
      const k = 3.2 / Math.max(320, el.clientWidth)
      this.yaw += dx * k * 1.6
      this.pitch = clamp(this.pitch + dy * k, -0.55, 0.55)
      this.vYaw = (dx * k * 1.6) / dt
      this.vPitch = (dy * k) / dt
      lastX = e.clientX
      lastY = e.clientY
      lastT = now
      this.dirty = true
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      const wasTap = !moved && performance.now() - downT < 350
      this.dragging = false
      el.classList.remove('is-grabbing')
      if (performance.now() - lastT > 80) {
        this.vYaw = 0
        this.vPitch = 0
      }
      this.vYaw = clamp(this.vYaw, -14, 14)
      if (wasTap && e.type === 'pointerup') this.flip(1)
      pointerId = -1
    }
    const hoverEl = this.opts.hoverTarget ?? el
    const hover = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || this.dragging) return
      const r = hoverEl.getBoundingClientRect()
      const nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1)
      const ny = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1)
      this.hoverTX = nx * 0.32
      this.hoverTY = ny * 0.22
      this.dirty = true
    }
    const leave = () => {
      this.hoverTX = 0
      this.hoverTY = 0
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.flip(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        this.vYaw += e.key === 'ArrowLeft' ? -3 : 3
        this.dirty = true
      }
    }

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('keydown', key)
    hoverEl.addEventListener('pointermove', hover)
    hoverEl.addEventListener('pointerleave', leave)
    this.cleanups.push(() => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('keydown', key)
      hoverEl.removeEventListener('pointermove', hover)
      hoverEl.removeEventListener('pointerleave', leave)
    })
  }

  // ───────────────────────────── frame loop

  private loop = () => {
    cancelAnimationFrame(this.raf)
    if (this.disposed || !this.ready || !this.visible || !this.pageVisible || this.paused) return
    this.raf = requestAnimationFrame(() => {
      const dt = Math.min(0.05, this.clock.getDelta())
      this.renderFrame(dt)
      this.loop()
    })
  }

  private renderFrame(dt: number) {
    const settling = this.step(dt)
    if (!this.dirty && !settling && !this.idle) return
    // Idle sway alone is slow: 60 fps is indistinguishable on 120 Hz screens and halves GPU work.
    // Anything driven by the user or by scroll still renders every frame.
    const now = performance.now()
    if (!this.dirty && !settling && now - this.lastRender < 15) return
    this.lastRender = now
    this.dirty = false
    this.renderer.render(this.scene, this.camera)
  }

  /** Advances physics; returns true while anything is still moving. */
  private step(dt: number) {
    const animate = this.opts.animate
    this.time += dt
    let moving = false

    if (this.flipping) {
      this.flipT = Math.min(1, this.flipT + dt / 1.05)
      const t = this.flipT
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      this.yaw = this.flipFrom + (this.flipTo - this.flipFrom) * e
      if (this.flipT >= 1) this.flipping = false
      moving = true
    } else if (!this.dragging) {
      // Inertia, then settle on the nearest face.
      this.yaw += this.vYaw * dt
      this.pitch += this.vPitch * dt
      this.vYaw *= Math.exp(-dt * 3.2)
      this.vPitch *= Math.exp(-dt * 6)
      if (Math.abs(this.vYaw) < 1.2) {
        const rest = Math.round(this.yaw / Math.PI) * Math.PI
        this.yaw = damp(this.yaw, rest, 3.4, dt)
      }
      this.pitch = damp(this.pitch, 0, 4, dt)
      moving = Math.abs(this.vYaw) > 0.001 || Math.abs(this.pitch) > 0.0005
    }
    // Keep yaw bounded so float error never accumulates.
    if (!this.flipping && !this.dragging && Math.abs(this.yaw) > TAU * 4) {
      const wrap = Math.round(this.yaw / TAU) * TAU
      this.yaw -= wrap
    }

    this.hoverX = damp(this.hoverX, this.hoverTX, 5, dt)
    this.hoverY = damp(this.hoverY, this.hoverTY, 5, dt)
    moving ||= Math.abs(this.hoverX - this.hoverTX) > 0.0005 || Math.abs(this.hoverY - this.hoverTY) > 0.0005

    // Close-ups amplify every wobble, so idle sway fades out as the feature camera zooms in.
    const f = this.feature
    const calm = this.idle ? 1 / Math.max(1, f.zoom * f.zoom) : 0
    const swayYaw = Math.sin(this.time * 0.55) * 0.14 * calm
    const swayPitch = Math.sin(this.time * 0.8 + 1.2) * 0.05 * calm
    const bob = Math.sin(this.time * 1.1) * 0.012 * calm

    const s = this.scroll
    const i = this.intro
    this.card.rotation.set(
      this.pitch + this.hoverY + this.gyroY + swayPitch + s.pitch + i.pitch + f.pitch,
      this.yaw + this.hoverX + this.gyroX + swayYaw + s.yaw + i.yaw + f.yaw,
      s.roll + i.roll + f.roll + Math.sin(this.time * 0.45) * 0.015 * calm,
    )
    // Bring the focus point to the centre of the frame, then scale around it.
    const zoom = f.zoom * s.scale
    this.focusVec.set(f.fx, f.fy, 0).applyEuler(this.card.rotation).multiplyScalar(-zoom)
    this.pivot.position.set(this.focusVec.x, this.focusVec.y + bob + s.y, this.focusVec.z)
    this.pivot.scale.setScalar(zoom)
    const wpp = this.worldPerPx()
    this.pivot.position.x += this.layout.x * wpp
    this.pivot.position.y -= this.layout.y * wpp
    return moving
  }
}

// ───────────────────────────── helpers

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${url}`))
    img.src = url
  })
}

/**
 * A photographic-style studio: dark room, a large overhead softbox and three strip lights.
 * Gives the steel crisp highlight bands that slide across the engraving as the card turns.
 */
function buildStudioEnvironment(renderer: THREE.WebGLRenderer) {
  const env = new THREE.Scene()

  // Studio cyclorama: bright ceiling → soft grey horizon → dark floor. A mirror finish shows
  // these gradients directly, so they are what makes the steel read as polished.
  const grad = document.createElement('canvas')
  grad.width = 4
  grad.height = 512
  const gg = grad.getContext('2d')!
  const g = gg.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, '#f6f6f4')
  g.addColorStop(0.34, '#c2c3c6')
  g.addColorStop(0.5, '#8a8c90')
  g.addColorStop(0.57, '#5b5d61')
  g.addColorStop(1, '#2c2d30')
  gg.fillStyle = g
  gg.fillRect(0, 0, 4, 512)
  const gradTex = new THREE.CanvasTexture(grad)
  gradTex.colorSpace = THREE.SRGBColorSpace
  const room = new THREE.Mesh(
    new THREE.SphereGeometry(10, 48, 24),
    new THREE.MeshBasicMaterial({ map: gradTex, side: THREE.BackSide }),
  )
  env.add(room)

  const panel = (w: number, h: number, intensity: number, pos: [number, number, number], tint = 0xffffff) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(intensity), side: THREE.DoubleSide }),
    )
    m.position.set(...pos)
    m.lookAt(0, 0, 0)
    env.add(m)
  }
  panel(7, 2.4, 5, [0, 4.6, 3]) // overhead softbox
  panel(0.5, 7, 7, [-4.6, 0.4, 3.4]) // left strip — crisp vertical highlight
  panel(0.5, 7, 5, [4.8, 0.2, 2.6], 0xeef2ff) // right strip, slightly cool
  panel(10, 0.45, 6, [0, -0.9, 6]) // horizontal kicker — the highlight that sweeps the face
  panel(3.2, 2, 1.8, [-2.6, 1.6, 7]) // front softbox, off-axis
  panel(3, 3, 1.6, [0, 1, -6]) // back fill for the reverse side

  // Black flag in front of the card: a dark stripe that slides across the mirror as it turns.
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 9), new THREE.MeshBasicMaterial({ color: 0x050506, side: THREE.DoubleSide }))
  flag.position.set(1.6, 0.3, 7.2)
  flag.lookAt(0, 0, 0)
  env.add(flag)

  const pmrem = new THREE.PMREMGenerator(renderer)
  const rt = pmrem.fromScene(env, 0.012)
  pmrem.dispose()
  env.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (mesh.isMesh) {
      mesh.geometry.dispose()
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.map?.dispose()
      mat.dispose()
    }
  })
  return rt.texture
}

/** Object.assign that reports whether anything actually changed (avoids redundant renders). */
function assignChanged<T extends Record<string, number>>(target: T, src: Partial<T>) {
  let changed = false
  for (const k in src) {
    const v = src[k] as number | undefined
    if (v === undefined) continue
    if (Math.abs((target[k] as number) - v) > 1e-5) {
      ;(target as Record<string, number>)[k] = v
      changed = true
    }
  }
  return changed
}
