import Image from 'next/image'

/** The flat front of the license with a number engraved into the "LICENCE #" line. */
export function LicenseImage({ number, className, sizes = '(max-width: 767px) 90vw, 40vw', priority }: {
  number?: string
  className?: string
  sizes?: string
  priority?: boolean
}) {
  return (
    <div className={`license-img ${className ?? ''}`}>
      <Image src="/assets/images/license-card.png" alt="" width={1024} height={649} sizes={sizes} priority={priority} />
      {number ? <span className="license-img__number">{number}</span> : null}
    </div>
  )
}
