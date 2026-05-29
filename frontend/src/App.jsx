import { useCallback, useEffect, useRef, useState } from 'react'

import {

  detectApi,

  enableDemoMode,

  fetchGameState,

  isDemoMode,

  resetGame,

  sendCommand,

  tickMysteryEvents,

  dismissCinematicEvent,

  rollRandomCinematicEvent,

  rollCharacterTransmissionEvent,

  dismissCharacterTransmission,

  markNovaIntroSeen,

  touchPlayerActivity,

} from './api/client'

import Terminal from './components/Terminal'

import StatusBar from './components/StatusBar'

import TopBar from './components/TopBar'

import GameOverSequence from './components/GameOverSequence'

import BootScreen from './components/BootScreen'

import AppWindow from './components/AppWindow'

import HintBroker from './components/HintBroker'
import BlackMarket from './components/BlackMarket'

import MissionJournal from './components/MissionJournal'

import Codex from './components/Codex'

import ProgramToolkit from './components/ProgramToolkit'

import GlobalChat from './components/GlobalChat'

import WelcomeScreen from './components/WelcomeScreen'

import FeedbackButton from './components/FeedbackButton'

import HowToPlayPanel from './components/HowToPlayPanel'

import SettingsPanel from './components/SettingsPanel'

import { useLanguage } from './i18n/LanguageProvider'

import MysteryOverlay from './components/MysteryOverlay'

import NovaEncounter from './components/NovaEncounter'

import CharacterTransmission from './components/CharacterTransmission'

import CinematicEventManager from './systems/CinematicEventManager'

import { getRandomRollDelayMs } from './systems/RandomCinematicEvents'

import { getRandomTransmissionRollDelayMs } from './systems/CharacterTransmissionSystem.jsx'

import './App.css'

import {
  collectNewIntros,
  computeUiProgression,
  getIntroLines,
} from './utils/uiProgression'

import {
  notificationKey,
  resetNotificationCache,
  seedNotifications,
  shouldShowNotification,
} from './utils/notifications'

import { getTraceCorruption } from './utils/traceCorruption'

import { useAudio, AudioToggle } from './systems/AudioManager.jsx'

const MYSTERY_TICK_MS = 90000

const NOVA_IDLE_MS = 30000

const HORROR_UI_TYPES = new Set([
  'pixel_mass',
  'ultratech_watch',
  'horror_ambient',
  'phantom_node',
  'ghost_typing',
  'cursor_possession',
  'fake_gameover',
])



function buildPostBootLines(t) {
  const banner = t('postBoot.banner')
  const pad = Math.max(0, 58 - banner.length)
  return [
    '╔══════════════════════════════════════════════════════════════╗',
    `║  ${banner}${' '.repeat(pad)}║`,
    '╚══════════════════════════════════════════════════════════════╝',
    '',
    t('postBoot.line1'),
    t('postBoot.line2'),
    '',
    t('postBoot.line3'),
    '──────────────────────────────────────────────────────────────',
  ]
}

