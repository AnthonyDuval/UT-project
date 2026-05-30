import { tx } from '../i18n/helpers'
import { dismissTraceTriangulation50 } from './traceTriangulation50'
import { dismissTraceWarning20 } from './traceWarning20'
import { PRESENCE_LEVELS, ensurePresenceState } from './UltraTechPresence'
import { reduceTrace, activateSafeWindow } from './traceRecovery'
import { applyEmergencyChoiceInfluence } from './CharacterInfluence'

export const EMERGENCY_FIREWALL_ITEM = 'firewall_jetable'
export const EMERGENCY_SCRAMBLER_COST = 120
export const EMERGENCY_FIREWALL_REDUCTION = 25
export const EMERGENCY_SCRAMBLER_REDUCTION = 30
export const EMERGENCY_TIMEOUT_MS = 30000

export function getFirewallCount(save) {
  const entry = save?.inventory?.find((e) => e.itemId === EMERGENCY_FIREWALL_ITEM)
  return entry?.quantity || 0
}

export function canUseEmergencyFirewall(save) {
  return getFirewallCount(save) >= 1
}

export function canUseEmergencyScrambler(save) {
  return (save?.player?.bittek || 0) >= EMERGENCY_SCRAMBLER_COST
}

export function tryTriggerTraceEmergency75(save) {
  if (!save || save.traceLevel < 75 || save.emergencyEscape75Seen) return false

  save.emergencyEscape75Seen = true
  dismissTraceWarning20(save)
  dismissTraceTriangulation50(save)
  const now = Date.now()
  save.traceEmergency75 = {
    open: true,
    startedAt: now,
    deadlineAt: now + EMERGENCY_TIMEOUT_MS,
  }
  save.events_log = save.events_log || []
  save.events_log.push(tx('traceEmergency75.eventLog'))
  return true
}

export function dismissTraceEmergency75(save) {
  if (!save?.traceEmergency75) return false
  save.traceEmergency75.open = false
  return true
}

export function isTraceEmergency75Open(save) {
  return !!(save?.traceEmergency75?.open)
}

function consumeFirewall(save) {
  const inv = save.inventory.find((e) => e.itemId === EMERGENCY_FIREWALL_ITEM)
  if (!inv || inv.quantity < 1) return false
  if (inv.quantity <= 1) {
    save.inventory = save.inventory.filter((e) => e.itemId !== EMERGENCY_FIREWALL_ITEM)
  } else {
    inv.quantity -= 1
  }
  return true
}

function applyHostilePresence(save) {
  ensurePresenceState(save)
  save.ultraTechPresence.level = PRESENCE_LEVELS.HOSTILE
}

export function resolveTraceEmergency75(save, choice) {
  if (!save?.traceEmergency75?.open) {
    return { ok: false, error: 'closed', output: [] }
  }

  const output = []
  save.events_log = save.events_log || []

  switch (choice) {
    case 'firewall': {
      if (!canUseEmergencyFirewall(save)) {
        return { ok: false, error: 'no_firewall', output: [] }
      }
      consumeFirewall(save)
      const result = reduceTrace(save, EMERGENCY_FIREWALL_REDUCTION, { showDelta: false })
      const line = tx('traceEmergency75.result.firewall', {
        old: result.old,
        trace: result.new,
      })
      output.push(...result.output, line)
      save.events_log.push(line)
      break
    }
    case 'scrambler': {
      if (!canUseEmergencyScrambler(save)) {
        return { ok: false, error: 'insufficient_bittek', output: [] }
      }
      save.player.bittek -= EMERGENCY_SCRAMBLER_COST
      const result = reduceTrace(save, EMERGENCY_SCRAMBLER_REDUCTION, { showDelta: false })
      const line = tx('traceEmergency75.result.scrambler', {
        old: result.old,
        trace: result.new,
        cost: EMERGENCY_SCRAMBLER_COST,
      })
      output.push(...result.output, line)
      save.events_log.push(line)
      break
    }
    case 'continue':
    default: {
      applyHostilePresence(save)
      const line = tx('traceEmergency75.result.continue')
      output.push(line)
      save.events_log.push(line)
      break
    }
  }

  dismissTraceEmergency75(save)
  const safeLine = activateSafeWindow(save, 'trace_emergency_75')
  if (safeLine) output.push('', safeLine)
  output.push(...applyEmergencyChoiceInfluence(save, choice))
  return { ok: true, output }
}
