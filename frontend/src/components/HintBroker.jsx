import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buyHint, fetchHintBroker } from '../api/client'
import { useLanguage } from '../i18n/LanguageProvider'
import { localizeHintEntry } from '../i18n/locales'
import './HintBroker.css'

function playRevealBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 640
    gain.gain.value = 0.035
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12)
    osc.stop(ctx.currentTime + 0.12)
    setTimeout(() => ctx.close(), 200)
  } catch {
    /* audio optional */
  }
}

function BrokerPortrait() {
  return (
    <div className="hint-broker__portrait" aria-hidden>
      <svg viewBox="0 0 64 64" className="hint-broker__portrait-svg">
        <rect x="8" y="8" width="48" height="48" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <rect x="20" y="22" width="6" height="4" fill="currentColor" opacity="0.8" />
        <rect x="38" y="22" width="6" height="4" fill="currentColor" opacity="0.8" />
        <path d="M24 40 Q32 36 40 40" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M12 14 H52 M14 50 H50" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
      </svg>
      <div className="hint-broker__portrait-glitch" />
    </div>
  )
}

function TypewriterReveal({ text, onComplete }) {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    indexRef.current = 0
    playRevealBeep()

    const tick = () => {
      indexRef.current += 1
      setDisplayed(text.slice(0, indexRef.current))
      if (indexRef.current >= text.length) {
        onComplete?.()
        return
      }
      setTimeout(tick, 18 + Math.random() * 22)
    }

    const start = setTimeout(tick, 280)
    return () => clearTimeout(start)
  }, [text, onComplete])

  return (
    <p className="hint-broker__reveal-text">
      {displayed}
      <span className="hint-broker__cursor" aria-hidden>|</span>
    </p>
  )
}

function RevealModal({ entry, onClose, t }) {
  const [done, setDone] = useState(false)

  return (
    <div className="hint-broker__reveal-overlay" onClick={onClose} role="presentation">
      <article className="hint-broker__reveal" onClick={(e) => e.stopPropagation()} role="dialog">
        <header className="hint-broker__reveal-head">
          <span className={`hint-broker__type hint-broker__type--${entry.type}`}>
            {entry.typeLabel || t(`hintBroker.types.${entry.type}`)}
          </span>
          <h3>{entry.title}</h3>
          <button type="button" className="hint-broker__reveal-close" onClick={onClose} aria-label={t('hintBroker.close')}>
            ×
          </button>
        </header>
        <TypewriterReveal text={entry.text} onComplete={() => setDone(true)} />
        {done && (
          <button type="button" className="hint-broker__reveal-ok" onClick={onClose}>
            {t('hintBroker.archived')}
          </button>
        )}
      </article>
    </div>
  )
}

/**
 * GHOST BROKER — opérateur clandestin vendant indices contre BitTek.
 */
export default function HintBroker({ gameState, onStateUpdate, disabled }) {
  const { t } = useLanguage()
  const [broker, setBroker] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [revealEntry, setRevealEntry] = useState(null)

  const novaRevealed = !!gameState?.novaIntroSeen

  const loadBroker = useCallback(async () => {
    try {
      const data = await fetchHintBroker()
      setBroker(data)
      if (data?.state) onStateUpdate?.(data.state)
    } catch (err) {
      setError(err.message)
    }
  }, [onStateUpdate])

  useEffect(() => {
    if (gameState?.hintBroker?.unlocked) loadBroker()
  }, [gameState?.hintBroker?.unlocked, gameState?.player?.bittek, loadBroker])

  const catalog = broker?.catalog ?? gameState.hintBroker?.catalog ?? []
  const history = broker?.history ?? gameState.hintBroker?.history ?? []

  const localizedCatalog = useMemo(
    () => catalog.map((entry) => localizeHintEntry(entry, t, novaRevealed)),
    [catalog, t, novaRevealed],
  )

  const localizedHistory = useMemo(
    () => history.map((entry) => localizeHintEntry(entry, t, novaRevealed)),
    [history, t, novaRevealed],
  )

  const handleBuy = async (hintId) => {
    if (disabled || loading) return
    setLoading(true)
    setError(null)
    try {
      const result = await buyHint(hintId)
      onStateUpdate(result.state)
      setBroker(result.broker)
      setRevealEntry(localizeHintEntry(result.hint, t, novaRevealed))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!gameState?.hintBroker?.unlocked) {
    return (
      <div className="hint-broker hint-broker--locked">
        <div className="hint-broker__lock">
          <span className="hint-broker__lock-icon">⛔</span>
          <h2>{t('hintBroker.lockedTitle')}</h2>
          <p>{t('hintBroker.lockedBody')}</p>
          <p className="hint-broker__lock-hint">{t('hintBroker.lockedHint')}</p>
        </div>
      </div>
    )
  }

  const bittek = broker?.bittek ?? gameState.player?.bittek ?? 0
  const available = localizedCatalog.filter((h) => h.canBuy)

  return (
    <div className="hint-broker">
      <header className="hint-broker__header">
        <BrokerPortrait />
        <div className="hint-broker__header-text">
          <span className="hint-broker__tag">{t('hintBroker.tag')}</span>
          <h2 className="hint-broker__title">GHOST BROKER</h2>
          <p className="hint-broker__subtitle">{t('hintBroker.quote')}</p>
        </div>
        <div className="hint-broker__balance">
          <span>{t('hintBroker.balance')}</span>
          <strong>{bittek} ₿</strong>
        </div>
      </header>

      {error && <div className="hint-broker__alert">{error}</div>}

      <section className="hint-broker__section">
        <h3 className="hint-broker__section-title">{t('hintBroker.available')}</h3>
        {available.length === 0 ? (
          <p className="hint-broker__empty">{t('hintBroker.empty')}</p>
        ) : (
          <div className="hint-broker__grid">
            {available.map((item) => (
              <article key={item.id} className={`hint-broker__card hint-broker__card--${item.type}`}>
                <div className="hint-broker__card-top">
                  <span className={`hint-broker__type hint-broker__type--${item.type}`}>
                    {t(`hintBroker.types.${item.type}`)}
                  </span>
                  <span className="hint-broker__price">{item.price} ₿</span>
                </div>
                <h4 className="hint-broker__card-title">{item.title}</h4>
                <p className="hint-broker__teaser">{item.teaser}</p>
                <button
                  type="button"
                  className="hint-broker__buy-btn"
                  onClick={() => handleBuy(item.id)}
                  disabled={disabled || loading || bittek < item.price}
                >
                  {t('hintBroker.buyFragment')}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {localizedHistory.length > 0 && (
        <section className="hint-broker__section hint-broker__section--history">
          <h3 className="hint-broker__section-title">{t('hintBroker.history')}</h3>
          <ul className="hint-broker__history">
            {localizedHistory.map((entry) => (
              <li key={`${entry.id}-${entry.purchasedAt}`} className="hint-broker__history-item">
                <div className="hint-broker__history-head">
                  <span className={`hint-broker__type hint-broker__type--${entry.type}`}>
                    {entry.typeLabel || t(`hintBroker.types.${entry.type}`)}
                  </span>
                  <strong>{entry.title}</strong>
                </div>
                <p>{entry.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {revealEntry && (
        <RevealModal entry={revealEntry} onClose={() => setRevealEntry(null)} t={t} />
      )}
    </div>
  )
}