function App() {
  const { t, locale } = useLanguage()
  const { playAmbient, duckAmbient, restoreAmbient } = useAudio()

  const [authenticated, setAuthenticated] = useState(false)

  const [authUser, setAuthUser] = useState(null)

  const [authChecking, setAuthChecking] = useState(true)

  const [demoMode, setDemoMode] = useState(false)

  const [showWelcome, setShowWelcome] = useState(false)

  const [welcomeLoading, setWelcomeLoading] = useState(false)

  const [howToOpen, setHowToOpen] = useState(false)

  const [settingsOpen, setSettingsOpen] = useState(false)

  const [mysteryEffect, setMysteryEffect] = useState(null)

  const [terminalEffect, setTerminalEffect] = useState(null)

  const [showNovaEncounter, setShowNovaEncounter] = useState(false)



  const [gameState, setGameState] = useState(null)

  const [terminalLines, setTerminalLines] = useState([])

  const [loading, setLoading] = useState(false)

  const [booting, setBooting] = useState(false)

  const [error, setError] = useState(null)

  const [commandLoading, setCommandLoading] = useState(false)

  const [gameOverActive, setGameOverActive] = useState(false)

  const [gameOverSkipToFinal, setGameOverSkipToFinal] = useState(false)

  const [openApps, setOpenApps] = useState(['terminal'])

  const gameOverTriggeredRef = useRef(false)

  const bootDoneRef = useRef(false)

  const initDoneRef = useRef(false)

  const uiIntrosHandledRef = useRef({})

  const lastActivityRef = useRef(Date.now())

  const lastActivitySyncRef = useRef(0)

  const cinematicBlockRef = useRef(true)

  const transmissionBlockRef = useRef(true)

  const appendCodexNotifications = useCallback((discoveries) => {

    if (!discoveries?.length) return

    const lines = []

    for (const entry of discoveries) {

      const key = notificationKey('codex', entry.id)

      if (!shouldShowNotification(key)) continue

      lines.push(t('app.codexAdded', { name: entry.name }))

    }

    if (!lines.length) return

    setTerminalLines((prev) => [...prev, '', ...lines, ''])

  }, [t])



  const bumpActivity = useCallback(() => {

    lastActivityRef.current = Date.now()

    const now = Date.now()

    if (now - lastActivitySyncRef.current > 12000) {

      lastActivitySyncRef.current = now

      if (demoMode || isDemoMode()) {

        touchPlayerActivity().catch(() => {})

      }

    }

  }, [demoMode])



  const handleNovaEncounterAppear = useCallback(async () => {

    if (!(demoMode || isDemoMode())) return

    if (gameState?.novaIntroSeen) return

    try {

      const result = await markNovaIntroSeen()

      if (result?.state) setGameState(result.state)

      if (result?.newCodexDiscoveries?.length) {

        appendCodexNotifications(result.newCodexDiscoveries)

      }

    } catch {

      /* ignore */

    }

  }, [demoMode, gameState?.novaIntroSeen, appendCodexNotifications])



  const handleNovaEncounterInteract = useCallback(() => {

    /* Persistance déjà effectuée à l'apparition — glitch immédiat au contact. */

  }, [])



  const handleNovaEncounterDismiss = useCallback(() => {

    setShowNovaEncounter(false)

    bumpActivity()

  }, [bumpActivity])



  const handleCinematicComplete = useCallback(async () => {

    try {

      const result = await dismissCinematicEvent()

      if (result?.state) setGameState(result.state)

      if (result?.autoLines?.length) {

        setTerminalLines((prev) => [...prev, ...result.autoLines, ''])

      }

    } catch {

      /* ignore */

    }

  }, [])



  const handleTransmissionComplete = useCallback(async () => {

    try {

      const result = await dismissCharacterTransmission()

      if (result?.state) setGameState(result.state)

    } catch {

      /* ignore */

    }

  }, [])



  const triggerGameOver = useCallback((skipToFinal = false) => {

    if (gameOverTriggeredRef.current) return

    gameOverTriggeredRef.current = true

    setGameOverSkipToFinal(skipToFinal)

    setGameOverActive(true)

  }, [])



  const seedNotificationState = useCallback((state) => {

    if (!state) return

    const keys = []

    for (const entry of state.codex?.entries || []) {

      if (entry.discovered) keys.push(notificationKey('codex', entry.id))

    }

    for (const [id] of Object.entries(state.uiIntrosSeen || {})) {

      keys.push(notificationKey('intro', id))

    }

    seedNotifications(keys)

  }, [])



  const loadGame = useCallback(async () => {

    setLoading(true)

    try {

      const state = await fetchGameState()

      setGameState(state)

      seedNotificationState(state)

      if (state.gameOver) triggerGameOver(true)

      setError(null)

      setBooting(true)

      bootDoneRef.current = false

    } catch (err) {

      setError(t('app.loadSession', { message: err.message }))

    } finally {

      setLoading(false)

    }

  }, [triggerGameOver, seedNotificationState, t])

  useEffect(() => {
    if (!authenticated || authChecking || loading || showWelcome) return
    fetchGameState()
      .then((state) => setGameState(state))
      .catch(() => {})
  }, [locale, authenticated, authChecking, loading, showWelcome])

  const launchDemoGame = useCallback(async (loadFn) => {

    setWelcomeLoading(true)

    playAmbient()

    enableDemoMode()

    setDemoMode(true)

    setAuthUser({ username: 'GHOST' })

    setAuthenticated(true)

    setShowWelcome(false)

    setError(null)

    uiIntrosHandledRef.current = {}

    resetNotificationCache()

    gameOverTriggeredRef.current = false

    setGameOverActive(false)

    setGameOverSkipToFinal(false)



    try {

      if (loadFn) {

        const result = await loadFn()

        setGameState(result.state)

        if (result.state.gameOver) triggerGameOver(true)

        setBooting(true)

        bootDoneRef.current = false

      } else {

        await loadGame()

      }

    } catch (err) {

      setError(err.message)

      setShowWelcome(true)

      setAuthenticated(false)

    } finally {

      setWelcomeLoading(false)

    }

  }, [loadGame, triggerGameOver, playAmbient])



  const handleWelcomeReset = useCallback(async () => {

    if (!window.confirm(t('app.resetConfirmLong'))) {

      return

    }

    setWelcomeLoading(true)

    enableDemoMode()

    setDemoMode(true)

    try {

      await resetGame()

    } catch (err) {

      setError(err.message)

    } finally {

      setWelcomeLoading(false)

    }

  }, [])



  useEffect(() => {

    if (initDoneRef.current) return

    initDoneRef.current = true



    async function init() {

      setAuthChecking(true)

      await detectApi()

      enableDemoMode()

      setDemoMode(true)

      setShowWelcome(true)

      setAuthChecking(false)

    }

    init()

  }, [])



  const handleBootComplete = useCallback(() => {

    if (bootDoneRef.current) return

    bootDoneRef.current = true

    setBooting(false)

    setTerminalLines(buildPostBootLines(t))

  }, [t])



  const appendTerminalLine = useCallback((line) => {

    setTerminalLines((prev) => [...prev, line])

  }, [])



  const appendIntroLines = useCallback((state) => {

    const newIntros = collectNewIntros(state, uiIntrosHandledRef.current)

    if (!newIntros.length) return

    const lines = []

    for (const key of newIntros) {

      if (!shouldShowNotification(notificationKey('intro', key))) continue

      lines.push(...getIntroLines(key, locale))

      uiIntrosHandledRef.current[key] = true

    }

    if (!lines.length) return

    setTerminalLines((prev) => [...prev, '', ...lines, ''])

  }, [locale])



  const handleStateUpdate = useCallback((state) => {

    setGameState(state)

    appendIntroLines(state)

    if (state.gameOver) triggerGameOver(false)

  }, [triggerGameOver, appendIntroLines])



  const handleOpenApp = (appId) => {

    const ui = computeUiProgression(gameState)

    if (!ui.unlockedApps.includes(appId)) return

    if (!openApps.includes(appId)) {

      setOpenApps((prev) => [...prev, appId])

    }

  }



  const handleCloseApp = (appId) => {

    setOpenApps((prev) => {

      const next = prev.filter((a) => a !== appId)

      return next.length > 0 ? next : ['terminal']

    })

  }



  const handleCommand = async (command) => {

    const fakeOver = gameState?.fakeGameOverActive

    if (!command.trim() || commandLoading || gameOverActive) return

    if (gameState?.activeCinematic?.lockTerminal) return

    if (gameState?.gameOver && !fakeOver) return



    bumpActivity()

    setCommandLoading(true)

    setTerminalLines((prev) => [...prev, `> ${command}`])



    try {

      const result = await sendCommand(command)



      if (result.clear_terminal) {

        setTerminalLines([])

      } else if (result.output.length > 0) {

        setTerminalLines((prev) => [...prev, ...result.output, ''])

      }



      setGameState(result.state)

      appendIntroLines(result.state)

      setError(null)



        if (result.uiEffect || result.state?.activeUiEffect) {

          setMysteryEffect(result.uiEffect || result.state.activeUiEffect)

        }

        if (result.terminalEffect) setTerminalEffect(result.terminalEffect)

        if (result.newCodexDiscoveries?.length) {

          appendCodexNotifications(result.newCodexDiscoveries)

        }



      if (result.state.gameOver && !result.state.fakeGameOverActive) triggerGameOver(false)

    } catch (err) {

      setTerminalLines((prev) => [...prev, `[ERR] ${err.message}`, ''])

    } finally {

      setCommandLoading(false)

    }

  }



  const handleFileOpen = (filename) => {

    if (commandLoading || gameState?.gameOver || gameOverActive) return

    if (!openApps.includes('terminal')) {

      setOpenApps((prev) => [...prev, 'terminal'])

    }

    handleCommand(`open ${filename}`)

  }



  const applyGameReload = useCallback((result, extraLine) => {

    setGameState(result.state)

    setTerminalLines([

      ...buildPostBootLines(t),

      extraLine || result.message || t('app.saveReloaded'),

      '',

    ])

    setError(null)

    setGameOverActive(false)

    setGameOverSkipToFinal(false)

    gameOverTriggeredRef.current = false

    setOpenApps(['terminal'])

    bootDoneRef.current = true

    setBooting(false)

  }, [t])



  const handleReset = async (skipConfirm = false) => {

    if (!skipConfirm && !window.confirm(t('app.resetConfirmLong'))) {

      return

    }



    try {

      const result = await resetGame()

      applyGameReload(result, t('app.resetDone'))

    } catch (err) {

      setError(t('app.resetError', { message: err.message }))

    }

  }



  const handleGameOverRestart = () => handleReset(true)



  const inDemo = demoMode || isDemoMode()



  useEffect(() => {

    if (!inDemo || showWelcome || !authenticated || loading || booting) return undefined

    const id = setInterval(async () => {

      try {

        const result = await tickMysteryEvents()

        if (!result?.state) return

        setGameState(result.state)

        if (result.uiEffect) setMysteryEffect(result.uiEffect)

        if (result.terminalEffect) setTerminalEffect(result.terminalEffect)

        if (result.autoLines?.length) {

          setTerminalLines((prev) => [...prev, ...result.autoLines, ''])

        }

        if (result.newCodexDiscoveries?.length) {

          appendCodexNotifications(result.newCodexDiscoveries)

        }

      } catch {

        /* ignore tick errors */

      }

    }, MYSTERY_TICK_MS)

    return () => clearInterval(id)

  }, [inDemo, showWelcome, authenticated, loading, booting, appendCodexNotifications])



  cinematicBlockRef.current =
    showWelcome
    || showNovaEncounter
    || booting
    || gameOverActive
    || howToOpen
    || commandLoading
    || !!gameState?.gameOver
    || !!gameState?.activeCinematic
    || !!gameState?.activeCharacterTransmission
    || !!gameState?.fakeGameOverActive
    || !!terminalEffect

  transmissionBlockRef.current =
    showWelcome
    || showNovaEncounter
    || booting
    || gameOverActive
    || howToOpen
    || commandLoading
    || !!gameState?.gameOver
    || !!gameState?.activeCinematic
    || !!gameState?.activeCharacterTransmission
    || !!gameState?.fakeGameOverActive
    || !!terminalEffect



  useEffect(() => {

    if (!inDemo || showWelcome || !authenticated || loading || booting) return undefined

    let cancelled = false
    let timerId

    const scheduleRoll = () => {
      const delay = getRandomRollDelayMs()
      timerId = setTimeout(async () => {
        if (cancelled) return

        if (!cinematicBlockRef.current) {
          try {
            const result = await rollRandomCinematicEvent(false)
            if (result?.state) {
              setGameState(result.state)
              if (result.autoLines?.length) {
                setTerminalLines((prev) => [...prev, ...result.autoLines, ''])
              }
            }
          } catch {
            /* ignore roll errors */
          }
        }

        if (!cancelled) scheduleRoll()
      }, delay)
    }

    scheduleRoll()

    return () => {
      cancelled = true
      clearTimeout(timerId)
    }

  }, [inDemo, showWelcome, authenticated, loading, booting])



  useEffect(() => {

    if (!inDemo || showWelcome || !authenticated || loading || booting) return undefined

    let cancelled = false
    let timerId

    const scheduleRoll = () => {
      const delay = getRandomTransmissionRollDelayMs()
      timerId = setTimeout(async () => {
        if (cancelled) return

        if (!transmissionBlockRef.current) {
          try {
            const result = await rollCharacterTransmissionEvent(false, 'random')
            if (result?.state) setGameState(result.state)
          } catch {
            /* ignore roll errors */
          }
        }

        if (!cancelled) scheduleRoll()
      }, delay)
    }

    scheduleRoll()

    return () => {
      cancelled = true
      clearTimeout(timerId)
    }

  }, [inDemo, showWelcome, authenticated, loading, booting])



  useEffect(() => {

    if (!inDemo || showWelcome || !authenticated || loading || booting) return undefined

    const onActivity = () => bumpActivity()

    window.addEventListener('mousemove', onActivity, { passive: true })

    window.addEventListener('mousedown', onActivity, { passive: true })

    window.addEventListener('keydown', onActivity, { passive: true })

    window.addEventListener('touchstart', onActivity, { passive: true })

    return () => {

      window.removeEventListener('mousemove', onActivity)

      window.removeEventListener('mousedown', onActivity)

      window.removeEventListener('keydown', onActivity)

      window.removeEventListener('touchstart', onActivity)

    }

  }, [inDemo, showWelcome, authenticated, loading, booting, bumpActivity])



  useEffect(() => {

    if (!inDemo || showWelcome || !authenticated || loading || booting) return undefined

    if (gameState?.novaIntroSeen) return undefined

    const id = setInterval(() => {

      if (gameState?.novaIntroSeen) return

      if (showNovaEncounter) return

      const critical =
        gameOverActive
        || howToOpen
        || commandLoading
        || terminalEffect
        || gameState?.activeCinematic
        || gameState?.activeCharacterTransmission
        || gameState?.fakeGameOverActive
        || mysteryEffect?.type === 'fake_gameover'
        || (gameState?.gameOver && !gameState?.fakeGameOverActive)

      if (critical) {

        bumpActivity()

        return

      }

      if (Date.now() - lastActivityRef.current >= NOVA_IDLE_MS) {

        setShowNovaEncounter(true)

      }

    }, 1000)

    return () => clearInterval(id)

  }, [
    inDemo,
    showWelcome,
    authenticated,
    loading,
    booting,
    gameState?.novaIntroSeen,
    gameState?.gameOver,
    gameState?.fakeGameOverActive,
    gameState?.activeCinematic,
    gameOverActive,
    howToOpen,
    commandLoading,
    terminalEffect,
    mysteryEffect,
    showNovaEncounter,
    bumpActivity,
  ])



  useEffect(() => {

    if (!authenticated || showWelcome) return undefined

    const shouldDuck =
      showNovaEncounter
      || !!gameState?.activeCinematic
      || !!gameState?.activeCharacterTransmission
      || gameState?.fakeGameOverActive
      || gameOverActive
      || (gameState?.gameOver && !gameState?.fakeGameOverActive)

    if (shouldDuck) duckAmbient()
    else restoreAmbient()

    return undefined

  }, [
    authenticated,
    showWelcome,
    showNovaEncounter,
    gameState?.activeCinematic,
    gameState?.activeCharacterTransmission,
    gameState?.fakeGameOverActive,
    gameState?.gameOver,
    gameOverActive,
    duckAmbient,
    restoreAmbient,
  ])



  const cinematicActive = gameState?.activeCinematic
  const transmissionActive = gameState?.activeCharacterTransmission
  const cinematicLocksTerminal = cinematicActive?.lockTerminal

  const isLocked = !!error || commandLoading || gameOverActive || cinematicLocksTerminal

  const networkTheme = gameState?.network?.currentNodeMeta?.theme ?? 'default'

  const operatorName = authUser?.username || 'GHOST'

  const ui = computeUiProgression(gameState)

  const terminalTitle = ui.earlyGame

    ? t('windows.terminalSecure')

    : gameState?.network?.connected

      ? t('windows.terminal', { name: gameState.network.currentNodeMeta.displayName })

      : t('windows.terminal', { name: operatorName })



  if (authChecking) {

    return (

      <div className="app app--loading">

        <div className="loader">

          <span className="loader__text">ULTRATECH ONLINE</span>

          <span className="loader__bar" />

          <span className="loader__sub">{t('loader.subtitle')}</span>

        </div>

      </div>

    )

  }



  if (showWelcome) {

    return (

      <>
        <WelcomeScreen
          loading={welcomeLoading}
          onOpenBeta={() => launchDemoGame(null)}
          onReset={handleWelcomeReset}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </>

    )

  }



  if (loading || booting) {

    return (

      <>

        {!loading && booting && <BootScreen onComplete={handleBootComplete} />}

        {loading && (

          <div className="app app--loading">

            <div className="loader">

              <span className="loader__text">ULTRATECH ONLINE</span>

              <span className="loader__bar" />

              <span className="loader__sub">{t('app.sessionLoading')}</span>

            </div>

          </div>

        )}

      </>

    )

  }



  const activeEffect = mysteryEffect || gameState?.activeUiEffect

  const horrorActive = activeEffect && HORROR_UI_TYPES.has(activeEffect.type)

  const traceFx = getTraceCorruption(gameState?.traceLevel ?? 0)



  return (

    <div
      className={`app app--theme-${networkTheme} ${ui.earlyGame ? 'app--focus-terminal' : ''} ${gameOverActive ? 'app--game-over' : ''} ${activeEffect ? 'app--mystery-active' : ''} ${horrorActive ? 'app--horror-active' : ''} ${cinematicActive ? 'app--cinematic-active' : ''} ${cinematicLocksTerminal ? 'app--cinematic-lock' : ''} ${traceFx.className}`}
      style={{ '--trace-scan-opacity': traceFx.scanlineOpacity }}
    >

      <div className="app__immersion" aria-hidden="true">

        <div className="app__scanlines" />

        {traceFx.rgbSplit && <div className="app__rgb-split" />}

        <div className="app__vignette" />

      </div>



      <TopBar

        state={gameState}

        onReset={handleReset}

        onOpenHowTo={() => setHowToOpen(true)}

        onOpenSettings={() => setSettingsOpen(true)}

        username={operatorName}

      />



      <main className="desktop">

        <aside className="sidebar">

          <StatusBar

            state={gameState}

            onFileOpen={handleFileOpen}

            onOpenApp={handleOpenApp}

            openApps={openApps}

          />

        </aside>



        <div className="workspace">

          <div className={`windows ${openApps.some((a) => ui.unlockedApps.includes(a) && a !== 'terminal') ? 'windows--split' : ''}`}>

            {error && (

              <div className="error-banner">

                <span>⚠ {error}</span>

                <button onClick={() => loadGame()}>{t('errors.retry')}</button>

              </div>

            )}



            <AppWindow

              title={terminalTitle}

              active={openApps.includes('terminal')}

              onClose={() => handleCloseApp('terminal')}

              variant="terminal"

            >

              <Terminal

                lines={terminalLines}

                onCommand={handleCommand}

                disabled={isLocked}

                horrorEffect={terminalEffect}

                onHorrorEffectDone={() => setTerminalEffect(null)}

              />

            </AppWindow>



            {ui.unlockedApps.includes('chat') && (

            <AppWindow

              title={t('windows.chat')}

              active={openApps.includes('chat')}

              onClose={() => handleCloseApp('chat')}

              variant="secondary"

            >

              <GlobalChat username={authUser?.username} disabled={isLocked} demoMode={inDemo} />

            </AppWindow>

            )}



            {ui.unlockedApps.includes('toolkit') && (

            <AppWindow

              title={t('windows.toolkit')}

              active={openApps.includes('toolkit')}

              onClose={() => handleCloseApp('toolkit')}

              variant="secondary"

            >

              <ProgramToolkit

                toolkit={gameState?.programToolkit}

                onRun={handleCommand}

              />

            </AppWindow>

            )}



            {ui.unlockedApps.includes('journal') && (

            <AppWindow

              title={t('windows.journal')}

              active={openApps.includes('journal')}

              onClose={() => handleCloseApp('journal')}

              variant="journal"

            >

              <MissionJournal journal={gameState?.missionJournal} gameState={gameState} />

            </AppWindow>

            )}



            {ui.unlockedApps.includes('broker') && (

            <AppWindow

              title={t('windows.broker')}

              active={openApps.includes('broker')}

              onClose={() => handleCloseApp('broker')}

              variant="broker"

            >

              <HintBroker

                gameState={gameState}

                onStateUpdate={handleStateUpdate}

                disabled={isLocked}

              />

            </AppWindow>

            )}



            {ui.unlockedApps.includes('codex') && (

            <AppWindow

              title={t('windows.codex')}

              active={openApps.includes('codex')}

              onClose={() => handleCloseApp('codex')}

              variant="secondary"

            >

              <Codex codex={gameState?.codex} />

            </AppWindow>

            )}



            {ui.unlockedApps.includes('market') && (

            <AppWindow

              title={t('windows.market')}

              active={openApps.includes('market')}

              onClose={() => handleCloseApp('market')}

              variant="market"

            >

              <BlackMarket

                gameState={gameState}

                onStateUpdate={handleStateUpdate}

                onTerminalAppend={appendTerminalLine}

                disabled={isLocked}

              />

            </AppWindow>

            )}

          </div>

        </div>

      </main>



      <footer className="footer">

        <span>{ui.earlyGame ? t('footer.secureConnection') : t('footer.corp', { operator: operatorName })}</span>

        <div className="footer__right">

          {inDemo && !ui.earlyGame && <FeedbackButton variant="ghost" />}

          <span className="footer__blink">

            {gameState?.gameOver
              ? t('footer.sessionCompromised')
              : ui.earlyGame
                ? t('footer.lineOpen')
                : t('footer.beingWatched')}

          </span>

        </div>

      </footer>



      <HowToPlayPanel open={howToOpen} onClose={() => setHowToOpen(false)} />

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />



      <NovaEncounter
        open={showNovaEncounter}
        onAppear={handleNovaEncounterAppear}
        onInteract={handleNovaEncounterInteract}
        onDismiss={handleNovaEncounterDismiss}
      />



      <CinematicEventManager
        event={cinematicActive}
        onComplete={handleCinematicComplete}
      />



      <CharacterTransmission
        transmission={transmissionActive}
        onComplete={handleTransmissionComplete}
      />



      <AudioToggle />



      <MysteryOverlay
        effect={activeEffect}
        onExpire={() => setMysteryEffect(null)}
      />

      <GameOverSequence

        active={gameOverActive}

        skipToFinal={gameOverSkipToFinal}

        onTerminalAppend={appendTerminalLine}

        onRestart={handleGameOverRestart}

      />

    </div>

  )

}



export default App

