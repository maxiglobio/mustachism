'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { CARD_ASSETS } from './assets'
import type { CardMode, LicenseCardEngine } from './engine'
import type { EngravingData } from './engraver'

export interface LicenseCardHandle {
  flip: () => void
  showFace: (face: 'front' | 'back') => void
  setScrollPose: LicenseCardEngine['setScrollPose']
  setIntroPose: LicenseCardEngine['setIntroPose']
  setFeaturePose: LicenseCardEngine['setFeaturePose']
  setLayout: (layout: { x?: number; y?: number }) => void
  setPaused: (paused: boolean) => void
  /** Card width in CSS px at zoom 1 (0 until the engine exists). */
  cardPxWidth: () => number
  enableGyro: () => Promise<boolean>
}

type Props = {
  mode?: CardMode
  engraving?: EngravingData
  interactive?: boolean
  /** Element whose area drives hover tilt (e.g. the whole hero). */
  hoverTargetRef?: React.RefObject<HTMLElement | null>
  /** Element that receives drag / tap / keys instead of the canvas stage. */
  pointerTargetRef?: React.RefObject<HTMLElement | null>
  className?: string
  label?: string
  /** Show the "drag / tap" hint + iOS motion opt-in. */
  showHint?: boolean
  priority?: boolean
  /** Fires once the card is rendering (or has fallen back to the poster). */
  onReady?: () => void
}

export const LicenseCard3D = forwardRef<LicenseCardHandle, Props>(function LicenseCard3D(
  {
    mode = 'showcase',
    engraving,
    interactive = true,
    hoverTargetRef,
    pointerTargetRef,
    className,
    label = 'Steel mustache license card in 3D',
    showHint = false,
    priority = false,
    onReady,
  },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const posterRef = useRef<HTMLImageElement>(null)
  const engineRef = useRef<LicenseCardEngine | null>(null)
  const engravingRef = useRef(engraving)
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading')
  const [gyro, setGyro] = useState<'unknown' | 'ask' | 'on'>('unknown')

  engravingRef.current = engraving
  const pending = useRef({ scroll: {}, intro: {}, feature: {}, layout: {} } as {
    layout: { x?: number; y?: number }
    scroll: Parameters<LicenseCardEngine['setScrollPose']>[0]
    intro: Parameters<LicenseCardEngine['setIntroPose']>[0]
    feature: Parameters<LicenseCardEngine['setFeaturePose']>[0]
  })
  // When a slot elsewhere handles input, this stage is purely visual.
  const ownInput = interactive && !pointerTargetRef
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useImperativeHandle(ref, () => ({
    flip: () => engineRef.current?.flip(),
    showFace: (face) => engineRef.current?.showFace(face),
    // Poses set before the engine exists are remembered and applied when it starts.
    setScrollPose: (pose) => {
      Object.assign(pending.current.scroll, pose)
      engineRef.current?.setScrollPose(pose)
    },
    setIntroPose: (pose) => {
      Object.assign(pending.current.intro, pose)
      engineRef.current?.setIntroPose(pose)
    },
    setFeaturePose: (pose) => {
      Object.assign(pending.current.feature, pose)
      engineRef.current?.setFeaturePose(pose)
    },
    setLayout: (layout) => {
      Object.assign(pending.current.layout, layout)
      engineRef.current?.setLayout(layout)
    },
    setPaused: (paused) => engineRef.current?.setPaused(paused),
    cardPxWidth: () => engineRef.current?.cardPxWidth() ?? 0,
    enableGyro: () => engineRef.current?.enableGyro() ?? Promise.resolve(false),
  }))

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    let cancelled = false
    let engine: LicenseCardEngine | null = null

    // Probe WebGL before pulling in three.js at all.
    const probe = document.createElement('canvas')
    const gl = probe.getContext('webgl2') || probe.getContext('webgl')
    if (!gl) {
      setStatus('fallback')
      onReadyRef.current?.()
      return
    }

    import('./engine').then(({ LicenseCardEngine }) => {
      if (cancelled) return
      const reduced = prefersReducedMotion()
      engine = new LicenseCardEngine(wrap, canvas, {
        mode,
        interactive,
        animate: !reduced,
        hoverTarget: hoverTargetRef?.current ?? null,
        pointerTarget: pointerTargetRef?.current ?? null,
        onReady: () => {
          if (cancelled) return
          setStatus('ready')
          onReadyRef.current?.()
          if (reduced) {
            gsap.set(canvas, { opacity: 1 })
            gsap.set(posterRef.current, { opacity: 0 })
          } else {
            gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' })
            gsap.to(posterRef.current, { opacity: 0, duration: 0.6, delay: 0.2 })
          }
        },
        onError: () => {
          if (cancelled) return
          setStatus('fallback')
          onReadyRef.current?.()
        },
      })
      engineRef.current = engine
      if (process.env.NODE_ENV !== 'production') {
        const w = window as unknown as { __cards?: Map<HTMLElement, LicenseCardEngine> }
        ;(w.__cards ??= new Map()).set(wrap, engine)
      }
      engine.setScrollPose(pending.current.scroll)
      engine.setIntroPose(pending.current.intro)
      engine.setFeaturePose(pending.current.feature)
      engine.setLayout(pending.current.layout)
      if (engravingRef.current) engine.setEngraving(engravingRef.current)
      engine.init()

      // Gyro: Android grants it silently; iOS needs an explicit tap.
      if (interactive && matchMedia('(hover: none) and (pointer: coarse)').matches && !reduced) {
        const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: unknown } | undefined
        if (DOE && typeof DOE.requestPermission === 'function') setGyro('ask')
        else if (DOE) engine.enableGyro().then((ok) => ok && setGyro('on'))
      }
    })

    return () => {
      cancelled = true
      engine?.dispose()
      engineRef.current = null
    }
    // Engine is created once per mode; engraving changes flow through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, interactive])

  useEffect(() => {
    if (engraving) engineRef.current?.setEngraving(engraving)
  }, [engraving])

  const askGyro = async () => {
    const ok = await engineRef.current?.enableGyro()
    setGyro(ok ? 'on' : 'unknown')
  }

  return (
    <div className={`card3d ${className ?? ''}`} data-status={status}>
      <div
        ref={wrapRef}
        className="card3d__stage"
        tabIndex={ownInput ? 0 : -1}
        role={ownInput ? 'img' : undefined}
        aria-roledescription={ownInput ? 'interactive 3D model' : undefined}
        aria-label={ownInput ? `${label}. Drag to rotate; press Enter to flip.` : label}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={posterRef}
          className="card3d__poster"
          src={CARD_ASSETS.poster}
          alt=""
          aria-hidden="true"
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
        />
        <canvas ref={canvasRef} className="card3d__canvas" aria-hidden="true" />
        <span className="card3d__shadow" aria-hidden="true" />
      </div>
      {showHint && interactive && status !== 'fallback' ? (
        <div className="card3d__hint mono">
          <span className="card3d__hint-desktop">Drag to turn · Click to flip</span>
          <span className="card3d__hint-touch">Swipe to turn · Tap to flip</span>
          {gyro === 'ask' ? (
            <button type="button" className="card3d__gyro" onClick={askGyro}>
              Enable tilt
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
})
