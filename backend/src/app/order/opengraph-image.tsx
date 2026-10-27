import { OG_SIZE, renderOg } from '@/lib/og/render'

export const alt = 'Order a MUSTACHISM license'
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOg({ title: 'Your details, engraved in steel.' })
}
