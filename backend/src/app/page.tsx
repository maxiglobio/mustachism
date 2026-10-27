import type { Metadata } from 'next'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { BoxSequences } from '@/components/home/BoxSequences'
import { Faq } from '@/components/home/Faq'
import { HomeJourney } from '@/components/home/HomeJourney'
import { Manifesto } from '@/components/home/Manifesto'
import { Statement } from '@/components/home/Statement'
import { FAQS } from '@/lib/content'
import { isWaitlistOnly } from '@/lib/site-mode'
import { SITE } from '@/lib/site'

const title = `${SITE.name} — A license for what remains`

export const metadata: Metadata = {
  title: { absolute: title },
  description: SITE.description,
  alternates: { canonical: '/' },
  openGraph: { title, description: SITE.description, url: '/' },
  twitter: { title, description: SITE.description },
}

export default function HomePage() {
  const waitlist = isWaitlistOnly()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: 'Mustache License',
        brand: { '@type': 'Brand', name: SITE.name },
        description: SITE.description,
        image: `${SITE.url}/opengraph-image`,
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: '49.99',
          highPrice: '199.99',
          offerCount: 3,
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <>
      <SiteHeader />
      <main id="main" className="page page--home">
        <HomeJourney waitlist={waitlist} />
        <BoxSequences />
        <Statement />
        <Manifesto />
        <Faq />
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
