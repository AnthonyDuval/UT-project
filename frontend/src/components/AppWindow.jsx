import './AppWindow.css'

/**
 * Fenêtre OS générique pour les applications du bureau.
 */
export default function AppWindow({ title, children, onClose, active, variant = 'default' }) {
  if (!active) return null

  return (
    <div className={`app-window app-window--${variant}`}>
      <div className="app-window__header">
        <div className="app-window__dots">
          <span className="dot dot--red" onClick={onClose} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClose()} />
          <span className="dot dot--yellow" />
          <span className="dot dot--green" />
        </div>
        <span className="app-window__title">{title}</span>
      </div>
      <div className="app-window__body">{children}</div>
    </div>
  )
}
