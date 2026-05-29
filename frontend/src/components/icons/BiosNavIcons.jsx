/**
 * Icônes BIOS discrètes — navigation terminal / modules clandestins.
 * Monochrome, petit format, style militaire futuriste.
 */

const BASE = {
  viewBox: '0 0 16 16',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
}

/** Dossier militaire / document crypté — cyan/gris */
export function JournalBiosIcon({ className = '' }) {
  return (
    <svg {...BASE} className={`bios-nav-svg bios-nav-svg--journal ${className}`}>
      <rect x="2" y="1" width="12" height="14" stroke="currentColor" strokeWidth="1" />
      <path d="M5 1 V4 H11 V1" stroke="currentColor" strokeWidth="0.8" />
      <path d="M5 7 H11 M5 9.5 H9" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
      <rect x="10" y="8" width="3" height="3" stroke="currentColor" strokeWidth="0.6" opacity="0.55" />
      <path d="M10.5 9.5 L12.5 9.5 M11.5 8.5 V10.5" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
    </svg>
  )
}

/** Puce illégale / marché noir terminal — orange/rouge discret */
export function MarketBiosIcon({ className = '' }) {
  return (
    <svg {...BASE} className={`bios-nav-svg bios-nav-svg--market ${className}`}>
      <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1" />
      <path d="M3 6 H13 M3 10 H13 M6 3 V13 M10 3 V13" stroke="currentColor" strokeWidth="0.5" opacity="0.45" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.85" />
      <path d="M1 8 H2.5 M13.5 8 H15" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
      <path d="M8 1 V2.5 M8 13.5 V15" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    </svg>
  )
}

/** Courtier indices — signal trader orange */
export function BrokerBiosIcon({ className = '' }) {
  return (
    <svg {...BASE} className={`bios-nav-svg bios-nav-svg--broker ${className}`}>
      <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="0.9" />
      <path d="M4 14 C4 10 6 8 8 8 C10 8 12 10 12 14" stroke="currentColor" strokeWidth="0.9" />
      <path d="M2 6 L4 7 M14 6 L12 7" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
      <path d="M8 2 V0.5" stroke="currentColor" strokeWidth="0.6" opacity="0.45" />
    </svg>
  )
}

export function BiosNavIcon({ type, className = '' }) {
  if (type === 'market') return <MarketBiosIcon className={className} />
  if (type === 'broker') return <BrokerBiosIcon className={className} />
  return <JournalBiosIcon className={className} />
}

export default BiosNavIcon
