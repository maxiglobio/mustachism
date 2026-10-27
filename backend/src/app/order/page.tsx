import type { Metadata } from 'next'
import { OrderClient } from '@/components/checkout/OrderClient'

const description =
  'Order your steel mustache license. Choose your number, add your details and watch them engraved on the card in real time.'

export const metadata: Metadata = {
  title: 'Order your license',
  description,
  alternates: { canonical: '/order' },
  openGraph: { title: 'Order your license — MUSTACHISM', description, url: '/order' },
  twitter: { title: 'Order your license — MUSTACHISM', description },
}

export default function OrderPage() {
  return <OrderClient />
}
