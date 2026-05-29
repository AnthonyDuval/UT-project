import './Desktop.css'

const APPS = [
  { id: 'terminal', name: 'Terminal', icon: '⌨', alwaysUnlocked: true },
  { id: 'chat', name: 'Canal', icon: '💬', alwaysUnlocked: true },
  { id: 'journal', name: 'Journal', icon: '📋', alwaysUnlocked: true },
  { id: 'toolkit', name: 'ToolKit', icon: '💾', alwaysUnlocked: true },
  { id: 'market', name: 'BLACK MARKET', icon: '🛒', requiresMarket: true },
]

/**
 * Lanceur d'applications — mode compact dans la sidebar.
 */
export default function Desktop({ openApps, onOpenApp, marketUnlocked, compact = false }) {
  return (
    <div className={`desktop-icons ${compact ? 'desktop-icons--compact' : ''}`}>
      {APPS.map((app) => {
        const locked = app.requiresMarket && !marketUnlocked
        const active = openApps.includes(app.id)

        return (
          <button
            key={app.id}
            className={`desktop-icons__app ${active ? 'desktop-icons__app--active' : ''} ${locked ? 'desktop-icons__app--locked' : ''}`}
            onClick={() => !locked && onOpenApp(app.id)}
            title={locked ? 'Verrouillé — terminez la Mission 1' : app.name}
            disabled={locked}
          >
            <span className="desktop-icons__icon">{locked ? '🔒' : app.icon}</span>
            <span className="desktop-icons__label">{app.name}</span>
          </button>
        )
      })}
    </div>
  )
}
