'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { licenseHref, TIERS } from '@/lib/offer'

/**
 * Phones: once the hero CTA scrolls away, a bar pinned to the bottom keeps the offer in reach.
 * It opens a compact sheet with the two licenses.
 */
export function StickyCta() {
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const target = document.querySelector('[data-hero-cta]')
    const footer = document.querySelector('.site-footer')
    if (!target) return
    let pastHero = false
    let atFooter = false
    const sync = () => setVisible(pastHero && !atFooter)
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === target) pastHero = !e.isIntersecting && e.boundingClientRect.top < 0
        else atFooter = e.isIntersecting
      }
      sync()
    })
    io.observe(target)
    if (footer) io.observe(footer)
    return () => io.disconnect()
  }, [])

  return (
    <>
      <div className="sticky-cta" data-visible={visible} aria-hidden={!visible}>
        <button
          type="button"
          className="btn btn--primary btn--lg btn--block"
          tabIndex={visible ? 0 : -1}
          onClick={() => setOpen(true)}
        >
          Get your license · From {TIERS.standard.price}
        </button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Choose your license" size="sm">
        <ul className="sheet-tiers">
          {(['standard', 'premium'] as const).map((id) => (
            <li key={id}>
              <Link href={licenseHref(false, id)} className="sheet-tier" onClick={() => setOpen(false)}>
                <span className="sheet-tier__name">{TIERS[id].short}</span>
                <span className="sheet-tier__desc">{TIERS[id].tagline}</span>
                <span className="sheet-tier__price">{TIERS[id].price}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  )
}
