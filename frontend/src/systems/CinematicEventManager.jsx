import { useCallback, useEffect, useRef, useState } from 'react'
import { CINEMATIC_TYPES, CINEMATIC_VIDEOS } from './CinematicEventSystem'
import { useAudio } from './AudioManager'
import './CinematicEventManager.css'

export {
  triggerUltraTechTransmission,
  triggerVoidRelay,
  triggerSystemFailure,
} from './CinematicEventSystem'

const EVENT_COPY = {
  [CINEMATIC_TYPES.ULTRATECH_TRANSMISSION]: {
    tag: 'INTERCEPTION',
    title: 'ULTRATECH SECOPS',
    subtitle: 'Canal gouvernemental — lecture forcée',
    footer: 'Origine : UT-CORE · Chiffrement : TOTAL',
  },
  [CINEMATIC_TYPES.VOID_RELAY]: {
    tag: 'RELAY FANTÔME',
    title: '██ VOID RELAY',
    subtitle: 'Signal non répertorié — présence éphémère',
    footer: 'Coordonnées : CORROMPUES · TTL : INSTABLE',
  },
  [CINEMATIC_TYPES.SYSTEM_FAILURE]: {
    tag: 'KERNEL PANIC',
    title: 'SYSTEM FAILURE',
    subtitle: 'Arrêt d\'urgence du noyau terminal',
    footer: 'Stack trace effacée · Intégrité : INCONNUE',
  },
}

function CinematicShell({ event, phase, children, onClose }) {
  const copy = EVENT_COPY[event.type] || EVENT_COPY[CINEMATIC_TYPES.ULTRATECH_TRANSMISSION]
  const banner = event.bannerMessage || copy.tag

  return (
    <div
      className={[
        'cinematic-event',
        `cinematic-event--${event.type}`,
        `cinematic-event--${phase}`,
        event.glitchUi ? 'cinematic-event--glitch' : '',
        event.blackout ? 'cinematic-event--blackout-capable' : '',
      ].filter(Boolean).join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label={banner}
    >
      <div className="cinematic-event__backdrop" aria-hidden="true" />
      <div className="cinematic-event__scanlines" aria-hidden="true" />
      <div className="cinematic-event__vignette" aria-hidden="true" />

      <div className="cinematic-event__frame">
        <header className="cinematic-event__header">
          <span className="cinematic-event__tag">{copy.tag}</span>
          <div>
            <p className="cinematic-event__banner">{banner}</p>
            <h2 className="cinematic-event__title">{copy.title}</h2>
            <p className="cinematic-event__subtitle">{copy.subtitle}</p>
          </div>
          <div className="cinematic-event__header-actions">
            <span className="cinematic-event__live">● REC</span>
            <button
              type="button"
              className="cinematic-event__close-btn"
              onClick={onClose}
              aria-label="Fermer le signal"
            >
              fermer signal
            </button>
          </div>
        </header>

        {children}

        <footer className="cinematic-event__footer">
          <span>{copy.footer}</span>
        </footer>
      </div>
    </div>
  )
}

/**
 * Gestionnaire visuel des cinématiques événementielles — overlay vidéo immersif.
 */
export default function CinematicEventManager({ event, onComplete }) {
  const videoRef = useRef(null)
  const completedRef = useRef(false)
  const [phase, setPhase] = useState('hidden')
  const [blackout, setBlackout] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const { duckAmbient, restoreAmbient, fadeAmbient } = useAudio()

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
    if (!event) {
      setPhase('hidden')
      return undefined
    }

    completedRef.current = false
    setBlackout(false)
    setAudioBlocked(false)
    setPhase('glitch-in')

    duckAmbient()

    const enterTimer = setTimeout(() => setPhase('playing'), 420)
    return () => clearTimeout(enterTimer)
  }, [event, duckAmbient])

  useEffect(() => {
    if (phase !== 'exit') return undefined
    const timer = setTimeout(handleClosed, event?.blackout ? 900 : 480)
    return () => clearTimeout(timer)
  }, [phase, event, handleClosed])

  useEffect(() => {
    if (!event || phase !== 'playing') return undefined

    const maxTimer = setTimeout(finish, event.maxDurationMs || 12000)
    return () => clearTimeout(maxTimer)
  }, [event, phase, finish])

  const tryPlay = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    video.volume = event?.type === CINEMATIC_TYPES.SYSTEM_FAILURE ? 0.85 : 0.65
    video.muted = false
    try {
      await video.play()
      setAudioBlocked(false)
    } catch {
      setAudioBlocked(true)
    }
  }, [event])

  useEffect(() => {
    if (phase === 'playing') tryPlay()
  }, [phase, tryPlay])

  const handleVideoEnded = () => {
    if (event?.blackout) {
      setBlackout(true)
      fadeAmbient(0.02, 400)
      setTimeout(finish, 1400)
      return
    }
    finish()
  }

  if (!event || phase === 'hidden') return null

  const src = CINEMATIC_VIDEOS[event.type]

  return (
    <CinematicShell event={event} phase={phase} onClose={finish}>
      <div className={`cinematic-event__body ${blackout ? 'cinematic-event__body--blackout' : ''}`}>
        {!blackout && (
          <div className="cinematic-event__media">
            <video
              ref={videoRef}
              className="cinematic-event__video"
              src={src}
              autoPlay
              playsInline
              preload="auto"
              onEnded={handleVideoEnded}
            />
            <div className="cinematic-event__noise" aria-hidden="true" />
            <div className="cinematic-event__video-scan" aria-hidden="true" />
          </div>
        )}

        {blackout && (
          <div className="cinematic-event__crash">
            <span className="cinematic-event__crash-text">SYSTEM RESTORED</span>
            <span className="cinematic-event__crash-sub">Reconstruction du noyau en cours…</span>
          </div>
        )}

        {audioBlocked && !blackout && (
          <button type="button" className="cinematic-event__audio-btn" onClick={tryPlay}>
            Activer le signal
          </button>
        )}

        {event.lockTerminal && phase === 'playing' && !blackout && (
          <p className="cinematic-event__lock-notice">Terminal verrouillé — transmission en cours</p>
        )}
      </div>
    </CinematicShell>
  )
}
