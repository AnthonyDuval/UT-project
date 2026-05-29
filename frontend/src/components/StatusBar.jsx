import Desktop from './Desktop'
import NetworkMap from './NetworkMap'
import MissionJournal from './MissionJournal'
import ProgramToolkit from './ProgramToolkit'
import { getMissionObjective, getThreatLevel } from '../utils/missionHints'
import './StatusBar.css'

/**
 * Panneau opérateur — avatar, menace, objectif, fichiers cliquables, apps.
 */
export default function StatusBar({
  state,
  onFileOpen,
  onOpenApp,
  onRunProgram,
  openApps,
  marketUnlocked,
}) {
  if (!state) return null

  const { player, visible_files, events_log, traceLevel, network, missionJournal } = state
  const currentMission = missionJournal?.currentMission
  const objective = getMissionObjective(state)
  const threat = getThreatLevel(traceLevel ?? 0)
  const nodeMeta = network?.currentNodeMeta
  const isConnected = network?.connected
  const traceMult = network?.traceMultiplier ?? 1

  return (
    <div className="statusbar">
      {/* Objectif actuel */}
      <div className="statusbar__objective">
        <h2 className="statusbar__objective-label">OBJECTIF ACTUEL</h2>
        <p className="statusbar__objective-title">{objective.title}</p>
        <p className="statusbar__objective-hint">{objective.hint}</p>
      </div>

      {/* Avatar opérateur */}
      <div className="statusbar__operator">
        <div className="statusbar__avatar">
          <div className="statusbar__avatar-ring" />
          <span className="statusbar__avatar-icon">👤</span>
          <span className="statusbar__avatar-status" />
        </div>
        <div className="statusbar__operator-info">
          <span className="statusbar__operator-id">{player.username}</span>
          <span className="statusbar__operator-role">Opérateur clandestin</span>
        </div>
      </div>

      {/* Stats vitales */}
      <div className="statusbar__stats-grid">
        <div className="statusbar__stat-card">
          <span className="statusbar__stat-label">BitTek</span>
          <span className="statusbar__stat-value statusbar__stat-value--bittek">
            {player.bittek} ₿
          </span>
        </div>
        <div className="statusbar__stat-card">
          <span className="statusbar__stat-label">Réputation</span>
          <span className="statusbar__stat-value">{player.reputation}</span>
        </div>
        <div className="statusbar__stat-card">
          <span className="statusbar__stat-label">Menace UT</span>
          <span className={`statusbar__stat-value statusbar__threat statusbar__threat--${threat.className}`}>
            {threat.label}
          </span>
        </div>
        <div className="statusbar__stat-card">
          <span className="statusbar__stat-label">Réseau</span>
          <span className={`statusbar__stat-value statusbar__stat-value--net ${isConnected ? 'statusbar__stat-value--connected' : ''}`}>
            {state.gameOver ? 'COMPROMIS' : isConnected ? nodeMeta?.name : 'LOCAL'}
          </span>
        </div>
      </div>

      {/* Section réseau */}
      <div className="statusbar__section statusbar__section--network">
        <h2 className="statusbar__heading">NETWORK</h2>
        <div className="statusbar__network-info">
          <div className="statusbar__network-row">
            <span>Nœud</span>
            <span className="statusbar__network-value">{nodeMeta?.name ?? 'LOCAL'}</span>
          </div>
          <div className="statusbar__network-row">
            <span>Sécurité</span>
            <span className={`statusbar__security statusbar__security--${(nodeMeta?.securityLevel ?? 'LOW').toLowerCase()}`}>
              {nodeMeta?.securityLevel ?? 'LOW'}
            </span>
          </div>
          <div className="statusbar__network-row">
            <span>Connexion</span>
            <span className={isConnected ? 'statusbar__conn--active' : 'statusbar__conn--idle'}>
              {isConnected ? '● CONNECTÉ' : '○ LOCAL'}
            </span>
          </div>
          <div className="statusbar__network-row">
            <span>Trace mult.</span>
            <span className="statusbar__network-value">x{traceMult}</span>
          </div>
        </div>
        <NetworkMap network={network} />
      </div>

      {/* Activité UltraTech */}
      <div className={`statusbar__ut-activity statusbar__ut-activity--${threat.className}`}>
        <span className="statusbar__ut-dot" />
        <span>
          UltraTech : {traceLevel >= 70 ? 'SURVEILLANCE ACTIVE' : 'Monitoring passif'} — {traceLevel ?? 0}%
        </span>
      </div>

      {/* Mission active */}
      <div className="statusbar__section statusbar__section--mission">
        <h2 className="statusbar__heading">MISSION</h2>
        <MissionJournal journal={missionJournal} compact />
        {currentMission && (
          <button
            className="statusbar__journal-btn"
            onClick={() => onOpenApp?.('journal')}
            type="button"
          >
            Voir le journal complet →
          </button>
        )}
      </div>

      {state.marketUnlocked && (
        <div className="statusbar__section">
          <h2 className="statusbar__heading">BLACK MARKET</h2>
          <span className="statusbar__badge statusbar__badge--market">ACCÈS ACTIF</span>
          {state.traceReductionPassive > 0 && (
            <p className="statusbar__passive">Passif : -{state.traceReductionPassive}% trace</p>
          )}
        </div>
      )}

      {/* Boîte à outils */}
      <div className="statusbar__section statusbar__section--toolkit">
        <h2 className="statusbar__heading">BOÎTE À OUTILS</h2>
        <ProgramToolkit toolkit={state.programToolkit} compact />
        {state.unlocked_commands?.includes('run') ? (
          <button
            type="button"
            className="statusbar__journal-btn"
            onClick={() => onOpenApp?.('toolkit')}
          >
            Gérer les programmes →
          </button>
        ) : (
          <p className="statusbar__toolkit-hint">Lisez toolkit_manifest.txt</p>
        )}
      </div>

      {/* Fichiers interactifs */}
      <div className="statusbar__section statusbar__section--files">
        <h2 className="statusbar__heading">FICHIERS</h2>
        <ul className="statusbar__files">
          {visible_files?.length > 0 ? (
            visible_files.map((file) => (
              <li key={file}>
                <button
                  className="statusbar__file"
                  onClick={() => onFileOpen?.(file)}
                  title={`open ${file}`}
                >
                  <span className="statusbar__file-icon">📁</span>
                  <span className="statusbar__file-name">{file}</span>
                  <span className="statusbar__file-action">OPEN</span>
                </button>
              </li>
            ))
          ) : (
            <li className="statusbar__file statusbar__file--empty">Aucun fichier</li>
          )}
        </ul>
      </div>

      {events_log?.length > 0 && (
        <div className="statusbar__section">
          <h2 className="statusbar__heading">ÉVÉNEMENTS</h2>
          <ul className="statusbar__events">
            {events_log.slice(-4).map((event, i) => (
              <li key={i} className="statusbar__event">{event}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Apps bureau */}
      <div className="statusbar__apps">
        <h2 className="statusbar__heading">APPLICATIONS</h2>
        <Desktop
          openApps={openApps}
          onOpenApp={onOpenApp}
          marketUnlocked={marketUnlocked}
          compact
        />
      </div>
    </div>
  )
}
