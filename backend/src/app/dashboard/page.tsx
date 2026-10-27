import type { Metadata } from 'next'
import { DashboardClient } from '@/components/account/DashboardClient'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your mustache licenses.',
  alternates: { canonical: '/dashboard' },
  robots: { index: false, follow: false },
}

export default function DashboardPage() {
  return (
    <>
      <SiteHeader account="logout" />
      <DashboardClient />
      <SiteFooter />
    </>
  )
}
