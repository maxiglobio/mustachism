'use client'

import { useCallback, useEffect, useRef } from 'react'
import { LicenseCard3D, type LicenseCardHandle } from '@/components/card3d/LicenseCard3D'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { CardFeatures } from './CardFeatures'
import { HomeHero } from './HomeHero'
import { clamp01, createJourneyState, lerp, slotZoom, smooth } from './journey'

/**
 * Hero + features share ONE 3D card. It lives in a fixed, full-screen layer behind the page:
 * it sits in the hero's card slot, glides to the centre as the features section arrives, runs
 * the features close-ups while that section is pinned, then scrolls away with it.
 */
export function HomeJourney({ waitlist }: { waitlist: boolean }) {
  const cardRef = useRef<LicenseCardHandle>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLElement>(null)
  const state = useRef(createJourneyState()).current
  const readyWaiters = useRef<Array<() => void>>([])

  const onReady = useCallback(() => {
    state.ready = true
    const status = layerRef.current?.querySelector<HTMLElement>('.card3d')?.dataset.status
    if (status === 'fallback') slotRef.current?.setAttribute('data-fallback', 'true')
    readyWaiters.current.splice(0).forEach((fn) => fn())
  }, [state])

  const whenReady = useCallback(
    () => new Promise<void>((r) => (state.ready ? r() : readyWaiters.current.push(r))),
    [state],
  )

  // Per-frame blend of hero slot ↔ features camera ↔ intro flight.
  useEffect(() => {
    const layer = layerRef.current
    const slot = slotRef.current
    const features = featuresRef.current
    if (!layer || !slot || !features) return
    const reduced = prefersReducedMotion()
    let paused = false
    let appear = 0 // fades the card in once it's ready (outside the intro)
    let lastOpacity = ''
    let lastShadow = ''

    const update = () => {
      const card = cardRef.current
      const cardPx = card?.cardPxWidth() ?? 0
      if (!card || !cardPx) return
      const vw = window.innerWidth
      const vh = window.innerHeight

      // Hero: card centred in its slot, sized to fill it.
      const r = slot.getBoundingClientRect()
      const heroX = r.left + r.width / 2 - vw / 2
      const heroY = r.top + r.height / 2 - vh / 2
      const heroZoom = slotZoom(r, cardPx)

      // Hand-off: over the last screen before the features pin, travel to the centre.
      // Phones stack the slot above the hero copy, so wait until that copy has scrolled away
      // (otherwise the card would slide down behind the paragraph and button).
      const f = features.getBoundingClientRect()
      const span = vw < 768 ? vh * 0.5 : vh
      const t = reduced ? 0 : smooth(clamp01((span - f.top) / span))
      const fp = state.feature
      let x = lerp(heroX, 0, t)
      let y = lerp(heroY, 0, t)
      let zoom = lerp(heroZoom, fp.zoom, t)
      const pose = { yaw: fp.yaw * t, pitch: fp.pitch * t, roll: fp.roll * t, fx: fp.fx * t, fy: fp.fy * t }

      // Leave with the features section when it un-pins.
      if (!reduced && f.bottom < vh) y += f.bottom - vh

      // Intro flight overrides everything while it runs, then hands back (k → 0).
      const it = state.intro
      if (it.k > 0) {
        x = lerp(x, it.x, it.k)
        y = lerp(y, it.y, it.k)
        zoom = lerp(zoom, it.zoom, it.k)
      }

      card.setLayout({ x, y })
      card.setFeaturePose({ ...pose, zoom })
      if (state.ready && appear < 1) appear = reduced ? 1 : Math.min(1, appear + gsap.ticker.deltaRatio() / 45)
      const opacity = lerp(appear, it.opacity, it.k).toFixed(3)
      if (opacity !== lastOpacity) layer.style.opacity = lastOpacity = opacity
      // The floor shadow belongs to the card: only show it while the card rests in the slot.
      const shadow = (appear * (1 - t) * (1 - it.k)).toFixed(3)
      if (shadow !== lastShadow) slot.style.setProperty('--slot-shadow', (lastShadow = shadow))

      // Nothing to draw once the card is a full screen above or below the viewport.
      const cardH = cardPx * zoom * 0.63
      const off = y + vh / 2 + cardH < 0 || y - cardH > vh
      if (off !== paused) {
        paused = off
        card.setPaused(off)
      }
    }

    gsap.ticker.add(update)
    return () => gsap.ticker.remove(update)
  }, [state])

  return (
    <>
      <div ref={layerRef} className="journey-layer" aria-hidden="true">
        <LicenseCard3D
          ref={cardRef}
          hoverTargetRef={heroRef}
          pointerTargetRef={slotRef}
          onReady={onReady}
          priority
        />
      </div>
      <HomeHero
        waitlist={waitlist}
        rootRef={heroRef}
        slotRef={slotRef}
        cardRef={cardRef}
        state={state}
        whenReady={whenReady}
      />
      <CardFeatures rootRef={featuresRef} state={state} />
    </>
  )
}
