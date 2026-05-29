/**
 * Service Codex — découvertes et état public.
 */

import {
  CODEX_ENTRIES,
  CODEX_ORDER,
  CODEX_TOTAL,
  EVENT_TO_CODEX,
  FILE_TO_CODEX,
} from './codexCatalog'

export function ensureCodexState(save) {
  if (!save.codexDiscovered) save.codexDiscovered = {}
}

export function discoverCodex(save, entryId) {
  if (!CODEX_ENTRIES[entryId]) return false
  ensureCodexState(save)
  if (save.codexDiscovered[entryId]) return false

  save.codexDiscovered[entryId] = new Date().toISOString()
  save.events_log = save.events_log || []
  save.events_log.push(`[CODEX] Entrée débloquée : ${CODEX_ENTRIES[entryId].name}`)

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

export function buildCodexState(save) {
  ensureCodexState(save)
  const discovered = save.codexDiscovered

  const entries = CODEX_ORDER.map((id, index) => {
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

  const discoveredCount = Object.keys(discovered).length

  return {
    total: CODEX_TOTAL,
    discoveredCount,
    progressLabel: `${discoveredCount}/${CODEX_TOTAL}`,
    entries,
  }
}
