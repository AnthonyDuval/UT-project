/**
 * RandomCinematicEvents — tirage aléatoire rare toutes les 45–90 s.
 */

import {
  CINEMATIC_GLOBAL_COOLDOWN_MS,
  CINEMATIC_TYPES,
  ensureCinematicState,
  fireCinematicEvent,
} from './CinematicEventSystem'

export const ROLL_INTERVAL_MIN_MS = 45000
export const ROLL_INTERVAL_MAX_MS = 90000

/** Chance de base qu'un événement soit tiré à chaque intervalle (faible). */
export const BASE_ROLL_CHANCE = 0.28

export function getRandomRollDelayMs() {
  return ROLL_INTERVAL_MIN_MS + Math.random() * (ROLL_INTERVAL_MAX_MS - ROLL_INTERVAL_MIN_MS)
}

function canRollCinematic(save, { blocked = false } = {}) {
  if (blocked) return false
  if (save.gameOver) return false
  if (save.activeCinematic) return false
  if (save.activeCharacterTransmission) return false
  if (save.fakeGameOverUntil && Date.now() < save.fakeGameOverUntil) return false

  ensureCinematicState(save)

  const sinceGlobal = Date.now() - (save.cinematicLastGlobalAt || 0)
  if (save.cinematicLastGlobalAt && sinceGlobal < CINEMATIC_GLOBAL_COOLDOWN_MS) {
    return false
  }

  return true
}

/** Poids relatifs selon TRACE — normalisés en interne. */
function getEventWeights(traceLevel = 0) {
  return {
    [CINEMATIC_TYPES.ULTRATECH_TRANSMISSION]: traceLevel > 50 ? 0.48 : 0.22,
    [CINEMATIC_TYPES.VOID_RELAY]: 0.14,
    [CINEMATIC_TYPES.SYSTEM_FAILURE]: traceLevel > 75 ? 0.38 : 0.12,
  }
}

function pickWeightedEvent(traceLevel) {
  const weights = getEventWeights(traceLevel)
  const entries = Object.entries(weights)
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = Math.random() * total

  for (const [type, weight] of entries) {
    roll -= weight
    if (roll <= 0) return type
  }

  return entries[entries.length - 1][0]
}

/**
 * Tente de déclencher un événement cinématique aléatoire.
 * @returns {{ cinematic, autoLines, fired } | { cinematic: null, autoLines: [], fired: null }}
 */
export function rollRandomCinematic(save, options = {}) {
  const empty = { cinematic: null, autoLines: [], fired: null }

  if (!canRollCinematic(save, options)) return empty

  if (Math.random() > BASE_ROLL_CHANCE) return empty

  const type = pickWeightedEvent(save.traceLevel || 0)
  const eventId = `random_${type}`

  const result = fireCinematicEvent(save, type, eventId)
  if (!result) return empty

  ensureCinematicState(save)
  if (!save.cinematicSeenEvents.includes(eventId)) {
    save.cinematicSeenEvents.push(eventId)
  }

  return { ...result, fired: eventId }
}

export default rollRandomCinematic
