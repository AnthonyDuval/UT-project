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
import { getLocale, getTranslator } from '../i18n'

export function ensureCodexState(save) {
  if (!save.codexDiscovered) save.codexDiscovered = {}
  if (!save.codexNotified) save.codexNotified = {}
}

function localizedEntry(entryId) {
  const tr = getTranslator(getLocale())
  const meta = tr.raw(`codex.entries.${entryId}`) || CODEX_ENTRIES[entryId]
  if (!meta) return null
  return {
    name: meta.name,
    description: meta.description,
    nextHint: meta.nextHint,
    rarity: meta.rarity,
  }
}

export function isUnlocked(save, entryId) {
  if (!entryId || !CODEX_ENTRIES[entryId]) return false
  ensureCodexState(save)
  return Object.prototype.hasOwnProperty.call(save.codexDiscovered, entryId)
}

function queueCodexDiscovery(save, entryId) {
  save._pendingCodexDiscoveries = save._pendingCodexDiscoveries || []
  if (save._pendingCodexDiscoveries.some((e) => e.id === entryId)) return
  const meta = localizedEntry(entryId)
  save._pendingCodexDiscoveries.push({
    id: entryId,
    name: meta?.name || CODEX_ENTRIES[entryId].name,
  })
}

export function discoverCodex(save, entryId) {
  if (!CODEX_ENTRIES[entryId]) return false
  if (NOVA_CODEX_IDS.has(entryId) && !save.novaIntroSeen) return false
  if (isUnlocked(save, entryId)) return false

  ensureCodexState(save)
  save.codexDiscovered[entryId] = new Date().toISOString()
  const meta = localizedEntry(entryId)
  const tr = getTranslator(getLocale())
  save.events_log = save.events_log || []
  save.events_log.push(tr('codex.unlocked', { name: meta?.name || entryId }))
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
  const tr = getTranslator(getLocale())

  const entries = order.map((id, index) => {
    const discoveredAt = discovered[id]

    if (discoveredAt) {
      const meta = localizedEntry(id)
      return {
        id,
        slot: index + 1,
        discovered: true,
        discoveredAt,
        name: meta?.name,
        description: meta?.description,
        nextHint: meta?.nextHint,
        rarity: meta?.rarity,
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
