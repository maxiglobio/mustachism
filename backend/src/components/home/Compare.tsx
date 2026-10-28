import Link from 'next/link'
import { licenseHref } from '@/lib/offer'

const ROWS: Array<[label: string, standard: string | boolean, premium: string | boolean]> = [
  ['Personalized steel license', true, true],
  ['Portrait + personal details', true, true],
  ['Digital license', true, true],
  ['Built-in mustache comb', true, true],
  ['License number', 'Unique, assigned automatically', 'You choose'],
  ['Packaging', 'Slim presentation packaging', 'Premium presentation box'],
  ['Mustachism letter', false, true],
  ['Price', '$69', '$169'],
]

const Cell = ({ v, strong }: { v: string | boolean; strong?: boolean }) =>
  v === true ? (
    <span className="compare__mark" aria-label="Included">
      ✓
    </span>
  ) : v === false ? (
    <span className="compare__none" aria-label="Not included">
      —
    </span>
  ) : strong ? (
    <strong>{v}</strong>
  ) : (
    <>{v}</>
  )

/** Block 5 — the short difference between the two SKUs. */
export function Compare({ waitlist }: { waitlist: boolean }) {
  return (
    <section className="section section--tight compare" aria-labelledby="compare-title">
      <div className="container compare__inner">
        <h2 id="compare-title" className="compare__title mono reveal">
          Standard vs Premium
        </h2>
        <div className="compare__scroll reveal">
          <table className="compare__table">
            <thead>
              <tr>
                <td />
                <th scope="col">Standard</th>
                <th scope="col">Premium</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, s, p]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>
                    <Cell v={s} strong={label === 'Price'} />
                  </td>
                  <td>
                    <Cell v={p} strong={typeof p === 'string'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href={licenseHref(waitlist)} className="btn btn--ghost btn--lg compare__cta reveal">
          Choose your license
        </Link>
      </div>
    </section>
  )
}
