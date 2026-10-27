const SEAL_PATH =
  'M257.994 24.3896L287.442 6.31543L305.659 35.7051L338.475 24.9209L349.435 57.7275L383.848 54.8135L386.959 89.2676L421.116 94.3828L416.211 128.626L448.27 141.494L435.613 173.682L463.845 193.607L444.12 222.005L467.003 247.915L441.271 270.989L457.572 301.488L427.223 317.996L436.062 351.438L402.729 360.491L403.632 395.073L369.113 396.182L362.03 430.041L328.188 423.146L313.499 454.455L282.156 439.928L260.655 467.001L233.502 445.624L206.348 467.001L184.848 439.928L153.504 454.455L138.816 423.146L104.973 430.041L97.8896 396.182L63.3711 395.073L64.2734 360.491L30.9404 351.438L39.7812 317.996L9.43066 301.488L25.7314 270.989L0 247.915L22.8838 222.005L3.1582 193.607L31.3896 173.682L18.7334 141.494L50.792 128.626L45.8877 94.3828L80.0439 89.2676L83.1553 54.8135L117.569 57.7275L128.528 24.9209L161.344 35.7051L179.562 6.31543L209.009 24.3896L233.502 0L257.994 24.3896Z'

/** The scalloped price seal from the original site; the ring rotates with scroll. */
export function PriceSeal({ price, inverted, className }: { price: string; inverted?: boolean; className?: string }) {
  return (
    <svg
      className={`price-seal${inverted ? ' price-seal--inverted' : ''} ${className ?? ''}`}
      viewBox="0 0 467 467"
      role="img"
      aria-label={`Price ${price}`}
    >
      <g className="price-seal__ring">
        <path d={SEAL_PATH} />
      </g>
      <text x="233.5" y="252" textAnchor="middle" dominantBaseline="middle" className="price-seal__text">
        {price}
      </text>
    </svg>
  )
}
