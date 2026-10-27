'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { configureScrollTrigger, gsap, isNarrowViewport, prefersReducedMotion } from '@/lib/motion'

/** Blur-in statement over a parallax photograph. */
export function Statement() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return
    configureScrollTrigger()
    const narrow = isNarrowViewport()
    const ctx = gsap.context(() => {
      if (!narrow) {
        gsap.fromTo(
          '.statement__bg',
          { yPercent: 6 },
          { yPercent: -6, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 0.45 } },
        )
        gsap.fromTo(
          '.statement__veil',
          { yPercent: -3 },
          { yPercent: 3, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 0.45 } },
        )
      }
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: 'top 78%', end: 'top 42%', scrub: narrow ? true : 0.65 },
      })
      tl.fromTo(
        '.statement__lead',
        { y: 28, opacity: 0.78, filter: 'blur(8px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', ease: 'none' },
        0,
      ).fromTo(
        '.statement__main',
        { y: 44, opacity: 0.55, filter: narrow ? 'blur(6px)' : 'blur(12px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', ease: 'none' },
        0.22,
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={rootRef} className="statement" aria-labelledby="statement-title">
      <div className="statement__media" aria-hidden="true">
        <Image className="statement__bg" src="/assets/images/hero-usp-private.jpg" alt="" fill sizes="100vw" />
        <div className="statement__veil" />
      </div>
      <div className="container statement__inner">
        <p className="statement__lead">This is not grooming. This is not irony. This is not a joke product.</p>
        <h2 id="statement-title" className="statement__main">
          We certify <em>what survived.</em>
        </h2>
      </div>
    </section>
  )
}
