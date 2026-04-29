(() => {
  const DEFAULT_PLAYBACK_PORTION = 0.78

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  function buildFrameSources(root, start, count) {
    return Array.from({ length: count }, (_, index) => (
      `${root.replace(/\/$/, '')}/box-${start + index}.webp`
    ))
  }

  function initOneSequence(section) {
    const root = section.dataset.sequenceRoot
    const start = parseInt(section.dataset.sequenceStart, 10)
    const count = parseInt(section.dataset.sequenceCount, 10)
    const parsedPortion = parseFloat(section.dataset.playbackPortion || '')
    const playbackPortion = Number.isFinite(parsedPortion) && parsedPortion > 0
      ? parsedPortion
      : DEFAULT_PLAYBACK_PORTION

    const frameImage = section.querySelector('.box-sequence-frame')
    if (!root || !Number.isFinite(start) || !Number.isFinite(count) || count < 1 || !frameImage) {
      return
    }

    const frameSources = buildFrameSources(root, start, count)
    let currentFrame = 0
    let ticking = false

    const firstFrame = new Image()
    firstFrame.decoding = 'async'
    firstFrame.src = frameSources[0]
    firstFrame.onload = () => {
      frameImage.src = frameSources[0]
      frameImage.classList.add('is-ready')
    }

    const preloadAllFrames = () => {
      frameSources.forEach((src, index) => {
        if (index === 0) return
        const img = new Image()
        img.decoding = 'async'
        img.src = src
      })
    }

    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight * 1.5) {
          preloadAllFrames()
          preloadObserver.disconnect()
        }
      },
      { rootMargin: '1200px 0px' }
    )

    preloadObserver.observe(section)

    const updateFrame = () => {
      const rect = section.getBoundingClientRect()
      const scrollDistance = Math.max(section.offsetHeight - window.innerHeight, 1)
      const scrollProgress = clamp(-rect.top / scrollDistance, 0, 1)
      const playbackProgress = clamp(scrollProgress / playbackPortion, 0, 1)
      const nextFrame = Math.min(
        count - 1,
        Math.round(playbackProgress * (count - 1))
      )

      if (nextFrame !== currentFrame) {
        currentFrame = nextFrame
        frameImage.src = frameSources[nextFrame]
      }

      ticking = false
    }

    const requestFrameUpdate = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(updateFrame)
    }

    requestFrameUpdate()
    window.addEventListener('scroll', requestFrameUpdate, { passive: true })
    window.addEventListener('resize', requestFrameUpdate, { passive: true })
  }

  function initBoxSequences() {
    document.querySelectorAll('[data-box-sequence]').forEach(initOneSequence)
  }

  window.addEventListener('DOMContentLoaded', initBoxSequences)
})()
