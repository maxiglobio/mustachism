import Link from 'next/link'
import { licenseHref } from '@/lib/offer'
import { LicenseImage } from './LicenseImage'

const NUMBERS = ['000-069', '000-777', '001-001']

/** Block 8 — the main reason to go Premium: you pick the number. */
export function YourNumber({ waitlist }: { waitlist: boolean }) {
  return (
    <section className="section your-number" aria-labelledby="number-title">
      <div className="container your-number__grid">
        <div className="your-number__copy reveal">
          <p className="eyebrow mono">Premium</p>
          <h2 id="number-title" className="section-title">
            Some numbers are assigned. <em>Others are claimed.</em>
          </h2>
          <p className="lead">Every Standard License receives its own individual number.</p>
          <p className="lead">
            With Premium, you choose your preferred available number and make the credential unmistakably yours.
          </p>
          <Link href={licenseHref(waitlist, 'premium')} className="btn btn--primary btn--lg">
            Choose Premium — $169
          </Link>
        </div>
        <ul className="your-number__stack" aria-label="Example license numbers">
          {NUMBERS.map((n) => (
            <li key={n} className="your-number__card">
              <LicenseImage number={n} sizes="(max-width: 767px) 80vw, 36vw" />
              <span className="sr-only">#{n.replace('-', '')}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
