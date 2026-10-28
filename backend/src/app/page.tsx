import type { Metadata } from 'next'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { BoxSequences } from '@/components/home/BoxSequences'
import { ChooseLicense } from '@/components/home/ChooseLicense'
import { Compare } from '@/components/home/Compare'
import { DigitalFirst } from '@/components/home/DigitalFirst'
import { Faq } from '@/components/home/Faq'
import { FinalCta } from '@/components/home/FinalCta'
import { Gift } from '@/components/home/Gift'
import { HomeJourney } from '@/components/home/HomeJourney'
import { HowItWorks } from '@/components/home/HowItWorks'
import { ProductNote } from '@/components/home/ProductNote'
import { Statement } from '@/components/home/Statement'
import { StickyCta } from '@/components/home/StickyCta'
import { YourNumber } from '@/components/home/YourNumber'
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
          lowPrice: '69',
          highPrice: '169',
          offerCount: 2,
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
        <ProductNote waitlist={waitlist} />
        <DigitalFirst />
        <ChooseLicense waitlist={waitlist} />
        <Compare waitlist={waitlist} />
        <HowItWorks waitlist={waitlist} />
        <BoxSequences />
        <YourNumber waitlist={waitlist} />
        <Gift waitlist={waitlist} />
        <Statement />
        <Faq />
        <FinalCta waitlist={waitlist} />
      </main>
      {waitlist ? null : <StickyCta />}
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
