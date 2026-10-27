'use client'

import { useRef, useState } from 'react'
import { LicenseCard3D, type LicenseCardHandle } from '@/components/card3d/LicenseCard3D'
import type { EngravingData } from '@/components/card3d/engraver'

/** The personalised card, re-engraved live as the form changes. */
export function CardPreview({ engraving, label }: { engraving: EngravingData; label?: string }) {
  const cardRef = useRef<LicenseCardHandle>(null)
  const [face, setFace] = useState<'front' | 'back'>('front')

  const show = (f: 'front' | 'back') => {
    setFace(f)
    cardRef.current?.showFace(f)
  }

  return (
    <div className="card-preview">
      <LicenseCard3D
        ref={cardRef}
        mode="personal"
        engraving={engraving}
        className="card-preview__card"
        label={label ?? 'Live preview of your engraved license card'}
      />
      <div className="card-preview__bar">
        <div className="segmented segmented--sm" role="group" aria-label="Card side">
          <button type="button" className="segmented__btn" aria-pressed={face === 'front'} onClick={() => show('front')}>
            Front
          </button>
          <button type="button" className="segmented__btn" aria-pressed={face === 'back'} onClick={() => show('back')}>
            Back
          </button>
        </div>
        <span className="card-preview__note mono">Live engraving preview</span>
      </div>
    </div>
  )
}
