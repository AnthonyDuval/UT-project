import { JournalBiosIcon, MarketBiosIcon, BrokerBiosIcon } from './icons/BiosNavIcons'
import './icons/BiosNavIcons.css'
import './Desktop.css'

const APPS = [
  { id: 'terminal', name: 'Terminal', icon: '⌨' },
  { id: 'journal', name: 'Journal', icon: 'bios-journal', label: 'Journal de missions' },
  { id: 'chat', name: 'Canal', icon: '💬' },
  { id: 'toolkit', name: 'ToolKit', icon: '💾' },
  { id: 'codex', name: 'Codex', icon: '📜' },
  { id: 'market', name: 'BLACK MARKET', icon: 'bios-market', label: 'Black Market' },
  { id: 'broker', name: 'GHOST BROKER', icon: 'bios-broker', label: 'Ghost Broker' },
]

function AppIcon({ app }) {
  if (app.icon === 'bios-journal') {
    return (
      <span className="desktop-icons__icon bios-nav-icon bios-nav-icon--journal">
        <JournalBiosIcon />
      </span>
    )
  }
  if (app.icon === 'bios-market') {
    return (
      <span className="desktop-icons__icon bios-nav-icon bios-nav-icon--market">
        <MarketBiosIcon />
      </span>
    )
  }
  if (app.icon === 'bios-broker') {
    return (
      <span className="desktop-icons__icon bios-nav-icon bios-nav-icon--broker">
        <BrokerBiosIcon />
      </span>
    )
  }
  return <span className="desktop-icons__icon">{app.icon}</span>
}

/**
 * Lanceur d'applications — débloqué progressivement.
 */
export default function Desktop({ openApps, onOpenApp, unlockedApps = ['terminal'], compact = false }) {
  const visible = APPS.filter((app) => unlockedApps.includes(app.id))

  if (visible.length <= 1) return null

  return (
    <div className={`desktop-icons ${compact ? 'desktop-icons--compact' : ''}`}>
      {visible.map((app) => {
        const active = openApps.includes(app.id)
        const isBios = app.icon === 'bios-journal' || app.icon === 'bios-market' || app.icon === 'bios-broker'

        return (
          <button
            key={app.id}
            type="button"
            className={[
              'desktop-icons__app',
              active ? 'desktop-icons__app--active' : '',
              isBios ? 'desktop-icons__app--bios' : '',
              app.icon === 'bios-journal' ? 'desktop-icons__app--journal' : '',
              app.icon === 'bios-market' ? 'desktop-icons__app--market' : '',
              app.icon === 'bios-broker' ? 'desktop-icons__app--broker' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onOpenApp(app.id)}
            title={app.label || app.name}
          >
            <AppIcon app={app} />
            <span className="desktop-icons__label">{app.label || app.name}</span>
          </button>
        )
      })}
    </div>
  )
}
