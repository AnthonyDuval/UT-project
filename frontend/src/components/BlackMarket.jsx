import { useCallback, useEffect, useState } from 'react'
import { buyMarketItem, fetchInventory, fetchMarket, useInventoryItem } from '../api/client'
import Inventory from './Inventory'
import './BlackMarket.css'

const RARITY_LABELS = {
  common: 'Commun',
  uncommon: 'Peu commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
}

/**
 * Application BLACK MARKET — boutique clandestine anti-trace.
 */
export default function BlackMarket({ gameState, onStateUpdate, onTerminalAppend, disabled }) {
  const [catalog, setCatalog] = useState(null)
  const [inventoryData, setInventoryData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const loadMarket = useCallback(async () => {
    try {
      const [market, inv] = await Promise.all([fetchMarket(), fetchInventory()])
      setCatalog(market)
      setInventoryData(inv)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    if (gameState?.marketUnlocked) {
      loadMarket()
    }
  }, [gameState?.marketUnlocked, gameState?.player?.bittek, loadMarket])

  const handleBuy = async (itemId) => {
    if (disabled || loading) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await buyMarketItem(itemId)
      onStateUpdate(result.state)
      setInventoryData(result.inventory)
      setSuccess(result.message)
      if (onTerminalAppend) onTerminalAppend(result.message)
      await loadMarket()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUse = async (itemId) => {
    if (disabled || loading) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await useInventoryItem(itemId)
      onStateUpdate(result.state)
      setInventoryData(result.inventory)
      setSuccess(result.message)
      if (result.output && onTerminalAppend) {
        result.output.forEach((line) => onTerminalAppend(line))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!gameState?.marketUnlocked) {
    return (
      <div className="black-market black-market--locked">
        <div className="black-market__lock">
          <span className="black-market__lock-icon">🔒</span>
          <h2>BLACK MARKET</h2>
          <p>Accès verrouillé.</p>
          <p className="black-market__hint">
            Terminez la Mission 1 ou découvrez <code>market://blacknode</code> dans les fichiers.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="black-market">
      <header className="black-market__header">
        <div>
          <h2 className="black-market__title">BLACK MARKET</h2>
          <p className="black-market__subtitle">Node clandestin — outils anti-trace</p>
        </div>
        <div className="black-market__balance">
          <span>Solde</span>
          <strong>{catalog?.bittek ?? gameState.player.bittek} ₿</strong>
        </div>
      </header>

      {error && <div className="black-market__alert black-market__alert--error">{error}</div>}
      {success && <div className="black-market__alert black-market__alert--success">{success}</div>}

      {gameState.traceReductionPassive > 0 && (
        <div className="black-market__passive">
          Passif actif : -{gameState.traceReductionPassive}% sur les augmentations de TRACE
        </div>
      )}

      <div className="black-market__grid">
        {catalog?.items?.map((item) => (
          <article
            key={item.id}
            className={`black-market__card black-market__card--${item.rarity}`}
          >
            <div className="black-market__card-top">
              <span className={`black-market__rarity black-market__rarity--${item.rarity}`}>
                {RARITY_LABELS[item.rarity] || item.rarity}
              </span>
              <span className="black-market__price">{item.price} ₿</span>
            </div>
            <h3 className="black-market__item-name">
              {item.name}
              {item.isProgram && <span className="black-market__program-tag">.EXE</span>}
            </h3>
            <p className="black-market__desc">{item.description}</p>
            <p className="black-market__effect">{item.effect}</p>
            <button
              className="black-market__buy-btn"
              onClick={() => handleBuy(item.id)}
              disabled={disabled || loading || !item.can_buy || (catalog?.bittek ?? 0) < item.price}
            >
              {!item.can_buy ? 'Déjà possédé' : item.isProgram ? 'Télécharger' : 'Acheter'}
            </button>
          </article>
        ))}
      </div>

      <Inventory
        inventory={inventoryData?.inventory ?? gameState.inventory}
        activeEffects={inventoryData?.activeEffects ?? gameState.activeEffects}
        onUse={handleUse}
        loading={loading || disabled}
        error={null}
      />
    </div>
  )
}
