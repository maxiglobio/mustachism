import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }

let cardData: Promise<string> | null = null
function card() {
  cardData ??= readFile(path.join(process.cwd(), 'src/lib/og/card.png')).then(
    (b) => `data:image/png;base64,${b.toString('base64')}`,
  )
  return cardData
}

/** Shared Open Graph artwork: title on the left, the steel card on the right. */
export async function renderOg({ title }: { title: string }) {
  const src = await card()
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%)',
          color: '#0e0e0f',
          padding: 64,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 560 }}>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 6, fontWeight: 700 }}>MUSTACHISM</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', fontSize: 68, lineHeight: 1.02, letterSpacing: -2, fontWeight: 700 }}>{title}</div>
          </div>
          <div style={{ display: 'flex', fontSize: 20, color: '#6b6964' }}>Valid everywhere · Expires never</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={src} width={640} height={437} style={{ position: 'absolute', right: -30, top: 96 }} />
      </div>
    ),
    OG_SIZE,
  )
}
