/**
 * UltraTechPresence — riposte progressive d'UltraTech après l'Acte 1.
 */

import { discoverCodex } from '../demo/codexService'
import {
  CINEMATIC_TYPES,
  fireCinematicEvent,
} from './CinematicEventSystem'
import {
  CHARACTER_IDS,
  fireCharacterTransmission,
} from './CharacterTransmissionSystem.jsx'
import { tx, txRaw } from '../i18n/helpers'

export const PRESENCE_LEVELS = {
  PASSIVE: 'passive',
  MONITORING: 'monitoring',
  HOSTILE: 'hostile',
  LOCKDOWN: 'lockdown',
}

const MONITORING_WARNING_COOLDOWN_MS = 90000
const PRESENCE_TICK_CHANCE = 0.07

export function ensurePresenceState(save) {
  save.ultraTechPresence = save.ultraTechPresence || {
    level: PRESENCE_LEVELS.PASSIVE,
    lastWarningAt: 0,
    terminalLockUntil: 0,
  }
  save.flags = save.flags || {}
}

export function computePresenceLevel(save) {
  ensurePresenceState(save)
  const trace = save.traceLevel || 0
  const unknownStreak = save.playerGuidance?.unknownStreak || 0
  const riposte = !!save.flags.ut_first_riposte

  if (trace >= 85) return PRESENCE_LEVELS.LOCKDOWN
  if (trace >= 65 || unknownStreak >= 3) return PRESENCE_LEVELS.HOSTILE
  if (riposte || trace > 45 || save.flags.mission_1_complete) {
    return PRESENCE_LEVELS.MONITORING
  }
  return PRESENCE_LEVELS.PASSIVE
}

export function syncPresenceLevel(save) {
  ensurePresenceState(save)
  const prev = save.ultraTechPresence.level
  const next = computePresenceLevel(save)
  save.ultraTechPresence.level = next

  if (
    prev !== next
    && (next === PRESENCE_LEVELS.MONITORING || next === PRESENCE_LEVELS.HOSTILE)
  ) {
    tryVeilIntroduction(save)
  }

  return next
}

export function getPresenceTraceMultiplier(save) {
  const level = save.ultraTechPresence?.level || computePresenceLevel(save)
  if (level === PRESENCE_LEVELS.LOCKDOWN) return 1.45
  if (level === PRESENCE_LEVELS.HOSTILE) return 1.22
  return 1
}

export function isTerminalLockedByPresence(save) {
  ensurePresenceState(save)
  const until = save.ultraTechPresence.terminalLockUntil || 0
  return Date.now() < until
}

function getRiposteTerminalLines() {
  const lines = txRaw('presence.riposte.lines')
  if (Array.isArray(lines) && lines.length) return lines
  return [
    tx('presence.riposte.title'),
    tx('presence.riposte.subtitle'),
  ]
}

/** Première riposte UltraTech — une seule fois. */
export function tryFirstUltraTechRiposte(save, source = 'unknown') {
  ensurePresenceState(save)
  if (save.flags.ut_first_riposte) return null
  if (save.gameOver) return null

  save.flags.ut_first_riposte = true
  syncPresenceLevel(save)

  save.activeUiEffect = {
    type: 'ut_freeze',
    duration: 500,
  }

  const autoLines = getRiposteTerminalLines()
  save.events_log = save.events_log || []
  autoLines.forEach((line) => save.events_log.push(line))

  let cinematicResult = null
  if (!save.activeCinematic && !save.activeCharacterTransmission) {
    cinematicResult = fireCinematicEvent(
      save,
      CINEMATIC_TYPES.ULTRATECH_TRANSMISSION,
      `riposte_${source}`,
      {
        skipCooldown: true,
        bannerMessage: tx('presence.riposte.cinematicBanner'),
      },
    )
  }

  if (!save.flags.veil_intro_seen) {
    save._pendingVeilIntro = true
  }

  return {
    autoLines,
    uiEffect: save.activeUiEffect,
    cinematic: cinematicResult?.cinematic || null,
    fired: `riposte_${source}`,
  }
}

