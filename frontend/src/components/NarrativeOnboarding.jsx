import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'
import { validatePlayerName } from '../utils/playerName'
import './NarrativeOnboarding.css'

const LORE_KEYS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
const TYPING_MS = 28
const LINE_PAUSE_MS = 420

export default function NarrativeOnboarding({ onComplete }) {
  const { t } = useLanguage()
  const [phase, setPhase] = useState('typing')
  const [lineIndex, setLineIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [glitch, setGlitch] = useState(true)

  const callerIds = useMemo(() => t.raw('onboarding.callerIds') || [], [t])
  const callerId = callerIds.length
    ? callerIds[Math.floor(Math.random() * callerIds.length)]
    : 'UNKNOWN_OPERATOR'

  const loreLines = useMemo(
    () => LORE_KEYS.map((key) => t(`onboarding.lore.${key}`)),
    [t],
  )

  const currentLine = loreLines[lineIndex] || ''
  const displayedLore = loreLines
    .slice(0, lineIndex)
    .concat(lineIndex < loreLines.length ? [currentLine.slice(0, charIndex)] : [])

  useEffect(() => {
    const timer = setTimeout(() => setGlitch(false), 480)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (phase !== 'typing') return undefined

    if (lineIndex >= loreLines.length) {
      const pause = setTimeout(() => setPhase('prompt'), LINE_PAUSE_MS)
      return () => clearTimeout(pause)
    }

    if (charIndex < currentLine.length) {
      const id = setTimeout(() => setCharIndex((c) => c + 1), TYPING_MS)
      return () => clearTimeout(id)
    }

    const id = setTimeout(() => {
      setLineIndex((i) => i + 1)
      setCharIndex(0)
    }, LINE_PAUSE_MS)
    return () => clearTimeout(id)
  }, [phase, lineIndex, charIndex, currentLine.length, loreLines.length])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    const result = validatePlayerName(name)
    if (!result.valid) {
      setError(t(`onboarding.errors.${result.error}`))
      return
    }
    onComplete?.(result.name)
  }, [name, onComplete, t])

  return (
    <div className={`narrative-onboarding ${glitch ? 'narrative-onboarding--glitch' : ''}`} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="narrative-onboarding__frame">
        <header className="narrative-onboarding__header">
          <span className="narrative-onboarding__live">{t('onboarding.live')}</span>
          <span className="narrative-onboarding__caller" id="onboarding-title">{callerId}</span>
        </header>

        <div className="narrative-onboarding__body">
          {displayedLore.map((line, i) => (
            <p key={`lore-${i}`} className="narrative-onboarding__line">{line}</p>
          ))}

          {phase === 'prompt' && (
            <>
              <p className="narrative-onboarding__line narrative-onboarding__line--prompt">
                {t('onboarding.namePrompt')}
              </p>
              <form className="narrative-onboarding__form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  className="narrative-onboarding__input"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null) }}
                  placeholder={t('onboarding.namePlaceholder')}
                  maxLength={20}
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />
                {error && <p className="narrative-onboarding__error">{error}</p>}
                <button type="submit" className="narrative-onboarding__submit">
                  {t('onboarding.confirm')}
                </button>
              </form>
            </>
          )}
        </div>

        <footer className="narrative-onboarding__footer">
          <span>{t('onboarding.footer')}</span>
        </footer>
      </div>
    </div>
  )
}
