import Link from 'next/link'
import { LEGAL, NAV, SITE } from '@/lib/site'
import { Logo } from './Logo'

export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <Logo className="site-footer__mark" />
          <p className="site-footer__tagline">A license for what remains.</p>
        </div>
        <nav className="site-footer__nav" aria-label="Footer">
          <ul>
            {NAV.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/order">Order</Link>
            </li>
          </ul>
          <ul>
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
            <li>
              <a href={`mailto:${SITE.contactEmail}`}>Contact</a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="container site-footer__base">
        <span>© {year} MUSTACHISM. All rights reserved.</span>
        <span className="mono">Valid everywhere · Expires never</span>
      </div>
    </footer>
  )
}
