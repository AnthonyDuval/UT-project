import { useCallback, useEffect, useRef, useState } from 'react'
import './NovaEncounter.css'

const NOVA_VIDEO_SRC = '/assets/videos/nova_intro.mp4'
const DEFAULT_VOLUME = 0.6

const NOVA_MESSAGE =
  'Bonjour, opérateur. Je suis Nova. Ne crains rien, je suis là pour t\'aider. Du moins je l\'espère.'

/**
 * Première manifestation N0VA — fenêtre intrusive, grande vidéo, son activé si possible.
 */
export default function NovaEncounter({ open, onDismiss, onInteract, onAppear }) {
  const [phase, setPhase] = useState('hidden')
  const [reply, setReply] = useState('')
  const [audioBlocked, setAudioBlocked] = useState(false)
  const inputRef = useRef(null)
  const videoRef = useRef(null)
  const dismissStartedRef = useRef(false)
  const appearNotifiedRef = useRef(false)

  useEffect(() => {
    if (open) {
      dismissStartedRef.current = false
      appearNotifiedRef.current = false
      setReply('')
      setAudioBlocked(false)
      setPhase('glitch-in')
      return undefined
    }
    setPhase('hidden')
    return undefined
  }, [open])

  useEffect(() => {
    if (phase !== 'glitch-in') return undefined
    const timer = setTimeout(() => setPhase('visible'), 420)
    return () => clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase === 'visible' && !appearNotifiedRef.current) {
      appearNotifiedRef.current = true
      onAppear?.()
    }
  }, [phase, onAppear])

  const tryPlayWithSound = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    video.volume = DEFAULT_VOLUME
    video.muted = false
    try {
      await video.play()
      setAudioBlocked(false)
    } catch {
      setAudioBlocked(true)
    }
  }, [])

  useEffect(() => {
    if (phase === 'visible') tryPlayWithSound()
  }, [phase, tryPlayWithSound])

  const beginDismiss = useCallback(() => {
    if (dismissStartedRef.current || phase === 'glitch-out' || phase === 'hidden') return
    dismissStartedRef.current = true
    onInteract?.()
    setPhase('glitch-out')
  }, [phase, onInteract])

  const handleGlitchEnd = useCallback((e) => {
    if (e.animationName !== 'nova-glitch-out') return
    if (phase !== 'glitch-out') return
    setPhase('hidden')
    onDismiss?.()
  }, [phase, onDismiss])

  const handleInputFocus = () => beginDismiss()

  const handleInputChange = (e) => {
    if (!dismissStartedRef.current && e.target.value.length > 0) beginDismiss()
    setReply(e.target.value)
  }

  const handleEnableAudio = () => {
    tryPlayWithSound()
  }

  if (!open && phase === 'hidden') return null

  return (
    <div
      className={`nova-encounter ${phase !== 'hidden' ? `nova-encounter--${phase}` : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nova-encounter-title"
      onAnimationEnd={handleGlitchEnd}
    >
      <div className="nova-encounter__backdrop" aria-hidden="true" />

      <div className="nova-encounter__window">
        <header className="nova-encounter__header">
          <span className="nova-encounter__signal" aria-hidden="true" />
          <div className="nova-encounter__header-text">
            <span className="nova-encounter__tag">CANAL PRIORITAIRE — INTRUSION DÉTECTÉE</span>
            <h2 id="nova-encounter-title">N0VA</h2>
          </div>
          <span className="nova-encounter__status">● LIVE</span>
        </header>

        <div className="nova-encounter__body">
          <div className="nova-encounter__media">
            <div className="nova-encounter__video-wrap">
              <video
                ref={videoRef}
                className="nova-encounter__video"
                src={NOVA_VIDEO_SRC}
                autoPlay
                loop
                playsInline
                preload="auto"
              />
              <div className="nova-encounter__video-scan" aria-hidden="true" />
              <div className="nova-encounter__video-noise" aria-hidden="true" />
            </div>

            {audioBlocked && (
              <button
                type="button"
                className="nova-encounter__audio-btn"
                onClick={handleEnableAudio}
              >
                Activer le signal audio
              </button>
            )}
          </div>

          <div className="nova-encounter__panel">
            <p className="nova-encounter__message">{NOVA_MESSAGE}</p>

            <label className="nova-encounter__reply-label" htmlFor="nova-reply">
              Répondre
            </label>
            <input
              ref={inputRef}
              id="nova-reply"
              className="nova-encounter__reply"
              type="text"
              value={reply}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder="Répondre..."
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        </div>

        <footer className="nova-encounter__footer">
          <span>Origine : INCONNUE</span>
          <span>Chiffrement : PARTIEL</span>
          <span>Interface forcée</span>
        </footer>
      </div>
    </div>
  )
}
