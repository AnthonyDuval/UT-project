import { useEffect, useState } from 'react'
import './MysteryOverlay.css'

/**
 * Effets visuels subtils — glitches, scanlines, faux game over, notifications corrompues.
 */
export default function MysteryOverlay({ effect, onExpire }) {
  const [visible, setVisible] = useState(false)
  const [notify, setNotify] = useState(null)

  useEffect(() => {
    if (!effect?.type) {
      setVisible(false)
      setNotify(null)
      return undefined
    }

    setVisible(true)

    if (effect.type === 'corrupt_notify') {
      setNotify(effect.message || 'ANOMALIE SYSTÈME')
    }

    const duration = effect.duration || 2500
    const timer = setTimeout(() => {
      setVisible(false)
      setNotify(null)
      onExpire?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [effect, onExpire])

  if (!visible && !notify) return null

  const type = effect?.type || 'glitch'

  return (
    <>
      {visible && type !== 'corrupt_notify' && (
        <div
          className={`mystery-overlay mystery-overlay--${type}`}
          aria-hidden="true"
        />
      )}
      {type === 'fake_gameover' && visible && (
        <div className="mystery-fake-death" aria-hidden="true">
          <span>GAME OVER</span>
          <span className="mystery-fake-death__sub">SESSION TERMINÉE</span>
        </div>
      )}
      {notify && (
        <div className="mystery-notify" role="status">
          <span className="mystery-notify__corrupt">⚠ {notify}</span>
        </div>
      )}
    </>
  )
}
