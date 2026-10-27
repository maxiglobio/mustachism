import type { Metadata, Viewport } from 'next'
import { Anton, Inter, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import { MotionProvider } from '@/components/motion/MotionProvider'
import { SITE } from '@/lib/site'
import './globals.css'

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const display = Anton({ subsets: ['latin'], weight: '400', variable: '--font-display', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — A license for what remains`, template: `%s — ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/assets/images/favicon.svg', type: 'image/svg+xml' },
      { url: '/assets/images/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/assets/images/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: { type: 'website', siteName: SITE.name, locale: 'en_US' },
  twitter: { card: 'summary_large_image' },
  appleWebApp: { title: SITE.name },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f4f4f5',
}

/**
 * Adds `motion` to <html> before first paint so animated elements start hidden (no flash).
 * MotionProvider takes over after hydration; if it never does, the class is dropped so
 * content can't stay invisible.
 */
const motionGate = `(function(){try{var d=document.documentElement;if(matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('intro-skip')}else{d.classList.add('motion');try{if(!/[?&]intro\\b/.test(location.search)&&sessionStorage.getItem('mustachism:intro')==='1')d.classList.add('intro-skip')}catch(e){}setTimeout(function(){if(!d.classList.contains('motion-ready')){d.classList.remove('motion');d.classList.add('intro-skip')}},4000)}}catch(e){}})()`

// Sanitised: Clarity IDs are alphanumeric (guards against stray quotes in .env).
const clarityId = (process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || '').replace(/[^a-z0-9]/gi, '')

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // <html> carries runtime-only classes (motion, intro-*); React must not own its className.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionGate }} />
      </head>
      <body className={`${sans.variable} ${display.variable} ${mono.variable}`}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <MotionProvider />
        {children}
        {clarityId && process.env.NODE_ENV === 'production' ? (
          <Script id="ms-clarity-init" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script",${JSON.stringify(clarityId)});`}
          </Script>
        ) : null}
      </body>
    </html>
  )
}
