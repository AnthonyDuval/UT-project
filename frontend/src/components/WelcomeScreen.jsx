import { useLanguage } from '../i18n/LanguageProvider'
import './WelcomeScreen.css'

/**
 * Écran d'accueil — portail clandestin avant ouverture du terminal.
 */
export default function WelcomeScreen({ loading, onOpenBeta, onReset, onOpenSettings }) {
  const { t } = useLanguage()

  return (
    <div className="welcome">
      <div className="welcome__immersion" aria-hidden="true">
        <div className="welcome__grid" />
        <div className="welcome__scanlines" />
        <div className="welcome__vignette" />
      </div>

      <div className="welcome__container">
        <header className="welcome__header">
          <div className="welcome__sigil" aria-hidden="true">
            <span className="welcome__sigil-ring" />
            <span className="welcome__sigil-core">◈</span>
          </div>
          <h1 className="welcome__title">ULTRATECH ONLINE</h1>
          <p className="welcome__subtitle">{t('welcome.subtitle')}</p>
        </header>

        <div className="welcome__actions">
          <button
            type="button"
            className="welcome__btn welcome__btn--primary"
            onClick={onOpenBeta}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="welcome__btn-pulse" aria-hidden="true" />
                {t('welcome.loading')}
              </>
            ) : (
              t('welcome.openBeta')
            )}
          </button>

          <button
            type="button"
            className="welcome__btn welcome__btn--reset"
            onClick={onReset}
            disabled={loading}
          >
            {t('welcome.reset')}
          </button>
        </div>

        <footer className="welcome__footer">
          <button
            type="button"
            className="welcome__cfg-btn"
            onClick={onOpenSettings}
            disabled={loading}
          >
            {t('topbar.settings')}
          </button>
          <span className="welcome__status">
            <span className="welcome__status-dot" aria-hidden="true" />
            {t('welcome.footer')}
          </span>
        </footer>
      </div>
    </div>
  )
}
