'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { NAV } from '@/lib/site'
import { logout, useAuth } from '@/lib/client/auth'
import { Logo } from './Logo'

type Props = {
  /** 'logout' swaps the account button for a Logout action (dashboard). */
  account?: 'auto' | 'logout'
}

export function SiteHeader({ account = 'auto' }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const [open, setOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Hide on scroll down / show on scroll up — desktop only.
  useEffect(() => {
    const header = headerRef.current
    if (!header || prefersReducedMotion()) return
    const mq = window.matchMedia('(min-width: 860px)')
    let lastY = window.scrollY
    let hidden = false
    const onScroll = () => {
      const y = window.scrollY
      if (!mq.matches || document.documentElement.classList.contains('nav-open')) {
        lastY = y
        return
      }
      const down = y > lastY
      if (down && y > 80 && !hidden) {
        hidden = true
        gsap.to(header, { y: -80, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
      } else if (!down && hidden) {
        hidden = false
        gsap.to(header, { y: 0, duration: 0.4, ease: 'power3.out', overwrite: 'auto' })
      }
      lastY = y
    }
    const onMq = () => {
      if (!mq.matches && hidden) {
        hidden = false
        gsap.set(header, { y: 0 })
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    mq.addEventListener('change', onMq)
    return () => {
      window.removeEventListener('scroll', onScroll)
      mq.removeEventListener('change', onMq)
    }
  }, [])

  // Mobile overlay: lock body scroll, close on Escape and on navigation.
  useEffect(() => {
    const html = document.documentElement
    if (!open) return
    const scrollY = window.scrollY
    html.classList.add('nav-open')
    document.body.style.top = `-${scrollY}px`
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)

    const overlay = overlayRef.current
    if (overlay && !prefersReducedMotion()) {
      gsap.fromTo(
        overlay.querySelectorAll('[data-nav-item]'),
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.06, delay: 0.08 },
      )
    }
    overlay?.querySelector<HTMLElement>('a, button')?.focus()

    return () => {
      html.classList.remove('nav-open')
      document.body.style.top = ''
      window.scrollTo(0, scrollY)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => setOpen(false), [pathname])

  const accountHref = auth.authenticated ? '/dashboard' : '/login'
  const accountLabel = auth.authenticated ? 'Dashboard' : 'Login'

  const onLogout = async () => {
    await logout().catch(() => undefined)
    router.push('/')
  }

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <>
      <header ref={headerRef} className="site-header" data-header>
        <div className="site-header__inner container">
          <Link href="/" className="brand" aria-label="MUSTACHISM — home">
            <Logo className="brand__mark" />
            <span className="brand__word">MUSTACHISM</span>
          </Link>

          <nav className="site-nav" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="site-nav__link"
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="site-header__actions">
            {account === 'logout' ? (
              <button type="button" className="btn btn--ghost btn--sm" onClick={onLogout}>
                Logout
              </button>
            ) : (
              <Link href={accountHref} className="btn btn--ghost btn--sm">
                {accountLabel}
              </Link>
            )}
            <button
              type="button"
              className="nav-toggle"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="nav-toggle__bar" />
              <span className="nav-toggle__bar" />
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-nav"
        ref={overlayRef}
        className="mobile-nav"
        data-lenis-prevent
        data-open={open}
        hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <nav className="mobile-nav__links" aria-label="Mobile">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-nav-item
              className="mobile-nav__link"
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
          {account === 'logout' ? (
            <button type="button" data-nav-item className="mobile-nav__link" onClick={onLogout}>
              Logout
            </button>
          ) : (
            <Link href={accountHref} data-nav-item className="mobile-nav__link">
              {accountLabel}
            </Link>
          )}
        </nav>
        <div className="mobile-nav__foot" data-nav-item>
          <Link href="/order" className="btn btn--primary btn--block">
            Get your license
          </Link>
        </div>
      </div>
    </>
  )
}
