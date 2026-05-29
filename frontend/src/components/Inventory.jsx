import './Inventory.css'

/**
 * Inventaire du joueur — objets consommables et effets actifs.
 */
export default function Inventory({ inventory, activeEffects, onUse, loading, error }) {
  return (
    <div className="inventory">
      <h3 className="inventory__title">INVENTAIRE</h3>

      {error && <div className="inventory__error">{error}</div>}

      {activeEffects?.length > 0 && (
        <div className="inventory__effects">
          <span className="inventory__effects-label">Effets actifs</span>
          {activeEffects.map((fx, i) => (
            <div key={i} className="inventory__effect">
              <span>{fx.label || fx.type}</span>
              {fx.usesLeft != null && (
                <span className="inventory__effect-uses">{fx.usesLeft} charge(s)</span>
              )}
            </div>
          ))}
        </div>
      )}

      {inventory?.length > 0 ? (
        <ul className="inventory__list">
          {inventory.map((item) => (
            <li key={item.itemId} className="inventory__item">
              <div className="inventory__item-info">
                <span className={`inventory__rarity inventory__rarity--${item.rarity}`}>
                  {item.name}
                </span>
                {item.quantity > 1 && (
                  <span className="inventory__qty">x{item.quantity}</span>
                )}
                <p className="inventory__item-effect">{item.effect}</p>
              </div>
              <button
                className="inventory__use-btn"
                onClick={() => onUse(item.itemId)}
                disabled={loading}
              >
                Utiliser
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="inventory__empty">Aucun objet en stock.</p>
      )}
    </div>
  )
}
