import { useState } from 'react'
import { registerUser } from '../api/client'

export default function RegisterForm({ loading, setLoading, onSuccess, onError }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    if (password !== confirm) {
      onError(new Error('Les mots de passe ne correspondent pas.'))
      return
    }

    setLoading(true)
    try {
      const result = await registerUser(username, password)
      onSuccess(result)
    } catch (err) {
      onError(err)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-form__field">
        <span>Choisir un pseudo</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="votre_pseudo"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]+"
          title="Lettres, chiffres et underscore uniquement"
        />
      </label>

      <label className="auth-form__field">
        <span>Mot de passe</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6 caractères minimum"
          autoComplete="new-password"
          required
          minLength={6}
        />
      </label>

      <label className="auth-form__field">
        <span>Confirmer</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          required
          minLength={6}
        />
      </label>

      <button type="submit" className="auth-form__submit auth-form__submit--create" disabled={loading}>
        {loading ? 'Création...' : 'Créer un opérateur'}
      </button>

      <p className="auth-form__hint">
        Chaque opérateur possède sa propre sauvegarde, progression et inventaire.
      </p>
    </form>
  )
}
