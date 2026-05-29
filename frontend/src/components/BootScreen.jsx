import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'
import './BootScreen.css'

/**
 * Séquence de boot cinématique plein écran.
 */
export default function BootScreen({ onComplete }) {
  const { locale, localeCode, localeLabel, t } = useLanguage()
  const [visibleLines, setVisibleLines] = useState([])
  const [phase, setPhase] = useState('logo')
  const [progress, setProgress] = useState(0)

  const bootSequence = useMemo(() => t.raw('boot.sequence') || [], [t, locale])

  const localeLines = useMemo(
    () => [
      {
        text: t('boot.detectedLocale', { code: localeCode }),
        delay: 2550,
        className: 'boot-ok boot-locale',
      },
      {
        text: t('boot.interfaceLanguage', { label: localeLabel }),
        delay: 2680,
        className: 'boot-ok boot-locale',
      },
    ],
    [t, localeCode, localeLabel, locale],
  )

  const fullSequence = useMemo(() => {
    const merged = [...bootSequence]
    merged.splice(7, 0, ...localeLines)
    return merged
  }, [bootSequence, localeLines])

  useEffect(() => {
    const timers = []

    timers.push(setTimeout(() => setPhase('lines'), 1200))

    fullSequence.forEach((line) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines((prev) => [...prev, line])
        }, 1200 + line.delay),
      )
    })

    timers.push(setTimeout(() => setPhase('done'), 1200 + 5400))

    const progInterval = setInterval(() => {
      setProgress((p) => Math.min(100, p + 2))
    }, 100)

    timers.push(
      setTimeout(() => {
        clearInterval(progInterval)
        setProgress(100)
        setTimeout(onComplete, 600)
      }, 1200 + 5600),
    )

    return () => {
      timers.forEach(clearTimeout)
      clearInterval(progInterval)
    }
  }, [onComplete, fullSequence])

  return (
    <div className={`boot-screen boot-screen--${phase}`}>
      <div className="boot-screen__scanlines" />
      <div className="boot-screen__noise" />

      <div className="boot-screen__logo-wrap">
        <div className="boot-screen__logo">◈</div>
        <h1 className="boot-screen__title">ULTRATECH</h1>
        <p className="boot-screen__subtitle">ONLINE</p>
      </div>

      <div className="boot-screen__console">
        {visibleLines.map((line, i) => (
          <div
            key={i}
            className={`boot-screen__line boot-screen__line--${line.className || 'default'}`}
          >
            {line.text}
          </div>
        ))}
        {phase === 'lines' && <span className="boot-screen__cursor">▌</span>}
      </div>

      <div className="boot-screen__progress">
        <div className="boot-screen__progress-bar" style={{ width: `${progress}%` }} />
        <span className="boot-screen__progress-text">{progress}%</span>
      </div>
    </div>
  )
}
