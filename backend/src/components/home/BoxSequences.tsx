'use client'

import { useCallback, useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { TIERS } from '@/lib/offer'
import { BoxSequence } from './BoxSequence'

/** Block 7 — Standard vs Premium packaging; the page fades to black for the premium box. */
export function BoxSequences() {
  const tintRef = useRef<HTMLDivElement>(null)

  const onDark = useCallback((on: boolean) => {
    document.documentElement.classList.toggle('is-dark-stage', on)
    const tint = tintRef.current
    if (!tint) return
    if (prefersReducedMotion()) gsap.set(tint, { autoAlpha: on ? 1 : 0 })
    else gsap.to(tint, { autoAlpha: on ? 1 : 0, duration: 0.6, ease: 'power2.out', overwrite: true })
  }, [])

  useEffect(() => () => document.documentElement.classList.remove('is-dark-stage'), [])

  return (
    <section className="box-seqs" aria-label="Packaging">
      <div ref={tintRef} className="page-tint" aria-hidden="true" />
      <header className="container box-seqs__head reveal">
        <h2 className="section-title">
          How official do you <em>want to get?</em>
        </h2>
      </header>
      <BoxSequence
        id="box-standard"
        root="/assets/images/box-sequence"
        start={10001}
        count={100}
        price={TIERS.standard.price}
        tier="Standard"
        title="Slim presentation packaging"
        copy="Clean, compact and designed to protect your license."
        alt="Slim presentation packaging opening to reveal a steel mustache license card"
      />
      <BoxSequence
        id="box-premium"
        root="/assets/images/box-sequence-premium"
        start={30000}
        count={101}
        price={TIERS.premium.price}
        tier="Premium"
        title="The Premium Box"
        copy="A more substantial presentation for gifting, collecting or giving the issuance of your license the ceremony it deserves."
        note="Your chosen number. Premium presentation. Official Mustachism letter."
        alt="Premium presentation box with velvet interior holding a steel mustache license"
        dark
        onDarkChange={onDark}
      />
    </section>
  )
}
