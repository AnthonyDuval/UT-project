/**
 * Service Codex — découvertes et état public.
 */

import {
  CODEX_ENTRIES,
  CODEX_ORDER,
  EVENT_TO_CODEX,
  FILE_TO_CODEX,
} from './codexCatalog'
import { filterCodexOrder, NOVA_CODEX_IDS } from '../utils/novaGate'

export function ensureCodexState(save) {
  if (!save.codexDiscovered) save.codexDiscovered = {}
  if (!save.codexNotified) save.codexNotified = {}
}

/** Entrée déjà débloquée (save + localStorage via codexDiscovered). */
export function isUnlocked(save, entryId) {
  if (!entryId || !CODEX_ENTRIES[entryId]) return false
  ensureCodexState(save)
  return Object.prototype.hasOwnProperty.call(save.codexDiscovered, entryId)
}

function queueCodexDiscovery(save, entryId) {
  save._pendingCodexDiscoveries = save._pendingCodexDiscoveries || []
  if (save._pendingCodexDiscoveries.some((e) => e.id === entryId)) return
  save._pendingCodexDiscoveries.push({
    id: entryId,
    name: CODEX_ENTRIES[entryId].name,
  })
}

/**
 * Débloque une entrée une seule fois.
 * @returns {boolean} true si nouvelle découverte
 */
export function discoverCodex(save, entryId) {
  if (!CODEX_ENTRIES[entryId]) return false
  if (NOVA_CODEX_IDS.has(entryId) && !save.novaIntroSeen) return false
  if (isUnlocked(save, entryId)) return false

  ensureCodexState(save)
  save.codexDiscovered[entryId] = new Date().toISOString()
  save.events_log = save.events_log || []
  save.events_log.push(`[CODEX] Entrée débloquée : ${CODEX_ENTRIES[entryId].name}`)
  queueCodexDiscovery(save, entryId)

  return true
}

export function discoverCodexFromEvent(save, eventId) {
  const entryId = EVENT_TO_CODEX[eventId]
  if (!entryId) return false
  return discoverCodex(save, entryId)
}

export function discoverCodexFromFile(save, filename) {
  const entryId = FILE_TO_CODEX[filename]
  if (!entryId) return false
  return discoverCodex(save, entryId)
}

/** Consomme et retourne les découvertes en attente (évite les doublons côté UI). */
export function consumePendingCodexDiscoveries(save) {
  const pending = save._pendingCodexDiscoveries || []
  delete save._pendingCodexDiscoveries

  const fresh = []
  ensureCodexState(save)
  for (const entry of pending) {
    if (save.codexNotified[entry.id]) continue
    save.codexNotified[entry.id] = true
    fresh.push(entry)
  }
  return fresh
}

export function buildCodexState(save) {
  ensureCodexState(save)
  const discovered = save.codexDiscovered
  const order = filterCodexOrder(CODEX_ORDER, save.novaIntroSeen)
  const total = order.length

  const entries = order.map((id, index) => {
    const meta = CODEX_ENTRIES[id]
    const discoveredAt = discovered[id]

    if (discoveredAt) {
      return {
        id,
        slot: index + 1,
        discovered: true,
        discoveredAt,
        name: meta.name,
        description: meta.description,
        nextHint: meta.nextHint,
        rarity: meta.rarity,
      }
    }

    return {
      id,
      slot: index + 1,
      discovered: false,
      discoveredAt: null,
      name: '???',
      description: null,
      nextHint: null,
      rarity: null,
    }
  })

  const discoveredCount = order.filter((id) => discovered[id]).length

  return {
    total,
    discoveredCount,
    progressLabel: `${discoveredCount}/${total}`,
    entries,
    novaRevealed: !!save.novaIntroSeen,
  }
}
