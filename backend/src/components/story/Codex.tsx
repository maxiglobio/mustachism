'use client'

import { useEffect, useRef } from 'react'
import { CODEX } from '@/lib/content'
import { configureScrollTrigger, gsap, isNarrowViewport, onWidthChange, prefersReducedMotion, ScrollTrigger } from '@/lib/motion'

/**
 * The ten commandments as a list; the media panel shows the row nearest the viewport centre.
 * Desktop: sticky panel with looping video, rows drift as they pass. Mobile: inline stills.
 */
export function Codex() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    configureScrollTrigger()
    const reduced = prefersReducedMotion()
    let ctx: gsap.Context | null = null
    let panelIo: IntersectionObserver | null = null

    const build = () => {
      ctx?.revert()
      panelIo?.disconnect()
      if (isNarrowViewport()) return

      const rows = gsap.utils.toArray<HTMLElement>('.codex__row', root)
      const layers = gsap.utils.toArray<HTMLElement>('.codex__layer', root)
      const videos = layers.map((l) => l.querySelector('video'))
      const list = root.querySelector<HTMLElement>('.codex__list')!
      const panel = root.querySelector<HTMLElement>('.codex__panel')!
      let active = -1
      let panelVisible = false

      const playActive = () => {
        videos.forEach((v, i) => {
          if (!v) return
          if (i === active && panelVisible && !reduced) {
            if (!v.src) v.src = v.dataset.src ?? ''
            v.currentTime = 0
            v.play().catch(() => undefined)
          } else {
            v.pause()
          }
        })
      }

      const activate = (i: number) => {
        if (i === active) return
        active = i
        layers.forEach((layer, j) => {
          if (j === i) {
            if (reduced) gsap.set(layer, { autoAlpha: 1, scale: 1 })
            else gsap.fromTo(layer, { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', overwrite: true })
          } else {
            gsap.to(layer, { autoAlpha: 0, duration: reduced ? 0 : 0.2, overwrite: true })
          }
        })
        rows.forEach((row, j) => {
          row.setAttribute('aria-current', j === i ? 'true' : 'false')
          gsap.to(row, { autoAlpha: j === i ? 1 : 0.35, duration: reduced ? 0 : 0.3, overwrite: 'auto' })
        })
        playActive()
      }

      ctx = gsap.context(() => {
        gsap.set(layers, { autoAlpha: 0 })
        rows.forEach((row, i) => {
          ScrollTrigger.create({
            trigger: row,
            start: 'top center',
            end: 'bottom center',
            onToggle: (self) => self.isActive && activate(i),
          })
          if (!reduced) {
            gsap
              .timeline({
                scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: 0.3, invalidateOnRefresh: true },
              })
              .to(row.querySelector('.codex__row-inner'), { x: () => list.clientWidth * 0.1, ease: 'sine.inOut' })
              .to(row.querySelector('.codex__row-inner'), { x: 0, ease: 'sine.inOut' })
          }
        })
        activate(0)
      }, root)

      panelIo = new IntersectionObserver(
        ([e]) => {
          panelVisible = e.isIntersecting
          playActive()
        },
        { threshold: 0.35 },
      )
      panelIo.observe(panel)
    }

    build()
    const off = onWidthChange(() => {
      build()
      ScrollTrigger.refresh()
    })
    return () => {
      off()
      panelIo?.disconnect()
      ctx?.revert()
    }
  }, [])

  return (
    <section ref={rootRef} id="codex" className="section codex" aria-labelledby="codex-title">
      <div className="container">
        <header className="section-head reveal">
          <h2 id="codex-title" className="section-title">
            Mustachism <em>codex.</em>
          </h2>
        </header>
        <div className="codex__grid">
          <ol className="codex__list">
            {CODEX.map((c) => (
              <li key={c.n} className="codex__row">
                <div className="codex__row-inner">
                  <span className="codex__n mono" aria-hidden="true">
                    {String(c.n).padStart(2, '0')}
                  </span>
                  <div className="codex__text">
                    <h3 className="codex__title">{c.title}</h3>
                    <p className="codex__body">{c.body}</p>
                  </div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="codex__still" src={c.mobile} alt="" width={440} height={440} loading="lazy" decoding="async" />
              </li>
            ))}
          </ol>
          <div className="codex__panel" aria-hidden="true">
            {CODEX.map((c) => (
              <figure key={c.n} className="codex__layer" aria-label={c.label}>
                <video
                  className="codex__video"
                  poster={c.poster}
                  data-src={c.video}
                  muted
                  loop
                  playsInline
                  preload="none"
                />
                <figcaption className="codex__caption mono">
                  {String(c.n).padStart(2, '0')} / {String(CODEX.length).padStart(2, '0')}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
