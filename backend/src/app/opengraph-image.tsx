import { OG_SIZE, renderOg } from '@/lib/og/render'

export const alt = 'MUSTACHISM — a steel mustache license card'
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOg({ title: 'A license for what remains.' })
}
