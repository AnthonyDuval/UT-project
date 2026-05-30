import { useCallback, useEffect, useMemo, useState } from 'react'
import { buyMarketItem, fetchInventory, fetchMarket, useInventoryItem } from '../api/client'
import { MarketItemIcon } from './icons/MarketItemIcons'
import { useLanguage } from '../i18n/LanguageProvider'
import { localizeMarketItem } from '../i18n/locales'
import Inventory from './Inventory'
import './BlackMarket.css'

function ZoomIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="black-market__zoom-svg">
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 15 L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 7 V13 M7 10 H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ItemDetailModal({ item, bittek, inventoryQty, onClose, onBuy, onUse, loading, disabled, t }) {
  if (!item) return null

  const canAfford = bittek >= item.price
  const owned = !item.can_buy || inventoryQty > 0
  const canUse = inventoryQty > 0 && !item.isProgram && item.type !== 'passive'

  const handleAction = () => {
    if (canUse) onUse(item.id)
    else if (item.can_buy && canAfford) onBuy(item.id)
  }

  const actionLabel = canUse
    ? t('market.use')
    : !item.can_buy
      ? t('market.alreadyOwned')
      : item.isProgram
        ? t('market.download')
        : t('market.buy')

  const actionDisabled =
    disabled ||
    loading ||
    (canUse ? false : !item.can_buy || !canAfford)

  return (
    <div className="black-market__detail-overlay" onClick={onClose} role="presentation">
      <article
        className={`black-market__detail black-market__detail--${item.rarity}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bm-detail-title"
      >
        <button type="button" className="black-market__detail-close" onClick={onClose} aria-label={t('missionJournal.close')}>
          ×
        </button>

        <div className="black-market__detail-icon">
          <MarketItemIcon itemId={item.id} size={96} />
        </div>

        <div className="black-market__detail-body">
          <span className={`black-market__rarity black-market__rarity--${item.rarity}`}>
            {t(`market.rarity.${item.rarity}`) || item.rarity}
          </span>
          <h3 id="bm-detail-title" className="black-market__detail-name">
            {item.name}
            {item.isProgram && <span className="black-market__program-tag">.EXE</span>}
          </h3>
          <p className="black-market__detail-price">{item.price} BitTek</p>

          <div className="black-market__detail-block">
            <span className="black-market__detail-label">{t('market.effect')}</span>
            <p>{item.effect}</p>
          </div>

          <div className="black-market__detail-block black-market__detail-block--lore">
            <span className="black-market__detail-label">{t('market.lore')}</span>
            <p>{item.description}</p>
          </div>

          {inventoryQty > 0 && (
            <p className="black-market__detail-stock">{t('market.stock', { qty: inventoryQty })}</p>
          )}

          <button
            type="button"
            className="black-market__detail-action"
            onClick={handleAction}
            disabled={actionDisabled}
          >
            {actionLabel}
          </button>
        </div>
      </article>
    </div>
  )
}

/**
 * Application BLACK MARKET — boutique clandestine anti-trace.
 */
export default function BlackMarket({ gameState, onStateUpdate, onTerminalAppend, disabled }) {
  const { t } = useLanguage()
  const [catalog, setCatalog] = useState(null)
  const [inventoryData, setInventoryData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [detailItem, setDetailItem] = useState(null)

  const novaRevealed = !!gameState?.novaIntroSeen

  const localizedItems = useMemo(() => {
    const items = catalog?.items ?? []
    return items.map((item) => localizeMarketItem(item, t, novaRevealed))
  }, [catalog?.items, t, novaRevealed])

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

  const getInventoryQty = (itemId) => {
    const inv = inventoryData?.inventory ?? gameState?.inventory ?? []
    return inv.find((e) => e.itemId === itemId)?.quantity ?? 0
  }

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
      setDetailItem(null)
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
      await loadMarket()
      setDetailItem(null)
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
          <span className="black-market__lock-icon">⛔</span>
          <h2>{t('market.lockedTitle')}</h2>
          <p>{t('market.lockedBody')}</p>
          <p className="black-market__hint">{t('market.lockedHint')}</p>
        </div>
      </div>
    )
  }

  const bittek = catalog?.bittek ?? gameState.player.bittek

  return (
    <div className="black-market">
      <header className="black-market__header">
        <div>
          <h2 className="black-market__title">{t('market.lockedTitle')}</h2>
          <p className="black-market__subtitle">{t('market.subtitle')}</p>
        </div>
        <div className="black-market__balance">
          <span>{t('market.balance')}</span>
          <strong>{bittek} ₿</strong>
        </div>
      </header>

      {error && <div className="black-market__alert black-market__alert--error">{error}</div>}
      {success && <div className="black-market__alert black-market__alert--success">{success}</div>}

      {gameState.traceReductionPassive > 0 && (
        <div className="black-market__passive">
          {t('market.passive', { value: gameState.traceReductionPassive })}
        </div>
      )}

      <div className="black-market__grid">
        {localizedItems.map((item) => {
          const qty = getInventoryQty(item.id)
          const canAfford = bittek >= item.price

          return (
            <article
              key={item.id}
              className={`black-market__card black-market__card--${item.rarity}`}
            >
              <div className="black-market__card-visual">
                <MarketItemIcon itemId={item.id} size={56} />
                <button
                  type="button"
                  className="black-market__zoom-btn"
                  onClick={() => setDetailItem(item)}
                  aria-label={`${t('market.inspect')} ${item.name}`}
                  title={t('market.inspect')}
                >
                  <ZoomIcon />
                </button>
              </div>

              <div className="black-market__card-top">
                <span className={`black-market__rarity black-market__rarity--${item.rarity}`}>
                  {t(`market.rarity.${item.rarity}`) || item.rarity}
                </span>
                <span className="black-market__price">{item.price} ₿</span>
              </div>

              <h3 className="black-market__item-name">
                {item.name}
                {item.isProgram && <span className="black-market__program-tag">.EXE</span>}
              </h3>

              <p className="black-market__effect">{item.effect}</p>

              <button
                type="button"
                className="black-market__buy-btn"
                onClick={() => handleBuy(item.id)}
                disabled={disabled || loading || !item.can_buy || !canAfford}
              >
                {!item.can_buy
                  ? (item.mission_limit_reached ? t('market.missionLimit') : t('market.owned'))
                  : item.isProgram ? t('market.download') : t('market.buy')}
              </button>
            </article>
          )
        })}
      </div>

      <Inventory
        inventory={inventoryData?.inventory ?? gameState.inventory}
        activeEffects={inventoryData?.activeEffects ?? gameState.activeEffects}
        onUse={handleUse}
        loading={loading || disabled}
        error={null}
      />

      {detailItem && (
        <ItemDetailModal
          item={localizeMarketItem(detailItem, t, novaRevealed)}
          bittek={bittek}
          inventoryQty={getInventoryQty(detailItem.id)}
          onClose={() => setDetailItem(null)}
          onBuy={handleBuy}
          onUse={handleUse}
          loading={loading}
          disabled={disabled}
          t={t}
        />
      )}
    </div>
  )
}
