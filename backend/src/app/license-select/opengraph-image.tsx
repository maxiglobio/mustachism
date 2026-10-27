import { OG_SIZE, renderOg } from '@/lib/og/render'

export const alt = 'Choose a MUSTACHISM license number'
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOg({ title: 'Choose a number that means something.' })
}
