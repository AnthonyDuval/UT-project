import { useCallback, useEffect, useRef, useState } from 'react'

import {

  detectApi,

  enableDemoMode,

  fetchGameState,

  isDemoMode,

  resetGame,

  sendCommand,

  tickMysteryEvents,

} from './api/client'

import Terminal from './components/Terminal'

import StatusBar from './components/StatusBar'

import TopBar from './components/TopBar'

import GameOverSequence from './components/GameOverSequence'

import BootScreen from './components/BootScreen'

import AppWindow from './components/AppWindow'

import BlackMarket from './components/BlackMarket'

import MissionJournal from './components/MissionJournal'

import Codex from './components/Codex'

import ProgramToolkit from './components/ProgramToolkit'

import GlobalChat from './components/GlobalChat'

import WelcomeScreen from './components/WelcomeScreen'

import FeedbackButton from './components/FeedbackButton'

import HowToPlayPanel from './components/HowToPlayPanel'

import MysteryOverlay from './components/MysteryOverlay'

import './App.css'

import {
  collectNewIntros,
  computeUiProgression,
  getIntroLines,
} from './utils/uiProgression'



function buildPostBootLines() {

  return [

    '╔══════════════════════════════════════════════════════════════╗',

    '║       ULTRATECH ONLINE — TERMINAL OPÉRATEUR v3.7             ║',

    '╚══════════════════════════════════════════════════════════════╝',

    '',

    '[SYS] Connexion sécurisée établie.',

    '[SYS] Quelqu\'un vous a laissé accéder à ce terminal.',

    '',

    '→ Tapez help pour voir ce que vous pouvez faire.',

    '──────────────────────────────────────────────────────────────',

  ]

}



