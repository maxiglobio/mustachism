/**
 * Hero 3D card - loads and displays GLB model with Three.js
 * Premium automatic presentation: reveal → hold → transition → reveal
 */
(function () {
  const MOBILE_BREAKPOINT = 768
  const getViewportFill = (w) => (w >= MOBILE_BREAKPOINT ? 0.6 : 0.9) // smaller on desktop, bigger on mobile
  const ENV_ROTATION = Math.PI * 0.5 // Environment map rotation (0.5 = 90°; use Math.PI for 180°)

  const canvas = document.getElementById('hero-card-3d-canvas')
  const container = document.getElementById('hero-card-3d')

  if (!canvas || !container) return

  // Ensure container has dimensions (flex layout may not be ready yet)
  const ensureDimensions = () => {
    const w = container.clientWidth
    const h = container.clientHeight
    if (w > 0 && h > 0) return { width: w, height: h }
    return { width: 400, height: 400 }
  }

  // Check WebGL support
  try {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) {
      console.warn('Hero 3D: WebGL not supported')
      return
    }
  } catch {
    console.warn('Hero 3D: WebGL not available')
    return
  }

  async function init() {
    const [three, { GLTFLoader }, { RGBELoader }, { MeshoptDecoder }] = await Promise.all([
      import('three'),
      import('https://unpkg.com/three@0.170.0/examples/jsm/loaders/GLTFLoader.js'),
      import('https://unpkg.com/three@0.170.0/examples/jsm/loaders/RGBELoader.js'),
      import('meshoptimizer/decoder'),
    ])
    const { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, Box3, Vector3, Group, MeshStandardMaterial, Color, EquirectangularReflectionMapping } = three

    const { width, height } = ensureDimensions()

    const scene = new Scene()

    // Load HDR environment map (Studio Small 09, Poly Haven, CC0)
    // Try local first, fallback to Poly Haven URL
    const HDR_URLS = [
      '/assets/hdr/studio_small_09_1k.hdr',
      'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr',
    ]
    await new Promise((resolve, reject) => {
      const rgbeLoader = new RGBELoader()
      let tried = 0
      function tryLoad() {
        rgbeLoader.load(
          HDR_URLS[tried],
          (texture) => {
            texture.mapping = EquirectangularReflectionMapping
            texture.rotation = ENV_ROTATION
            scene.environment = texture
            resolve()
          },
          undefined,
          () => {
            tried++
            if (tried < HDR_URLS.length) tryLoad()
            else reject(new Error('HDR load failed'))
          }
        )
      }
      tryLoad()
    })
    const camera = new PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(0, 0, 1.5)

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000, 0)

    scene.add(new AmbientLight(0xffffff, 1.2))
    const dirLight = new DirectionalLight(0xffffff, 1.1)
    dirLight.position.set(3, 3, 4)
    scene.add(dirLight)
    const fillLight = new DirectionalLight(0xffffff, 0.7)
    fillLight.position.set(-3, 2, 3)
    scene.add(fillLight)
    const backLight = new DirectionalLight(0xffffff, 0.5)
    backLight.position.set(0, -2, -2)
    scene.add(backLight)

    let model = null
    let animationId = null
    let basePositionY = 0

    try {
      const gltf = await new Promise((resolve, reject) => {
        const loader = new GLTFLoader()
        loader.setMeshoptDecoder(MeshoptDecoder)
        loader.load(
          '/assets/models/3d-card-prod.glb',
          resolve,
          undefined,
          reject
        )
      })
      model = gltf.scene

      // Use MeshStandardMaterial (lighter than MeshPhysicalMaterial) – reduces GPU load
      const metalMaterial = new MeshStandardMaterial({
        color: new Color(0xc8c8c8),
        metalness: 0.8,
        roughness: 0.9,
        envMapIntensity: 0.8,
      })
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = metalMaterial
        }
      })

      // Center model and scale to fill viewport (dynamic scaling works for any model units)
      const box = new Box3().setFromObject(model)
      const center = box.getCenter(new Vector3())
      model.position.sub(center)
      const size = box.getSize(new Vector3())

      const cameraDistance = camera.position.length()
      const vFov = camera.fov * (Math.PI / 180)
      const visibleHeight = 2 * Math.tan(vFov / 2) * cameraDistance
      const visibleWidth = visibleHeight * (width / height)
      const maxModelSize = Math.max(size.x, size.y, size.z)

      const updateScale = () => {
        const dims = ensureDimensions()
        const vFov = camera.fov * (Math.PI / 180)
        const visibleH = 2 * Math.tan(vFov / 2) * camera.position.length()
        const visibleW = visibleH * (dims.width / dims.height)
        const fill = getViewportFill(dims.width)
        model.scale.setScalar((Math.min(visibleW, visibleH) * fill) / maxModelSize)
      }
      updateScale()

      const cardGroup = new Group()
      cardGroup.add(model)
      scene.add(cardGroup)
      cardGroup.rotation.x = -Math.PI / 2
      cardGroup.rotation.y = Math.PI // 180° – flip card right-side up
      basePositionY = model.position.y
      document.getElementById('hero-card-loading')?.classList.add('loaded')
    } catch (err) {
      console.warn('Hero 3D: failed to load model', err)
      document.getElementById('hero-card-loading')?.classList.add('loaded')
      return
    }

    // Z: 360° loop, X: ±20° tilt
    const DEG = Math.PI / 180
    model.rotation.order = 'YXZ'
    model.rotation.set(0, 0, 0)

    gsap.to(model.rotation, {
      z: Math.PI * 2,
      duration: 16,
      ease: 'none',
      repeat: -1,
    })

    gsap.fromTo(
      model.rotation,
      { x: -20 * DEG },
      { x: 20 * DEG, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1 }
    )

    gsap.fromTo(
      model.position,
      { y: basePositionY - 0.004 },
      { y: basePositionY + 0.004, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }
    )

    gsap.to(dirLight, {
      intensity: 1.7,
      duration: 4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })

    function animate() {
      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }
    animate()

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animationId) { cancelAnimationFrame(animationId); animationId = 0 }
      } else {
        if (!animationId) animate()
      }
    })

    function resize() {
      const { width: w, height: h } = ensureDimensions()
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      updateScale()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    window.addEventListener('resize', resize)

    window.addEventListener('beforeunload', () => {
      if (animationId) cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', resize)
    })
  }

  // Wait for layout so container has dimensions (with timeout fallback)
  let retries = 0
  const maxRetries = 60 // ~1 second at 60fps
  const runInit = () => {
    if ((container.clientWidth > 0 && container.clientHeight > 0) || retries++ > maxRetries) {
      init().catch((err) => {
        console.warn('Hero 3D: init failed', err)
        document.getElementById('hero-card-loading')?.classList.add('loaded')
      })
    } else {
      requestAnimationFrame(runInit)
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInit)
  } else {
    runInit()
  }
})()
