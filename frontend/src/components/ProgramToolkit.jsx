import { useLanguage } from '../i18n/LanguageProvider'
import './ProgramToolkit.css'

/**
 * Boîte à outils — programmes installés et inventaire numérique.
 */
export default function ProgramToolkit({ toolkit, onRun, compact = false }) {
  const { t } = useLanguage()

  if (!toolkit) return null

  const { installed = [], inventory = [], installedCount, inventoryCount } = toolkit

  if (compact) {
    return (
      <div className="ptoolkit ptoolkit--compact">
        <div className="ptoolkit__row">
          <span>{t('toolkit.programsPath')}</span>
          <strong>{installedCount ?? installed.length}</strong>
        </div>
        <div className="ptoolkit__row">
          <span>{t('toolkit.inventoryPath')}</span>
          <strong>{inventoryCount ?? inventory.reduce((n, i) => n + (i.quantity || 1), 0)}</strong>
        </div>
      </div>
    )
  }

  return (
    <div className="ptoolkit">
      <section className="ptoolkit__section">
        <h3 className="ptoolkit__heading">{t('toolkit.programsHeading')}</h3>
        {installed.length === 0 ? (
          <p className="ptoolkit__empty">{t('toolkit.programsEmpty')}</p>
        ) : (
          <ul className="ptoolkit__list">
            {installed.map((prog) => (
              <li key={prog.programId} className="ptoolkit__item ptoolkit__item--installed">
                <span className="ptoolkit__icon">⚙</span>
                <div className="ptoolkit__info">
                  <span className="ptoolkit__name">{prog.filename}</span>
                  <span className="ptoolkit__meta">{prog.name} · {t('toolkit.permanent')}</span>
                </div>
                {onRun && (
                  <button
                    type="button"
                    className="ptoolkit__run"
                    onClick={() => onRun(`run ${prog.filename}`)}
                    title={`run ${prog.filename}`}
                  >
                    {t('toolkit.run')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ptoolkit__section">
        <h3 className="ptoolkit__heading">{t('toolkit.inventoryHeading')}</h3>
        {inventory.length === 0 ? (
          <p className="ptoolkit__empty">{t('toolkit.inventoryEmpty')}</p>
        ) : (
          <ul className="ptoolkit__list">
            {inventory.map((prog) => (
              <li key={prog.programId} className={`ptoolkit__item ptoolkit__item--${prog.rarity}`}>
                <span className="ptoolkit__icon">💾</span>
                <div className="ptoolkit__info">
                  <span className="ptoolkit__name">
                    {prog.filename}
                    {prog.quantity > 1 && <span className="ptoolkit__qty"> x{prog.quantity}</span>}
                  </span>
                  <span className="ptoolkit__meta">
                    {prog.type === 'permanent' ? t('toolkit.toInstall') : t('toolkit.consumable')}
                  </span>
                </div>
                {onRun && (
                  <button
                    type="button"
                    className="ptoolkit__run"
                    onClick={() => onRun(`run ${prog.filename}`)}
                    title={`run ${prog.filename}`}
                  >
                    {t('toolkit.run')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
