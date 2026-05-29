import { useEffect, useState } from 'react'
import './BootScreen.css'

const BOOT_SEQUENCE = [
  { text: '[KERNEL] UltraTech OS v3.7 — boot sequence initiated', delay: 0 },
  { text: '[CHECK] Memory integrity............ OK', delay: 400 },
  { text: '[CHECK] Encryption module........... OK', delay: 800 },
  { text: '[CHECK] Network stack............... WARN', delay: 1200, className: 'boot-warn' },
  { text: '[AUTH]  Operator clearance.......... DENIED', delay: 1600, className: 'boot-error' },
  { text: '[AUTH]  Override ghost_operative.... ACCEPTED', delay: 2100, className: 'boot-ok' },
  { text: '[NET]   SecOps monitoring........... ACTIVE', delay: 2600, className: 'boot-warn' },
  { text: '[NET]   Relay scan module........... STANDBY', delay: 3000 },
  { text: '[WARN]  Unauthorized access logged', delay: 3400, className: 'boot-error' },
  { text: '[WARN]  Trace subsystem armed', delay: 3800, className: 'boot-warn' },
  { text: '[SYS]   Session tunnel established', delay: 4200, className: 'boot-ok' },
  { text: '[SYS]   Terminal ready — awaiting input', delay: 4600, className: 'boot-ok' },
]

/**
 * Séquence de boot cinématique plein écran.
 */
export default function BootScreen({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState([])
  const [phase, setPhase] = useState('logo')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timers = []

    timers.push(setTimeout(() => setPhase('lines'), 1200))

    BOOT_SEQUENCE.forEach((line) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines((prev) => [...prev, line])
        }, 1200 + line.delay)
      )
    })

    timers.push(
      setTimeout(() => setPhase('done'), 1200 + 5200)
    )

    const progInterval = setInterval(() => {
      setProgress((p) => Math.min(100, p + 2))
    }, 100)

    timers.push(
      setTimeout(() => {
        clearInterval(progInterval)
        setProgress(100)
        setTimeout(onComplete, 600)
      }, 1200 + 5400)
    )

    return () => {
      timers.forEach(clearTimeout)
      clearInterval(progInterval)
    }
  }, [onComplete])

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
