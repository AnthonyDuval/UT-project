import { getMissionObjective } from '../utils/missionHints'
import { computeUiProgression } from '../utils/uiProgression'
import './StatusBar.css'

/**
 * Panneau latéral — objectif narratif et documents, sans tutoriel technique.
 */
export default function StatusBar({
  state,
  onFileOpen,
  onOpenApp,
}) {
  if (!state) return null

  const ui = computeUiProgression(state)
  const { visible_files } = state
  const objective = getMissionObjective(state)

  return (
    <div className={`statusbar ${ui.earlyGame ? 'statusbar--minimal' : ''}`}>
      <div className="statusbar__objective">
        <h2 className="statusbar__objective-label">PISTE ACTUELLE</h2>
        <p className="statusbar__objective-title">{objective.title}</p>
        <p className="statusbar__objective-hint">{objective.hint}</p>
      </div>

      <div className="statusbar__section statusbar__section--files">
        <h2 className="statusbar__heading">DOCUMENTS</h2>
        <ul className="statusbar__files">
          {visible_files?.length > 0 ? (
            visible_files.map((file) => (
              <li key={file}>
                <button
                  className="statusbar__file"
                  onClick={() => onFileOpen?.(file)}
                  type="button"
                >
                  <span className="statusbar__file-icon">📄</span>
                  <span className="statusbar__file-name">{file}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="statusbar__file statusbar__file--empty">Aucun document</li>
          )}
        </ul>
      </div>

      {ui.showTrace && (
        <div className="statusbar__intro-panel statusbar__intro-panel--trace">
          <span className="statusbar__intro-dot" />
          <div>
            <strong>Surveillance UltraTech</strong>
            <p>{state.traceLevel ?? 0}% — restez discret</p>
          </div>
        </div>
      )}

      {ui.showNetwork && (
        <div className="statusbar__section statusbar__section--network-compact">
          <h2 className="statusbar__heading">RÉSEAU</h2>
          <p className="statusbar__network-simple">
            {state.network?.connected
              ? `Connecté · ${state.network.currentNodeMeta?.name}`
              : `${(state.network?.nodes?.length ?? 0)} signal(aux) détecté(s)`}
          </p>
        </div>
      )}

      {ui.showJournal && (
        <div className="statusbar__section">
          <button
            type="button"
            className="statusbar__journal-btn"
            onClick={() => onOpenApp?.('journal')}
          >
            Journal de missions →
          </button>
        </div>
      )}

      {ui.showMarket && (
        <div className="statusbar__section">
          <button
            type="button"
            className="statusbar__journal-btn statusbar__journal-btn--market"
            onClick={() => onOpenApp?.('market')}
          >
            Black Market →
          </button>
        </div>
      )}

      {ui.showCodex && (
        <div className="statusbar__section">
          <button
            type="button"
            className="statusbar__journal-btn statusbar__journal-btn--codex"
            onClick={() => onOpenApp?.('codex')}
          >
            Codex · {state.codex?.progressLabel ?? '0/18'} →
          </button>
        </div>
      )}
    </div>
  )
}
