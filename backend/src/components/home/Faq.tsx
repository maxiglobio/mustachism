'use client'

import { useId, useRef, useState } from 'react'
import { FAQS } from '@/lib/content'
import { gsap, prefersReducedMotion } from '@/lib/motion'

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  const base = useId()
  const answers = useRef<Array<HTMLDivElement | null>>([])

  const toggle = (i: number) => {
    const next = open === i ? null : i
    setOpen(next)
    if (next !== null && !prefersReducedMotion()) {
      requestAnimationFrame(() => {
        const el = answers.current[next]
        if (el) gsap.fromTo(el, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' })
      })
    }
  }

  return (
    <section className="section faq" aria-labelledby="faq-title">
      <div className="container faq__grid">
        <header className="reveal">
          <h2 id="faq-title" className="section-title">
            Asked, <em>answered.</em>
          </h2>
        </header>
        <ul className="faq__list reveal-stagger">
          {FAQS.map((item, i) => {
            const isOpen = open === i
            return (
              <li key={item.q} className="faq__item" data-open={isOpen}>
                <h3 className="faq__q">
                  <button
                    type="button"
                    id={`${base}-q${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`${base}-a${i}`}
                    onClick={() => toggle(i)}
                  >
                    <span>{item.q}</span>
                    <span className="faq__icon" aria-hidden="true" />
                  </button>
                </h3>
                <div
                  ref={(el) => {
                    answers.current[i] = el
                  }}
                  id={`${base}-a${i}`}
                  role="region"
                  aria-labelledby={`${base}-q${i}`}
                  className="faq__a"
                  hidden={!isOpen}
                >
                  <p>{item.a}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
