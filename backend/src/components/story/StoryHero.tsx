'use client'

import { useEffect, useRef } from 'react'
import { MUSTACHE_FRAMES } from '@/lib/content'
import { configureScrollTrigger, gsap, prefersReducedMotion } from '@/lib/motion'

export function StoryHero() {
  const rootRef = useRef<HTMLElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const img = imgRef.current
    if (!root || !img || prefersReducedMotion()) return
    configureScrollTrigger()

    // Preload, then flip through the mustaches like a flip-book (only while on screen).
    MUSTACHE_FRAMES.forEach((src) => {
      const i = new Image()
      i.src = src
    })
    let frame = 0
    let timer = 0
    const start = () => {
      window.clearInterval(timer)
      timer = window.setInterval(() => {
        frame = (frame + 1) % MUSTACHE_FRAMES.length
        img.src = MUSTACHE_FRAMES[frame]
      }, 150)
    }
    const stop = () => window.clearInterval(timer)
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()))
    io.observe(root)

    const ctx = gsap.context(() => {
      const header = document.querySelector('[data-header]')
      if (header) gsap.fromTo(header, { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' })
      gsap.fromTo(
        '.hero-title-line',
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.12 },
      )
      gsap.fromTo('.hero-subtitle', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out', delay: 0.28 })
      gsap.fromTo('.hero-actions', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out', delay: 0.38 })
      gsap.fromTo(
        '.hero-visual',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.44, clearProps: 'transform' },
      )
      gsap.to('.story-hero__seal', {
        yPercent: -18,
        rotate: -6,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.5 },
      })
    }, root)

    return () => {
      stop()
      io.disconnect()
      ctx.revert()
    }
  }, [])

  return (
    <section ref={rootRef} className="story-hero" aria-labelledby="story-title">
      <div className="container story-hero__grid">
        <div className="story-hero__copy">
          <h1 id="story-title" className="hero-title hero-title--story">
            <span className="hero-title-line">Everything real</span>
            <span className="hero-title-line">
              gets <em>erased first.</em>
            </span>
          </h1>
          <p className="hero-subtitle">Ten commandments for the ones who kept theirs.</p>
          <div className="hero-actions">
            <a href="#codex" className="scroll-cue mono">
              <span>Mustachism codex</span>
              <svg width="14" height="22" viewBox="0 0 22 36" fill="none" aria-hidden="true">
                <path
                  d="M11 0v30M3 22l8 8 8-8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
        <div className="hero-visual story-hero__visual" aria-hidden="true">
          <div className="story-hero__seal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/story/stamp.webp" alt="" className="story-hero__stamp" width={744} height={549} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={MUSTACHE_FRAMES[0]}
              alt=""
              className="story-hero__mustache"
              width={1140}
              height={768}
              fetchPriority="high"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
