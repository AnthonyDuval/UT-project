import { useEffect, useRef, useState } from 'react'
import './GameOverSequence.css'

/** Messages UltraTech qui envahissent l'écran */
const INVASION_MESSAGES = [
  'LOCALISATION CONFIRMÉE',
  'INTRUS IDENTIFIÉ',
  'SESSION COMPROMISED',
  'NO ESCAPE',
  'WE SEE YOU',
  'CONNECTION SEALED',
]

/** Faux logs système */
const FAKE_LOGS = [
  '[SECOPS] Triangulation IP en cours...',
  '[SECOPS] Correlation MAC address... OK',
  '[SECOPS] Biometric scan initiated...',
  '[CAM] Device camera access GRANTED',
  '[CAM] Stream relay to UltraTech HQ...',
  '[NET] All exit nodes SEALED',
  '[AUTH] Credentials REVOKED',
  '[TRACE] Signal locked — 100%',
]

/** Faux popups */
const FAKE_WINDOWS = [
  { id: 1, title: 'SECOPS ALERT', body: 'LOCALISATION CONFIRMÉE\nOpérateur non autorisé détecté.' },
  { id: 2, title: 'CAMERA FEED', body: '[ LIVE ] Accès caméra activé...\n████████████' },
  { id: 3, title: 'ULTRATECH NET', body: 'CONNECTION SEALED\nTous les relais fermés.' },
  { id: 4, title: 'INTRUSION DETECTED', body: 'WE SEE YOU\nSession compromise.' },
]

/** Séquence auto-typing terminal */
const AUTO_TERMINAL = [
  { type: 'cmd', text: 'whoami' },
  { type: 'out', text: 'ghost_operative [ACCESS REVOKED]' },
  { type: 'cmd', text: 'disconnect --force' },
  { type: 'out', text: '[ERR] COMMAND BLOCKED BY ULTRATECH SECOPS' },
  { type: 'cmd', text: 'purge trace' },
  { type: 'out', text: '[ERR] PERMISSION DENIED — TRACE LOCKED AT 100%' },
  { type: 'cmd', text: 'help' },
  { type: 'out', text: '[ERR] TERMINAL UNDER EXTERNAL CONTROL' },
]

const NOVA_LINES = [
  '',
  '>>> SIGNAL ENTRANT — N0VA <<<',
  '',
  '« Opérateur... je perds le signal. »',
  '« Ils t\'ont trouvé. Ne résiste pas. »',
  '« C\'était... »',
  '[SIGNAL LOST — N0VA DISCONNECTED]',
  '',
]

/**
 * Séquence Game Over UltraTech — chaos visuel progressif.
 * Déclenchée automatiquement quand traceLevel atteint 100 %.
 */
