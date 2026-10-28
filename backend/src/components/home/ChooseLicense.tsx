import Image from 'next/image'
import Link from 'next/link'
import { licenseHref, TIERS } from '@/lib/offer'

/** Block 4 — the two licenses, side by side on desktop, stacked on phones. */
export function ChooseLicense({ waitlist }: { waitlist: boolean }) {
  return (
    <section id="license" className="section choose" aria-labelledby="choose-title">
      <div className="container">
        <header className="section-head section-head--center reveal">
          <p className="eyebrow mono">Two versions. One mustache.</p>
          <h2 id="choose-title" className="section-title">
            Choose your <em>license.</em>
          </h2>
        </header>
        <div className="tiers reveal-stagger">
          {(['standard', 'premium'] as const).map((id) => {
            const t = TIERS[id]
            const premium = id === 'premium'
            return (
              <article key={id} className={`tier${premium ? ' tier--premium' : ''}`} aria-labelledby={`tier-${id}`}>
                <div className="tier__media">
                  <Image src={t.image} alt={t.imageAlt} width={1414} height={1182} sizes="(max-width: 767px) 92vw, 44vw" />
                  {premium ? (
                    <ul className="tier__badges mono">
                      <li>Choose your number</li>
                      <li>Premium presentation</li>
                    </ul>
                  ) : null}
                </div>
                <div className="tier__body">
                  <header className="tier__head">
                    <h3 id={`tier-${id}`} className="tier__name">
                      {t.name}
                    </h3>
                    <p className="tier__price">{t.price}</p>
                  </header>
                  <p className="tier__tagline">{t.tagline}</p>
                  <ul className="tier__list">
                    {t.includes.map((item) => (
                      <li key={item} data-highlight={(t.highlights as readonly string[]).includes(item) || undefined}>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {premium ? (
                    <div className="tier__note">
                      <p className="tier__note-title mono">Choose your number</p>
                      <p>Select your preferred number from those still available.</p>
                    </div>
                  ) : (
                    <div className="tier__note">
                      <p className="tier__note-title mono">A unique number, assigned to you</p>
                      <p>
                        Every Standard License receives a unique individual number automatically assigned by Mustachism.
                        Want to choose it yourself? That&rsquo;s available with Premium.
                      </p>
                    </div>
                  )}
                  <Link
                    href={licenseHref(waitlist, id)}
                    className={`btn btn--lg btn--block ${premium ? 'btn--primary' : 'btn--ghost'}`}
                  >
                    Get {t.short} — {t.price}
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
