'use client'

import { useEffect, useId, useRef } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/motion'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  /** Visually hide the title (still labels the dialog). */
  hideTitle?: boolean
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  footer?: React.ReactNode
}

/** Native <dialog> (focus trap, Esc, inert background) with a GSAP entrance. */
export function Modal({ open, onClose, title, hideTitle, size = 'md', children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) {
      dlg.showModal()
      document.documentElement.classList.add('modal-open')
      if (!prefersReducedMotion()) {
        gsap.fromTo(dlg, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
        gsap.fromTo(
          dlg.querySelector('.modal__panel'),
          { y: 28, opacity: 0, scale: 0.98 },
          { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' },
        )
      }
    } else if (!open && dlg.open) {
      dlg.close()
    }
  }, [open])

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    const onNativeClose = () => {
      document.documentElement.classList.remove('modal-open')
      onCloseRef.current()
    }
    const onCancel = (e: Event) => {
      e.preventDefault()
      onCloseRef.current()
    }
    dlg.addEventListener('close', onNativeClose)
    dlg.addEventListener('cancel', onCancel)
    return () => {
      dlg.removeEventListener('close', onNativeClose)
      dlg.removeEventListener('cancel', onCancel)
      document.documentElement.classList.remove('modal-open')
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className={`modal modal--${size}`}
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="modal__panel">
        <header className="modal__head">
          <h2 id={titleId} className={hideTitle ? 'sr-only' : 'modal__title'}>
            {title}
          </h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="modal__body" data-lenis-prevent>{open ? children : null}</div>
        {footer ? <footer className="modal__foot">{footer}</footer> : null}
      </div>
    </dialog>
  )
}
