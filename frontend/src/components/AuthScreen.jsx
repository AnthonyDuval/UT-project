import { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import './AuthScreen.css'

/**
 * Écran d'authentification — connexion / inscription opérateur.
 */
export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSuccess = (result) => {
    setError(null)
    onAuthenticated?.(result)
  }

  const handleError = (err) => {
    setError(err.message)
    setLoading(false)
  }

  return (
    <div className="auth-screen">
      <div className="auth-screen__immersion" aria-hidden="true">
        <div className="auth-screen__scanlines" />
        <div className="auth-screen__vignette" />
      </div>

      <div className="auth-screen__container">
        <header className="auth-screen__header">
          <span className="auth-screen__logo">◈</span>
          <h1 className="auth-screen__title">ULTRATECH ONLINE</h1>
          <p className="auth-screen__subtitle">Réseau clandestin — accès opérateur</p>
        </header>

        <div className="auth-screen__tabs">
          <button
            type="button"
            className={`auth-screen__tab ${mode === 'login' ? 'auth-screen__tab--active' : ''}`}
            onClick={() => { setMode('login'); setError(null) }}
          >
            Se connecter
          </button>
          <button
            type="button"
            className={`auth-screen__tab ${mode === 'register' ? 'auth-screen__tab--active' : ''}`}
            onClick={() => { setMode('register'); setError(null) }}
          >
            Créer un opérateur
          </button>
        </div>

        <div className="auth-screen__panel">
          {error && <div className="auth-screen__error">{error}</div>}

          {mode === 'login' ? (
            <LoginForm
              loading={loading}
              setLoading={setLoading}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          ) : (
            <RegisterForm
              loading={loading}
              setLoading={setLoading}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}
        </div>

        <footer className="auth-screen__footer">
          <span>UltraTech Corp. surveille toute connexion non autorisée</span>
          <span className="auth-screen__blink">● ACCÈS CLANDESTIN UNIQUEMENT</span>
        </footer>
      </div>
    </div>
  )
}
