import { useEffect, useMemo, useState } from 'react'
import './MysteryOverlay.css'

const HORROR_TYPES = new Set([
  'pixel_mass',
  'ultratech_watch',
  'horror_ambient',
  'phantom_node',
  'ghost_typing',
  'cursor_possession',
])

function buildPixelMass() {
  const pixels = []
  for (let i = 0; i < 48; i += 1) {
    pixels.push({
      id: i,
      x: 40 + Math.random() * 20,
      y: 38 + Math.random() * 24,
      size: 2 + Math.floor(Math.random() * 5),
      tone: Math.random() > 0.45 ? 'red' : 'black',
      delay: Math.random() * 0.25,
    })
  }
  return pixels
}

/**
 * Effets visuels subtils — glitches, scanlines, horreur psychologique, faux game over.
 */
export default function MysteryOverlay({ effect, onExpire }) {
  const [visible, setVisible] = useState(false)
  const [notify, setNotify] = useState(null)
  const [pixels, setPixels] = useState([])

  const isHorror = HORROR_TYPES.has(effect?.type) || effect?.type === 'fake_gameover'

  useEffect(() => {
    if (!effect?.type) {
      setVisible(false)
      setNotify(null)
      setPixels([])
      return undefined
    }

    setVisible(true)

    if (effect.type === 'corrupt_notify') {
      setNotify(effect.message || 'ANOMALIE SYSTÈME')
    }

    if (effect.type === 'pixel_mass') {
      setPixels(buildPixelMass())
    }

    const duration = effect.duration || 2500
    const timer = setTimeout(() => {
      setVisible(false)
      setNotify(null)
      setPixels([])
      onExpire?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [effect, onExpire])

  const watchText = useMemo(() => {
    const raw = effect?.message || 'ULTRATECH VOUS SURVEILLE'
    return raw.split('').map((ch, i) => (
      <span
        key={`${ch}-${i}`}
        className="mystery-watch__char"
        style={{ animationDelay: `${i * 0.04}s` }}
      >
        {ch === ' ' ? '\u00A0' : ch}
      </span>
    ))
  }, [effect?.message])

  if (!visible && !notify) return null

  const type = effect?.type || 'glitch'
  const overlayClass = [
    'mystery-overlay',
    `mystery-overlay--${type}`,
    isHorror ? 'mystery-overlay--horror' : '',
    visible ? 'mystery-overlay--visible' : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      {visible && type !== 'corrupt_notify' && (
        <div className={overlayClass} aria-hidden="true">
          {type === 'pixel_mass' && (
            <div className="mystery-pixel-mass">
              {pixels.map((p) => (
                <span
                  key={p.id}
                  className={`mystery-pixel mystery-pixel--${p.tone}`}
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: p.size,
                    height: p.size,
                    animationDelay: `${p.delay}s`,
                  }}
                />
              ))}
            </div>
          )}

          {type === 'ultratech_watch' && (
            <div className="mystery-watch">
              <p className="mystery-watch__text">{watchText}</p>
            </div>
          )}

          {type === 'phantom_node' && (
            <div className="mystery-phantom">
              <span className="mystery-phantom__node">██_VOID_RELAY</span>
            </div>
          )}

          {(type === 'horror_ambient' || type === 'ghost_typing' || type === 'cursor_possession') && (
            <div className="mystery-noise" aria-hidden="true" />
          )}
        </div>
      )}

      {type === 'fake_gameover' && visible && (
        <div className="mystery-fake-death mystery-fake-death--horror" aria-hidden="true">
          <span>GAME OVER</span>
          <span className="mystery-fake-death__sub">SESSION TERMINÉE</span>
          {effect?.traceLevel != null && (
            <span className="mystery-fake-death__trace">
              TRACE : {effect.traceLevel}% — CRITIQUE
            </span>
          )}
        </div>
      )}

      {notify && (
        <div className="mystery-notify mystery-notify--corrupt" role="status">
          <span className="mystery-notify__corrupt">⚠ {notify}</span>
        </div>
      )}
    </>
  )
}
