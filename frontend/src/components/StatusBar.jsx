import { getMissionObjective } from '../utils/missionHints'
import { computeUiProgression } from '../utils/uiProgression'
import { useLanguage } from '../i18n/LanguageProvider'
import { JournalBiosIcon, MarketBiosIcon, BrokerBiosIcon, CodexBiosIcon } from './icons/BiosNavIcons'
import './icons/BiosNavIcons.css'
import './StatusBar.css'

/**
 * Panneau latéral — objectif narratif et documents, sans tutoriel technique.
 */
export default function StatusBar({
  state,
  onFileOpen,
  onOpenApp,
}) {
  const { t, locale } = useLanguage()

  if (!state) return null

  const ui = computeUiProgression(state)
  const { visible_files } = state
  const objective = getMissionObjective(state, locale)

  return (
    <div className={`statusbar ${ui.earlyGame ? 'statusbar--minimal' : ''}`}>
      <div className="statusbar__objective">
        <h2 className="statusbar__objective-label">{t('statusbar.currentLead')}</h2>
        <p className="statusbar__objective-title">{objective.title}</p>
        <p className="statusbar__objective-hint">{objective.hint}</p>
      </div>

      <div className="statusbar__section statusbar__section--files">
        <h2 className="statusbar__heading">{t('statusbar.documents')}</h2>
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
            <li className="statusbar__file statusbar__file--empty">{t('statusbar.noDocuments')}</li>
          )}
        </ul>
      </div>

      {ui.showTrace && (
        <div className="statusbar__intro-panel statusbar__intro-panel--trace">
          <span className="statusbar__intro-dot" />
          <div>
            <strong>{t('statusbar.surveillance')}</strong>
            <p>{t('statusbar.surveillanceHint', { level: state.traceLevel ?? 0 })}</p>
          </div>
        </div>
      )}

      {ui.showNetwork && (
        <div className="statusbar__section statusbar__section--network-compact">
          <h2 className="statusbar__heading">{t('statusbar.network')}</h2>
          <p className="statusbar__network-simple">
            {state.network?.connected
              ? t('statusbar.connected', { node: state.network.currentNodeMeta?.name })
              : t('statusbar.signals', { count: state.network?.nodes?.length ?? 0 })}
          </p>
        </div>
      )}

      {ui.showJournal && (
        <div className="statusbar__section">
          <button
            type="button"
            className="bios-nav-btn bios-nav-btn--journal"
            onClick={() => onOpenApp?.('journal')}
          >
            <span className="bios-nav-icon bios-nav-icon--journal">
              <JournalBiosIcon />
            </span>
            <span className="bios-nav-btn__label">{t('statusbar.missionJournal')}</span>
            <span className="bios-nav-btn__arrow" aria-hidden>→</span>
          </button>
        </div>
      )}

      {ui.showMarket && (
        <div className="statusbar__section">
          <button
            type="button"
            className="bios-nav-btn bios-nav-btn--market"
            onClick={() => onOpenApp?.('market')}
          >
            <span className="bios-nav-icon bios-nav-icon--market">
              <MarketBiosIcon />
            </span>
            <span className="bios-nav-btn__label">{t('statusbar.blackMarket')}</span>
            <span className="bios-nav-btn__arrow" aria-hidden>→</span>
          </button>
        </div>
      )}

      {ui.showBroker && (
        <div className="statusbar__section">
          <button
            type="button"
            className="bios-nav-btn bios-nav-btn--broker"
            onClick={() => onOpenApp?.('broker')}
          >
            <span className="bios-nav-icon bios-nav-icon--broker">
              <BrokerBiosIcon />
            </span>
            <span className="bios-nav-btn__label">{t('statusbar.ghostBroker')}</span>
            <span className="bios-nav-btn__arrow" aria-hidden>→</span>
          </button>
        </div>
      )}

      {ui.showCodex && (
        <div className="statusbar__section">
          <button
            type="button"
            className="bios-nav-btn bios-nav-btn--codex"
            onClick={() => onOpenApp?.('codex')}
          >
            <span className="bios-nav-icon bios-nav-icon--codex">
              <CodexBiosIcon />
            </span>
            <span className="bios-nav-btn__label">
              {t('statusbar.codex')}
              <span className="bios-nav-btn__meta">{t('statusbar.codexProgress', { progress: state.codex?.progressLabel ?? '0/18' })}</span>
            </span>
            <span className="bios-nav-btn__arrow" aria-hidden>→</span>
          </button>
        </div>
      )}
    </div>
  )
}
