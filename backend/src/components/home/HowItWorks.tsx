import Link from 'next/link'
import { licenseHref } from '@/lib/offer'

const STEPS = [
  { title: 'Choose your license', copy: ['Standard or Premium.'] },
  {
    title: 'Make it yours',
    copy: [
      'Upload your photo and enter the personal details you want engraved on your license.',
      'With Standard, your unique license number is assigned automatically. With Premium, you choose your preferred available number.',
    ],
  },
  { title: 'Get your digital license', copy: ['Your personalized digital license arrives first.'] },
  { title: 'We engrave the real thing', copy: ['Your physical steel license is individually produced and engraved.'] },
  { title: 'Receive your credentials', copy: ['Your license is packed and delivered to you.'] },
]

/** Block 6 — choose → personalize → digital → engraving → delivery. */
export function HowItWorks({ waitlist }: { waitlist: boolean }) {
  return (
    <section id="how-it-works" className="section how" aria-labelledby="how-title">
      <div className="container how__grid">
        <header className="how__head reveal">
          <h2 id="how-title" className="section-title">
            How to get <em>licensed.</em>
          </h2>
          <Link href={licenseHref(waitlist)} className="btn btn--primary btn--lg">
            Get your license
          </Link>
        </header>
        <ol className="how__steps reveal-stagger">
          {STEPS.map((s, i) => (
            <li key={s.title} className="how__step">
              <span className="how__n mono">0{i + 1}</span>
              <div>
                <h3 className="how__title">{s.title}</h3>
                {s.copy.map((c) => (
                  <p key={c}>{c}</p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
