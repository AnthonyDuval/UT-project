import { tx } from '../i18n/helpers'
import { syncPresenceLevel } from './UltraTechPresence'

export const SAFE_WINDOW_MS = 45000
export const SAFE_WINDOW_GAIN_MULT = 0.7

export function isSafeWindowActive(save, now = Date.now()) {
  const until = save?.safeWindow?.until || 0
  return until > now
}

export function getSafeWindowTraceMultiplier(save, now = Date.now()) {
  return isSafeWindowActive(save, now) ? SAFE_WINDOW_GAIN_MULT : 1
}

export function activateSafeWindow(save, source = 'ultratech') {
  const now = Date.now()
  save.safeWindow = {
    until: now + SAFE_WINDOW_MS,
    startedAt: now,
    source,
  }
  save.events_log = save.events_log || []
  save.events_log.push(tx('traceRecovery.safeWindowLog'))
  return tx('traceRecovery.safeWindowTerminal')
}

export function reduceTrace(save, amount, options = {}) {
  if (!save || amount <= 0) return { changed: false, old: save?.traceLevel ?? 0, new: save?.traceLevel ?? 0, output: [] }

  const old = save.traceLevel ?? 0
  const next = Math.max(0, old - amount)
  if (next === old) return { changed: false, old, new: old, output: [] }

  save.traceLevel = next
  syncPresenceLevel(save)

  const output = []
  if (options.feedback !== false) {
    output.push(tx('traceRecovery.signatureErased'))
    if (options.showDelta !== false) {
      output.push(tx('inventory.traceReduced', { old, new: next }))
    }
  }

  return { changed: true, old, new: next, output }
}

export function getActiveMissionId(save) {
  if (save.missions?.satlink_intrusion?.status === 'active') return 'satlink_intrusion'
  if (save.missions?.signal_fantome?.status === 'active') return 'signal_fantome'
  if (save.missions?.satlink_intrusion?.status === 'completed') return 'satlink_intrusion'
  return 'signal_fantome'
}

export function canBuyMissionLimitedItem(save, itemId) {
  if (itemId !== 'trace_cleaner') return true
  save.marketMissionPurchases = save.marketMissionPurchases || {}
  const missionId = getActiveMissionId(save)
  return !save.marketMissionPurchases[missionId]?.includes(itemId)
}

export function recordMissionLimitedPurchase(save, itemId) {
  if (itemId !== 'trace_cleaner') return
  save.marketMissionPurchases = save.marketMissionPurchases || {}
  const missionId = getActiveMissionId(save)
  const list = save.marketMissionPurchases[missionId] || []
  if (!list.includes(itemId)) list.push(itemId)
  save.marketMissionPurchases[missionId] = list
}
