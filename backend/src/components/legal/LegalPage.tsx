import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="page page--legal">
        <article className="container legal">
          <header className="legal__head reveal">
            <h1 className="legal__title">{title}</h1>
            <p className="legal__updated mono">Last updated: {updated}</p>
          </header>
          <div className="legal__body prose reveal">{children}</div>
        </article>
      </main>
      <SiteFooter />
    </>
  )
}
