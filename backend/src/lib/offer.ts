/**
 * The two licenses sold on the homepage. Checkout prices come from Shopify (Basic / Pro);
 * these are the marketing prices shown on the page.
 */
export const TIERS = {
  standard: {
    id: 'standard',
    name: 'Standard License',
    short: 'Standard',
    price: '$69',
    package: 'basic',
    tagline: 'Everything required to become officially licensed.',
    image: '/assets/images/license-box-withcard.png',
    imageAlt: 'Steel mustache license in its slim black presentation packaging',
    includes: [
      'Personalized engraved steel license',
      'Your portrait',
      'Your personal details',
      'Unique license number, assigned automatically',
      'Built-in mustache comb',
      'Digital license',
      'Slim presentation packaging',
    ],
    highlights: [] as string[],
  },
  premium: {
    id: 'premium',
    name: 'Premium License',
    short: 'Premium',
    price: '$169',
    package: 'pro',
    tagline: 'Same license. Your number. Proper ceremony.',
    image: '/assets/images/license-box-premium-withcard.png',
    imageAlt: 'Steel mustache license inside the premium presentation box',
    includes: [
      'Personalized engraved steel license',
      'Your portrait',
      'Your personal details',
      'Choose your own available license number',
      'Built-in mustache comb',
      'Digital license',
      'Premium presentation box',
      'Official Mustachism letter',
    ],
    highlights: ['Choose your own available license number', 'Premium presentation box'],
  },
} as const

export type TierId = keyof typeof TIERS

/** Where a "get your license" button goes; waitlist mode sends everyone to the hero form. */
export function licenseHref(waitlist: boolean, tier?: TierId) {
  if (waitlist) return '/#waitlist'
  return tier ? `/order?package=${TIERS[tier].package}` : '/#license'
}
