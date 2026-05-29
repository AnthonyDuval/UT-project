import TraceBar from './TraceBar'
import './TopBar.css'

/**
 * Barre supérieure — stats joueur, mission active et jauge de traque.
 */
export default function TopBar({ state, onReset, onLogout, username }) {
  const player = state?.player
  const mission = state?.missions?.signal_fantome
  const traceLevel = state?.traceLevel ?? 0

  const missionLabel = mission?.completed
    ? 'Signal Fantôme ✓'
    : 'Signal Fantôme'

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__logo">◈</span>
        <span className="topbar__title">ULTRATECH ONLINE</span>
      </div>

      <div className="topbar__stats">
        <div className="topbar__stat">
          <span className="topbar__stat-label">BitTek</span>
          <span className="topbar__stat-value topbar__stat-value--accent">
            {player?.bittek ?? 0} ₿
          </span>
        </div>

        <div className="topbar__stat">
          <span className="topbar__stat-label">Réputation</span>
          <span className="topbar__stat-value">{player?.reputation ?? 0}</span>
        </div>

        <div className="topbar__stat topbar__stat--mission">
          <span className="topbar__stat-label">Mission</span>
          <span
            className={`topbar__stat-value ${
              mission?.completed ? 'topbar__stat-value--done' : ''
            }`}
          >
            {missionLabel}
          </span>
        </div>

        <TraceBar level={traceLevel} gameOver={state?.gameOver} />
      </div>

      <div className="topbar__actions">
        {username && (
          <span className="topbar__user">{username}</span>
        )}
        <button className="btn-logout" onClick={onLogout} title="Déconnexion">
          ⏻ Déconnexion
        </button>
        <button className="btn-reset" onClick={onReset} title="Reset sauvegarde">
          ↺ Reset Save
        </button>
      </div>
    </header>
  )
}
