/**
 * Conséquences perceptibles de l'influence cachée — jamais de valeurs affichées.
 */

import { ensureCharacterInfluence, getInfluenceTier } from './CharacterInfluence'
import { tx, txRaw } from '../i18n/helpers'

const FORBIDDEN_NODES = new Set(['morgue_server', 'blackvault', 'mirror_relay', 'void_relay'])
const REACTION_COOLDOWN_MS = 42000
const ADAPTIVE_CODEX_IDS = new Set([
  'veil_agent', 'nova_contact_01', 'ghost_echo', 'unknown_signal',
  'echo_17', 'satlink_lie', 'mirror_relay', 'the_absent', 'veil_protocol',
])

export function getDominantInfluence(save) {
  const inf = ensureCharacterInfluence(save)
  const ranked = [
    { id: 'veil', value: inf.veilSuspicion },
    { id: 'nova', value: Math.max(0, inf.novaAffinity) },
    { id: 'morse', value: inf.morseTrust },
    { id: 'absent', value: inf.absentExposure },
  ]
  ranked.sort((a, b) => b.value - a.value)
  if (ranked[0].value < 35) return null
  return ranked[0].id
}

export function isAdaptiveCodexEntry(entryId) {
  return ADAPTIVE_CODEX_IDS.has(entryId)
}

export function getAdaptiveCodexDescription(entryId, save, fallback) {
  const dominant = getDominantInfluence(save)
  if (!dominant || !ADAPTIVE_CODEX_IDS.has(entryId)) return fallback
  const variant = txRaw(`codex.entries.${entryId}.variants.${dominant}`)
  return typeof variant === 'string' && variant.length ? variant : fallback
}

function pickRandomPool(key, fallbackKey) {
  const pool = txRaw(key)
  if (Array.isArray(pool) && pool.length) return pool
  const fallback = txRaw(fallbackKey)
  return Array.isArray(fallback) ? fallback : []
}

export function pickInfluenceUnknownLine(save, cmd) {
  const inf = ensureCharacterInfluence(save)
  const tier = getInfluenceTier(inf.veilSuspicion)
  if (tier === 'high') {
    const cold = pickRandomPool('terminal.influence.veil.unknown', 'terminal.unknown.flavors')
    if (cold.length) {
      return cold[Math.floor(Math.random() * cold.length)].replace(/\{\{cmd\}\}/g, cmd)
    }
  }
  const flavors = txRaw('terminal.unknown.flavors')
  if (Array.isArray(flavors) && flavors.length) {
    return flavors[Math.floor(Math.random() * flavors.length)].replace(/\{\{cmd\}\}/g, cmd)
  }
  return tx('terminal.unknown.command', { cmd })
}

export function pickInfluenceHelpExtra(save) {
  const inf = ensureCharacterInfluence(save)
  const tier = getInfluenceTier(inf.novaAffinity, { signed: true })
  if (tier !== 'high') return null
  const hints = pickRandomPool('terminal.influence.nova.help', null)
  return hints.length ? hints[Math.floor(Math.random() * hints.length)] : null
}

export function pickInfluenceTraceFeedback(save, amount) {
  const inf = ensureCharacterInfluence(save)
  const tier = getInfluenceTier(inf.veilSuspicion)
  if (tier !== 'high') return null
  const pool = pickRandomPool('terminal.influence.veil.trace', 'terminal.trace.riseVariants')
  if (!pool.length) return null
  const line = pool[Math.floor(Math.random() * pool.length)]
  return typeof line === 'string' ? line.replace(/\{\{amount\}\}/g, String(amount)) : null
}

export function getHintPriceMultiplier(save) {
  const inf = ensureCharacterInfluence(save)
  const tier = getInfluenceTier(inf.morseTrust)
  if (tier === 'high') return 0.86
  if (tier === 'low') return 1.04
  return 1
}

export function getMorseHintPrecisionSuffix(save) {
  const inf = ensureCharacterInfluence(save)
  if (getInfluenceTier(inf.morseTrust) !== 'high') return null
  const pool = pickRandomPool('terminal.influence.morse.precision', null)
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
}

export function maybeInfluenceReaction(save, actionType) {
  if (!actionType) return null
  save._influenceReactions = save._influenceReactions || { lastAt: 0 }
  const since = Date.now() - (save._influenceReactions.lastAt || 0)
  if (since < REACTION_COOLDOWN_MS) return null
  if (Math.random() > 0.44) return null

  const specific = txRaw(`terminal.influence.reactions.${actionType}`)
  const general = txRaw('terminal.influence.reactions.general')
  const pool = (Array.isArray(specific) && specific.length ? specific : general) || []
  if (!pool.length) return null

  save._influenceReactions.lastAt = Date.now()
  return pool[Math.floor(Math.random() * pool.length)]
}

export function corruptTerminalOutput(lines, save) {
  const inf = ensureCharacterInfluence(save)
  const tier = getInfluenceTier(inf.absentExposure)
  if (tier === 'low') return lines

  const chance = tier === 'high' ? 0.34 : 0.14
  const glyphs = '█▓░¿?'

  return lines.map((line) => {
    if (!line || typeof line !== 'string' || line.length < 10) return line
    if (Math.random() > chance) return line
    const idx = Math.floor(Math.random() * (line.length - 3)) + 1
    const glyph = glyphs[Math.floor(Math.random() * glyphs.length)]
    return `${line.slice(0, idx)}${glyph}${line.slice(idx + 1)}`
  })
}

export function applyInfluenceOutputLayer(output, save) {
  return corruptTerminalOutput(output, save)
}
