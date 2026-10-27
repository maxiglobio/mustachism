'use client'

import { useState } from 'react'
import { api } from '@/lib/client/api'
import { isValidEmail } from '@/lib/licenses'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!isValidEmail(value)) {
      setState('error')
      setMessage('Please enter a valid email address.')
      return
    }
    setState('sending')
    try {
      const r = await api.submitWaitlist(value)
      setState('done')
      setMessage(r.message || "You're on the list. We'll be in touch.")
      setEmail('')
    } catch (err) {
      setState('error')
      setMessage((err as Error).message || 'Something went wrong. Try again.')
    }
  }

  if (state === 'done') {
    return (
      <p className="waitlist__done" role="status">
        {message}
      </p>
    )
  }

  return (
    <form className="waitlist" onSubmit={submit} noValidate>
      <p className="waitlist__lead mono">Early access — be first when issuance opens.</p>
      <div className="waitlist__row">
        <label className="sr-only" htmlFor="waitlist-email">
          Email
        </label>
        <input
          id="waitlist-email"
          className="input"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={state === 'error'}
          aria-describedby="waitlist-msg"
          required
        />
        <button type="submit" className="btn btn--primary" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Get early access'}
        </button>
      </div>
      <p id="waitlist-msg" className="waitlist__msg" role="status" aria-live="polite">
        {state === 'error' ? message : ''}
      </p>
    </form>
  )
}
