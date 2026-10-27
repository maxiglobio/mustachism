import type { Metadata } from 'next'
import { LicenseSelectClient } from '@/components/checkout/LicenseSelectClient'

const description = 'Browse available mustache license numbers by category — cinema, music, history, math and more.'

export const metadata: Metadata = {
  title: 'Select a license number',
  description,
  alternates: { canonical: '/license-select' },
  openGraph: { title: 'Select a license number — MUSTACHISM', description, url: '/license-select' },
}

export default function LicenseSelectPage() {
  return <LicenseSelectClient />
}
