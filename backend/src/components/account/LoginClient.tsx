'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/layout/Logo'
import { login, useAuth } from '@/lib/client/auth'
import { isValidEmail } from '@/lib/licenses'
import { gsap, prefersReducedMotion } from '@/lib/motion'

export function LoginClient() {
  const router = useRouter()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (auth.checked && auth.authenticated) router.replace('/dashboard')
  }, [auth.checked, auth.authenticated, router])

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'link') {
      setError('That sign-in link is invalid or has expired. Request a new one below.')
    }
  }, [])

  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.auth > *', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08 })
    })
    return () => ctx.revert()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!isValidEmail(value)) return setError('Please enter a valid email address.')
    setBusy(true)
    setError('')
    try {
      await login(value)
      setSent(true)
    } catch (err) {
      setError((err as Error).message || 'Login failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main id="main" className="page page--auth">
      <div className="auth">
        <Link href="/" className="auth__mark" aria-label="MUSTACHISM — home">
          <Logo />
        </Link>
        <h1 className="auth__title">
          Welcome <em>back.</em>
        </h1>
        {sent ? (
          <p className="auth__lead" role="status">
            We’ve emailed you a sign-in link. It expires in 15 minutes.
          </p>
        ) : (
            <>
            <p className="auth__lead">Sign in with the email you used for your license.</p>
            <form className="auth__form" onSubmit={submit} noValidate>
              <div className="field">
                <label className="field__label" htmlFor="login-email">
                  Email
                </label>
                <input
                  id="login-email"
                  className="input"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
              {error ? (
                <p id="login-error" className="form-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
                {busy ? 'Sending link…' : 'Email me a sign-in link'}
              </button>
            </form>
            </>
        )}
        <p className="auth__foot">
          Don’t have a license yet? <Link href="/order">Get one</Link>
        </p>
      </div>
    </main>
  )
}
