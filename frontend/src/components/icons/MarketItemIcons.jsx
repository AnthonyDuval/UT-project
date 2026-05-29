/**
 * Icônes cyberpunk rouge/noir pour le Black Market — SVG inline, lisibles en petit.
 */

const iconBase = {
  viewBox: '0 0 48 48',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
}

function IconShell({ children, className = '' }) {
  return (
    <svg {...iconBase} className={`market-icon ${className}`}>
      <defs>
        <filter id="mi-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
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

function FirewallJetableIcon() {
  return (
    <IconShell>
      <path
        d="M24 6 L38 14 V26 C38 34 24 42 24 42 C24 42 10 34 10 26 V14 Z"
        stroke="#e63946"
        strokeWidth="1.5"
        filter="url(#mi-glow)"
      />
      <path d="M14 18 H34" stroke="#ff6b6b" strokeWidth="1" opacity="0.7" />
      <path d="M12 24 H36" stroke="#ff6b6b" strokeWidth="1" opacity="0.5" />
      <path d="M16 30 H32" stroke="#ff6b6b" strokeWidth="1" opacity="0.35" />
      <rect x="20" y="20" width="8" height="2" fill="#e63946" opacity="0.8" />
    </IconShell>
  )
}

function ProxyFantomeIcon() {
  return (
    <IconShell>
      <circle cx="24" cy="14" r="5" stroke="#e63946" strokeWidth="1.5" filter="url(#mi-glow)" />
      <path
        d="M14 38 C14 28 18 22 24 22 C30 22 34 28 34 38"
        stroke="#c1121f"
        strokeWidth="1.5"
        strokeDasharray="3 2"
        opacity="0.85"
      />
      <path d="M8 20 L16 24 M40 20 L32 24" stroke="#e63946" strokeWidth="1" opacity="0.5" />
      <circle cx="8" cy="18" r="2" fill="#e63946" opacity="0.4" />
      <circle cx="40" cy="18" r="2" fill="#e63946" opacity="0.4" />
    </IconShell>
  )
}

function BrouilleurNovaIcon() {
  return (
    <IconShell>
      <path
        d="M6 24 Q14 16 24 24 T42 24"
        stroke="#e63946"
        strokeWidth="1.5"
        filter="url(#mi-glow)"
      />
      <path d="M6 30 Q18 22 30 30 T42 28" stroke="#ff6b6b" strokeWidth="1" opacity="0.6" />
      <path d="M8 18 Q20 26 32 18" stroke="#c1121f" strokeWidth="1" opacity="0.45" />
      <text x="24" y="40" textAnchor="middle" fill="#e63946" fontSize="7" fontFamily="monospace" opacity="0.7">
        N0
      </text>
    </IconShell>
  )
}

function SpoofIdentiteIcon() {
  return (
    <IconShell>
      <path
        d="M24 8 C16 8 12 16 12 22 C12 30 18 36 24 40 C30 36 36 30 36 22 C36 16 32 8 24 8 Z"
        stroke="#e63946"
        strokeWidth="1.5"
        filter="url(#mi-glow)"
      />
      <rect x="18" y="18" width="12" height="3" fill="#ff6b6b" opacity="0.7" />
      <rect x="16" y="24" width="16" height="2" fill="#c1121f" opacity="0.5" />
      <path d="M20 30 H28" stroke="#e63946" strokeWidth="1" />
    </IconShell>
  )
}

function PackFirewallIcon() {
  return (
    <IconShell>
      <rect x="8" y="10" width="32" height="28" stroke="#e63946" strokeWidth="1.5" filter="url(#mi-glow)" />
      <path d="M8 18 H40 M8 26 H40 M8 34 H40" stroke="#c1121f" strokeWidth="0.8" opacity="0.6" />
      <path d="M16 10 V38 M24 10 V38 M32 10 V38" stroke="#ff6b6b" strokeWidth="0.6" opacity="0.4" />
      <circle cx="24" cy="22" r="3" stroke="#e63946" strokeWidth="1" />
    </IconShell>
  )
}

function WormExeIcon() {
  return (
    <IconShell>
      <path
        d="M10 30 C10 22 16 16 24 16 C32 16 38 22 38 30"
        stroke="#e63946"
        strokeWidth="1.5"
        filter="url(#mi-glow)"
      />
      <circle cx="16" cy="28" r="3" fill="#c1121f" />
      <circle cx="24" cy="26" r="3" fill="#e63946" />
      <circle cx="32" cy="28" r="3" fill="#ff6b6b" />
      <path d="M34 26 L40 22" stroke="#e63946" strokeWidth="1.2" />
      <text x="24" y="42" textAnchor="middle" fill="#e63946" fontSize="6" fontFamily="monospace">
        .exe
      </text>
    </IconShell>
  )
}

function GhostVpnIcon() {
  return (
    <IconShell>
      <ellipse cx="24" cy="24" rx="16" ry="10" stroke="#e63946" strokeWidth="1.5" filter="url(#mi-glow)" />
      <path d="M8 24 H40" stroke="#c1121f" strokeWidth="0.8" opacity="0.5" strokeDasharray="2 2" />
      <circle cx="14" cy="24" r="2" fill="#ff6b6b" opacity="0.6" />
      <circle cx="34" cy="24" r="2" fill="#ff6b6b" opacity="0.6" />
      <path d="M20 24 L28 24 M24 20 L24 28" stroke="#e63946" strokeWidth="1" opacity="0.7" />
    </IconShell>
  )
}

function ProgramChipIcon() {
  return (
    <IconShell>
      <rect x="14" y="14" width="20" height="20" stroke="#7dd3fc" strokeWidth="1.5" filter="url(#mi-glow)" />
      <path d="M18 14 V10 M24 14 V8 M30 14 V10" stroke="#7dd3fc" strokeWidth="1" />
      <path d="M18 34 V38 M24 34 V40 M30 34 V38" stroke="#7dd3fc" strokeWidth="1" />
      <path d="M14 20 H10 M14 28 H8 M34 20 H38 M34 28 H40" stroke="#7dd3fc" strokeWidth="1" />
      <text x="24" y="27" textAnchor="middle" fill="#7dd3fc" fontSize="6" fontFamily="monospace">
        EXE
      </text>
    </IconShell>
  )
}

function GenericMarketIcon() {
  return (
    <IconShell>
      <rect x="12" y="12" width="24" height="24" stroke="#e63946" strokeWidth="1.5" filter="url(#mi-glow)" />
      <path d="M18 24 L24 18 L30 24 L24 30 Z" stroke="#ff6b6b" strokeWidth="1" />
    </IconShell>
  )
}

const MARKET_ICON_MAP = {
  firewall_jetable: FirewallJetableIcon,
  proxy_fantome: ProxyFantomeIcon,
  brouilleur_nova: BrouilleurNovaIcon,
  spoof_identite: SpoofIdentiteIcon,
  pack_firewall_basique: PackFirewallIcon,
  worm_exe: WormExeIcon,
  ghostvpn: GhostVpnIcon,
  prog_netscan: ProgramChipIcon,
  prog_trace_wiper: ProgramChipIcon,
}

export function MarketItemIcon({ itemId, size = 48, className = '' }) {
  const Icon = MARKET_ICON_MAP[itemId] || GenericMarketIcon
  return (
    <span
      className={`market-icon-wrap ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon />
    </span>
  )
}

export default MarketItemIcon
