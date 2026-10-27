import { OG_SIZE, renderOg } from '@/lib/og/render'

export const alt = 'MUSTACHISM Terms of Service'
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOg({ title: 'Terms of Service' })
}
