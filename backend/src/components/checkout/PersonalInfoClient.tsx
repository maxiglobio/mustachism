'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api, type LicenseNumber } from '@/lib/client/api'
import { formatMoney } from '@/lib/licenses'
import { CardPreview } from './CardPreview'
import { CheckoutHeader } from './CheckoutHeader'
import { LicenseFormFields } from './LicenseFormFields'
import { PackagePicker } from './PackagePicker'
import { PaymentDialog } from './PaymentDialog'
import { useLicenseForm } from './useLicenseForm'
import { useShop } from './useShop'

function readStored(): LicenseNumber | null {
  try {
    const raw = sessionStorage.getItem('selectedLicense')
    return raw ? (JSON.parse(raw) as LicenseNumber) : null
  } catch {
    return null
  }
}

export function PersonalInfoClient() {
  const router = useRouter()
  const params = useSearchParams()
  const [license, setLicense] = useState<LicenseNumber | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const form = useLicenseForm(license?.number ?? null)
  const shop = useShop()
  const price = shop.selected?.price ?? license?.price ?? 49.99
  const currency = shop.selected?.currency ?? 'USD'
  const realCheckout = shop.configured === true

  useEffect(() => {
    const fromUrl = params.get('license')
    const stored = readStored()
    if (!fromUrl && !stored) {
      router.replace('/license-select')
      return
    }
    if (stored && (!fromUrl || stored.number === fromUrl)) {
      setLicense(stored)
      return
    }
    const number = fromUrl!
    setLicense({ number, status: 'available', priceTier: 'standard', price: 49.99 })
    api.checkLicense(number).then((l) => l && setLicense(l))
  }, [params, router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!license) return
    const problem = form.validate()
    if (problem) return setError(problem)
    setError('')
    setSubmitting(true)
    try {
      if (realCheckout) {
        const { checkoutUrl } = await api.startCheckout({ ...form.toOrder(license.number), package: shop.selectedId })
        window.location.assign(checkoutUrl)
        return
      }
      const r = await api.createOrder(form.toOrder(license.number))
      setOrderId(r.orderId)
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <>
      <CheckoutHeader
        backHref="/license-select"
        title="Personal info"
        steps={[
          { label: 'Select license', state: 'done' },
          { label: 'Personal info', state: 'current' },
          { label: 'Payment', state: 'todo' },
        ]}
      />
      <main id="main" className="page page--order">
        <div className="container order">
          <section className="order__visual" aria-label="License preview">
            <CardPreview engraving={form.engraving} />
            <div className="order__summary">
              <dl className="summary">
                <div>
                  <dt>License</dt>
                  <dd className="mono">{license?.number ?? '—'}</dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>{formatMoney(price, currency)}</dd>
                </div>
              </dl>
            </div>
          </section>
          <form className="order__form" onSubmit={submit} noValidate aria-labelledby="pi-title">
            <header className="order__head">
              <h1 id="pi-title" className="order__title">
                Your details, <em>engraved.</em>
              </h1>
            </header>
            <PackagePicker shop={shop} />
            <LicenseFormFields form={form} />
            {error ? (
              <p className="form-error" role="alert">
                {error}
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
              <button type="button" className="btn btn--ghost btn--block" onClick={() => router.push('/license-select')}>
                Back to license selection
              </button>
            </div>
          </form>
        </div>
      </main>
      <PaymentDialog
        open={!!orderId}
        onClose={() => setOrderId(null)}
        orderId={orderId}
        licenseNumber={license?.number ?? ''}
        price={price}
      />
    </>
  )
}
