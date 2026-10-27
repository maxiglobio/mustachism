'use client'

import { useRouter } from 'next/navigation'
import { CheckoutHeader } from './CheckoutHeader'
import { LicensePicker } from './LicensePicker'

export function LicenseSelectClient() {
  const router = useRouter()
  return (
    <>
      <CheckoutHeader
        backHref="/"
        title="Select license"
        steps={[
          { label: 'Select license', state: 'current' },
          { label: 'Personal info', state: 'todo' },
          { label: 'Payment', state: 'todo' },
        ]}
      />
      <main id="main" className="page page--select">
        <div className="container">
          <header className="page-head reveal">
            <h1 className="page-head__title">
              Choose your <em>number.</em>
            </h1>
            <p className="page-head__lead">Search for a number that means something, or browse by category.</p>
          </header>
          <LicensePicker
            onSelect={(l) => {
              try {
                sessionStorage.setItem('selectedLicense', JSON.stringify(l))
              } catch {
                /* storage unavailable */
              }
              router.push(`/personal-info?license=${encodeURIComponent(l.number)}`)
            }}
          />
        </div>
      </main>
    </>
  )
}
