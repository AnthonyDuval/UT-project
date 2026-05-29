import TraceBar from './TraceBar'
import { computeUiProgression } from '../utils/uiProgression'
import { useLanguage } from '../i18n/LanguageProvider'
import './TopBar.css'

/**
 * Barre supérieure minimaliste — stats débloquées progressivement.
 */
export default function TopBar({ state, onReset, onOpenHowTo, onOpenSettings, username }) {
  const { t } = useLanguage()
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
              <span className="topbar__stat-label">{t('topbar.reputation')}</span>
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
          className="btn-settings"
          onClick={onOpenSettings}
          title={t('topbar.settingsTitle')}
          type="button"
        >
          {t('topbar.settings')}
        </button>
        <button
          className="btn-howto"
          onClick={onOpenHowTo}
          title={t('topbar.helpTitle')}
          type="button"
        >
          {t('topbar.help')}
        </button>
        <button className="btn-reset" onClick={onReset} title={t('topbar.resetTitle')} type="button">
          {t('topbar.reset')}
        </button>
      </div>
    </header>
  )
}
