import Image from 'next/image'
import Link from 'next/link'
import { licenseHref, TIERS } from '@/lib/offer'

/** Block 12 — the last push. */
export function FinalCta({ waitlist }: { waitlist: boolean }) {
  return (
    <section className="section final-cta" aria-labelledby="final-title">
      <div className="container final-cta__inner">
        <div className="final-cta__media reveal" aria-hidden="true">
          <Image src={TIERS.standard.image} alt="" width={1414} height={1182} sizes="(max-width: 767px) 46vw, 30vw" />
          <Image src={TIERS.premium.image} alt="" width={1414} height={1182} sizes="(max-width: 767px) 46vw, 30vw" />
        </div>
        <div className="final-cta__copy reveal">
          <h2 id="final-title" className="section-title">
            Your mustache has waited <em>long enough.</em>
          </h2>
          <p className="lead">Personalized. Engraved in steel. Valid everywhere. Expires never.</p>
          <p className="final-cta__prices mono">
            <span>Standard — {TIERS.standard.price}</span>
            <span>Premium — {TIERS.premium.price}</span>
          </p>
          <Link href={licenseHref(waitlist)} className="btn btn--primary btn--lg">
            Get your license
          </Link>
        </div>
      </div>
    </section>
  )
}
