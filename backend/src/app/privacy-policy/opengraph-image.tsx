import { OG_SIZE, renderOg } from '@/lib/og/render'

export const alt = 'MUSTACHISM Privacy Policy'
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOg({ title: 'Privacy Policy' })
}
