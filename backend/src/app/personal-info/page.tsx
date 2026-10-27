import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PersonalInfoClient } from '@/components/checkout/PersonalInfoClient'

export const metadata: Metadata = {
  title: 'Personal info',
  description: 'Add the details to be engraved on your mustache license.',
  alternates: { canonical: '/personal-info' },
  robots: { index: false, follow: true },
}

export default function PersonalInfoPage() {
  return (
    <Suspense>
      <PersonalInfoClient />
    </Suspense>
  )
}
