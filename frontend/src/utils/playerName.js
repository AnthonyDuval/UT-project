export const DEFAULT_PLAYER_NAME = 'ghost_operator'
export const PLAYER_NAME_MIN = 3
export const PLAYER_NAME_MAX = 20
const PLAYER_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/

export function sanitizePlayerName(raw) {
  if (typeof raw !== 'string') return DEFAULT_PLAYER_NAME
  const trimmed = raw.trim()
  if (!trimmed) return DEFAULT_PLAYER_NAME
  const cleaned = trimmed.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, PLAYER_NAME_MAX)
  if (cleaned.length < PLAYER_NAME_MIN) return DEFAULT_PLAYER_NAME
  return cleaned
}

export function validatePlayerName(raw) {
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  if (!trimmed) {
    return { valid: true, name: DEFAULT_PLAYER_NAME, usedFallback: true }
  }
  if (trimmed.length < PLAYER_NAME_MIN || trimmed.length > PLAYER_NAME_MAX) {
    return { valid: false, error: 'length' }
  }
  if (!PLAYER_NAME_PATTERN.test(trimmed)) {
    return { valid: false, error: 'chars' }
  }
  return { valid: true, name: trimmed, usedFallback: false }
}

export function getPlayerDisplayName(saveOrPlayer) {
  const player = saveOrPlayer?.player || saveOrPlayer
  const name = player?.username
  if (name && typeof name === 'string' && name.trim()) return name.trim()
  return DEFAULT_PLAYER_NAME
}

export function interpolatePlayerName(text, playerName) {
  if (typeof text !== 'string') return text
  return text.replace(/\{\{playerName\}\}/g, playerName)
}
