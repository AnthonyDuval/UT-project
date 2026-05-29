/**
 * Icônes BIOS mission — discret, cyberpunk, couleur par dossier.
 */

const iconBase = {
  viewBox: '0 0 40 40',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
}

function MissionIconShell({ children, filterId, className = '' }) {
  return (
    <svg {...iconBase} className={`mission-icon ${className}`}>
      <defs>
        <filter id={filterId} x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="0.7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {children}
    </svg>
  )
}

/** Antenne corrompue — onde cassée — cyan */
function SignalFantomeIcon() {
  return (
    <MissionIconShell filterId="mj-sf-glow">
      <path d="M20 4 V12" stroke="currentColor" strokeWidth="1.3" filter="url(#mj-sf-glow)" />
      <path d="M12 12 L20 8 L28 12" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 20 Q20 14 32 20" stroke="currentColor" strokeWidth="1" opacity="0.7" strokeDasharray="2 2" />
      <path d="M6 26 Q20 18 34 28" stroke="currentColor" strokeWidth="0.9" opacity="0.5" />
      <path d="M10 32 H30" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <path d="M14 28 L18 32 M26 28 L22 32" stroke="currentColor" strokeWidth="0.8" opacity="0.55" />
    </MissionIconShell>
  )
}

/** Satellite orbital — radar — ambre/or */
function IntrusionOrbitaleIcon() {
  return (
    <MissionIconShell filterId="mj-io-glow">
      <circle cx="20" cy="20" r="13" stroke="currentColor" strokeWidth="0.9" strokeDasharray="3 4" opacity="0.55" />
      <rect x="16" y="15" width="8" height="6" stroke="currentColor" strokeWidth="1.2" filter="url(#mj-io-glow)" />
      <path d="M18 15 V11 M22 15 V11" stroke="currentColor" strokeWidth="0.8" />
      <path d="M20 21 V26 M16 24 H24" stroke="currentColor" strokeWidth="0.7" opacity="0.6" />
      <circle cx="32" cy="10" r="2" fill="currentColor" opacity="0.65" />
      <path d="M20 7 V9 M20 31 V33 M7 20 H9 M31 20 H33" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
    </MissionIconShell>
  )
}

/** Puce illégale — marché noir — orange */
function BlackMarketMissionIcon() {
  return (
    <MissionIconShell filterId="mj-bm-glow">
      <rect x="11" y="11" width="18" height="18" stroke="currentColor" strokeWidth="1.2" filter="url(#mj-bm-glow)" />
      <path d="M11 17 H29 M11 23 H29 M17 11 V29 M23 11 V29" stroke="currentColor" strokeWidth="0.5" opacity="0.45" />
      <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.8" />
      <path d="M6 20 H9 M31 20 H34" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
    </MissionIconShell>
  )
}

/** Œil glitché — contact inconnu — rouge */
function NovaContactIcon() {
  return (
    <MissionIconShell filterId="mj-nc-glow">
      <ellipse cx="20" cy="20" rx="11" ry="7" stroke="currentColor" strokeWidth="1.2" filter="url(#mj-nc-glow)" />
      <circle cx="20" cy="20" r="3.5" fill="currentColor" opacity="0.75" />
      <path d="M8 18 L5 17 M32 18 L35 17 M8 22 L5 23 M32 22 L35 23" stroke="currentColor" strokeWidth="0.7" opacity="0.45" />
      <path d="M17 19 H19 M21 19 H23" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    </MissionIconShell>
  )
}

function GenericMissionIcon() {
  return (
    <MissionIconShell filterId="mj-gen-glow">
      <rect x="11" y="8" width="18" height="24" stroke="currentColor" strokeWidth="1.1" filter="url(#mj-gen-glow)" />
      <path d="M15 16 H25 M15 21 H25 M15 26 H20" stroke="currentColor" strokeWidth="0.7" opacity="0.55" />
    </MissionIconShell>
  )
}

const MISSION_ICON_MAP = {
  signal_fantome: SignalFantomeIcon,
  satlink_intrusion: IntrusionOrbitaleIcon,
  black_market: BlackMarketMissionIcon,
  nova_contact: NovaContactIcon,
}

export function MissionIcon({ missionId, size = 40, className = '' }) {
  const Icon = MISSION_ICON_MAP[missionId] || GenericMissionIcon
  return (
    <span
      className={`mission-icon-wrap mission-icon-wrap--${missionId} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon />
    </span>
  )
}

export default MissionIcon