function App() {

  const [authenticated, setAuthenticated] = useState(false)

  const [authUser, setAuthUser] = useState(null)

  const [authChecking, setAuthChecking] = useState(true)

  const [demoMode, setDemoMode] = useState(false)

  const [showWelcome, setShowWelcome] = useState(false)

  const [welcomeLoading, setWelcomeLoading] = useState(false)

  const [howToOpen, setHowToOpen] = useState(false)

  const [mysteryEffect, setMysteryEffect] = useState(null)



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



  const triggerGameOver = useCallback((skipToFinal = false) => {

    if (gameOverTriggeredRef.current) return

    gameOverTriggeredRef.current = true

    setGameOverSkipToFinal(skipToFinal)

    setGameOverActive(true)

  }, [])



  const loadGame = useCallback(async () => {

    setLoading(true)

    try {

      const state = await fetchGameState()

      setGameState(state)

      if (state.gameOver) triggerGameOver(true)

      setError(null)

      setBooting(true)

      bootDoneRef.current = false

    } catch (err) {

      setError(`Impossible de charger la session (${err.message})`)

    } finally {

      setLoading(false)

    }

  }, [triggerGameOver])



  const launchDemoGame = useCallback(async (loadFn) => {

    setWelcomeLoading(true)

    enableDemoMode()

    setDemoMode(true)

    setAuthUser({ username: 'GHOST' })

    setAuthenticated(true)

    setShowWelcome(false)

    setError(null)

    uiIntrosHandledRef.current = {}

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

  }, [loadGame, triggerGameOver])



  const handleWelcomeReset = useCallback(async () => {

    if (!window.confirm('Réinitialiser la sauvegarde ? Toute progression sera perdue.')) {

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

    setTerminalLines(buildPostBootLines())

  }, [])



  const appendTerminalLine = useCallback((line) => {

    setTerminalLines((prev) => [...prev, line])

  }, [])



  const appendIntroLines = useCallback((state) => {

    const newIntros = collectNewIntros(state, uiIntrosHandledRef.current)

    if (!newIntros.length) return

    const lines = newIntros.flatMap((key) => getIntroLines(key))

    uiIntrosHandledRef.current = {

      ...uiIntrosHandledRef.current,

      ...Object.fromEntries(newIntros.map((k) => [k, true])),

    }

    setTerminalLines((prev) => [...prev, '', ...lines, ''])

  }, [])



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

    if (gameState?.gameOver && !fakeOver) return



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

        if (result.state?.codex?.discoveredCount > (gameState?.codex?.discoveredCount ?? 0)) {

          appendTerminalLine('[SYS] Nouvelle découverte enregistrée dans le Codex.')

        }



      if (result.state.gameOver && !result.state.fakeGameOverActive) triggerGameOver(false)

      const lastLog = result.state.events_log?.[result.state.events_log.length - 1]

      if (lastLog?.startsWith('[CODEX]')) {

        appendTerminalLine(lastLog)

      }

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

      ...buildPostBootLines(),

      extraLine || result.message || '[SYS] Sauvegarde rechargée.',

      '',

    ])

    setError(null)

    setGameOverActive(false)

    setGameOverSkipToFinal(false)

    gameOverTriggeredRef.current = false

    setOpenApps(['terminal'])

    bootDoneRef.current = true

    setBooting(false)

  }, [])



  const handleReset = async (skipConfirm = false) => {

    if (!skipConfirm && !window.confirm('Réinitialiser la sauvegarde ? Toute progression sera perdue.')) {

      return

    }



    try {

      const result = await resetGame()

      applyGameReload(result, '[SYS] Sauvegarde réinitialisée — Mission 1.')

    } catch (err) {

      setError(`Erreur reset : ${err.message}`)

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

        if (result.autoLines?.length) {

          setTerminalLines((prev) => [...prev, ...result.autoLines, ''])

        }

        const lastLog = result.state.events_log?.[result.state.events_log.length - 1]

        if (lastLog?.startsWith('[CODEX]')) {

          setTerminalLines((prev) => [...prev, lastLog, ''])

        }

      } catch {

        /* ignore tick errors */

      }

    }, 45000)

    return () => clearInterval(id)

  }, [inDemo, showWelcome, authenticated, loading, booting])



  const isLocked = !!error || commandLoading || gameOverActive

    || (gameState?.gameOver && !gameState?.fakeGameOverActive)



  const networkTheme = gameState?.network?.currentNodeMeta?.theme ?? 'default'

  const operatorName = authUser?.username || 'GHOST'

  const ui = computeUiProgression(gameState)

  const terminalTitle = ui.earlyGame

    ? 'TERMINAL SÉCURISÉ'

    : gameState?.network?.connected

      ? `${gameState.network.currentNodeMeta.displayName} — TERMINAL`

      : `${operatorName} — TERMINAL`



  if (authChecking) {

    return (

      <div className="app app--loading">

        <div className="loader">

          <span className="loader__text">ULTRATECH ONLINE</span>

          <span className="loader__bar" />

          <span className="loader__sub">Connexion réseau détectée…</span>

        </div>

      </div>

    )

  }



  if (showWelcome) {

    return (

      <WelcomeScreen

        loading={welcomeLoading}

        onOpenBeta={() => launchDemoGame(null)}

        onReset={handleWelcomeReset}

      />

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

              <span className="loader__sub">Chargement de la session…</span>

            </div>

          </div>

        )}

      </>

    )

  }



  return (

    <div className={`app app--theme-${networkTheme} ${ui.earlyGame ? 'app--focus-terminal' : ''} ${gameOverActive ? 'app--game-over' : ''} ${mysteryEffect ? 'app--mystery-active' : ''}`}>

      <div className="app__immersion" aria-hidden="true">

        <div className="app__scanlines" />

        <div className="app__vignette" />

      </div>



      <TopBar

        state={gameState}

        onReset={handleReset}

        onOpenHowTo={() => setHowToOpen(true)}

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

                <button onClick={() => loadGame()}>Réessayer</button>

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

              />

            </AppWindow>



            {ui.unlockedApps.includes('chat') && (

            <AppWindow

              title="CANAL CLANDESTIN"

              active={openApps.includes('chat')}

              onClose={() => handleCloseApp('chat')}

              variant="secondary"

            >

              <GlobalChat username={authUser?.username} disabled={isLocked} demoMode={inDemo} />

            </AppWindow>

            )}



            {ui.unlockedApps.includes('toolkit') && (

            <AppWindow

              title="BOÎTE À OUTILS"

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

              title="JOURNAL DE MISSIONS"

              active={openApps.includes('journal')}

              onClose={() => handleCloseApp('journal')}

              variant="secondary"

            >

              <MissionJournal journal={gameState?.missionJournal} />

            </AppWindow>

            )}



            {ui.unlockedApps.includes('codex') && (

            <AppWindow

              title="CODEX — REGISTRE CLASSIFIÉ"

              active={openApps.includes('codex')}

              onClose={() => handleCloseApp('codex')}

              variant="secondary"

            >

              <Codex codex={gameState?.codex} />

            </AppWindow>

            )}



            {ui.unlockedApps.includes('market') && (

            <AppWindow

              title="BLACK MARKET"

              active={openApps.includes('market')}

              onClose={() => handleCloseApp('market')}

              variant="secondary"

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

        <span>{ui.earlyGame ? 'Connexion sécurisée active' : `UltraTech Corp. — ${operatorName}`}</span>

        <div className="footer__right">

          {inDemo && !ui.earlyGame && <FeedbackButton variant="ghost" />}

          <span className="footer__blink">

            {gameState?.gameOver
              ? '● SESSION COMPROMISE'
              : ui.earlyGame
                ? '● ligne ouverte'
                : '● VOUS ÊTES OBSERVÉ'}

          </span>

        </div>

      </footer>



      <HowToPlayPanel open={howToOpen} onClose={() => setHowToOpen(false)} />



      <MysteryOverlay
        effect={mysteryEffect || gameState?.activeUiEffect}
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

