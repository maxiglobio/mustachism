'use client'

import { useEffect } from 'react'
import { configureScrollTrigger, gsap, isNarrowViewport, prefersReducedMotion } from '@/lib/motion'
import type { JourneyState, Pose } from './journey'

/**
 * Each feature is a camera move on the card. fx / fy are in card units
 * (0.92 wide × 0.58 tall, origin at the centre, +y up, front face).
 */
const FEATURES: Array<{ title: string; copy: string; pose: Pose }> = [
  {
    title: 'Solid Steel. No Plastic.',
    copy: 'Engraved. Permanent. Real.',
    // Nearly edge-on: the light runs along the steel edge and the comb teeth.
    pose: { yaw: -1.15, pitch: 0.2, roll: 0.06, fx: -0.1, fy: -0.1, zoom: 0.95 },
  },
  {
    title: 'Your Number. Your Mark.',
    copy: 'Choose it. Or take what’s left.',
    // Close on the licence number in the header line.
    pose: { yaw: 0.12, pitch: -0.1, roll: 0, fx: 0.15, fy: 0.23, zoom: 1.25 },
  },
  {
    title: 'Not For Everyone.',
    copy: 'Private access. Limited issuance.',
    // Turned over: the mark on the reverse.
    pose: { yaw: Math.PI - 0.18, pitch: 0.1, roll: -0.03, fx: 0, fy: 0.03, zoom: 0.82 },
  },
]

const OVERVIEW: Pose = { yaw: -0.25, pitch: 0.12, roll: 0, fx: 0, fy: 0.24, zoom: 0.46 }

type Props = {
  rootRef: React.RefObject<HTMLElement | null>
  /** The shared card's features camera lives here; HomeJourney applies it. */
  state: JourneyState
}

export function CardFeatures({ rootRef, state }: Props) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return
    configureScrollTrigger()
    const narrow = isNarrowViewport()
    // Phones frame the card by width, so it renders smaller — scale every shot up to compensate.
    const zoomFor = (z: number) => (narrow ? z * 1.65 : z)

    const overview: Pose = { ...OVERVIEW, zoom: zoomFor(OVERVIEW.zoom) }
    const pose = Object.assign(state.feature, overview)

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('.features__item', root)
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: narrow ? 0.6 : 1,
        },
      })

      // Each step: camera move (1 unit) + hold (0.8 units); text crossfades on the move.
      // The title introduces the card, then lifts away so each close-up owns the stage.
      tl.to('.features__title', { autoAlpha: 0, y: -40, filter: 'blur(6px)', duration: 0.6, ease: 'power2.in' }, 0)

      FEATURES.forEach((f, i) => {
        const at = i * 1.8
        tl.to(pose, { ...f.pose, zoom: zoomFor(f.pose.zoom), duration: 1 }, at)
        if (i > 0) tl.to(items[i - 1], { autoAlpha: 0, y: -28, filter: 'blur(6px)', duration: 0.45 }, at)
        tl.fromTo(
          items[i],
          { autoAlpha: 0, y: 28, filter: 'blur(6px)' },
          { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.55 },
          at + 0.4,
        )
      })
      // Pull back out before the section releases.
      const end = FEATURES.length * 1.8
      tl.to(pose, { ...overview, yaw: Math.PI * 2 - 0.25, duration: 1 }, end)
        .to(items[items.length - 1], { autoAlpha: 0, y: -28, duration: 0.45 }, end)
        .to({}, { duration: 0.3 })

      // Dots track progress.
      const dots = gsap.utils.toArray<HTMLElement>('.features__dot', root)
      tl.eventCallback('onUpdate', () => {
        const step = Math.min(FEATURES.length - 1, Math.floor((tl.time() + 0.2) / 1.8))
        dots.forEach((d, i) => d.setAttribute('data-active', String(i === step)))
      })
    }, root)

    return () => ctx.revert()
  }, [rootRef, state])

  return (
    <section ref={rootRef as React.RefObject<HTMLElement>} className="features" aria-labelledby="features-title">
      <div className="features__stage">
        <h2 id="features-title" className="features__title section-title">
          One card. Cut from steel, <em>numbered for life.</em>
        </h2>
        <ul className="features__list">
          {FEATURES.map((f, i) => (
            <li key={f.title} className="features__item">
              <span className="features__n mono">0{i + 1}</span>
              <h3 className="features__name">{f.title}</h3>
              <p className="features__copy mono">{f.copy}</p>
            </li>
          ))}
        </ul>
        <div className="features__dots" aria-hidden="true">
          {FEATURES.map((f) => (
            <span key={f.title} className="features__dot" />
          ))}
        </div>
      </div>
    </section>
  )
}
