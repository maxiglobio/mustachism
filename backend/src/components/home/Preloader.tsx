'use client'

import { forwardRef } from 'react'
import { MUSTACHE_FRAMES } from '@/lib/content'

/**
 * Homepage intro layer: the mustache flip-book and a licence-number counter. HomeHero drives all of its motion.
 * Rendered on the server so it covers the first paint; hidden when the intro is skipped.
 */
export const Preloader = forwardRef<HTMLDivElement>(function Preloader(_, ref) {
  return (
    <div ref={ref} className="preloader" aria-hidden="true">
      <div className="preloader__stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="preloader__mustache" src={MUSTACHE_FRAMES[0]} alt="" width={1140} height={768} />
      </div>
      <p className="preloader__count mono">
        Licence #<span data-count>000 000</span>
      </p>
    </div>
  )
})
