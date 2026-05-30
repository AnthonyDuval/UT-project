import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'
import './TraceTriangulationModal.css'

const AUTO_DISMISS_MS = 8000
const ENTER_MS = 380
const GAUGE_TARGET = 50

export default function TraceTriangulationModal({ triangulation, onDismiss }) {
  const { t } = useLanguage()
  const dismissedRef = useRef(false)
  const rafRef = useRef(null)
  const [phase, setPhase] = useState('hidden')
  const [gaugeValue, setGaugeValue] = useState(0)

  const finish = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    setPhase('exit')
  }, [])

  const handleClosed = useCallback(() => {
    onDismiss?.()
  }, [onDismiss])

  useEffect(() => {
    if (!triangulation?.open) {
      dismissedRef.current = false
      setPhase('hidden')
      setGaugeValue(0)
      return undefined
    }

    dismissedRef.current = false
    setGaugeValue(0)
    setPhase('enter')

    const enterTimer = setTimeout(() => setPhase('visible'), ENTER_MS)
    const autoTimer = setTimeout(finish, AUTO_DISMISS_MS)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(autoTimer)
    }
  }, [triangulation, finish])

  useEffect(() => {
    if (!triangulation?.open || phase !== 'visible') return undefined

    const startedAt = triangulation.startedAt || Date.now()
    const duration = triangulation.animDurationMs || 6000

    const tick = () => {
      const elapsed = Date.now() - startedAt
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - (1 - progress) ** 2.2
      setGaugeValue(Math.round(eased * GAUGE_TARGET))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [triangulation, phase])

  useEffect(() => {
    if (phase !== 'exit') return undefined
    const timer = setTimeout(handleClosed, 380)
    return () => clearTimeout(timer)
  }, [phase, handleClosed])

  if (!triangulation?.open && phase === 'hidden') return null

  return (
    <div
      className={`trace-triangulation ${phase}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="trace-triangulation-title"
    >
      <div className="trace-triangulation__backdrop" aria-hidden="true" />
      <div className="trace-triangulation__scanlines" aria-hidden="true" />
      <div className="trace-triangulation__panel">
        <div className="trace-triangulation__header">
          <span className="trace-triangulation__seal">{t('traceTriangulation50.seal')}</span>
          <span className="trace-triangulation__badge">{t('traceTriangulation50.badge')}</span>
        </div>
        <h2 id="trace-triangulation-title" className="trace-triangulation__title">
          {t('traceTriangulation50.title')}
        </h2>
        <p className="trace-triangulation__subtitle">
          {t('traceTriangulation50.subtitle')}
        </p>
        <div className="trace-triangulation__gauge-wrap">
          <div className="trace-triangulation__gauge-label">
            <span>{t('traceTriangulation50.gaugeLabel')}</span>
            <span className="trace-triangulation__gauge-value">{gaugeValue}%</span>
          </div>
          <div className="trace-triangulation__gauge-track" aria-hidden="true">
            <div
              className="trace-triangulation__gauge-fill"
              style={{ width: `${gaugeValue}%` }}
            />
            <div className="trace-triangulation__gauge-marker" style={{ left: `${GAUGE_TARGET}%` }} />
          </div>
          <div className="trace-triangulation__gauge-scale">
            <span>0%</span>
            <span>{GAUGE_TARGET}%</span>
            <span>100%</span>
          </div>
        </div>
        <div className="trace-triangulation__footer">
          <span className="trace-triangulation__status">{t('traceTriangulation50.status')}</span>
          <button
            type="button"
            className="trace-triangulation__btn"
            onClick={finish}
          >
            {t('traceTriangulation50.dismiss')}
          </button>
        </div>
      </div>
    </div>
  )
}
