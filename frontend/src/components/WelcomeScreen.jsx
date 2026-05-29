import './WelcomeScreen.css'

/**
 * Écran d'accueil — portail clandestin avant ouverture du terminal.
 */
export default function WelcomeScreen({ loading, onOpenBeta, onReset }) {
  return (
    <div className="welcome">
      <div className="welcome__immersion" aria-hidden="true">
        <div className="welcome__grid" />
        <div className="welcome__scanlines" />
        <div className="welcome__vignette" />
      </div>

      <div className="welcome__container">
        <header className="welcome__header">
          <div className="welcome__sigil" aria-hidden="true">
            <span className="welcome__sigil-ring" />
            <span className="welcome__sigil-core">◈</span>
          </div>
          <h1 className="welcome__title">ULTRATECH ONLINE</h1>
          <p className="welcome__subtitle">Connexion réseau détectée.</p>
        </header>

        <div className="welcome__actions">
          <button
            type="button"
            className="welcome__btn welcome__btn--primary"
            onClick={onOpenBeta}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="welcome__btn-pulse" aria-hidden="true" />
                Établissement du lien…
              </>
            ) : (
              'OUVRIR LA BÊTA TEST'
            )}
          </button>

          <button
            type="button"
            className="welcome__btn welcome__btn--reset"
            onClick={onReset}
            disabled={loading}
          >
            Réinitialiser la sauvegarde
          </button>
        </div>

        <footer className="welcome__footer">
          <span className="welcome__status">
            <span className="welcome__status-dot" aria-hidden="true" />
            Canal chiffré · accès restreint
          </span>
        </footer>
      </div>
    </div>
  )
}
