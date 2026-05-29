import { useLanguage } from '../i18n/LanguageProvider'
import './SettingsPanel.css'

/**
 * Paramètres discrets — style BIOS / terminal clandestin.
 */
export default function SettingsPanel({ open, onClose }) {
  const { locale, setLocale, t, localeCode } = useLanguage()

  if (!open) return null

  const handleSelect = (code) => {
    setLocale(code)
  }

  return (
    <div className="settings" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <button type="button" className="settings__backdrop" onClick={onClose} aria-label={t('settings.close')} />
      <div className="settings__panel">
        <header className="settings__header">
          <span className="settings__stamp">SYS · CFG · v0.1</span>
          <h2 id="settings-title">{t('settings.title')}</h2>
          <p className="settings__subtitle">{t('settings.subtitle')}</p>
          <button type="button" className="settings__close" onClick={onClose} aria-label={t('settings.close')}>
            ×
          </button>
        </header>

        <section className="settings__section">
          <span className="settings__label">{t('settings.langLabel')}</span>
          <div className="settings__lang-row">
            <button
              type="button"
              className={`settings__lang-btn ${locale === 'fr' ? 'settings__lang-btn--active' : ''}`}
              onClick={() => handleSelect('fr')}
            >
              <span className="settings__lang-code">LANG : FR</span>
              <span className="settings__lang-name">{t('settings.lang.fr')}</span>
            </button>
            <button
              type="button"
              className={`settings__lang-btn ${locale === 'en' ? 'settings__lang-btn--active' : ''}`}
              onClick={() => handleSelect('en')}
            >
              <span className="settings__lang-code">LANG : EN</span>
              <span className="settings__lang-name">{t('settings.lang.en')}</span>
            </button>
          </div>
          <p className="settings__current">
            {t('settings.langCurrent', { code: localeCode })}
            {' · '}
            {t('settings.saved')}
          </p>
        </section>

        <footer className="settings__footer">
          <span className="settings__note">{t('settings.coreNote')}</span>
        </footer>
      </div>
    </div>
  )
}
