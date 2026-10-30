import { LicenseImage } from './LicenseImage'

/** Block 3 — the digital license arrives before the steel one. */
export function DigitalFirst() {
  return (
    <section className="section digital" aria-labelledby="digital-title">
      <div className="container digital__grid">
        <div className="digital__copy reveal">
          <p className="eyebrow mono">Digital first. Steel next.</p>
          <h2 id="digital-title" className="section-title">
            Licensed before <em>the mail arrives.</em>
          </h2>
          <p className="lead">
            Once your license is personalized, you&rsquo;ll receive your digital version while your engraved steel license
            is being prepared and shipped.
          </p>
          <p className="digital__badge mono">Digital license included with every order</p>
        </div>
        <div className="digital__visual reveal" aria-hidden="true">
          <LicenseImage className="digital__steel" number="000 069" />
          <div className="phone">
            <div className="phone__screen">
              <p className="phone__head mono">
                <span>Mustachism</span>
                <span className="phone__status">Valid</span>
              </p>
              <p className="phone__title">Digital license</p>
              <LicenseImage className="phone__card" number="000 069" sizes="240px" />
              <dl className="phone__meta mono">
                <div>
                  <dt>License</dt>
                  <dd>#000 069</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>Issued</dd>
                </div>
                <div>
                  <dt>Steel</dt>
                  <dd>Engraving</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
