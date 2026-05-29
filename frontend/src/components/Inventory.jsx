import { useLanguage } from '../i18n/LanguageProvider'
import { localizeMarketItem } from '../i18n/locales'
import './Inventory.css'

/**
 * Inventaire du joueur — objets consommables et effets actifs.
 */
export default function Inventory({ inventory, activeEffects, onUse, loading, error }) {
  const { t } = useLanguage()

  return (
    <div className="inventory">
      <h3 className="inventory__title">{t('inventory.title')}</h3>

      {error && <div className="inventory__error">{error}</div>}

      {activeEffects?.length > 0 && (
        <div className="inventory__effects">
          <span className="inventory__effects-label">{t('inventory.activeEffects')}</span>
          {activeEffects.map((fx, i) => (
            <div key={i} className="inventory__effect">
              <span>{fx.label || fx.type}</span>
              {fx.usesLeft != null && (
                <span className="inventory__effect-uses">
                  {t('inventory.charges', { count: fx.usesLeft })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {inventory?.length > 0 ? (
        <ul className="inventory__list">
          {inventory.map((item) => {
            const localized = localizeMarketItem(item, t)
            return (
              <li key={item.itemId} className="inventory__item">
                <div className="inventory__item-info">
                  <span className={`inventory__rarity inventory__rarity--${item.rarity}`}>
                    {localized.name}
                  </span>
                  {item.quantity > 1 && (
                    <span className="inventory__qty">x{item.quantity}</span>
                  )}
                  <p className="inventory__item-effect">{localized.effect}</p>
                </div>
                <button
                  className="inventory__use-btn"
                  onClick={() => onUse(item.itemId)}
                  disabled={loading}
                >
                  {t('inventory.use')}
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="inventory__empty">{t('inventory.empty')}</p>
      )}
    </div>
  )
}
