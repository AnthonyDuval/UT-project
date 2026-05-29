import './TraceBar.css'
import { useLanguage } from '../i18n/LanguageProvider'

/**
 * Jauge UltraTech Trace — niveau de traque du joueur (0–100 %).
 */
export default function TraceBar({ level = 0, gameOver = false }) {
  const { t } = useLanguage()
  const clamped = Math.min(100, Math.max(0, level))
  const isGameOver = gameOver || clamped >= 100
  const isGlitch = clamped >= 70 || isGameOver
  const isCritical = clamped >= 85 || isGameOver
  const intensity = isGameOver
    ? 'gameover'
    : clamped >= 85
      ? 'critical'
      : clamped >= 70
        ? 'high'
        : clamped >= 60
          ? 'medium'
          : clamped >= 30
            ? 'low'
            : 'minimal'

  return (
    <div
      className={`trace-bar trace-bar--${intensity} ${isGlitch ? 'trace-bar--glitch' : ''} ${isCritical ? 'trace-bar--critical' : ''} ${isGameOver ? 'trace-bar--gameover' : ''}`}
    >
      <div className="trace-bar__header">
        <span className="trace-bar__label">{t('traceBar.label')}</span>
        <span className="trace-bar__value">{isGameOver ? '100%' : `${clamped}%`}</span>
      </div>
      <div className="trace-bar__track">
        <div
          className="trace-bar__fill"
          style={{ width: isGameOver ? '100%' : `${clamped}%` }}
          role="progressbar"
          aria-valuenow={isGameOver ? 100 : clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('traceBar.aria', { level: isGameOver ? 100 : clamped })}
        />
        {isGlitch && <div className="trace-bar__glitch-overlay" aria-hidden="true" />}
      </div>
    </div>
  )
}
