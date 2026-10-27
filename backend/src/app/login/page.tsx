import type { Metadata } from 'next'
import { LoginClient } from '@/components/account/LoginClient'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to view the mustache licenses tied to your account.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: true },
}

export default function LoginPage() {
  return <LoginClient />
}
