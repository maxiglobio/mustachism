'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { LicenseCardHandle } from '@/components/card3d/LicenseCard3D'
import { CARD_ASSETS } from '@/components/card3d/assets'
import { AmbientShapes } from '@/components/motion/AmbientShapes'
import { MUSTACHE_FRAMES } from '@/lib/content'
import { formatCurrency } from '@/lib/licenses'
import { configureScrollTrigger, gsap, prefersReducedMotion } from '@/lib/motion'
import { SITE } from '@/lib/site'
import { CARD_ASPECT, slotZoom, type JourneyState } from './journey'
import { Preloader } from './Preloader'
import { WaitlistForm } from './WaitlistForm'

const INTRO_KEY = 'mustachism:intro'
const MIN_PRELOAD = 2 // seconds the preloader stays up even when everything is cached
const MAX_PRELOAD = 7 // never hold visitors longer than this, ready or not

type Props = {
  waitlist: boolean
  rootRef: React.RefObject<HTMLElement | null>
  /** Where the shared card sits in the hero (also receives drag / tap / keys). */
  slotRef: React.RefObject<HTMLDivElement | null>
  cardRef: React.RefObject<LicenseCardHandle | null>
  state: JourneyState
  whenReady: () => Promise<void>
}

export function HomeHero({ waitlist, rootRef, slotRef, cardRef, state, whenReady }: Props) {
  const preloaderRef = useRef<HTMLDivElement>(null)
  const [gyro, setGyro] = useState<'none' | 'ask' | 'on'>('none')

  useEffect(() => {
    // iOS needs an explicit tap to grant motion access; Android is enabled by the card itself.
    const coarse = matchMedia('(hover: none) and (pointer: coarse)').matches
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: unknown } | undefined
    if (coarse && !prefersReducedMotion() && DOE && typeof DOE.requestPermission === 'function') setGyro('ask')
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    configureScrollTrigger()
    const html = document.documentElement
    const reduced = prefersReducedMotion()

    let flip = 0
    let seen = false
    // `/?intro` always replays it (handy for reviewing).
    const forced = new URLSearchParams(window.location.search).has('intro')
    try {
      seen = !forced && sessionStorage.getItem(INTRO_KEY) === '1'
    } catch {
      /* storage unavailable: play it */
    }
    const playIntro = !reduced && !seen && !!preloaderRef.current
    if (!playIntro) html.classList.add('intro-skip')
    // Hold the card invisible off-screen until the intro flies it in.
    if (playIntro) Object.assign(state.intro, { k: 1, x: -window.innerWidth, y: -window.innerHeight, zoom: 0.5, opacity: 0 })

    if (reduced) return

    const ctx = gsap.context(() => {
      const header = document.querySelector('[data-header]')

      /** Header, title, copy — the regular hero entrance. */
      const entrance = (tl: gsap.core.Timeline, at: gsap.Position) => {
        if (header) tl.fromTo(header, { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, at)
        tl.fromTo(
          '.hero-title-line',
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08 },
          `${at}+=0.12`,
        )
          .fromTo('.hero-subtitle', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out' }, `${at}+=0.28`)
          .fromTo('.hero-actions', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out' }, `${at}+=0.38`)
        return tl
      }

      if (!playIntro) {
        const tl = entrance(gsap.timeline(), 0)
        tl.fromTo(
          '.hero-visual',
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', clearProps: 'transform' },
          0.44,
        )
      } else {
        runIntro(entrance)
      }

    }, root)

    /** Preloader → tumbling fly-in to centre → glide into the hero → page entrance. */
    function runIntro(entrance: (tl: gsap.core.Timeline, at: gsap.Position) => gsap.core.Timeline) {
      const pre = preloaderRef.current!
      const visual = root!.querySelector<HTMLElement>('.hero-visual')!
      const slot = slotRef.current!
      const mustache = pre.querySelector<HTMLImageElement>('.preloader__mustache')!
      const counter = pre.querySelector<HTMLElement>('[data-count]')!

      html.classList.add('intro-running')
      window.scrollTo(0, 0)

      // Flip-book.
      MUSTACHE_FRAMES.forEach((src) => {
        const i = new Image()
        i.src = src
      })
      let frame = 0
      flip = window.setInterval(() => {
        frame = (frame + 1) % MUSTACHE_FRAMES.length
        mustache.src = MUSTACHE_FRAMES[frame]
      }, 130)

      gsap.fromTo(mustache, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: 'expo.out', delay: 0.1 })
      gsap.fromTo(pre.querySelector('.preloader__count'), { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.3 })

      // Counter: eases toward 90 while loading, completes when the card is ready.
      const count = { v: 0 }
      const render = () => (counter.textContent = `000-${String(Math.round(count.v)).padStart(3, '0')}`)
      const loading = gsap.to(count, { v: 90, duration: MIN_PRELOAD + 1.5, ease: 'power2.out', onUpdate: render })

      const minWait = new Promise<void>((r) => window.setTimeout(r, MIN_PRELOAD * 1000))
      const cardReady = whenReady()
      const cap = new Promise<void>((r) => window.setTimeout(r, MAX_PRELOAD * 1000))

      Promise.all([minWait, Promise.race([cardReady, cap])]).then(() => ctx.add(() => {
        loading.kill()
        gsap.to(count, { v: 100, duration: 0.35, ease: 'power1.out', onUpdate: render })

        // Positions are screen offsets (px) from the viewport centre; zoom is the card's scale.
        const r = slot.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight
        const cardPx = cardRef.current?.cardPxWidth() || vw * 0.5
        const heroZoom = slotZoom(r, cardPx)
        const centreZoom = heroZoom * gsap.utils.clamp(0.85, 1.22, Math.min((vw * 0.92) / r.width, (vh * 0.78) / r.height))
        const startZoom = centreZoom * 0.72
        // Start just outside the top-left corner, slightly turned toward the viewer.
        const fromX = -vw / 2 - (cardPx * startZoom) / 2
        const fromY = -vh / 2 - (cardPx * startZoom * CARD_ASPECT) / 2
        const intro = state.intro
        Object.assign(intro, { k: 1, x: fromX, y: fromY, zoom: startZoom, opacity: 0 })
        const pose = { yaw: 0.85, pitch: -0.5, roll: 0.32 }
        const applyPose = () => cardRef.current?.setIntroPose(pose)

        const tl = gsap.timeline({
          delay: 0.35,
          onComplete: () => {
            window.clearInterval(flip)
            html.classList.remove('intro-running')
            html.classList.add('intro-skip')
            try {
              sessionStorage.setItem(INTRO_KEY, '1')
            } catch {
              /* ignore */
            }
          },
        })

        // Strictly one step at a time.
        // 1 — the flip-book dissolves completely.
        tl.to(mustache, { scale: 0.86, opacity: 0, filter: 'blur(8px)', duration: 0.6, ease: 'power2.in' }, 0)
          .to(pre.querySelector('.preloader__count'), { opacity: 0, y: -8, duration: 0.4, ease: 'power2.in' }, 0)

        // 2 — then the card drifts in from the top-left corner along a soft arc and turns calmly
        //     to face the viewer as it arrives mid-screen. Different x/y eases bend the path.
        //     (The preloader's backdrop clears first — the card layer sits beneath it.)
        const fly = 0.75
        const flyDur = 2.6
        tl.set(pre, { autoAlpha: 0 }, fly - 0.05)
          .call(applyPose, [], fly)
          .to(intro, { opacity: 1, duration: 0.5, ease: 'sine.out' }, fly)
          .to(intro, { x: 0, duration: flyDur, ease: 'power2.out' }, fly)
          .to(intro, { y: 0, duration: flyDur, ease: 'power3.out' }, fly)
          .to(intro, { zoom: centreZoom, duration: flyDur, ease: 'sine.out' }, fly)
          .to(pose, { yaw: 0, pitch: 0, roll: 0, duration: flyDur + 0.2, ease: 'sine.inOut', onUpdate: applyPose }, fly)

        // 3 — after it lands, it glides into its slot in the hero (the intro hands control back).
        const glide = fly + flyDur + 0.35
        tl.to(intro, { k: 0, duration: 1.15, ease: 'power3.inOut' }, glide)

        // 4 — only then the header, title and copy come in.
        const page = glide + 1.2
        entrance(tl, page)
        tl.fromTo(visual, { opacity: 0 }, { opacity: 1, duration: 0.6 }, page + 0.6)
      }))
    }

    return () => {
      window.clearInterval(flip)
      ctx.revert()
      html.classList.remove('intro-running')
      state.intro.k = 0
    }
  }, [rootRef, slotRef, cardRef, state, whenReady])

  return (
    <section ref={rootRef as React.RefObject<HTMLElement>} className="hero" aria-labelledby="hero-title">
      <AmbientShapes />
      <Preloader ref={preloaderRef} />
      <div className="container hero__grid">
        <div className="hero__copy">
          <h1 id="hero-title" className="hero-title">
            <span className="hero-title-line">A license</span>
            <span className="hero-title-line">for what</span>
            <span className="hero-title-line">
              <em>remains.</em>
            </span>
          </h1>
          <p className="hero-subtitle">
            Solid steel. Engraved. Permanent. Real. A quiet resistance against plastic masculinity.
          </p>
          <div className="hero-actions">
            {waitlist ? (
              <WaitlistForm />
            ) : (
              <div className="hero-cta">
                <Link href="/order" className="btn btn--primary btn--lg">
                  Get your mustache license
                </Link>
                <p className="hero-actions__note mono">Starting from {formatCurrency(SITE.startingPrice)}</p>
              </div>
            )}
          </div>
        </div>
        <div className="hero-visual">
          {/* The shared 3D card is drawn here by HomeJourney's layer; this slot handles input. */}
          <div
            ref={slotRef}
            className="card-slot"
            tabIndex={0}
            role="img"
            aria-roledescription="interactive 3D model"
            aria-label="Steel mustache license card in 3D. Drag to rotate; press Enter to flip."
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="card-slot__poster" src={CARD_ASSETS.poster} alt="" aria-hidden="true" />
          </div>
          <div className="card3d__hint mono">
            <span className="card3d__hint-desktop">Drag to turn · Click to flip</span>
            <span className="card3d__hint-touch">Swipe to turn · Tap to flip</span>
            {gyro === 'ask' ? (
              <button
                type="button"
                className="card3d__gyro"
                onClick={async () => setGyro((await cardRef.current?.enableGyro()) ? 'on' : 'ask')}
              >
                Enable tilt
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
