/**
 * Influence cachée des personnages — jamais affichée au joueur.
 */

import { tx } from '../i18n/helpers'
import { maybeInfluenceReaction } from './influenceConsequences'
import { CHARACTER_IDS } from './CharacterTransmissionSystem.jsx'

const GHOST_NODES = new Set(['relay_ghost', 'mirror_relay', 'void_relay'])
const FORBIDDEN_NODES = new Set(['morgue_server', 'blackvault', 'mirror_relay', 'void_relay'])
const SECRET_COMMANDS = new Set(['override', 'ghost', 'nova', 'mirror', 'trace', 'echo', 'resonate'])

export const INFLUENCE_DEFAULTS = {
  novaAffinity: 0,
  veilSuspicion: 0,
  morseTrust: 0,
  absentExposure: 0,
}

export function ensureCharacterInfluence(save) {
  if (!save.characterInfluence) {
    save.characterInfluence = { ...INFLUENCE_DEFAULTS }
  }
  save.influenceUnlocks = save.influenceUnlocks || {}
  return save.characterInfluence
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function adjustInfluence(save, key, delta) {
  if (!delta) return
  const inf = ensureCharacterInfluence(save)
  if (!(key in inf)) return
  if (key === 'novaAffinity') {
    inf.novaAffinity = clamp(inf.novaAffinity + delta, -100, 100)
  } else {
    inf[key] = clamp(inf[key] + delta, 0, 100)
  }
}

export function getInfluenceTier(value, { low = 35, high = 65, signed = false } = {}) {
  if (signed) {
    if (value >= 40) return 'high'
    if (value <= -20) return 'low'
    return 'mid'
  }
  if (value >= high) return 'high'
  if (value <= low) return 'low'
  return 'mid'
}

export function getInfluenceMessageKeys(characterId, save) {
  const inf = ensureCharacterInfluence(save)
  const keys = []

  switch (characterId) {
    case CHARACTER_IDS.NOVA: {
      const tier = getInfluenceTier(inf.novaAffinity, { signed: true })
      if (tier === 'high') {
        keys.push('transmissions.nova.influence.high.0', 'transmissions.nova.influence.high.1')
      } else if (tier === 'low') {
        keys.push('transmissions.nova.influence.low.0', 'transmissions.nova.influence.low.1')
      }
      break
    }
    case CHARACTER_IDS.VEIL: {
      const tier = getInfluenceTier(inf.veilSuspicion)
      if (tier === 'low') keys.push('transmissions.veil.influence.low.0')
      if (tier === 'high') keys.push('transmissions.veil.influence.high.0', 'transmissions.veil.influence.high.1')
      break
    }
    case CHARACTER_IDS.MORSE: {
      const tier = getInfluenceTier(inf.morseTrust)
      if (tier === 'high') keys.push('transmissions.morse.influence.high.0')
      if (tier === 'low') keys.push('transmissions.morse.influence.low.0')
      break
    }
    case CHARACTER_IDS.ABSENT: {
      const tier = getInfluenceTier(inf.absentExposure)
      if (tier === 'high') keys.push('transmissions.absent.influence.high.0', 'transmissions.absent.influence.high.1')
      if (tier === 'mid') keys.push('transmissions.absent.influence.mid.0')
      break
    }
    default:
      break
  }

  return keys
}

export function getInfluenceWeightMultiplier(save, characterId) {
  const inf = ensureCharacterInfluence(save)
  switch (characterId) {
    case CHARACTER_IDS.NOVA:
      return inf.novaAffinity >= 40 ? 1.35 : inf.novaAffinity <= -20 ? 0.75 : 1
    case CHARACTER_IDS.VEIL:
      return inf.veilSuspicion >= 65 ? 1.4 : inf.veilSuspicion <= 25 ? 0.85 : 1
    case CHARACTER_IDS.MORSE:
      return inf.morseTrust >= 55 ? 1.25 : 1
    case CHARACTER_IDS.ABSENT:
      return inf.absentExposure >= 50 ? 1.5 : 0.9
    default:
      return 1
  }
}

function queueInfluenceTransmission(save, characterId, messageKey) {
  if (save.activeCharacterTransmission || save.activeCinematic) {
    save._pendingInfluenceTransmission = { characterId, messageKey }
    return
  }
  save._pendingInfluenceTransmission = { characterId, messageKey }
}

export function tryInfluenceUnlocks(save) {
  const inf = ensureCharacterInfluence(save)
  const unlocks = save.influenceUnlocks
  const lines = []

  if (inf.morseTrust >= 55 && !unlocks.morse_rare_catalog) {
    unlocks.morse_rare_catalog = true
    lines.push(tx('influenceUnlock.morseRareCatalog'))
  }

  if (inf.veilSuspicion >= 72 && !unlocks.veil_direct) {
    unlocks.veil_direct = true
    queueInfluenceTransmission(save, CHARACTER_IDS.VEIL, 'transmissions.veil.influence.high.1')
    lines.push(tx('influenceUnlock.veilDirect'))
  }

  if (inf.novaAffinity >= 45 && !unlocks.nova_protect) {
    unlocks.nova_protect = true
    queueInfluenceTransmission(save, CHARACTER_IDS.NOVA, 'transmissions.nova.influence.high.0')
  }

  if (inf.novaAffinity <= -25 && !unlocks.nova_doubt) {
    unlocks.nova_doubt = true
    queueInfluenceTransmission(save, CHARACTER_IDS.NOVA, 'transmissions.nova.influence.low.0')
  }

  if (inf.absentExposure >= 52 && !unlocks.absent_node) {
    unlocks.absent_node = true
    if (!save.discoveredNodes.includes('mirror_relay')) {
      save.discoveredNodes.push('mirror_relay')
    }
    lines.push(tx('influenceUnlock.absentNode'))
  }

  if (inf.absentExposure >= 70 && !unlocks.absent_whisper) {
    unlocks.absent_whisper = true
    queueInfluenceTransmission(save, CHARACTER_IDS.ABSENT, 'transmissions.absent.influence.high.0')
    lines.push(tx('influenceUnlock.absentWhisper'))
  }

  return lines
}

export function applyCommandInfluence(save, cmd, args = [], meta = {}) {
  const normalized = cmd?.toLowerCase?.() || ''
  const inf = ensureCharacterInfluence(save)
  const lines = []

  if (SECRET_COMMANDS.has(normalized) || meta.isSecret) {
    adjustInfluence(save, 'novaAffinity', 3)
    adjustInfluence(save, 'veilSuspicion', 4)
    adjustInfluence(save, 'absentExposure', 2)
    if (normalized !== 'override') {
      const reaction = maybeInfluenceReaction(save, 'secret_command')
      if (reaction) lines.push(reaction)
    }
  }

  if (normalized === 'override') {
    adjustInfluence(save, 'novaAffinity', 6)
    adjustInfluence(save, 'veilSuspicion', 5)
    const reaction = maybeInfluenceReaction(save, 'override')
    if (reaction) lines.push(reaction)
  }

  if (normalized === 'scan') {
    const scans = save.playerBehavior?.scanCount || 0
    if (scans >= 3) adjustInfluence(save, 'veilSuspicion', 2)
  }

  if (normalized === 'connect' || normalized === 'probe') {
    const target = args[0]?.toLowerCase?.()
    if (target && FORBIDDEN_NODES.has(target)) {
      adjustInfluence(save, 'novaAffinity', 5)
      adjustInfluence(save, 'veilSuspicion', 4)
      adjustInfluence(save, 'absentExposure', 3)
      const reaction = maybeInfluenceReaction(save, 'forbidden_node')
      if (reaction) lines.push(reaction)
    }
  }

  if (normalized === 'market' || normalized === 'buy') {
    adjustInfluence(save, 'morseTrust', 1)
  }

  if (!save.unlocked_commands?.includes(normalized) && normalized !== 'clear' && normalized !== 'ls') {
    adjustInfluence(save, 'veilSuspicion', 2)
  }

  lines.push(...tryInfluenceUnlocks(save))
  return lines
}

export function applyTraceInfluence(save, prev, next) {
  const lines = []
  if (next <= prev) {
    if (next < prev) adjustInfluence(save, 'veilSuspicion', -2)
    return lines
  }

  const rise = next - prev
  adjustInfluence(save, 'veilSuspicion', Math.min(4, Math.ceil(rise / 3)))

  if (prev < 70 && next >= 70) {
    adjustInfluence(save, 'absentExposure', 4)
  }

  if (next >= 50) adjustInfluence(save, 'novaAffinity', -1)

  lines.push(...tryInfluenceUnlocks(save))
  return lines
}

export function applyMarketPurchaseInfluence(save, price = 0) {
  adjustInfluence(save, 'morseTrust', 4)
  if (price >= 90) adjustInfluence(save, 'morseTrust', 2)
  const lines = tryInfluenceUnlocks(save)
  const reaction = maybeInfluenceReaction(save, 'market_purchase')
  if (reaction) lines.push(reaction)
  return lines
}

export function applyMissionCleanupInfluence(save, choice) {
  if (choice === 'bittek') adjustInfluence(save, 'morseTrust', 5)
  if (choice === 'trace') adjustInfluence(save, 'novaAffinity', 2)
  if (choice === 'firewall') adjustInfluence(save, 'morseTrust', 2)
  if (choice === 'skip') adjustInfluence(save, 'veilSuspicion', 1)
  return tryInfluenceUnlocks(save)
}

export function applyEmergencyChoiceInfluence(save, choice) {
  if (choice === 'continue') {
    adjustInfluence(save, 'novaAffinity', 4)
    adjustInfluence(save, 'veilSuspicion', 3)
  }
  if (choice === 'scrambler') adjustInfluence(save, 'morseTrust', 3)
  if (choice === 'firewall') adjustInfluence(save, 'novaAffinity', 1)
  return tryInfluenceUnlocks(save)
}

export function applyInfluenceTick(save, deltaMs = 0) {
  if (!deltaMs || !GHOST_NODES.has(save.currentNode)) return []

  save._ghostNodeMs = (save._ghostNodeMs || 0) + deltaMs
  const minuteMark = Math.floor(save._ghostNodeMs / 60000)
  const prevMark = save._ghostNodeMinuteMark || 0

  if (minuteMark > prevMark) {
    save._ghostNodeMinuteMark = minuteMark
    adjustInfluence(save, 'absentExposure', minuteMark - prevMark)
    return tryInfluenceUnlocks(save)
  }

  return []
}

export function isMorseRareCatalogUnlocked(save) {
  return !!save.influenceUnlocks?.morse_rare_catalog
}

export function consumePendingInfluenceTransmission(save, fireFn) {
  const pending = save._pendingInfluenceTransmission
  if (!pending || !fireFn) return null
  if (save.activeCharacterTransmission || save.activeCinematic) return null
  save._pendingInfluenceTransmission = null
  return fireFn(save, pending.characterId, 'influence', {
    forceMessageKey: pending.messageKey,
    bypassCooldown: true,
  })
}
