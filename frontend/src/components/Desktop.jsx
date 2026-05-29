import './Desktop.css'

const APPS = [
  { id: 'terminal', name: 'Terminal', icon: '⌨' },
  { id: 'journal', name: 'Journal', icon: '📋' },
  { id: 'chat', name: 'Canal', icon: '💬' },
  { id: 'toolkit', name: 'ToolKit', icon: '💾' },
  { id: 'codex', name: 'Codex', icon: '📜' },
  { id: 'market', name: 'BLACK MARKET', icon: '🛒' },
]

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
        return (
          <button
            key={app.id}
            type="button"
            className={`desktop-icons__app ${active ? 'desktop-icons__app--active' : ''}`}
            onClick={() => onOpenApp(app.id)}
            title={app.name}
          >
            <span className="desktop-icons__icon">{app.icon}</span>
            <span className="desktop-icons__label">{app.name}</span>
          </button>
        )
      })}
    </div>
  )
}
