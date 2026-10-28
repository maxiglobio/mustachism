export const SITE = {
  name: 'MUSTACHISM',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mustachism.com',
  description: 'Official mustache licenses in solid steel. A quiet resistance against plastic masculinity.',
  startingPrice: 69,
  /** TODO(owner): confirm this mailbox exists — the old site linked Contact to '#'. */
  contactEmail: 'hello@mustachism.com',
} as const

export const NAV = [
  { href: '/', label: 'License' },
  { href: '/story', label: 'Story' },
] as const

export const LEGAL = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-of-service', label: 'Terms of Service' },
] as const
