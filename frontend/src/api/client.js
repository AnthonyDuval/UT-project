/** Client API REST — backend FastAPI ou mode démo offline local */

import { executeDemoCommand, getDemoState, loadAdvancedDemoGame, resetDemoGame } from '../demo/demoEngine'
import { buyDemoItem, getDemoInventory, getDemoMarket, useDemoItem } from '../demo/demoMarket'
import { loadDemoChat, saveDemoChat } from '../demo/demoStorage'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'ut_auth_token'

let DEMO_MODE = false

export function isDemoMode() {
  return DEMO_MODE
}

/** Hébergement Netlify (preview ou production). */
export function isNetlifyHost() {
  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  return (
    host.endsWith('.netlify.app')
    || host.endsWith('.netlify.live')
    || import.meta.env.VITE_NETLIFY === 'true'
  )
}

/** Force le mode démo (bouton manuel ou init). */
export function enableDemoMode() {
  DEMO_MODE = true
  clearAuthToken()
  return true
}

/** Teste /api/health — active DEMO_MODE si Netlify ou backend inaccessible. */
export async function detectApi() {
  if (isNetlifyHost()) {
    enableDemoMode()
    return true
  }
  const ok = await checkHealth()
  if (!ok) {
    enableDemoMode()
    return true
  }
  DEMO_MODE = false
  return false
}

function demoDelay(result) {
  return new Promise((resolve) => setTimeout(() => resolve(result), 80))
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function apiFetch(endpoint, options = {}) {
  const headers = { ...(options.headers || {}) }
  const token = getAuthToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401 && token) {
    clearAuthToken()
    const err = new Error('Session expirée — reconnectez-vous.')
    err.code = 'UNAUTHORIZED'
    throw err
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const detail = error.detail
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : `Erreur API (${response.status})`
    console.error(`[API] ${options.method || 'GET'} ${endpoint} → ${response.status}`, message)
    throw new Error(message)
  }

  return response.json()
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function registerUser(username, password) {
  if (DEMO_MODE) {
    throw new Error('Inscription indisponible en mode démo offline.')
  }
  const result = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setAuthToken(result.token)
  return result
}

export async function loginUser(username, password) {
  if (DEMO_MODE) {
    throw new Error('Connexion indisponible en mode démo offline.')
  }
  const result = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setAuthToken(result.token)
  return result
}

export async function logoutUser() {
  if (DEMO_MODE) return
  try {
    await apiFetch('/auth/logout', { method: 'POST' })
  } finally {
    clearAuthToken()
  }
}

export async function fetchMe() {
  if (DEMO_MODE) {
    return demoDelay({ username: 'ghost_demo' })
  }
  return apiFetch('/auth/me')
}

// ─── Jeu ────────────────────────────────────────────────────────────────────

export async function fetchGameState() {
  if (DEMO_MODE) {
    return demoDelay(getDemoState())
  }
  return apiFetch('/state')
}

export async function sendCommand(command) {
  if (DEMO_MODE) {
    return demoDelay(executeDemoCommand(command))
  }
  return apiFetch('/command', {
    method: 'POST',
    body: JSON.stringify({ command }),
  })
}

export async function resetGame() {
  if (DEMO_MODE) {
    return demoDelay(resetDemoGame())
  }
  return apiFetch('/reset', { method: 'POST' })
}

export async function loadAdvancedDemo() {
  if (!DEMO_MODE) {
    throw new Error('Démo avancée disponible uniquement en mode offline.')
  }
  return demoDelay(loadAdvancedDemoGame())
}

export async function checkHealth() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)
    const response = await fetch(`${API_BASE}/health`, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (!response.ok) return false
    const data = await response.json().catch(() => ({}))
    return data?.status === 'ok'
  } catch {
    return false
  }
}

export async function fetchMarket() {
  if (DEMO_MODE) {
    return demoDelay(getDemoMarket())
  }
  return apiFetch('/market')
}

export async function buyMarketItem(itemId) {
  if (DEMO_MODE) {
    return demoDelay(buyDemoItem(itemId))
  }
  return apiFetch('/market/buy', {
    method: 'POST',
    body: JSON.stringify({ itemId }),
  })
}

export async function fetchInventory() {
  if (DEMO_MODE) {
    return demoDelay(getDemoInventory())
  }
  return apiFetch('/inventory')
}

export async function useInventoryItem(itemId) {
  if (DEMO_MODE) {
    return demoDelay(useDemoItem(itemId))
  }
  return apiFetch('/inventory/use', {
    method: 'POST',
    body: JSON.stringify({ itemId }),
  })
}

// ─── Chat ───────────────────────────────────────────────────────────────────

export async function fetchChat() {
  if (DEMO_MODE) {
    return demoDelay({ messages: loadDemoChat() })
  }
  return apiFetch('/chat')
}

export async function sendChatMessage(message) {
  if (DEMO_MODE) {
    const messages = loadDemoChat()
    messages.push({
      username: 'ghost_demo',
      timestamp: new Date().toISOString(),
      message,
    })
    saveDemoChat(messages)
    return demoDelay({ ok: true })
  }
  return apiFetch('/chat/send', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}
