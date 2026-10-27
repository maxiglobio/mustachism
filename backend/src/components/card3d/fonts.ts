import { DM_Serif_Display, Inter, Share_Tech_Mono } from 'next/font/google'

/** Squared stencil-mono used for the card's field values. */
export const engraveMono = Share_Tech_Mono({ weight: '400', subsets: ['latin'], display: 'block' })
/** Rounder grotesque used for the number on the reverse. */
export const engraveRound = Inter({ weight: '600', subsets: ['latin'], display: 'block' })
/** High-contrast serif for the class letter. */
export const engraveSerif = DM_Serif_Display({ weight: '400', subsets: ['latin'], display: 'block' })
