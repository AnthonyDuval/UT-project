import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'
import './MissionCleanupModal.css'

const AUTO_DISMISS_MS = 45000
const ENTER_MS = 380

export default function MissionCleanupModal({ cleanup, onChoice }) {
  const { t } = useLanguage()
  const resolvedRef = useRef(false)
  const [phase, setPhase] = useState('hidden')

  const choose = useCallback((choice) => {
    if (resolvedRef.current) return
    resolvedRef.current = true
    setPhase('exit')
    onChoice?.(choice)
  }, [onChoice])

  useEffect(() => {
    if (!cleanup?.open) {
      resolvedRef.current = false
      setPhase('hidden')
      return undefined
    }

    resolvedRef.current = false
    setPhase('enter')
    const enterTimer = setTimeout(() => setPhase('visible'), ENTER_MS)
    const autoTimer = setTimeout(() => choose('skip'), AUTO_DISMISS_MS)
    return () => {
      clearTimeout(enterTimer)
      clearTimeout(autoTimer)
    }
  }, [cleanup, choose])

  if (!cleanup?.open && phase === 'hidden') return null

  return (
    <div
      className={`mission-cleanup ${phase}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-cleanup-title"
    >
      <div className="mission-cleanup__backdrop" aria-hidden="true" />
      <div className="mission-cleanup__scanlines" aria-hidden="true" />
      <div className="mission-cleanup__panel">
        <div className="mission-cleanup__header">
          <span className="mission-cleanup__seal">{t('missionCleanup.seal')}</span>
        </div>
        <h2 id="mission-cleanup-title" className="mission-cleanup__title">
          {t('missionCleanup.title')}
        </h2>
        <p className="mission-cleanup__subtitle">{t('missionCleanup.subtitle')}</p>

        <div className="mission-cleanup__choices">
          <button type="button" className="mission-cleanup__choice" onClick={() => choose('bittek')}>
            <span className="mission-cleanup__choice-label">{t('missionCleanup.choices.bittek.label')}</span>
            <span className="mission-cleanup__choice-effect">{t('missionCleanup.choices.bittek.effect')}</span>
          </button>
          <button type="button" className="mission-cleanup__choice" onClick={() => choose('trace')}>
            <span className="mission-cleanup__choice-label">{t('missionCleanup.choices.trace.label')}</span>
            <span className="mission-cleanup__choice-effect">{t('missionCleanup.choices.trace.effect')}</span>
          </button>
          <button type="button" className="mission-cleanup__choice" onClick={() => choose('firewall')}>
            <span className="mission-cleanup__choice-label">{t('missionCleanup.choices.firewall.label')}</span>
            <span className="mission-cleanup__choice-effect">{t('missionCleanup.choices.firewall.effect')}</span>
          </button>
        </div>

        <button type="button" className="mission-cleanup__skip" onClick={() => choose('skip')}>
          {t('missionCleanup.skip')}
        </button>
      </div>
    </div>
  )
}
