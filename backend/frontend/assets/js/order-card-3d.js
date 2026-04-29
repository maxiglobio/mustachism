/**
 * Order page 3D card - loads and displays 3d-card-order.glb with Three.js
 * Subtle idle rotation for visual interest
 */
(function () {
  const canvas = document.getElementById('order-card-3d-canvas')
  const container = document.getElementById('order-card-3d')

  if (!canvas || !container) return

  const ensureDimensions = () => {
    const w = container.clientWidth
    const h = container.clientHeight
    if (w > 0 && h > 0) return { width: w, height: h }
    return { width: 500, height: 311 }
  }

  try {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) {
      console.warn('Order 3D: WebGL not supported')
      return
    }
  } catch {
    console.warn('Order 3D: WebGL not available')
    return
  }

  async function init() {
    const [three, { GLTFLoader }, { RGBELoader }] = await Promise.all([
      import('three'),
      import('https://unpkg.com/three@0.170.0/examples/jsm/loaders/GLTFLoader.js'),
      import('https://unpkg.com/three@0.170.0/examples/jsm/loaders/RGBELoader.js'),
    ])
    let MeshoptDecoder = null
    try {
      const mod = await import('meshoptimizer/decoder')
      MeshoptDecoder = mod.default || mod
    } catch (_) { /* optional */ }
    const { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, Box3, Vector3, Group, MeshPhysicalMaterial, Color, EquirectangularReflectionMapping } = three

    const { width, height } = ensureDimensions()

    const scene = new Scene()

    const HDR_URLS = [
      '/assets/hdr/studio_small_09_1k.hdr',
      'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr',
    ]
    try {
      await new Promise((resolve, reject) => {
        const rgbeLoader = new RGBELoader()
        let tried = 0
        function tryLoad() {
          rgbeLoader.load(
            HDR_URLS[tried],
            (texture) => {
              texture.mapping = EquirectangularReflectionMapping
              texture.rotation = Math.PI * 0.5
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
    } catch (_) {
      /* continue without env map */
    }

    const camera = new PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(0, 0, 1.5)

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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
        if (MeshoptDecoder) loader.setMeshoptDecoder(MeshoptDecoder)
        loader.load(
          '/assets/models/3d-card-order.glb',
          resolve,
          undefined,
          reject
        )
      })
      model = gltf.scene

      const brushedAluminiumMaterial = new MeshPhysicalMaterial({
        color: new Color(0xc8c8c8),
        metalness: 0.85,
        roughness: 0.92,
        clearcoat: 0,
        anisotropy: 0.2,
        anisotropyRotation: 0,
        envMapIntensity: 1.0,
      })
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = brushedAluminiumMaterial
        }
      })

      const box = new Box3().setFromObject(model)
      const center = box.getCenter(new Vector3())
      model.position.sub(center)
      const size = box.getSize(new Vector3())

      const cameraDistance = camera.position.length()
      const vFov = camera.fov * (Math.PI / 180)
      const visibleHeight = 2 * Math.tan(vFov / 2) * cameraDistance
      const visibleWidth = visibleHeight * (width / height)
      const maxModelSize = Math.max(size.x, size.y, size.z)
      const fill = 0.7

      const updateScale = () => {
        const dims = ensureDimensions()
        const vFov = camera.fov * (Math.PI / 180)
        const visibleH = 2 * Math.tan(vFov / 2) * camera.position.length()
        const visibleW = visibleH * (dims.width / dims.height)
        model.scale.setScalar((Math.min(visibleW, visibleH) * fill) / maxModelSize)
      }
      updateScale()

      function resize() {
        const { width: w, height: h } = ensureDimensions()
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
        updateScale()
      }

      const cardGroup = new Group()
      cardGroup.add(model)
      scene.add(cardGroup)
      cardGroup.rotation.x = -Math.PI / 2
      cardGroup.rotation.y = Math.PI
      basePositionY = model.position.y

      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(container)
      window.addEventListener('resize', resize)

      window.addEventListener('beforeunload', () => {
        if (animationId) cancelAnimationFrame(animationId)
        resizeObserver.disconnect()
        window.removeEventListener('resize', resize)
      })
    } catch (err) {
      console.warn('Order 3D: failed to load model', err)
      return
    }

    let time = 0
    function animate() {
      time += 0.005
      model.rotation.z = Math.sin(time) * 0.08
      model.rotation.x = Math.sin(time * 0.7) * 0.04
      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }
    animate()
  }

  let retries = 0
  const maxRetries = 60
  const runInit = () => {
    if ((container.clientWidth > 0 && container.clientHeight > 0) || retries++ > maxRetries) {
      init().catch((err) => console.warn('Order 3D: init failed', err))
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
