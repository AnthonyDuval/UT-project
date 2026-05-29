import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import './AudioManager.css'
import { useLanguage } from '../i18n/LanguageProvider'

const AMBIENT_SRC = '/assets/audio/ambient_loop.mp3'
const DEFAULT_VOLUME = 0.18
const DUCK_VOLUME = 0.04
const FADE_IN_MS = 2800
const FADE_OUT_MS = 1200
const DUCK_MS = 700
const RESTORE_MS = 1400

const AudioContext = createContext(null)

function cancelFade(rafRef) {
  if (rafRef.current) {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }
}

function runFade(audio, rafRef, targetVolume, durationMs, onComplete) {
  cancelFade(rafRef)
  if (!audio) return

  const startVolume = audio.volume
  const startTime = performance.now()

  const step = (now) => {
    const progress = Math.min(1, (now - startTime) / durationMs)
    audio.volume = startVolume + (targetVolume - startVolume) * progress
    if (progress < 1) {
      rafRef.current = requestAnimationFrame(step)
    } else {
      rafRef.current = null
      onComplete?.()
    }
  }

  rafRef.current = requestAnimationFrame(step)
}

export function AudioProvider({ children }) {
  const audioRef = useRef(null)
  const fadeRef = useRef(null)
  const duckRef = useRef(false)
  const enabledRef = useRef(true)
  const startedRef = useRef(false)

  const [enabled, setEnabled] = useState(true)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    const audio = new Audio(AMBIENT_SRC)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0
    audioRef.current = audio

    return () => {
      cancelFade(fadeRef)
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [])

  const setVolume = useCallback((level) => {
    const audio = audioRef.current
    if (!audio) return
    const clamped = Math.max(0, Math.min(1, level))
    cancelFade(fadeRef)
    audio.volume = clamped
  }, [])

  const playAmbient = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !enabledRef.current) return

    startedRef.current = true
    setStarted(true)
    audio.volume = 0

    audio.play().then(() => {
      const target = duckRef.current ? DUCK_VOLUME : DEFAULT_VOLUME
      runFade(audio, fadeRef, target, FADE_IN_MS)
    }).catch(() => {
      /* autoplay blocked — user can toggle ON later */
    })
  }, [])

  const stopAmbient = useCallback((durationMs = FADE_OUT_MS) => {
    const audio = audioRef.current
    if (!audio) return

    runFade(audio, fadeRef, 0, durationMs, () => {
      audio.pause()
      audio.currentTime = 0
    })
  }, [])

  const fadeAmbient = useCallback((targetVolume, durationMs = FADE_IN_MS) => {
    const audio = audioRef.current
    if (!audio || !enabledRef.current) return
    if (audio.paused && targetVolume > 0) {
      audio.play().catch(() => {})
    }
    runFade(audio, fadeRef, targetVolume, durationMs)
  }, [])

  const duckAmbient = useCallback(() => {
    if (duckRef.current) return
    duckRef.current = true
    fadeAmbient(DUCK_VOLUME, DUCK_MS)
  }, [fadeAmbient])

  const restoreAmbient = useCallback(() => {
    if (!duckRef.current) return
    duckRef.current = false
    if (!enabledRef.current || !startedRef.current) return
    fadeAmbient(DEFAULT_VOLUME, RESTORE_MS)
  }, [fadeAmbient])

  const toggleAmbient = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      enabledRef.current = next

      if (!next) {
        stopAmbient(FADE_OUT_MS)
        return next
      }

      if (startedRef.current) {
        playAmbient()
      }
      return next
    })
  }, [playAmbient, stopAmbient])

  const value = useMemo(() => ({
    enabled,
    started,
    playAmbient,
    stopAmbient,
    fadeAmbient,
    duckAmbient,
    restoreAmbient,
    setVolume,
    toggleAmbient,
  }), [
    enabled,
    started,
    playAmbient,
    stopAmbient,
    fadeAmbient,
    duckAmbient,
    restoreAmbient,
    setVolume,
    toggleAmbient,
  ])

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const ctx = useContext(AudioContext)
  if (!ctx) {
    throw new Error('useAudio must be used within AudioProvider')
  }
  return ctx
}

/** Bouton discret Audio ON/OFF — coin de l'interface. */
export function AudioToggle({ className = '' }) {
  const { enabled, started, toggleAmbient } = useAudio()
  const { t } = useLanguage()

  if (!started) return null

  return (
    <button
      type="button"
      className={`audio-toggle ${enabled ? 'audio-toggle--on' : 'audio-toggle--off'} ${className}`.trim()}
      onClick={toggleAmbient}
      title={enabled ? t('audio.toggleOnTitle') : t('audio.toggleOffTitle')}
      aria-pressed={enabled}
      aria-label={enabled ? t('audio.toggleOnAria') : t('audio.toggleOffAria')}
    >
      <span className="audio-toggle__icon" aria-hidden="true">{enabled ? '♪' : '♪̸'}</span>
      <span className="audio-toggle__label">{enabled ? t('audio.on') : t('audio.off')}</span>
    </button>
  )
}

export { DEFAULT_VOLUME, DUCK_VOLUME }
