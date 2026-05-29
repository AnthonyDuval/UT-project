import { useLanguage } from '../i18n/LanguageProvider'
import './HowToPlayPanel.css'

/**
 * Panneau d'aide optionnel — ton enquête, pas tutoriel technique.
 */
export default function HowToPlayPanel({ open, onClose }) {
  const { t } = useLanguage()
  const steps = t.raw('howto.steps') || []

  if (!open) return null

  return (
    <div className="howto" role="dialog" aria-modal="true" aria-labelledby="howto-title">
      <button type="button" className="howto__backdrop" onClick={onClose} aria-label={t('howto.close')} />
      <div className="howto__panel">
        <header className="howto__header">
          <h2 id="howto-title">{t('howto.title')}</h2>
          <button type="button" className="howto__close" onClick={onClose} aria-label={t('howto.close')}>
            ✕
          </button>
        </header>

        <p className="howto__intro">{t('howto.intro')}</p>

        <ol className="howto__list">
          {steps.map((step, i) => (
            <li key={step.title} className="howto__item">
              <span className="howto__step-num">{i + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <footer className="howto__footer">
          <p>{t('howto.footer')}</p>
          <button type="button" className="howto__ok" onClick={onClose}>
            {t('howto.ok')}
          </button>
        </footer>
      </div>
    </div>
  )
}