export function checkRiposteTriggers(save, trigger) {
  if (save.flags?.ut_first_riposte) return null

  const eligible = {
    mission_1_complete: !!save.flags?.mission_1_complete,
    trace_threshold: (save.traceLevel || 0) > 45,
    satlink_scan: trigger === 'satlink_scan',
    satlink_connect: trigger === 'satlink_connect',
    satlink_probe: trigger === 'satlink_probe',
  }

  if (!eligible[trigger]) return null
  return tryFirstUltraTechRiposte(save, trigger)
}

/** Introduction VEIL — première fois en monitoring/hostile. */
export function tryVeilIntroduction(save) {
  ensurePresenceState(save)
  if (save.flags.veil_intro_seen) return null

  const level = save.ultraTechPresence.level
  if (level !== PRESENCE_LEVELS.MONITORING && level !== PRESENCE_LEVELS.HOSTILE) {
    return null
  }

  if (save.activeCinematic || save.activeCharacterTransmission) {
    save._pendingVeilIntro = true
    return null
  }

  save.flags.veil_intro_seen = true
  discoverCodex(save, 'veil_agent')

  const result = fireCharacterTransmission(save, CHARACTER_IDS.VEIL, 'veil_intro', {
    forceMessageKey: 'transmissions.veil.messages.0',
    bypassCooldown: true,
    bypassGlobalBlock: false,
  })

  return result
}

export function flushPendingVeilIntro(save) {
  if (!save._pendingVeilIntro || save.flags.veil_intro_seen) {
    delete save._pendingVeilIntro
    return null
  }
  delete save._pendingVeilIntro
  return tryVeilIntroduction(save)
}

export function tickPresenceEffects(save) {
  ensurePresenceState(save)
  syncPresenceLevel(save)
  const level = save.ultraTechPresence.level
  const autoLines = []
  const now = Date.now()

  if (level === PRESENCE_LEVELS.MONITORING || level === PRESENCE_LEVELS.HOSTILE) {
    const since = now - (save.ultraTechPresence.lastWarningAt || 0)
    if (since >= MONITORING_WARNING_COOLDOWN_MS && Math.random() < PRESENCE_TICK_CHANCE) {
      const warnings = txRaw('presence.monitoring.warnings')
      if (Array.isArray(warnings) && warnings.length) {
        autoLines.push(warnings[Math.floor(Math.random() * warnings.length)])
        save.ultraTechPresence.lastWarningAt = now
      }
    }
  }

  if (level === PRESENCE_LEVELS.LOCKDOWN && Math.random() < 0.04) {
    if (!save.fakeGameOverUntil || now >= save.fakeGameOverUntil) {
      save.ultraTechPresence.terminalLockUntil = now + 4000
      autoLines.push(tx('presence.lockdown.terminalLock'))
    }
  }

  const veil = flushPendingVeilIntro(save)
  if (veil?.transmission) {
    return { autoLines, transmission: veil.transmission }
  }

  return { autoLines }
}

export function getTraceRiseFeedback(save, amount) {
  if (amount <= 0 || save.gameOver) return null

  save._traceFeedback = save._traceFeedback || { lastAt: 0 }
  const since = Date.now() - save._traceFeedback.lastAt
  if (since < 12000) return null

  const variants = txRaw('terminal.trace.riseVariants')
  if (!Array.isArray(variants) || !variants.length) return null

  save._traceFeedback.lastAt = Date.now()
  const line = variants[Math.floor(Math.random() * variants.length)]
  return typeof line === 'string' ? line.replace(/\{\{amount\}\}/g, String(amount)) : null
}

export function mergePresenceResult(base, presenceResult) {
  if (!presenceResult) return base
  return {
    ...base,
    autoLines: [...(base.autoLines || []), ...(presenceResult.autoLines || [])],
    cinematic: presenceResult.cinematic || base.cinematic,
    uiEffect: presenceResult.uiEffect || base.uiEffect,
    transmission: presenceResult.transmission || base.transmission,
  }
}

export default {
  PRESENCE_LEVELS,
  ensurePresenceState,
  syncPresenceLevel,
  tryFirstUltraTechRiposte,
  checkRiposteTriggers,
  tryVeilIntroduction,
  tickPresenceEffects,
  getPresenceTraceMultiplier,
  getTraceRiseFeedback,
  isTerminalLockedByPresence,
}
