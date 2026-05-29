import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'
import { useAudio } from '../systems/AudioManager'
import './CharacterTransmission.css'

const DEFAULT_VOLUME = 0.55

/**
 * Fenêtre glitchée — transmission personnage brève, non intrusive.
 */
export default function CharacterTransmission({ transmission, onComplete }) {
  const { t } = useLanguage()
  const videoRef = useRef(null)
  const completedRef = useRef(false)
  const [phase, setPhase] = useState('hidden')
  const [audioBlocked, setAudioBlocked] = useState(false)
  const { duckAmbient, restoreAmbient } = useAudio()

  const finish = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    setPhase('exit')
  }, [])

  const handleClosed = useCallback(() => {
    restoreAmbient()
    onComplete?.()
  }, [onComplete, restoreAmbient])

  useEffect(() => {
    if (!transmission) {
      setPhase('hidden')
      return undefined
    }

    completedRef.current = false
    setAudioBlocked(false)
    setPhase('glitch-in')
    duckAmbient()

    const enterTimer = setTimeout(() => setPhase('visible'), 380)
    return () => clearTimeout(enterTimer)
  }, [transmission, duckAmbient])

  useEffect(() => {
    if (phase !== 'exit') return undefined
    const timer = setTimeout(handleClosed, 420)
    return () => clearTimeout(timer)
  }, [phase, handleClosed])

  useEffect(() => {
    if (!transmission || phase !== 'visible') return undefined
    const maxTimer = setTimeout(finish, transmission.durationMs || 10000)
    return () => clearTimeout(maxTimer)
  }, [transmission, phase, finish])

  const tryPlay = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    video.volume = DEFAULT_VOLUME
    video.muted = false
    try {
      await video.play()
      setAudioBlocked(false)
    } catch {
      video.muted = true
      try {
        await video.play()
      } catch {
        /* silent fallback */
      }
      setAudioBlocked(true)
    }
  }, [])

  useEffect(() => {
    if (phase === 'visible') tryPlay()
  }, [phase, tryPlay])

  if (!transmission || phase === 'hidden') return null

  const name = t(transmission.displayNameKey)
  const tag = t(transmission.tagKey)
  const message = t(transmission.messageKey)

  return (
    <div
      className={[
        'char-transmission',
        `char-transmission--${transmission.characterId}`,
        `char-transmission--${phase}`,
      ].join(' ')}
      role="dialog"
      aria-modal="false"
      aria-label={name}
    >
      <div className="char-transmission__backdrop" aria-hidden="true" />
      <div className="char-transmission__scanlines" aria-hidden="true" />

      <div className="char-transmission__frame">
        <header className="char-transmission__header">
          <span className="char-transmission__tag">{tag}</span>
          <div className="char-transmission__meta">
            <p className="char-transmission__name">{name}</p>
            <span className="char-transmission__live">{t('transmissions.ui.live')}</span>
          </div>
          <button
            type="button"
            className="char-transmission__cut"
            onClick={finish}
            aria-label={t('transmissions.ui.cutSignal')}
          >
            {t('transmissions.ui.cutSignal')}
          </button>
        </header>

        <div className="char-transmission__body">
          <div className="char-transmission__media">
            <video
              ref={videoRef}
              className="char-transmission__video"
              src={transmission.videoSrc}
              autoPlay
              playsInline
              muted
              preload="auto"
              loop
              onEnded={() => {}}
            />
            <div className="char-transmission__noise" aria-hidden="true" />
          </div>

          <p className="char-transmission__message">{message}</p>

          {audioBlocked && (
            <button type="button" className="char-transmission__audio-btn" onClick={tryPlay}>
              {t('transmissions.ui.enableAudio')}
            </button>
          )}
        </div>

        <footer className="char-transmission__footer">
          <span>{t('transmissions.ui.footer')}</span>
        </footer>
      </div>
    </div>
  )
}
