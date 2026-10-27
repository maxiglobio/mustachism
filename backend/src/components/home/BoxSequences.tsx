'use client'

import { useCallback, useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { BoxSequence } from './BoxSequence'

/** The three presentation boxes; the page fades to black for the premium one. */
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
    <div className="box-seqs">
      <div ref={tintRef} className="page-tint" aria-hidden="true" />
      <BoxSequence
        id="box-standard"
        root="/assets/images/box-sequence"
        start={10001}
        count={100}
        price="$49.99"
        tier="Tier I — Standard"
        title="The Standard Box"
        copy="Your license, presented in its own box. Opened once. Kept for good."
        alt="Presentation box opening to reveal a steel mustache license card"
      />
      <BoxSequence
        id="box-black"
        root="/assets/images/box-sequence-middle"
        start={20001}
        count={100}
        price="$99.99"
        tier="Tier II — Matte Black"
        title="The Black Box"
        copy="Matte black, with a custom cutout that holds the card in place."
        alt="Matte black presentation box with a custom cutout for a mustache license card"
      />
      <BoxSequence
        id="box-premium"
        root="/assets/images/box-sequence-premium"
        start={30000}
        count={101}
        price="$199.99"
        tier="Tier III — Premium"
        title="The Premium Box"
        copy="Velvet interior. The full ceremony, for the ones who have earned it."
        alt="Premium luxury presentation box with velvet interior"
        dark
        onDarkChange={onDark}
      />
    </div>
  )
}
