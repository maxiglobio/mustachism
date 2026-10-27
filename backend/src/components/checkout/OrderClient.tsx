'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { api, type LicenseNumber } from '@/lib/client/api'
import { formatMoney } from '@/lib/licenses'
import { configureScrollTrigger, gsap, prefersReducedMotion } from '@/lib/motion'
import { CardPreview } from './CardPreview'
import { CheckoutHeader } from './CheckoutHeader'
import { LicenseFormFields } from './LicenseFormFields'
import { LicensePicker } from './LicensePicker'
import { PackagePicker } from './PackagePicker'
import { PaymentDialog } from './PaymentDialog'
import { useLicenseForm } from './useLicenseForm'
import { useShop } from './useShop'

export function OrderClient() {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const [license, setLicense] = useState<LicenseNumber | null>(null)
  const [initialNumber, setInitialNumber] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const form = useLicenseForm(license?.number ?? null)
  const shop = useShop()
  // Shopify is the source of truth for price once connected; the demo flow falls back to the number's price.
  const price = shop.selected?.price ?? license?.price ?? 49.99
  const currency = shop.selected?.currency ?? 'USD'
  const realCheckout = shop.configured === true

  useEffect(() => {
    api
      .fetchNextLicense()
      .then(({ license }) => {
        setLicense(license)
        setInitialNumber(license.number)
      })
      .catch((err) => setLoadError((err as Error).message || 'Failed to load a license number'))
  }, [])

  // Entrance.
  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return
    configureScrollTrigger()
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-header]', { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' })
      gsap.fromTo('.order__visual', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.1 })
      gsap.fromTo(
        '.order__form > *',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.06, delay: 0.18 },
      )
    }, root)
    return () => ctx.revert()
  }, [])

  const isDirty = form.isDirty || (!!initialNumber && !!license && license.number !== initialNumber)

  const onBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isDirty) return
    e.preventDefault()
    setLeaveOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!license) return
    const problem = form.validate()
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      if (realCheckout) {
        // Reserve the number, then hand over to Shopify's hosted checkout.
        const { checkoutUrl } = await api.startCheckout({ ...form.toOrder(license.number), package: shop.selectedId })
        window.location.assign(checkoutUrl)
        return
      }
      const r = await api.createOrder(form.toOrder(license.number))
      setOrderId(r.orderId)
    } catch (err) {
      setError((err as Error).message || 'Something went wrong')
    }
    setSubmitting(false)
  }

  return (
    <div ref={rootRef}>
      <CheckoutHeader backHref="/" title="Order license" onBack={onBack} />
      <main id="main" className="page page--order">
        <div className="container order">
          <section className="order__visual" aria-label="License preview">
            <CardPreview engraving={form.engraving} />
            <div className="order__summary">
              <dl className="summary">
                <div>
                  <dt>License</dt>
                  <dd className="mono">{license?.number ?? (loadError ? '—' : 'Reserving…')}</dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>{formatMoney(price, currency)}</dd>
                </div>
              </dl>
              <button type="button" className="btn btn--ghost" onClick={() => setPickerOpen(true)}>
                Choose a custom number
              </button>
            </div>
          </section>

          <form className="order__form" onSubmit={submit} noValidate aria-labelledby="order-title">
            <header className="order__head">
              <h1 id="order-title" className="order__title">
                Your details, <em>engraved.</em>
              </h1>
              <p className="order__lead">Everything you type is etched into the steel preview in real time.</p>
            </header>
            <PackagePicker shop={shop} />
            <LicenseFormFields form={form} />
            {loadError || error || shop.error ? (
              <p className="form-error" role="alert">
                {error || loadError || shop.error}
              </p>
            ) : null}
            <div className="order__actions">
              <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={!license || submitting || shop.configured === null}>
                {submitting
                  ? realCheckout
                    ? 'Opening secure checkout…'
                    : 'Processing…'
                  : `${realCheckout ? 'Continue to checkout' : 'Pay (demo)'} · ${formatMoney(price, currency)}`}
              </button>
              <p className="order__fineprint mono">
                {realCheckout ? 'Secure checkout by Shopify · Number held for 60 min' : 'Demo mode — no real charge'}
              </p>
            </div>
          </form>
        </div>
      </main>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Choose license number" size="lg">
        <LicensePicker
          autoFocus
          selected={license?.number}
          onSelect={(l) => {
            setLicense(l)
            setPickerOpen(false)
          }}
        />
      </Modal>

      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Leave this page?"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setLeaveOpen(false)}>
              Stay
            </button>
            <button type="button" className="btn btn--primary" onClick={() => router.push('/')}>
              Leave
            </button>
          </>
        }
      >
        <p>You have entered information on this order. If you go back now, your changes will be lost.</p>
      </Modal>

      <PaymentDialog
        open={!!orderId}
        onClose={() => setOrderId(null)}
        orderId={orderId}
        licenseNumber={license?.number ?? ''}
        price={price}
      />
    </div>
  )
}
