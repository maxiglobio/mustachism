'use client'

import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/motion'

const SHAPES = [
  { className: 'ambient__shape--a', travel: 46, duration: 0.22 },
  { className: 'ambient__shape--b', travel: -30, duration: 0.26 },
  { className: 'ambient__shape--c', travel: 70, duration: 0.28 },
]

/** Blurred light shapes behind a section that drift with the (mouse) pointer while in view. */
export function AmbientShapes() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const section = root?.parentElement
    if (!root || !section || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const movers = gsap.utils.toArray<HTMLElement>('.ambient__shape', root).map((el, i) => ({
        travel: SHAPES[i].travel,
        x: gsap.quickTo(el, 'x', { duration: SHAPES[i].duration, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration: SHAPES[i].duration, ease: 'power3.out' }),
      }))

      let active = false
      const onMove = (e: PointerEvent) => {
        if (!active || e.pointerType === 'touch') return
        const nx = e.clientX / window.innerWidth - 0.5
        const ny = e.clientY / window.innerHeight - 0.5
        for (const m of movers) {
          m.x(nx * m.travel * 2)
          m.y(ny * m.travel * 1.4)
        }
      }
      const io = new IntersectionObserver(([entry]) => {
        active = entry.isIntersecting
      })
      io.observe(section)
      window.addEventListener('pointermove', onMove, { passive: true })
      return () => {
        io.disconnect()
        window.removeEventListener('pointermove', onMove)
      }
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef} className="ambient" aria-hidden="true">
      {SHAPES.map((s) => (
        <span key={s.className} className={`ambient__shape ${s.className}`} />
      ))}
    </div>
  )
}
