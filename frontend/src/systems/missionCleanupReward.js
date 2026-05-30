import { tx } from '../i18n/helpers'
import { activateSafeWindow, reduceTrace } from './traceRecovery'
import { applyMissionCleanupInfluence } from './CharacterInfluence'

const OFFER_CHANCE = 0.68
const CLEANUP_BITTEK = 80
const CLEANUP_TRACE_REDUCTION = 15
const CLEANUP_FIREWALL_ITEM = 'firewall_jetable'

export function tryOfferMissionCleanup(save, missionId) {
  if (!save || !missionId) return false

  save.missionCleanupOffers = save.missionCleanupOffers || []
  if (save.missionCleanupOffers.includes(missionId)) return false
  if (Math.random() > OFFER_CHANCE) return false

  save.missionCleanupOffers.push(missionId)
  save.missionCleanup = {
    open: true,
    missionId,
    startedAt: Date.now(),
  }
  save.events_log = save.events_log || []
  save.events_log.push(tx('missionCleanup.eventLog'))
  return true
}

function grantFirewall(save) {
  const inv = save.inventory.find((e) => e.itemId === CLEANUP_FIREWALL_ITEM)
  if (inv) inv.quantity += 1
  else save.inventory.push({ itemId: CLEANUP_FIREWALL_ITEM, quantity: 1 })
}

export function resolveMissionCleanup(save, choice) {
  if (!save?.missionCleanup?.open) {
    return { ok: false, error: 'closed', output: [] }
  }

  const output = []
  save.events_log = save.events_log || []

  switch (choice) {
    case 'bittek': {
      save.player.bittek = (save.player.bittek || 0) + CLEANUP_BITTEK
      const line = tx('missionCleanup.result.bittek', { amount: CLEANUP_BITTEK })
      output.push(line)
      save.events_log.push(line)
      break
    }
    case 'trace': {
      const result = reduceTrace(save, CLEANUP_TRACE_REDUCTION)
      output.push(...result.output)
      if (result.changed) {
        save.events_log.push(tx('missionCleanup.result.trace', {
          old: result.old,
          trace: result.new,
        }))
      }
      break
    }
    case 'firewall': {
      grantFirewall(save)
      const line = tx('missionCleanup.result.firewall')
      output.push(line)
      save.events_log.push(line)
      break
    }
    case 'skip':
    default: {
      const line = tx('missionCleanup.result.skip')
      output.push(line)
      save.events_log.push(line)
      break
    }
  }

  save.missionCleanup.open = false
  const safeLine = activateSafeWindow(save, 'mission_cleanup')
  if (safeLine) output.push('', safeLine)
  output.push(...applyMissionCleanupInfluence(save, choice))

  return { ok: true, output }
}

export function dismissMissionCleanup(save) {
  if (!save?.missionCleanup) return false
  save.missionCleanup.open = false
  return true
}
