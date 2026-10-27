'use client'

import { useEffect, useRef } from 'react'
import { configureScrollTrigger, gsap, isNarrowViewport, prefersReducedMotion, ScrollTrigger } from '@/lib/motion'
import { PriceSeal } from './PriceSeal'

type Props = {
  id: string
  root: string
  start: number
  count: number
  price: string
  tier: string
  title: string
  copy: string
  alt: string
  dark?: boolean
  onDarkChange?: (on: boolean) => void
}

const frameUrl = (root: string, n: number) => `${root}/box-${n}.webp`

/**
 * Scroll-scrubbed presentation-box sequence. Frames are drawn to a canvas (no layout churn
 * from swapping <img src>), preloaded once the section is near the viewport.
 */
export function BoxSequence({ id, root, start, count, price, tier, title, copy, alt, dark, onDarkChange }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    if (!section || !canvas) return
    configureScrollTrigger()
    const g = canvas.getContext('2d')!
    const frames: HTMLImageElement[] = []
    let current = -1
    let loadedAll = false

    const draw = (i: number) => {
      const img = frames[i]
      if (!img || !img.complete || !img.naturalWidth) return false
      if (canvas.width !== img.naturalWidth) {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
      }
      g.clearRect(0, 0, canvas.width, canvas.height)
      g.drawImage(img, 0, 0)
      current = i
      return true
    }
    const show = (i: number) => {
      if (i === current) return
      // Fall back to the nearest decoded frame while the rest stream in.
      for (let d = 0; d < count; d++) {
        if (draw(Math.max(0, i - d))) return
      }
    }
    const load = (i: number) => {
      if (frames[i]) return frames[i]
      const img = new Image()
      img.decoding = 'async'
      img.src = frameUrl(root, start + i)
      frames[i] = img
      return img
    }
    const reduced = prefersReducedMotion()
    // Reduced motion: no scrubbing, just the finished (open) box.
    const firstIndex = reduced ? count - 1 : 0
    const first = load(firstIndex)
    first.onload = () => {
      draw(firstIndex)
      canvas.classList.add('is-ready')
    }
    const loadAll = () => {
      if (loadedAll) return
      loadedAll = true
      for (let i = 1; i < count; i++) load(i)
    }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && !reduced && loadAll(), {
      rootMargin: '150% 0px',
    })
    io.observe(section)

    const ctx = gsap.context(() => {
      if (!reduced) {
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            // Play through the first 82% of the track, then hold the final frame.
            const p = Math.min(1, self.progress / 0.82)
            show(Math.round(p * (count - 1)))
          },
        })
        gsap.fromTo(
          section.querySelector('.price-seal__ring'),
          { rotate: 0 },
          {
            rotate: isNarrowViewport() ? 90 : 220,
            ease: 'none',
            transformOrigin: '50% 50%',
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.4 },
          },
        )
        gsap.fromTo(
          section.querySelectorAll('[data-box-copy] > *'),
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: { trigger: section, start: 'top 45%', once: true },
          },
        )
      }
      if (onDarkChange) {
        ScrollTrigger.create({
          trigger: section,
          start: 'top 55%',
          end: 'bottom 45%',
          onToggle: (self) => onDarkChange(self.isActive),
        })
      }
    }, section)

    return () => {
      io.disconnect()
      ctx.revert()
    }
  }, [root, start, count, onDarkChange])

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`box-seq${dark ? ' box-seq--dark' : ''}`}
      aria-labelledby={`${id}-title`}
    >
      <div className="box-seq__stage">
        <div className="container box-seq__grid">
          <div className="box-seq__copy" data-box-copy>
            <h2 id={`${id}-title`} className="box-seq__title">
              {title}
            </h2>
            <p className="box-seq__text">{copy}</p>
          </div>
          <div className="box-seq__visual">
            <canvas ref={canvasRef} className="box-seq__canvas" role="img" aria-label={alt} />
            <PriceSeal price={price} inverted={dark} className="box-seq__seal" />
          </div>
        </div>
      </div>
    </section>
  )
}
