import { useCallback, useEffect, useRef, useState } from 'react'
import {
  detectApi,
  enableDemoMode,
  fetchGameState,
  fetchMe,
  getAuthToken,
  isDemoMode,
  logoutUser,
  resetGame,
  sendCommand,
} from './api/client'
import Terminal from './components/Terminal'
import StatusBar from './components/StatusBar'
import TopBar from './components/TopBar'
import GameOverSequence from './components/GameOverSequence'
import BootScreen from './components/BootScreen'
import AppWindow from './components/AppWindow'
import BlackMarket from './components/BlackMarket'
import MissionJournal from './components/MissionJournal'
import ProgramToolkit from './components/ProgramToolkit'
import GlobalChat from './components/GlobalChat'
import AuthScreen from './components/AuthScreen'
import DemoBanner from './components/DemoBanner'
import './App.css'

function buildPostBootLines(username, demo = false) {
  const lines = [
    '╔══════════════════════════════════════════════════════════════╗',
    '║       ULTRATECH ONLINE — TERMINAL OPÉRATEUR v3.7             ║',
    '╚══════════════════════════════════════════════════════════════╝',
    '',
    `[SYS] Session établie — opérateur : ${username}`,
  ]
  if (demo) {
    lines.push('[DEMO] Mode offline — sauvegarde locale active.')
    lines.push('[DEMO] Aucune connexion serveur — explorez librement.')
  }
  lines.push(
    '[SYS] Surveillance UltraTech : ACTIVE',
    '[WARN] Toute action anormale augmentera votre TRACE',
    '',
    '→ Tapez help pour lister les commandes de base.',
    '→ Consultez les fichiers dans le panneau gauche.',
    '──────────────────────────────────────────────────────────────',
  )
  return lines
}

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [authUser, setAuthUser] = useState(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [demoMode, setDemoMode] = useState(false)

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

  const triggerGameOver = useCallback((skipToFinal = false) => {
    if (gameOverTriggeredRef.current) return
    gameOverTriggeredRef.current = true
    setGameOverSkipToFinal(skipToFinal)
    setGameOverActive(true)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser()
    } catch {
      /* token cleared in client */
    }
    setAuthenticated(false)
    setAuthUser(null)
    setGameState(null)
    setTerminalLines([])
    setBooting(false)
    setLoading(false)
    bootDoneRef.current = false
    gameOverTriggeredRef.current = false
    setGameOverActive(false)
    setOpenApps(['terminal'])
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
      if (isDemoMode() || demoMode) {
        setError(`Impossible de charger la démo (${err.message})`)
      } else if (err.code === 'UNAUTHORIZED') {
        await handleLogout()
      } else {
        setError(`Impossible de charger la sauvegarde (${err.message})`)
      }
    } finally {
      setLoading(false)
    }
  }, [triggerGameOver, handleLogout, demoMode])

  const startDemoSession = useCallback(async () => {
    enableDemoMode()
    setDemoMode(true)
    setAuthUser({ username: 'ghost_demo' })
    setAuthenticated(true)
    setAuthChecking(true)
    setError(null)
    await loadGame()
    setAuthChecking(false)
  }, [loadGame])

  const checkAuth = useCallback(async () => {
    if (isDemoMode()) return
    setAuthChecking(true)
    const token = getAuthToken()
    if (!token) {
      setAuthenticated(false)
      setAuthChecking(false)
      return
    }
    try {
      const user = await fetchMe()
      setAuthUser(user)
      setAuthenticated(true)
      await loadGame()
    } catch {
      setAuthenticated(false)
      setAuthUser(null)
    } finally {
      setAuthChecking(false)
    }
  }, [loadGame])

  useEffect(() => {
    if (initDoneRef.current) return
    initDoneRef.current = true

    async function init() {
      setAuthChecking(true)
      const offline = await detectApi()
      if (offline) {
        await startDemoSession()
        return
      }
      await checkAuth()
    }
    init()
  }, [checkAuth, startDemoSession])

  const handleAuthenticated = useCallback(async (result) => {
    if (isDemoMode()) return
    setAuthUser({ username: result.username })
    setAuthenticated(true)
    await loadGame()
  }, [loadGame])

  const handleBootComplete = useCallback(() => {
    if (bootDoneRef.current) return
    bootDoneRef.current = true
    setBooting(false)
    setTerminalLines(buildPostBootLines(
      authUser?.username || gameState?.player?.username || 'operateur',
      demoMode || isDemoMode(),
    ))
  }, [authUser, gameState, demoMode])

  const appendTerminalLine = useCallback((line) => {
    setTerminalLines((prev) => [...prev, line])
  }, [])

  const handleStateUpdate = useCallback((state) => {
    setGameState(state)
    if (state.gameOver) triggerGameOver(false)
  }, [triggerGameOver])

  const handleOpenApp = (appId) => {
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
    if (!command.trim() || commandLoading || gameState?.gameOver || gameOverActive) return

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
      setError(null)

      if (result.state.gameOver) triggerGameOver(false)
      if (result.state.marketUnlocked && !openApps.includes('market')) {
        appendTerminalLine('[SYS] Nouvelle app : BLACK MARKET disponible.')
      }
    } catch (err) {
      if (isDemoMode()) {
        /* pas de déconnexion en mode démo */
      } else if (err.code === 'UNAUTHORIZED') {
        handleLogout()
      } else {
        setTerminalLines((prev) => [...prev, `[ERR] ${err.message}`, ''])
      }
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

  const handleReset = async (skipConfirm = false) => {
    if (!skipConfirm && !window.confirm('Réinitialiser la sauvegarde ? Toute progression sera perdue.')) {
      return
    }

    try {
      const result = await resetGame()
      setGameState(result.state)
      setTerminalLines([
        ...buildPostBootLines(authUser?.username || 'operateur', demoMode),
        demoMode ? '[DEMO] Sauvegarde locale réinitialisée.' : '[SYS] Sauvegarde réinitialisée.',
        '',
      ])
      setError(null)
      setGameOverActive(false)
      setGameOverSkipToFinal(false)
      gameOverTriggeredRef.current = false
      setOpenApps(['terminal'])
    } catch (err) {
      if (err.code === 'UNAUTHORIZED') handleLogout()
      else setError(`Erreur reset : ${err.message}`)
    }
  }

  const handleGameOverRestart = () => handleReset(true)

  const isLocked = !!error || commandLoading || gameState?.gameOver || gameOverActive
  const inDemo = demoMode || isDemoMode()

  const networkTheme = gameState?.network?.currentNodeMeta?.theme ?? 'default'
  const operatorName = gameState?.player?.username || authUser?.username || 'operateur'
  const terminalTitle = gameState?.network?.connected
    ? `${gameState.network.currentNodeMeta.displayName} — TERMINAL SECURE SHELL`
    : `${operatorName}@ultratech — TERMINAL SECURE SHELL`

  if (authChecking) {
    return (
      <div className="app app--loading">
        <div className="loader">
          <span className="loader__text">ULTRATECH ONLINE</span>
          <span className="loader__bar" />
          <span className="loader__sub">Initialisation du terminal...</span>
        </div>
      </div>
    )
  }

  if (!authenticated && !inDemo) {
    return (
      <AuthScreen
        onAuthenticated={handleAuthenticated}
        onEnterDemo={startDemoSession}
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
              <span className="loader__sub">Chargement de la sauvegarde...</span>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className={`app app--theme-${networkTheme} ${gameOverActive ? 'app--game-over' : ''}`}>
      <div className="app__immersion" aria-hidden="true">
        <div className="app__scanlines" />
        <div className="app__vignette" />
      </div>

      {inDemo && <DemoBanner />}

      <TopBar
        state={gameState}
        onReset={handleReset}
        onLogout={handleLogout}
        username={authUser?.username}
        demoMode={inDemo}
      />

      <main className="desktop">
        <aside className="sidebar">
          <StatusBar
            state={gameState}
            onFileOpen={handleFileOpen}
            onOpenApp={handleOpenApp}
            onRunProgram={handleCommand}
            openApps={openApps}
            marketUnlocked={gameState?.marketUnlocked}
          />
        </aside>

        <div className="workspace">
          <div className={`windows ${openApps.some((a) => ['market', 'journal', 'toolkit', 'chat'].includes(a)) ? 'windows--split' : ''}`}>
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

            <AppWindow
              title="CANAL CLANDESTIN — chat://global"
              active={openApps.includes('chat')}
              onClose={() => handleCloseApp('chat')}
              variant="secondary"
            >
              <GlobalChat username={authUser?.username} disabled={isLocked} demoMode={inDemo} />
            </AppWindow>

            <AppWindow
              title="TOOLKIT — /programs · /inventory"
              active={openApps.includes('toolkit')}
              onClose={() => handleCloseApp('toolkit')}
              variant="secondary"
            >
              <ProgramToolkit
                toolkit={gameState?.programToolkit}
                onRun={handleCommand}
              />
            </AppWindow>

            <AppWindow
              title="JOURNAL DE MISSIONS — ops://mission_log"
              active={openApps.includes('journal')}
              onClose={() => handleCloseApp('journal')}
              variant="secondary"
            >
              <MissionJournal journal={gameState?.missionJournal} />
            </AppWindow>

            <AppWindow
              title="BLACK MARKET — blacknode://market"
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
          </div>
        </div>
      </main>

      <footer className="footer">
        <span>UltraTech Corp. — Opérateur : {operatorName}</span>
        <span className="footer__blink">
          {gameState?.gameOver ? '● SESSION COMPROMISED' : '● SYSTÈME ACTIF — VOUS ÊTES OBSERVÉ'}
        </span>
      </footer>

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
