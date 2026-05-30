import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'
import './TraceWarningModal.css'

const AUTO_DISMISS_MS = 8000
const ENTER_MS = 420

export default function TraceWarningModal({ warning, onDismiss }) {
  const { t } = useLanguage()
  const dismissedRef = useRef(false)
  const [phase, setPhase] = useState('hidden')

  const finish = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    setPhase('exit')
  }, [])

  const handleClosed = useCallback(() => {
    onDismiss?.()
  }, [onDismiss])

  useEffect(() => {
    if (!warning?.open) {
      dismissedRef.current = false
      setPhase('hidden')
      return undefined
    }

    dismissedRef.current = false
    setPhase('enter')

    const enterTimer = setTimeout(() => setPhase('visible'), ENTER_MS)
    const autoTimer = setTimeout(finish, AUTO_DISMISS_MS)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(autoTimer)
    }
  }, [warning, finish])

  useEffect(() => {
    if (phase !== 'exit') return undefined
    const timer = setTimeout(handleClosed, 380)
    return () => clearTimeout(timer)
  }, [phase, handleClosed])

  if (!warning?.open && phase === 'hidden') return null

  const bodyLines = t.raw('traceWarning20.body') || []

  return (
    <div
      className={`trace-warning ${phase}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="trace-warning-title"
    >
      <div className="trace-warning__backdrop" aria-hidden="true" />
      <div className="trace-warning__scanlines" aria-hidden="true" />
      <div className="trace-warning__panel">
        <div className="trace-warning__header">
          <span className="trace-warning__seal">{t('traceWarning20.seal')}</span>
          <span className="trace-warning__badge">{t('traceWarning20.badge')}</span>
        </div>
        <div className="trace-warning__divider" aria-hidden="true" />
        <h2 id="trace-warning-title" className="trace-warning__title">
          {t('traceWarning20.title')}
        </h2>
        <div className="trace-warning__body">
          {bodyLines.map((line, i) => (
            <p key={i} className={line ? '' : 'trace-warning__gap'}>
              {line || '\u00A0'}
            </p>
          ))}
        </div>
        <div className="trace-warning__footer">
          <span className="trace-warning__trace">{t('traceWarning20.traceLevel')}</span>
          <button
            type="button"
            className="trace-warning__btn"
            onClick={finish}
          >
            {t('traceWarning20.acknowledge')}
          </button>
        </div>
      </div>
    </div>
  )
}
