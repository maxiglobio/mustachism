'use client'

import { useEffect, useRef, useState } from 'react'
import { configureScrollTrigger, gsap, isNarrowViewport, prefersReducedMotion, ScrollTrigger } from '@/lib/motion'

/** "The chronicle" film. The page darkens around it; it scales up into place as it arrives. */
export function Chronicle() {
  const rootRef = useRef<HTMLElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const tintRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    const frame = frameRef.current
    const tint = tintRef.current
    if (!root || !frame || !tint) return
    configureScrollTrigger()
    const reduced = prefersReducedMotion()
    const html = document.documentElement

    const ctx = gsap.context(() => {
      if (!reduced) {
        gsap.fromTo(
          frame,
          { scale: isNarrowViewport() ? 0.9 : 0.76, opacity: 0.4 },
          {
            scale: 1,
            opacity: 1,
            ease: 'none',
            scrollTrigger: { trigger: frame, start: 'top bottom', end: 'top 16%', scrub: 0.4 },
          },
        )
      }
      ScrollTrigger.create({
        trigger: frame,
        start: 'top 65%',
        end: 'bottom 35%',
        onToggle: ({ isActive }) => {
          html.classList.toggle('is-dark-stage', isActive)
          gsap.to(tint, { autoAlpha: isActive ? 1 : 0, duration: reduced ? 0 : 0.6, ease: 'power2.out', overwrite: true })
        },
      })
    }, root)

    // Pause if the viewer scrolls away mid-film.
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) videoRef.current?.pause()
    })
    io.observe(frame)

    return () => {
      io.disconnect()
      ctx.revert()
      html.classList.remove('is-dark-stage')
    }
  }, [])

  const play = () => {
    const v = videoRef.current
    if (!v) return
    v.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    )
  }

  return (
    <section ref={rootRef} className="section chronicle" aria-labelledby="chronicle-title">
      <div ref={tintRef} className="page-tint" aria-hidden="true" />
      <div className="container">
        <header className="section-head section-head--center reveal">
          <h2 id="chronicle-title" className="section-title">
            The <em>chronicle.</em>
          </h2>
        </header>
        <div ref={frameRef} className="chronicle__frame">
          <video
            ref={videoRef}
            className="chronicle__video"
            preload="metadata"
            playsInline
            controls={playing}
            poster="/assets/images/chronicle-poster.jpg"
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
            onEnded={() => setPlaying(false)}
          >
            <source src="/assets/6.mp4" type="video/mp4" />
          </video>
          {!playing ? (
            <button type="button" className="chronicle__play" onClick={play} aria-label="Play the chronicle film">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
