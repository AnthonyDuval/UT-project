import TraceBar from './TraceBar'
import { computeUiProgression } from '../utils/uiProgression'
import './TopBar.css'

/**
 * Barre supérieure minimaliste — stats débloquées progressivement.
 */
export default function TopBar({ state, onReset, onOpenHowTo, username }) {
  const ui = computeUiProgression(state)
  const traceLevel = state?.traceLevel ?? 0

  return (
    <header className={`topbar ${ui.earlyGame ? 'topbar--minimal' : ''}`}>
      <div className="topbar__brand">
        <span className="topbar__logo">◈</span>
        <span className="topbar__title">ULTRATECH ONLINE</span>
      </div>

      {!ui.earlyGame && (
        <div className="topbar__stats">
          {ui.showBittek && (
            <div className="topbar__stat">
              <span className="topbar__stat-label">BitTek</span>
              <span className="topbar__stat-value topbar__stat-value--accent">
                {state?.player?.bittek ?? 0} ₿
              </span>
            </div>
          )}

          {ui.showReputation && (
            <div className="topbar__stat">
              <span className="topbar__stat-label">Réputation</span>
              <span className="topbar__stat-value">{state?.player?.reputation ?? 0}</span>
            </div>
          )}

          {ui.showTrace && (
            <TraceBar level={traceLevel} gameOver={state?.gameOver} />
          )}
        </div>
      )}

      <div className="topbar__actions">
        {username && !ui.earlyGame && (
          <span className="topbar__user">{username}</span>
        )}
        <button
          className="btn-howto"
          onClick={onOpenHowTo}
          title="Comment jouer"
          type="button"
        >
          ? Aide
        </button>
        <button className="btn-reset" onClick={onReset} title="Reset sauvegarde" type="button">
          ↺ Reset
        </button>
      </div>
    </header>
  )
}
