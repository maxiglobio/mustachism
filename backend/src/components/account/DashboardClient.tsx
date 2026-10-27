'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CardPreview } from '@/components/checkout/CardPreview'
import { api, type UserLicense } from '@/lib/client/api'
import { formatCardDate, formatCurrency } from '@/lib/licenses'
import { gsap, prefersReducedMotion } from '@/lib/motion'

export function DashboardClient() {
  const router = useRouter()
  const [licenses, setLicenses] = useState<UserLicense[] | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    let alive = true
    Promise.all([api.checkAuth(), api.fetchUserLicenses()])
      .then(([auth, data]) => {
        if (!alive) return
        if (!auth.authenticated) return router.replace('/login')
        setLicenses(data.licenses)
      })
      .catch((err) => alive && setError((err as Error).message))
    return () => {
      alive = false
    }
  }, [router])

  useEffect(() => {
    if (!licenses || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.dash__body > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08 })
    })
    return () => ctx.revert()
  }, [licenses])

  const current = licenses?.[selected]
  const engraving = useMemo(
    () =>
      current
        ? {
            number: current.licenseNumber,
            name: current.fullName ?? '',
            sex: current.sex ?? '',
            dob: formatCardDate(current.dateOfBirth ?? null),
            issueDate: formatCardDate(current.issueDate),
            licenseClass: 'A',
            photo: null,
          }
        : null,
    [current],
  )

  return (
    <main id="main" className="page page--dash">
      <div className="container dash">
        <header className="page-head">
          <h1 className="page-head__title">
            Your <em>dashboard.</em>
          </h1>
          <p className="page-head__lead">Licenses tied to your account.</p>
        </header>

        {error ? (
          <div className="notice notice--error" role="alert">
            <p className="notice__title">Couldn’t load your dashboard</p>
            <p>{error}</p>
          </div>
        ) : !licenses ? (
          <div className="dash__loading" role="status">
            <span className="spinner" aria-hidden="true" />
            <span className="mono">Loading your licenses…</span>
          </div>
        ) : licenses.length === 0 ? (
          <div className="notice">
            <p className="notice__title">No licenses yet</p>
            <p>You haven’t purchased a mustache license yet.</p>
            <Link href="/order" className="btn btn--primary">
              Get your license
            </Link>
          </div>
        ) : (
          <div className="dash__body">
            {engraving ? <CardPreview engraving={engraving} label={`Your license ${current?.licenseNumber}`} /> : null}
            <div className="dash__list">
              <p className="dash__count mono">
                {licenses.length} license{licenses.length > 1 ? 's' : ''}
              </p>
              <ul className="dash__items">
                {licenses.map((l, i) => (
                  <li key={l.id}>
                    <button type="button" className="dash-item" aria-pressed={i === selected} onClick={() => setSelected(i)}>
                      <span className="dash-item__num mono">{l.licenseNumber}</span>
                      <dl className="dash-item__meta">
                        <div>
                          <dt>Status</dt>
                          <dd>{l.status}</dd>
                        </div>
                        <div>
                          <dt>Issued</dt>
                          <dd>
                            {l.issueDate
                              ? new Date(l.issueDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })
                              : 'N/A'}
                          </dd>
                        </div>
                        <div>
                          <dt>Paid</dt>
                          <dd>{formatCurrency(l.pricePaid ?? 0)}</dd>
                        </div>
                        {l.fullName ? (
                          <div>
                            <dt>Name</dt>
                            <dd>{l.fullName}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
