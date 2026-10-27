'use client'

import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'

type Step = { label: string; state: 'done' | 'current' | 'todo' }

type Props = {
  backHref: string
  backLabel?: string
  title: string
  steps?: Step[]
  /** Call `e.preventDefault()` to cancel navigation (e.g. to confirm discarding a draft). */
  onBack?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

export function CheckoutHeader({ backHref, backLabel = 'Back', title, steps, onBack }: Props) {
  return (
    <header className="checkout-head" data-header>
      <div className="container checkout-head__inner">
        <Link href={backHref} className="back-link" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span>{backLabel}</span>
        </Link>
        <Link href="/" className="checkout-head__mark" aria-label="MUSTACHISM — home">
          <Logo />
        </Link>
        <p className="checkout-head__title mono">{title}</p>
      </div>
      {steps ? (
        <ol className="container steps" aria-label="Checkout progress">
          {steps.map((s, i) => (
            <li key={s.label} className="steps__item" data-state={s.state} aria-current={s.state === 'current' ? 'step' : undefined}>
              <span className="steps__n mono">{i + 1}</span>
              <span className="steps__label">{s.label}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </header>
  )
}
