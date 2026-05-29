import { useMemo, useState } from 'react'
import { MissionIcon } from './icons/MissionIcons'
import {
  getCurrentObjectiveId,
  getDiscoveredSuspectCommands,
  sortMissionsForDisplay,
} from '../utils/missionJournalUtils'
import { useLanguage } from '../i18n/LanguageProvider'
import {
  getCommandLabel,
  localizeJournal,
  parseRewardModules,
} from '../i18n/locales'
import { getMissionObjective } from '../utils/missionHints'
import './MissionJournal.css'

function ZoomIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="mjournal__zoom-svg">
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 15 L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 7 V13 M7 10 H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function StatusBadge({ status, t }) {
  const label = t(`missionJournal.status.${status}`) || status?.toUpperCase()
  return <span className={`mjournal__badge mjournal__badge--${status}`}>{label}</span>
}

function RewardModules({ rewardsPreview, t }) {
  const modules = parseRewardModules(rewardsPreview, t)
  if (!modules.length) return null

  return (
    <div className="mjournal__rewards">
      <span className="mjournal__rewards-label">{t('missionJournal.rewardsLabel')}</span>
      <div className="mjournal__rewards-grid">
        {modules.map((mod) => (
          <span key={mod.label} className={`mjournal__reward-chip mjournal__reward-chip--${mod.type}`}>
            {mod.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function ObjectivesList({ objectives, currentObjectiveId, compact = false, t }) {
  if (!objectives?.length) return null

  return (
    <ul className={`mjournal__objectives ${compact ? 'mjournal__objectives--compact' : ''}`}>
      {objectives.map((obj) => {
        const isCurrent = obj.id === currentObjectiveId && !obj.done
        return (
          <li
            key={obj.id}
            className={[
              obj.done ? 'mjournal__obj--done' : '',
              isCurrent ? 'mjournal__obj--current' : '',
            ].filter(Boolean).join(' ')}
          >
            <span className="mjournal__check" aria-hidden>
              {obj.done ? '☑' : '☐'}
            </span>
            <span>{obj.label}</span>
            {isCurrent && <span className="mjournal__obj-tag">{t('missionJournal.activeTag')}</span>}
          </li>
        )
      })}
    </ul>
  )
}

function MissionDetailModal({ mission, gameState, onClose, t }) {
  if (!mission) return null

  const currentObjectiveId = getCurrentObjectiveId(mission.objectives)
  const suspectCommands = getDiscoveredSuspectCommands(
    mission.id,
    gameState?.unlocked_commands ?? [],
  ).map(({ cmd }) => ({ cmd, label: getCommandLabel(cmd, t) }))
  const isLocked = mission.status === 'locked'

  return (
    <div className="mjournal__detail-overlay" onClick={onClose} role="presentation">
      <article
        className={`mjournal__detail mjournal__detail--${mission.status} mjournal__detail--${mission.id}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mj-detail-title"
      >
        <button type="button" className="mjournal__detail-close" onClick={onClose} aria-label={t('missionJournal.close')}>
          ×
        </button>

        <div className="mjournal__detail-icon">
          <MissionIcon missionId={mission.id} size={88} />
        </div>

        <div className="mjournal__detail-body">
          <div className="mjournal__detail-head">
            <span className="mjournal__dossier-ref">{mission.subtitle}</span>
            <StatusBadge status={mission.status} t={t} />
          </div>

          <h3 id="mj-detail-title" className="mjournal__detail-title">{mission.title}</h3>

          {!isLocked && (
            <>
              <p className="mjournal__detail-desc">{mission.description}</p>

              {mission.atmosphere && (
                <div className="mjournal__detail-block mjournal__detail-block--dread">
                  <span className="mjournal__detail-label">{t('missionJournal.analystNote')}</span>
                  <p>{mission.atmosphere}</p>
                </div>
              )}

              {mission.primaryNode && (
                <div className="mjournal__detail-block">
                  <span className="mjournal__detail-label">{t('missionJournal.targetNode')}</span>
                  <p className="mjournal__detail-node">{mission.primaryNode}</p>
                </div>
              )}

              {mission.status === 'active' && mission.currentObjective && (
                <div className="mjournal__detail-block mjournal__detail-block--hint">
                  <span className="mjournal__detail-label">{t('missionJournal.activeHint')}</span>
                  <p>{mission.currentObjective}</p>
                </div>
              )}

              <div className="mjournal__detail-progress">
                <span>{t('missionJournal.progress')}</span>
                <strong>{mission.progress}</strong>
              </div>
              <div className="mjournal__progress-bar mjournal__progress-bar--detail">
                <div
                  className="mjournal__progress-fill"
                  style={{ width: `${(mission.progressRatio ?? 0) * 100}%` }}
                />
              </div>

              <div className="mjournal__detail-block">
                <span className="mjournal__detail-label">{t('missionJournal.objectivesLabel')}</span>
                <ObjectivesList
                  objectives={mission.objectives}
                  currentObjectiveId={currentObjectiveId}
                  t={t}
                />
              </div>

              <RewardModules rewardsPreview={mission.rewardsPreview} t={t} />

              {suspectCommands.length > 0 && (
                <div className="mjournal__detail-block">
                  <span className="mjournal__detail-label">{t('missionJournal.suspectCommands')}</span>
                  <ul className="mjournal__commands">
                    {suspectCommands.map(({ cmd, label }) => (
                      <li key={cmd}><code>{label}</code></li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {isLocked && (
            <p className="mjournal__locked-msg">{t('missionJournal.lockedSealed')}</p>
          )}
        </div>
      </article>
    </div>
  )
}

function MissionCard({ mission, isHighlighted, onInspect, t }) {
  const isLocked = mission.status === 'locked'
  const currentObjectiveId = getCurrentObjectiveId(mission.objectives)

  return (
    <article
      className={[
        'mjournal__card',
        `mjournal__card--${mission.status}`,
        `mjournal__card--${mission.id}`,
        isHighlighted ? 'mjournal__card--highlight' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="mjournal__card-icon">
        <MissionIcon missionId={mission.id} size={52} />
      </div>

      <div className="mjournal__card-body">
        <div className="mjournal__card-top">
          <div>
            <span className="mjournal__dossier-ref">{mission.subtitle}</span>
            <h3 className="mjournal__card-title">{mission.title}</h3>
          </div>
          <StatusBadge status={mission.status} t={t} />
        </div>

        {!isLocked && (
          <>
            {mission.status === 'active' && mission.currentObjective && (
              <p className="mjournal__card-hint">{mission.currentObjective}</p>
            )}

            <div className="mjournal__card-progress">
              <span className="mjournal__progress-label">
                {t('missionJournal.objectivesCount', { progress: mission.progress })}
              </span>
              <div className="mjournal__progress-bar">
                <div
                  className="mjournal__progress-fill"
                  style={{ width: `${(mission.progressRatio ?? 0) * 100}%` }}
                />
              </div>
            </div>

            <ObjectivesList
              objectives={mission.objectives}
              currentObjectiveId={currentObjectiveId}
              compact
              t={t}
            />

            <RewardModules rewardsPreview={mission.rewardsPreview} t={t} />
          </>
        )}

        {isLocked && (
          <p className="mjournal__locked-msg">{t('missionJournal.lockedPrereq')}</p>
        )}
      </div>

      <button
        type="button"
        className="mjournal__zoom-btn"
        onClick={() => onInspect(mission)}
        aria-label={`${t('missionJournal.inspect')} ${mission.title}`}
        title={t('missionJournal.inspect')}
      >
        <ZoomIcon />
      </button>
    </article>
  )
}

/**
 * Journal de missions — dossier d'enquête UltraTech / BIOS clandestin.
 */
export default function MissionJournal({ journal, gameState, compact = false }) {
  const { t, locale } = useLanguage()
  const [detailMission, setDetailMission] = useState(null)

  const localized = useMemo(
    () => localizeJournal(journal, t, gameState),
    [journal, t, gameState],
  )

  const activeLead = useMemo(
    () => getMissionObjective(gameState, locale),
    [gameState, locale],
  )

  if (!localized) {
    return (
      <div className="mjournal mjournal--empty">
        <span>{t('missionJournal.empty')}</span>
      </div>
    )
  }

  const { currentMission, currentMissionId, missions = [] } = localized
  const sortedMissions = sortMissionsForDisplay(missions, currentMissionId)

  if (compact) {
    return (
      <div className="mjournal mjournal--compact">
        {currentMission ? (
          <>
            <div className="mjournal__header">
              <MissionIcon missionId={currentMission.id} size={32} />
              <div>
                <span className="mjournal__subtitle">{currentMission.subtitle}</span>
                <h3 className="mjournal__title">{currentMission.title}</h3>
              </div>
              <StatusBadge status="active" t={t} />
            </div>
            <div className="mjournal__active-lead">
              <span className="mjournal__active-lead-label">{t('missionJournal.activeLead')}</span>
              <strong>{activeLead.title}</strong>
              <p>{activeLead.hint}</p>
            </div>
            <p className="mjournal__objective">{currentMission.currentObjective}</p>
            <div className="mjournal__progress-bar">
              <div
                className="mjournal__progress-fill"
                style={{ width: `${(currentMission.progressRatio ?? 0) * 100}%` }}
              />
            </div>
            <span className="mjournal__progress-label">
              {t('missionJournal.objectivesCount', { progress: currentMission.progress })}
            </span>
          </>
        ) : (
          <p className="mjournal__none">{t('missionJournal.noActive')}</p>
        )}
      </div>
    )
  }

  return (
    <div className="mjournal">
      <header className="mjournal__panel-header">
        <div className="mjournal__panel-stamp">{t('missionJournal.stamp')}</div>
        <h2 className="mjournal__panel-title">{t('missionJournal.title')}</h2>
        <span className="mjournal__panel-sub">{t('missionJournal.subtitle')}</span>
      </header>

      {currentMission && (
        <div className="mjournal__active-banner">
          <span className="mjournal__active-dot" />
          <div>
            <span className="mjournal__active-label">{t('missionJournal.activeMission')}</span>
            <strong>{currentMission.title}</strong>
            <div className="mjournal__active-lead">
              <span className="mjournal__active-lead-label">{t('missionJournal.activeLead')}</span>
              <p>{activeLead.hint}</p>
            </div>
          </div>
        </div>
      )}

      {!currentMission && missions.every((m) => m.status === 'completed') && (
        <p className="mjournal__none">{t('missionJournal.allComplete')}</p>
      )}

      <section className="mjournal__grid">
        {sortedMissions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            isHighlighted={mission.id === currentMissionId}
            onInspect={setDetailMission}
            t={t}
          />
        ))}
      </section>

      {detailMission && (
        <MissionDetailModal
          mission={sortedMissions.find((m) => m.id === detailMission.id) || detailMission}
          gameState={gameState}
          onClose={() => setDetailMission(null)}
          t={t}
        />
      )}
    </div>
  )
}
