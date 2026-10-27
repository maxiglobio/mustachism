'use client'

import Lenis from 'lenis'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { configureScrollTrigger, gsap, prefersReducedMotion, ScrollTrigger } from '@/lib/motion'

/**
 * Site-wide motion: html.motion gating, `.reveal` / `.reveal-stagger` scroll reveals and the
 * button hover scale. Re-scans on every route change (the layout persists between pages).
 */
export function MotionProvider() {
  const pathname = usePathname()

  // Gate + button hover live for the app lifetime.
  useEffect(() => {
    configureScrollTrigger()
    const html = document.documentElement
    if (prefersReducedMotion()) {
      html.classList.remove('motion')
      return
    }
    html.classList.add('motion', 'motion-ready')

    const setters = new WeakMap<Element, gsap.QuickToFunc>()
    const scaleFor = (el: Element) => {
      let fn = setters.get(el)
      if (!fn) {
        fn = gsap.quickTo(el, 'scale', { duration: 0.25, ease: 'power3.out' })
        setters.set(el, fn)
      }
      return fn
    }
    const over = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const btn = (e.target as Element | null)?.closest?.('.btn')
      if (!btn || btn.contains(e.relatedTarget as Node | null)) return
      if ((btn as HTMLButtonElement).disabled) return
      scaleFor(btn)(1.03)
    }
    const out = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const btn = (e.target as Element | null)?.closest?.('.btn')
      if (!btn || btn.contains(e.relatedTarget as Node | null)) return
      scaleFor(btn)(1)
    }
    document.addEventListener('pointerover', over, { passive: true })
    document.addEventListener('pointerout', out, { passive: true })

    // Inertial smooth scrolling for mouse / trackpad. Touch devices keep native momentum
    // scrolling — it's already smooth and far cheaper than a JS-driven scroll.
    let lenis: Lenis | null = null
    let lockObserver: MutationObserver | null = null
    const tick = (time: number) => lenis?.raf(time * 1000)
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9, anchors: { offset: -80 } })
      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
      // Pause while something locks the page (modal, mobile menu, intro).
      const sync = () => {
        const locked = ['modal-open', 'nav-open', 'intro-running'].some((c) => html.classList.contains(c))
        if (locked) lenis?.stop()
        else lenis?.start()
      }
      lockObserver = new MutationObserver(sync)
      lockObserver.observe(html, { attributes: true, attributeFilter: ['class'] })
      sync()
    }

    return () => {
      document.removeEventListener('pointerover', over)
      document.removeEventListener('pointerout', out)
      lockObserver?.disconnect()
      gsap.ticker.remove(tick)
      lenis?.destroy()
      html.classList.remove('motion', 'motion-ready')
    }
  }, [])

  // Scroll reveals for whatever the current page rendered.
  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 86%', once: true },
          },
        )
      })
      gsap.utils.toArray<HTMLElement>('.reveal-stagger').forEach((group) => {
        const children = Array.from(group.children)
        if (!children.length) return
        gsap.fromTo(
          children,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.1,
            scrollTrigger: { trigger: group, start: 'top 86%', once: true },
          },
        )
      })
    })
    // Pages may have mounted pinned/sticky sections in the same commit; settle positions.
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => {
      cancelAnimationFrame(id)
      ctx.revert()
    }
  }, [pathname])

  return null
}
