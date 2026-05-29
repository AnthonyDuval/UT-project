import { useState } from 'react'
import HowToPlayPanel from './HowToPlayPanel'
import FeedbackButton from './FeedbackButton'
import './WelcomeScreen.css'

/**
 * Écran d'accueil alpha — avant d'entrer dans la démo offline.
 */
export default function WelcomeScreen({
  loading,
  onContinue,
  onNewGame,
  onAdvanced,
}) {
  const [howToOpen, setHowToOpen] = useState(false)

  return (
    <div className="welcome">
      <div className="welcome__immersion" aria-hidden="true">
        <div className="welcome__scanlines" />
        <div className="welcome__vignette" />
      </div>

      <div className="welcome__container">
        <header className="welcome__header">
          <span className="welcome__logo" aria-hidden="true">◈</span>
          <h1 className="welcome__title">ULTRATECH ONLINE</h1>
          <p className="welcome__tagline">Prototype alpha — mode démo offline</p>
          <p className="welcome__pitch">
            Jeu narratif de hacking en terminal. Infiltrez le réseau UltraTech,
            survivez à la TRACE et découvrez les secrets de N0VA.
          </p>
        </header>

        <div className="welcome__actions">
          <button
            type="button"
            className="welcome__btn welcome__btn--primary"
            onClick={onContinue}
            disabled={loading}
          >
            {loading ? 'Chargement…' : 'Entrer dans la démo'}
          </button>
          <p className="welcome__hint">Reprendre votre sauvegarde locale</p>

          <button
            type="button"
            className="welcome__btn welcome__btn--secondary"
            onClick={onNewGame}
            disabled={loading}
          >
            Nouvelle partie
          </button>
          <p className="welcome__hint">Mission 1 — Signal Fantôme · TRACE 0</p>

          <button
            type="button"
            className="welcome__btn welcome__btn--advanced"
            onClick={onAdvanced}
            disabled={loading}
          >
            Démo avancée
          </button>
          <p className="welcome__hint">Showcase — SATLINK, Black Market, Mission 2</p>

          <button
            type="button"
            className="welcome__btn welcome__btn--ghost"
            onClick={() => setHowToOpen(true)}
            disabled={loading}
          >
            Comment jouer ?
          </button>
        </div>

        <footer className="welcome__footer">
          <FeedbackButton variant="ghost" />
          <span className="welcome__version">Alpha 0.1 · Demo Offline · Netlify</span>
        </footer>
      </div>

      <HowToPlayPanel open={howToOpen} onClose={() => setHowToOpen(false)} />
    </div>
  )
}
