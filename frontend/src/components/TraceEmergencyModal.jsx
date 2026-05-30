import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'
import {
  EMERGENCY_SCRAMBLER_COST,
  EMERGENCY_TIMEOUT_MS,
} from '../systems/traceEmergency75'
import './TraceEmergencyModal.css'

const ENTER_MS = 380

export default function TraceEmergencyModal({
  emergency,
  firewallCount,
  bittek,
  onChoice,
}) {
  const { t } = useLanguage()
  const resolvedRef = useRef(false)
  const [phase, setPhase] = useState('hidden')
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(EMERGENCY_TIMEOUT_MS / 1000))

  const canFirewall = firewallCount >= 1
  const canScrambler = bittek >= EMERGENCY_SCRAMBLER_COST

  const choose = useCallback((choice) => {
    if (resolvedRef.current) return
    resolvedRef.current = true
    setPhase('exit')
    onChoice?.(choice)
  }, [onChoice])

  useEffect(() => {
    if (!emergency?.open) {
      resolvedRef.current = false
      setPhase('hidden')
      setSecondsLeft(Math.ceil(EMERGENCY_TIMEOUT_MS / 1000))
      return undefined
    }

    resolvedRef.current = false
    setPhase('enter')
    const enterTimer = setTimeout(() => setPhase('visible'), ENTER_MS)
    return () => clearTimeout(enterTimer)
  }, [emergency])

  useEffect(() => {
    if (!emergency?.open || phase !== 'visible') return undefined

    const deadline = emergency.deadlineAt || ((emergency.startedAt || Date.now()) + EMERGENCY_TIMEOUT_MS)

    const tick = () => {
      const remaining = Math.max(0, deadline - Date.now())
      setSecondsLeft(Math.ceil(remaining / 1000))
      if (remaining <= 0) {
        choose('continue')
      }
    }

    tick()
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
  }, [emergency, phase, choose])

  if (!emergency?.open && phase === 'hidden') return null

  return (
    <div
      className={`trace-emergency ${phase}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trace-emergency-title"
    >
      <div className="trace-emergency__backdrop" aria-hidden="true" />
      <div className="trace-emergency__scanlines" aria-hidden="true" />
      <div className="trace-emergency__panel">
        <div className="trace-emergency__header">
          <span className="trace-emergency__seal">{t('traceEmergency75.seal')}</span>
          <span className="trace-emergency__timer">
            {t('traceEmergency75.timer', { seconds: secondsLeft })}
          </span>
        </div>
        <h2 id="trace-emergency-title" className="trace-emergency__title">
          {t('traceEmergency75.title')}
        </h2>
        <p className="trace-emergency__subtitle">{t('traceEmergency75.subtitle')}</p>

        <div className="trace-emergency__choices">
          <button
            type="button"
            className="trace-emergency__choice"
            disabled={!canFirewall}
            onClick={() => choose('firewall')}
          >
            <span className="trace-emergency__choice-label">
              {t('traceEmergency75.choices.firewall.label')}
            </span>
            <span className="trace-emergency__choice-effect">
              {t('traceEmergency75.choices.firewall.effect')}
            </span>
            {!canFirewall && (
              <span className="trace-emergency__choice-reason">
                {t('traceEmergency75.choices.firewall.unavailable')}
              </span>
            )}
          </button>

          <button
            type="button"
            className="trace-emergency__choice"
            disabled={!canScrambler}
            onClick={() => choose('scrambler')}
          >
            <span className="trace-emergency__choice-label">
              {t('traceEmergency75.choices.scrambler.label')}
            </span>
            <span className="trace-emergency__choice-effect">
              {t('traceEmergency75.choices.scrambler.effect', { cost: EMERGENCY_SCRAMBLER_COST })}
            </span>
            {!canScrambler && (
              <span className="trace-emergency__choice-reason">
                {t('traceEmergency75.choices.scrambler.unavailable', { cost: EMERGENCY_SCRAMBLER_COST })}
              </span>
            )}
          </button>

          <button
            type="button"
            className="trace-emergency__choice trace-emergency__choice--danger"
            onClick={() => choose('continue')}
          >
            <span className="trace-emergency__choice-label">
              {t('traceEmergency75.choices.continue.label')}
            </span>
            <span className="trace-emergency__choice-effect">
              {t('traceEmergency75.choices.continue.effect')}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
