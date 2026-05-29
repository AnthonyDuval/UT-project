/** Client API REST — communication avec le backend FastAPI multijoueur */

const API_BASE = 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'ut_auth_token'

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
  const result = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setAuthToken(result.token)
  return result
}

export async function loginUser(username, password) {
  const result = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setAuthToken(result.token)
  return result
}

export async function logoutUser() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' })
  } finally {
    clearAuthToken()
  }
}

export async function fetchMe() {
  return apiFetch('/auth/me')
}

// ─── Jeu ────────────────────────────────────────────────────────────────────

export async function fetchGameState() {
  return apiFetch('/state')
}

export async function sendCommand(command) {
  return apiFetch('/command', {
    method: 'POST',
    body: JSON.stringify({ command }),
  })
}

export async function resetGame() {
  return apiFetch('/reset', { method: 'POST' })
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`)
    if (!response.ok) return false
    const data = await response.json().catch(() => ({}))
    return data?.status === 'ok'
  } catch {
    return false
  }
}

export async function fetchMarket() {
  return apiFetch('/market')
}

export async function buyMarketItem(itemId) {
  return apiFetch('/market/buy', {
    method: 'POST',
    body: JSON.stringify({ itemId }),
  })
}

export async function fetchInventory() {
  return apiFetch('/inventory')
}

export async function useInventoryItem(itemId) {
  return apiFetch('/inventory/use', {
    method: 'POST',
    body: JSON.stringify({ itemId }),
  })
}

// ─── Chat ───────────────────────────────────────────────────────────────────

export async function fetchChat() {
  return apiFetch('/chat')
}

export async function sendChatMessage(message) {
  return apiFetch('/chat/send', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}