export default function GameOverSequence({
  active,
  skipToFinal = false,
  onTerminalAppend,
  onRestart,
}) {
  const [phase, setPhase] = useState('idle')
  const [intensity, setIntensity] = useState(0)
  const [flash, setFlash] = useState(false)
  const [overlays, setOverlays] = useState([])
  const [windows, setWindows] = useState([])
  const [logs, setLogs] = useState([])
  const [showFinal, setShowFinal] = useState(false)
  const timersRef = useRef([])
  const runningRef = useRef(false)

  /** Planifie un timeout avec cleanup automatique */
  const schedule = (fn, delay) => {
    const id = setTimeout(fn, delay)
    timersRef.current.push(id)
    return id
  }

  /** Nettoie tous les timers */
  const clearAll = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  /** Ajoute une ligne au terminal via callback parent */
  const term = (line) => {
    if (onTerminalAppend) onTerminalAppend(line)
  }

  /** Lance la séquence auto-typing */
  const runAutoTerminal = (startDelay = 0) => {
    let delay = startDelay
    AUTO_TERMINAL.forEach((entry) => {
      schedule(() => {
        if (entry.type === 'cmd') {
          term(`> ${entry.text}`)
        } else {
          term(entry.text)
        }
      }, delay)
      delay += 450
    })
  }

  /** Démarre la séquence complète */
  useEffect(() => {
    if (!active || runningRef.current) return

    if (skipToFinal) {
      setShowFinal(true)
      setPhase('final')
      return
    }

    runningRef.current = true
    clearAll()

    // Phase 1 — Freeze 1 seconde
    setPhase('freeze')
    setIntensity(0)

    schedule(() => {
      // Phase 2 — Chaos progressif
      setPhase('chaos')
      setIntensity(1)
      term('')
      term('[!!!] TRACE CRITIQUE — 100%')
      term('[!!!] ULTRATECH SECOPS ENGAGED')
    }, 1000)

    // Flashs rouges intermittents
    ;[1200, 1600, 2100, 2800, 3500].forEach((t) => {
      schedule(() => {
        setFlash(true)
        schedule(() => setFlash(false), 80)
      }, t)
    })

    // Intensité croissante
    schedule(() => setIntensity(2), 2000)
    schedule(() => setIntensity(3), 3500)

    // Phase 3 — Invasion messages + logs
    schedule(() => {
      setPhase('invasion')
      setIntensity(4)
    }, 4000)

    INVASION_MESSAGES.forEach((msg, i) => {
      schedule(() => {
        setOverlays((prev) => [...prev, { id: Date.now() + i, text: msg }])
      }, 4200 + i * 600)
    })

    FAKE_LOGS.forEach((log, i) => {
      schedule(() => {
        setLogs((prev) => [...prev.slice(-6), log])
        term(log)
      }, 4500 + i * 400)
    })

    // Faux popups
    FAKE_WINDOWS.forEach((win, i) => {
      schedule(() => {
        setWindows((prev) => [...prev, { ...win, uid: Date.now() + i }])
      }, 5000 + i * 700)
    })

    // Fermeture/réouverture chaotique de fenêtres
    schedule(() => setWindows([]), 7500)
    schedule(() => {
      setWindows(
        FAKE_WINDOWS.slice(0, 2).map((w, i) => ({ ...w, uid: Date.now() + 100 + i }))
      )
    }, 7800)

    // Phase 4 — Auto-typing terminal
    schedule(() => {
      setPhase('autotype')
      setIntensity(5)
      term('')
      term('[SYS] TERMINAL HIJACKED BY ULTRATECH')
    }, 8000)

    runAutoTerminal(8200)

    // Phase 5 — N0VA tente d'intervenir
    schedule(() => {
      setPhase('nova')
      NOVA_LINES.forEach((line) => term(line))
    }, 11500)

    schedule(() => {
      term('[ULTRATECH] Signal N0VA neutralisé.')
      term('[ULTRATECH] Connexion fermée de force.')
    }, 13000)

    // Phase 6 — Écran final
    schedule(() => {
      setPhase('final')
      setIntensity(6)
      setShowFinal(true)
      setWindows([])
      setOverlays([])
    }, 14500)

    return () => {
      clearAll()
      runningRef.current = false
    }
  }, [active, skipToFinal])

  if (!active && !showFinal) return null

  return (
    <div
      className={`game-over game-over--${phase} game-over--intensity-${intensity} ${
        flash ? 'game-over--flash' : ''
      }`}
    >
      <div className="game-over__flash-layer" />
      <div className="game-over__scanlines" />
      <div className="game-over__noise" />

      <div className="game-over__invasion">
        {overlays.map((o) => (
          <div key={o.id} className="game-over__invasion-msg">
            {o.text}
          </div>
        ))}
      </div>

      <div className="game-over__log-panel">
        {logs.map((log, i) => (
          <div key={i} className="game-over__log-line">
            {log}
          </div>
        ))}
      </div>

      <div className="game-over__windows">
        {windows.map((win, i) => (
          <div
            key={win.uid}
            className="game-over__window"
            style={{
              top: `${15 + (i % 3) * 22}%`,
              left: `${10 + (i % 2) * 35 + Math.sin(i) * 5}%`,
            }}
          >
            <div className="game-over__window-bar">
              <span className="game-over__window-title">{win.title}</span>
              <span className="game-over__window-close">✕</span>
            </div>
            <pre className="game-over__window-body">{win.body}</pre>
          </div>
        ))}
      </div>

      {intensity >= 3 && phase !== 'final' && (
        <div className="game-over__camera">
          <div className="game-over__camera-header">
            <span className="game-over__camera-dot" />
            CAM LIVE — ULTRATECH SURVEILLANCE
          </div>
          <div className="game-over__camera-feed">
            <div className="game-over__camera-static" />
            <span className="game-over__camera-text">WE SEE YOU</span>
          </div>
        </div>
      )}

      {showFinal && (
        <div className="game-over__final">
          <div className="game-over__final-glitch" data-text="ULTRATECH HAS FOUND YOU">
            ULTRATECH HAS FOUND YOU
          </div>
          <p className="game-over__final-sub">
            Session terminée — Opérateur localisé et neutralisé.
          </p>
          <button className="game-over__restart" onClick={onRestart}>
            ↺ Recommencer
          </button>
        </div>
      )}
    </div>
  )
}
