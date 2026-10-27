'use client'

import { useEffect, useRef } from 'react'
import {
  configureScrollTrigger,
  gsap,
  isNarrowViewport,
  onWidthChange,
  prefersReducedMotion,
  ScrollTrigger,
  SplitText,
} from '@/lib/motion'

const PARAGRAPHS = [
  'The world has become obsessed with smoothness, cleanliness, youth, and the absence of scars. Men who have lived through pain, loss, speed, mistakes, and survival understand one thing: a mustache is often the last thing that wasn’t bought, optimized, or erased.',
  'Mustachism exists to license that.',
  'A license here is not regulation. It is symbolic permission. A marker of lived experience. Recognition that what remains after everything else has been stripped away deserves to be visible.',
  'We certify what survived. We document what wasn’t erased. We give permission to be seen.',
  'This is ideological infrastructure. Not marketing copy. Not a trend. A quiet resistance against plastic masculinity.',
]

/**
 * "Justified words settle": each line starts fully justified and relaxes to natural spacing
 * as it scrolls into view.
 */
export function Manifesto() {
  const rootRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const content = contentRef.current
    if (!root || !content) return
    configureScrollTrigger()

    const markReady = () => content.classList.add('is-ready')
    if (prefersReducedMotion()) {
      markReady()
      return
    }

    let splits: SplitText[] = []
    let triggers: ScrollTrigger[] = []
    let tweens: gsap.core.Tween[] = []
    let alive = true

    const teardown = () => {
      triggers.forEach((t) => t.kill())
      tweens.forEach((t) => t.kill())
      splits.forEach((s) => s.revert())
      triggers = []
      tweens = []
      splits = []
    }

    const build = () => {
      teardown()
      if (!alive) return
      if (isNarrowViewport()) {
        markReady()
        return
      }
      const width = content.clientWidth
      content.querySelectorAll<HTMLParagraphElement>('p').forEach((p) => {
        const split = SplitText.create(p, { type: 'lines, words', linesClass: 'line', wordsClass: 'word' })
        splits.push(split)
        const lines = split.lines as HTMLElement[]
        lines.forEach((line, li) => {
          const words = Array.from(line.querySelectorAll<HTMLElement>('.word'))
          // Last line of a paragraph and single-word lines stay put (as justified text would).
          if (words.length < 2 || li === lines.length - 1) return
          const lineLeft = line.getBoundingClientRect().left
          const rects = words.map((w) => w.getBoundingClientRect())
          const total = rects.reduce((sum, r) => sum + r.width, 0)
          const gap = (width - total) / (words.length - 1)
          let x = 0
          words.forEach((w, i) => {
            const current = rects[i].left - lineLeft
            gsap.set(w, { x: x - current })
            x += rects[i].width + gap
          })
          const tween = gsap.to(words, {
            x: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: line,
              start: 'top bottom',
              end: 'top 60%',
              scrub: 0.2,
              invalidateOnRefresh: true,
            },
          })
          tweens.push(tween)
          if (tween.scrollTrigger) triggers.push(tween.scrollTrigger)
        })
      })
      markReady()
    }

    document.fonts.ready.then(() => alive && build())
    const off = onWidthChange(() => {
      build()
      ScrollTrigger.refresh()
    })
    return () => {
      alive = false
      off()
      teardown()
    }
  }, [])

  return (
    <section ref={rootRef} id="what-is-license" className="section manifesto" aria-labelledby="manifesto-title">
      <div className="container manifesto__grid">
        <header className="manifesto__head reveal">
          <h2 id="manifesto-title" className="section-title">
            What is a mustache license?
          </h2>
        </header>
        <div ref={contentRef} className="manifesto__content content">
          {PARAGRAPHS.map((t) => (
            <p key={t.slice(0, 24)}>{t}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
