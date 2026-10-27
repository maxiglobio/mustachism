'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/client/api'
import { formatCurrency } from '@/lib/licenses'

type Props = {
  open: boolean
  onClose: () => void
  orderId: string | null
  licenseNumber: string
  price: number
}

/** Demo checkout (no real charge) — mirrors the previous site's mock Stripe step. */
export function PaymentDialog({ open, onClose, orderId, licenseNumber, price }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pay = async () => {
    if (!orderId) return
    setBusy(true)
    setError('')
    try {
      await api.processPayment(orderId)
      router.push('/dashboard')
    } catch (err) {
      setError((err as Error).message || 'Payment failed. Please try again.')
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={() => !busy && onClose()} title="Complete your payment" size="sm">
      <div className="pay">
        <p className="pay__item">
          <span>Mustache license</span>
          <span className="mono">{licenseNumber}</span>
        </p>
        <div className="pay__fields" aria-label="Demo card details">
          <div className="field">
            <span className="field__label">Card number</span>
            <span className="input input--static mono">4242 4242 4242 4242</span>
          </div>
          <div className="field-row">
            <div className="field">
              <span className="field__label">Expiry</span>
              <span className="input input--static mono">12/34</span>
            </div>
            <div className="field">
              <span className="field__label">CVC</span>
              <span className="input input--static mono">123</span>
            </div>
          </div>
        </div>
        <p className="pay__total">
          <span>Total</span>
          <strong>{formatCurrency(price)}</strong>
        </p>
        {error ? (
          <p className="field__error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={pay} disabled={busy}>
          {busy ? 'Processing…' : `Pay ${formatCurrency(price)}`}
        </button>
        <p className="pay__demo mono">Demo mode — no real charge</p>
      </div>
    </Modal>
  )
}
