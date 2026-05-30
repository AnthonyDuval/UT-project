import { useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'
import { formatSessionDuration, pickRareGameOverLine } from '../utils/gameOverReport'
import './GameOverSequence.css'

const VIDEO_SRC = '/assets/videos/events/system_failure.mp4'

const TIMING = {
  FREEZE_MS: 900,
  GLITCH_PEAK_MS: 3200,
  CORRUPT_START_MS: 2600,
  MSG_1_MS: 4200,
  MSG_2_MS: 5600,
  MSG_3_MS: 7000,
  VIDEO_START_MS: 5400,
  REPORT_MS: 11200,
  FAILSAFE_MS: 15000,
}

const UT_MESSAGE_KEYS = ['location', 'intervention', 'session']

/**
 * Séquence Game Over UltraTech — narrative corporate enrichie.
 * Réutilise gameOver existant ; pas de second système.
 */
export default function GameOverSequence({
  active,
  skipToFinal = false,
  playerName = 'ghost_operator',
  gameOverReport = null,
  onTerminalAppend,
  onRestart,
  onReturnHome,
}) {
  const { t } = useLanguage()
  const [phase, setPhase] = useState('idle')
  const [intensity, setIntensity] = useState(0)
  const [visibleMsgs, setVisibleMsgs] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const timersRef = useRef([])
  const runningRef = useRef(false)
  const videoRef = useRef(null)

  const rareLine = useMemo(() => {
    const lines = t.raw('gameOver.rareLines') || []
    return pickRareGameOverLine(lines, Date.now())
  }, [t, showReport])

  const schedule = (fn, delay) => {
    const id = setTimeout(fn, delay)
    timersRef.current.push(id)
    return id
  }

  const clearAll = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  const term = (line) => {
    if (onTerminalAppend && line) onTerminalAppend(line)
  }

  const goReport = () => {
    setShowVideo(false)
    setPhase('report')
    setIntensity(0)
    setShowReport(true)
  }

  useEffect(() => {
    if (!active) {
      runningRef.current = false
      return undefined
    }

    if (skipToFinal) {
      setPhase('report')
      setShowReport(true)
      return undefined
    }

    if (runningRef.current) return undefined
    runningRef.current = true
    clearAll()

    setPhase('freeze')
    setIntensity(0)
    setVisibleMsgs(0)
    setShowVideo(false)
    setShowReport(false)
    setVideoFailed(false)

    schedule(() => {
      setPhase('glitch')
      setIntensity(1)
    }, TIMING.FREEZE_MS)

    schedule(() => setIntensity(2), TIMING.FREEZE_MS + 700)
    schedule(() => setIntensity(3), TIMING.GLITCH_PEAK_MS)

    schedule(() => {
      setPhase('corrupt')
      term('')
      term(t('gameOver.terminal.critical'))
      term(t('gameOver.terminal.engaged'))
    }, TIMING.CORRUPT_START_MS)

    schedule(() => {
      term(t('gameOver.terminal.hijacked'))
      term(t('gameOver.terminal.cmdWhoami'))
      term(t('gameOver.terminal.accessRevoked', { name: playerName }))
      term(t('gameOver.terminal.cmdDisconnect'))
      term(t('gameOver.terminal.cmdBlocked'))
      term(t('gameOver.terminal.cmdPurge'))
      term(t('gameOver.terminal.purgeDenied'))
    }, TIMING.CORRUPT_START_MS + 500)

    schedule(() => setVisibleMsgs(1), TIMING.MSG_1_MS)
    schedule(() => setVisibleMsgs(2), TIMING.MSG_2_MS)
    schedule(() => {
      setVisibleMsgs(3)
      setPhase('messages')
    }, TIMING.MSG_3_MS)

    schedule(() => {
      setPhase('video')
      setShowVideo(true)
    }, TIMING.VIDEO_START_MS)

    schedule(goReport, TIMING.REPORT_MS)
    schedule(goReport, TIMING.FAILSAFE_MS)

    return () => {
      clearAll()
      runningRef.current = false
    }
  }, [active, skipToFinal, playerName, t])

  useEffect(() => {
    if (!showVideo || phase !== 'video') return undefined
    const video = videoRef.current
    if (!video) return undefined

    video.muted = true
    const play = async () => {
      try {
        await video.play()
      } catch {
        setVideoFailed(true)
      }
    }
    play()

    const onEnded = () => {
      if (!showReport) goReport()
    }
    video.addEventListener('ended', onEnded)
    return () => video.removeEventListener('ended', onEnded)
  }, [showVideo, phase, showReport])

  if (!active && !showReport) return null

  const report = gameOverReport || {
    operatorName: playerName,
    finalTrace: 100,
    suspiciousCommands: [],
    visitedNodes: [{ id: 'local', name: 'LOCAL' }],
    sessionDurationMs: 0,
  }

  const commandsLabel = report.suspiciousCommands?.length
    ? report.suspiciousCommands
      .map((entry) => t('gameOver.report.commandEntry', { cmd: entry.cmd, count: entry.count }))
      .join(', ')
    : t('gameOver.report.none')

  const nodesLabel = report.visitedNodes?.length
    ? report.visitedNodes.map((n) => n.name).join(' · ')
    : t('gameOver.report.none')

  return (
    <div
      className={`game-over game-over--${phase} game-over--intensity-${intensity}`}
      aria-live="assertive"
    >
      <div className="game-over__flash-layer" />
      <div className="game-over__scanlines" />
      <div className="game-over__noise" />

      {!showReport && (
        <>
          <div className="game-over__ut-banner">
            <span className="game-over__ut-seal">{t('gameOver.seal')}</span>
          </div>

          <div className="game-over__ut-messages">
            {UT_MESSAGE_KEYS.slice(0, visibleMsgs).map((key) => (
              <div key={key} className="game-over__ut-msg">
                {t(`gameOver.utMessages.${key}`)}
              </div>
            ))}
          </div>

          {showVideo && !videoFailed && (
            <div className="game-over__video-wrap">
              <div className="game-over__video-label">{t('gameOver.videoLabel')}</div>
              <video
                ref={videoRef}
                className="game-over__video"
                src={VIDEO_SRC}
                playsInline
                muted
              />
              <div className="game-over__video-scanlines" aria-hidden="true" />
            </div>
          )}
        </>
      )}

      {showReport && (
        <div className="game-over__report">
          <div className="game-over__report-header">
            <span className="game-over__report-seal">{t('gameOver.seal')}</span>
            <h2 className="game-over__report-title">{t('gameOver.report.title')}</h2>
            <p className="game-over__report-sub">{t('gameOver.report.subtitle')}</p>
          </div>

          <dl className="game-over__report-grid">
            <div className="game-over__report-row">
              <dt>{t('gameOver.report.operator')}</dt>
              <dd>{report.operatorName}</dd>
            </div>
            <div className="game-over__report-row">
              <dt>{t('gameOver.report.finalTrace')}</dt>
              <dd className="game-over__report-trace">{report.finalTrace}%</dd>
            </div>
            <div className="game-over__report-row">
              <dt>{t('gameOver.report.suspiciousCommands')}</dt>
              <dd>{commandsLabel}</dd>
            </div>
            <div className="game-over__report-row">
              <dt>{t('gameOver.report.visitedNodes')}</dt>
              <dd>{nodesLabel}</dd>
            </div>
            <div className="game-over__report-row">
              <dt>{t('gameOver.report.sessionDuration')}</dt>
              <dd>{formatSessionDuration(report.sessionDurationMs)}</dd>
            </div>
            <div className="game-over__report-row game-over__report-row--status">
              <dt>{t('gameOver.report.status')}</dt>
              <dd className="game-over__report-status">{t('gameOver.report.statusValue')}</dd>
            </div>
          </dl>

          {rareLine && (
            <p className="game-over__report-rare">{rareLine}</p>
          )}

          <div className="game-over__actions">
            <button type="button" className="game-over__btn game-over__btn--primary" onClick={onRestart}>
              {t('gameOver.actions.newIdentity')}
            </button>
            <button type="button" className="game-over__btn game-over__btn--ghost" onClick={onReturnHome}>
              {t('gameOver.actions.returnHome')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
