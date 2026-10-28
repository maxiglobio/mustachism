import Image from 'next/image'
import Link from 'next/link'
import { licenseHref } from '@/lib/offer'

/** Block 9 — for the gift buyer. */
export function Gift({ waitlist }: { waitlist: boolean }) {
  return (
    <section className="section gift" aria-labelledby="gift-title">
      <div className="container gift__grid">
        <div className="gift__media reveal">
          <Image
            src="/assets/images/license-box-premium-withcard.png"
            alt="An opened premium box with an engraved steel mustache license inside"
            width={1414}
            height={1182}
            sizes="(max-width: 767px) 92vw, 50vw"
            className="gift__img"
          />
        </div>
        <div className="gift__copy reveal">
          <p className="eyebrow mono">Gift</p>
          <h2 id="gift-title" className="section-title">
            The gift he definitely <em>doesn&rsquo;t have.</em>
          </h2>
          <p className="lead">For husbands. Boyfriends. Fathers. Friends. Groomsmen.</p>
          <p className="lead">And anyone whose mustache has become part of their identity.</p>
          <p className="gift__tags mono">Personalized · Functional · Completely unnecessary · Impossible to forget</p>
          <Link href={licenseHref(waitlist)} className="btn btn--primary btn--lg">
            Get him licensed
          </Link>
        </div>
      </div>
    </section>
  )
}
