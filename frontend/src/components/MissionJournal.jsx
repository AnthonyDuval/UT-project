import { useState } from 'react'
import './MissionJournal.css'

/**
 * Journal de missions — objectifs, progression, récompenses et historique.
 */
export default function MissionJournal({ journal, compact = false }) {
  const [showHistory, setShowHistory] = useState(false)

  if (!journal) {
    return (
      <div className="mjournal mjournal--empty">
        <span>Aucune donnée mission.</span>
      </div>
    )
  }

  const { currentMission, completedMissions = [], missions = [] } = journal
  const lockedMissions = missions.filter((m) => m.status === 'locked')

  if (compact) {
    return (
      <div className="mjournal mjournal--compact">
        {currentMission ? (
          <>
            <div className="mjournal__header">
              <span className="mjournal__subtitle">{currentMission.subtitle}</span>
              <span className="mjournal__badge mjournal__badge--active">ACTIVE</span>
            </div>
            <h3 className="mjournal__title">{currentMission.title}</h3>
            <p className="mjournal__objective">{currentMission.currentObjective}</p>
            <div className="mjournal__progress-bar">
              <div
                className="mjournal__progress-fill"
                style={{ width: `${(currentMission.progressRatio ?? 0) * 100}%` }}
              />
            </div>
            <span className="mjournal__progress-label">{currentMission.progress}</span>
          </>
        ) : (
          <p className="mjournal__none">Aucune mission active — infiltration libre.</p>
        )}
      </div>
    )
  }

  return (
    <div className="mjournal">
      <header className="mjournal__panel-header">
        <h2 className="mjournal__panel-title">JOURNAL DE MISSIONS</h2>
        <span className="mjournal__panel-sub">UltraTech — classification CLANDESTINE</span>
      </header>

      {currentMission && (
        <section className="mjournal__section mjournal__section--current">
          <div className="mjournal__section-head">
            <h3>MISSION ACTIVE</h3>
            <span className="mjournal__badge mjournal__badge--active">ACTIVE</span>
          </div>
          <p className="mjournal__mission-name">{currentMission.title}</p>
          <p className="mjournal__mission-desc">{currentMission.description}</p>

          {currentMission.primaryNode && (
            <p className="mjournal__node">
              Nœud cible : <strong>{currentMission.primaryNode}</strong>
            </p>
          )}

          <div className="mjournal__current-obj">
            <span className="mjournal__current-label">Objectif actuel</span>
            <p>{currentMission.currentObjective || 'Finalisation en cours…'}</p>
          </div>

          <div className="mjournal__progress-row">
            <span>Progression</span>
            <span className="mjournal__progress-label">{currentMission.progress}</span>
          </div>
          <div className="mjournal__progress-bar">
            <div
              className="mjournal__progress-fill"
              style={{ width: `${(currentMission.progressRatio ?? 0) * 100}%` }}
            />
          </div>

          <ul className="mjournal__objectives">
            {currentMission.objectives?.map((obj) => (
              <li key={obj.id} className={obj.done ? 'mjournal__obj--done' : ''}>
                <span className="mjournal__check">{obj.done ? '✓' : '○'}</span>
                <span>{obj.label}</span>
              </li>
            ))}
          </ul>

          {currentMission.rewardsPreview && (
            <div className="mjournal__rewards">
              <span className="mjournal__rewards-label">Récompenses prévues</span>
              <p>
                +{currentMission.rewardsPreview.bittek} BitTek · +{currentMission.rewardsPreview.reputation} Réputation
              </p>
              <p className="mjournal__rewards-summary">{currentMission.rewardsPreview.summary}</p>
            </div>
          )}
        </section>
      )}

      {!currentMission && completedMissions.length > 0 && (
        <p className="mjournal__none">Toutes les missions disponibles sont terminées.</p>
      )}

      {completedMissions.length > 0 && (
        <section className="mjournal__section">
          <button
            className="mjournal__history-toggle"
            onClick={() => setShowHistory((v) => !v)}
            type="button"
          >
            {showHistory ? '▾ Masquer l\'historique' : '▸ Missions terminées'} ({completedMissions.length})
          </button>

          {showHistory && (
            <ul className="mjournal__history">
              {completedMissions.map((m) => (
                <li key={m.id} className="mjournal__history-item">
                  <div className="mjournal__history-head">
                    <span>{m.title}</span>
                    <span className="mjournal__badge mjournal__badge--done">TERMINÉE</span>
                  </div>
                  <span className="mjournal__history-progress">{m.progress} objectifs</span>
                  <ul className="mjournal__history-objs">
                    {m.objectives?.filter((o) => o.done).map((o) => (
                      <li key={o.id}>✓ {o.label}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {lockedMissions.length > 0 && showHistory && (
        <section className="mjournal__section mjournal__section--locked">
          <h3 className="mjournal__locked-title">Missions verrouillées</h3>
          {lockedMissions.map((m) => (
            <p key={m.id} className="mjournal__locked-item">🔒 {m.title}</p>
          ))}
        </section>
      )}
    </div>
  )
}
