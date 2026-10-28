import Link from 'next/link'
import { licenseHref } from '@/lib/offer'

/** Closes the product breakdown: the brand line and the first CTA after the close-ups. */
export function ProductNote({ waitlist }: { waitlist: boolean }) {
  return (
    <section className="section section--tight product-note" aria-label="Get your license">
      <div className="container product-note__inner reveal">
        <p className="product-note__line">
          Official identification should <em>occasionally be useful.</em>
        </p>
        <Link href={licenseHref(waitlist)} className="btn btn--primary btn--lg">
          Get your license
        </Link>
      </div>
    </section>
  )
}
