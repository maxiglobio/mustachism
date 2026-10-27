import type { Metadata } from 'next'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { Chronicle } from '@/components/story/Chronicle'
import { Codex } from '@/components/story/Codex'
import { StoryHero } from '@/components/story/StoryHero'

const description =
  'The Mustachism Codex: ten commandments for wearing a mustache with dignity, unity and joy — and the chronicle behind the license.'

export const metadata: Metadata = {
  title: 'Story',
  description,
  alternates: { canonical: '/story' },
  openGraph: { title: 'Story — MUSTACHISM', description, url: '/story' },
  twitter: { title: 'Story — MUSTACHISM', description },
}

export default function StoryPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="page page--story">
        <StoryHero />
        <Codex />
        <Chronicle />
      </main>
      <SiteFooter />
    </>
  )
}
