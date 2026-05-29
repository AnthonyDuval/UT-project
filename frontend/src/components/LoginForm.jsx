import { useState } from 'react'
import { loginUser } from '../api/client'

export default function LoginForm({ loading, setLoading, onSuccess, onError }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const result = await loginUser(username, password)
      onSuccess(result)
    } catch (err) {
      onError(err)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-form__field">
        <span>Pseudo opérateur</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ghost_operative"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
        />
      </label>

      <label className="auth-form__field">
        <span>Mot de passe</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </label>

      <button type="submit" className="auth-form__submit" disabled={loading}>
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  )
}
