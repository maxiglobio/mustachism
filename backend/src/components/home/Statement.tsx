'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { configureScrollTrigger, gsap, isNarrowViewport, prefersReducedMotion } from '@/lib/motion'

/** Block 10 — why Mustachism exists: blur-in statement over a parallax photograph. */
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
        <div className="statement__lead">
          <h2 id="statement-title" className="statement__ask">
            So why does a mustache need a license?
          </h2>
          <p>Technically, it doesn&rsquo;t. That&rsquo;s not the point.</p>
          <p>
            A mustache can become style, character, ritual, rebellion — or simply part of who someone is. Mustachism
            exists to make that official.
          </p>
        </div>
        <p className="statement__main">
          We certify <em>what survived.</em> We document <em>what wasn&rsquo;t erased.</em> We give permission{' '}
          <em>to be seen.</em>
        </p>
        <Link href="/story" className="btn btn--lg statement__cta">
          Explore Mustachism
        </Link>
      </div>
    </section>
  )
}
