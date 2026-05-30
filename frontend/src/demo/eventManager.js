/**
 * EventManager — déclenchement d'événements mystère selon contexte.
 */

import { MYSTERY_EVENTS } from './mysteryEvents'
import { discoverCodexFromEvent } from './codexService'

function ensureMysteryState(save) {
  if (!save.mysteryFlags) save.mysteryFlags = {}
  if (!save.seenEvents) save.seenEvents = []
  if (!save.hiddenCommandUses) save.hiddenCommandUses = {}
  if (!save.eventLastTriggeredAt) save.eventLastTriggeredAt = {}
  if (!save.sessionStartMs) save.sessionStartMs = Date.now()
  if (save.commandCount == null) save.commandCount = 0
}

function sessionSeconds(save) {
  return Math.floor((Date.now() - (save.sessionStartMs || Date.now())) / 1000)
}

function getActiveMissionId(save) {
  const m2 = save.missions?.satlink_intrusion
  const m1 = save.missions?.signal_fantome
  if (m2?.status === 'active') return 'satlink_intrusion'
  if (m1?.status === 'active') return 'signal_fantome'
  return null
}

function matchesConditions(event, save, ctx) {
  const c = event.conditions
  if (c.type !== ctx.type) return false

  if (c.minTrace != null && save.traceLevel < c.minTrace) return false
  if (c.maxTrace != null && save.traceLevel > c.maxTrace) return false
  if (c.minSessionSec != null && sessionSeconds(save) < c.minSessionSec) return false
  if (c.minCommands != null && (save.commandCount || 0) < c.minCommands) return false
  if (c.command && ctx.command !== c.command) return false
  if (c.minUses != null) {
    const uses = save.hiddenCommandUses?.[c.command] || 0
    if (uses < c.minUses) return false
  }
  if (c.file && ctx.file !== c.file) return false
  if (c.mission && getActiveMissionId(save) !== c.mission) return false
  if (c.missionStatus) {
    const mid = c.mission || getActiveMissionId(save)
    if (save.missions?.[mid]?.status !== c.missionStatus) return false
  }
  if (c.requiresNovaIntro && !save.novaIntroSeen) return false

  return true
}

function applyEffects(save, effects) {
  const result = {
    autoLines: [],
    uiEffect: null,
    fakeGameOver: null,
  }

  if (effects.log) {
    save.events_log = save.events_log || []
    save.events_log.push(effects.log)
  }
  if (effects.autoLines?.length) {
    result.autoLines.push(...effects.autoLines)
  }
  if (effects.flag) {
    save.flags = save.flags || {}
    save.flags[effects.flag] = true
  }
  if (effects.uiEffect) {
    save.activeUiEffect = effects.uiEffect
    result.uiEffect = effects.uiEffect
  }
  if (effects.fakeGameOver) {
    save.fakeGameOverUntil = Date.now() + effects.fakeGameOver.duration
    result.fakeGameOver = effects.fakeGameOver
  }
  if (effects.revealNode) {
    if (!save.discoveredNodes.includes(effects.revealNode)) {
      save.discoveredNodes.push(effects.revealNode)
    }
    save.flags = save.flags || {}
    save.flags[`node_${effects.revealNode}_revealed`] = true
  }

  return result
}

/**
 * Évalue et déclenche les événements correspondant au contexte.
 * @returns {{ autoLines: string[], uiEffect: object|null, fakeGameOver: object|null, fired: string[] }}
 */
export function processMysteryEvents(save, ctx) {
  ensureMysteryState(save)
  const fired = []
  const autoLines = []
  let uiEffect = null
  let fakeGameOver = null

  for (const event of MYSTERY_EVENTS) {
    if (event.once && save.seenEvents.includes(event.id)) continue

    const cooldownMs = event.cooldownMs ?? (event.once ? 0 : 180000)
    if (cooldownMs > 0) {
      const lastAt = save.eventLastTriggeredAt[event.id]
      if (lastAt && Date.now() - lastAt < cooldownMs) continue
    }

    if (!matchesConditions(event, save, ctx)) continue
    if (event.chance != null && Math.random() > event.chance) continue

    save.seenEvents.push(event.id)
    save.eventLastTriggeredAt[event.id] = Date.now()

    const applied = applyEffects(save, event.effects)
    if (applied.autoLines.length) autoLines.push(...applied.autoLines)
    if (applied.uiEffect) uiEffect = applied.uiEffect
    if (applied.fakeGameOver) fakeGameOver = applied.fakeGameOver
    fired.push(event.id)
    discoverCodexFromEvent(save, event.id)
  }

  return { autoLines, uiEffect, fakeGameOver, fired }
}

/** Tick périodique — temps passé en session. */
export function processMysteryTick(save) {
  return processMysteryEvents(save, { type: 'tick' })
}

/** Après changement de TRACE. */
export function processMysteryTrace(save) {
  return processMysteryEvents(save, { type: 'trace' })
}

/** Après commande (hors hidden handler). */
export function processMysteryAfterCommand(save, command) {
  save.commandCount = (save.commandCount || 0) + 1
  return processMysteryEvents(save, { type: 'command', command })
}

/** Après ouverture de fichier. */
export function processMysteryFileOpen(save, filename) {
  return processMysteryEvents(save, { type: 'file', file: filename })
}

/** Nettoie les effets UI expirés. */
export function clearExpiredUiEffects(save) {
  if (save.fakeGameOverUntil && Date.now() > save.fakeGameOverUntil) {
    save.fakeGameOverUntil = null
  }
  const fx = save.activeUiEffect
  if (fx?.duration) {
    const started = fx._started || fx.startedAt
    if (started && Date.now() - started > fx.duration) {
      save.activeUiEffect = null
    }
  }
  if (save.ultraTechPresence?.terminalLockUntil && Date.now() >= save.ultraTechPresence.terminalLockUntil) {
    save.ultraTechPresence.terminalLockUntil = 0
  }
  if (save.activeCinematic?.startedAt && save.activeCinematic?.maxDurationMs) {
    const elapsed = Date.now() - save.activeCinematic.startedAt
    if (elapsed > save.activeCinematic.maxDurationMs + 3000) {
      save.activeCinematic = null
    }
  }
}

export function stampUiEffectStart(save) {
  if (save.activeUiEffect && !save.activeUiEffect._started) {
    save.activeUiEffect = {
      ...save.activeUiEffect,
      _started: Date.now(),
      startedAt: save.activeUiEffect.startedAt || Date.now(),
    }
  }
}
