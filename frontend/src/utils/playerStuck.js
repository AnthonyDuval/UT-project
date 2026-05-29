import { getLocale } from '../i18n'
import { getNextLeadStageId, buildStateForLead, getNextLeadTerminalHint } from './nextLead'

export const STUCK_IDLE_MS = 120000
export const STUCK_HINT_COOLDOWN_MS = 90000

export function ensurePlayerGuidance(save) {
  if (!save.playerGuidance) {
    save.playerGuidance = {
      unknownStreak: save.guidanceUnknownStreak || 0,
      lastProgressAt: Date.now(),
      lastStageId: null,
      uselessRepeat: { cmd: '', count: 0 },
      lastStuckHintAt: 0,
      stuckTier: 0,
    }
  }
  save.playerGuidance.unknownStreak = save.playerGuidance.unknownStreak ?? 0
  save.playerGuidance.lastProgressAt = save.playerGuidance.lastProgressAt || Date.now()
  save.playerGuidance.uselessRepeat = save.playerGuidance.uselessRepeat || { cmd: '', count: 0 }
}

/** Progression détectée — reset anti-blocage. */
export function touchProgress(save) {
  ensurePlayerGuidance(save)
  const pg = save.playerGuidance
  const stageId = getNextLeadStageId(buildStateForLead(save))

  if (stageId !== pg.lastStageId) {
    pg.lastStageId = stageId
    pg.lastProgressAt = Date.now()
    pg.uselessRepeat = { cmd: '', count: 0 }
    pg.stuckTier = 0
    pg.unknownStreak = 0
  }
}

export function recordUselessCommand(save, cmd) {
  ensurePlayerGuidance(save)
  const pg = save.playerGuidance
  const normalized = cmd?.trim().toLowerCase() || ''

  if (pg.uselessRepeat.cmd === normalized) {
    pg.uselessRepeat.count += 1
  } else {
    pg.uselessRepeat = { cmd: normalized, count: 1 }
  }
}

export function recordUnknownCommand(save) {
  ensurePlayerGuidance(save)
  save.playerGuidance.unknownStreak += 1
  save.guidanceUnknownStreak = save.playerGuidance.unknownStreak
}

export function resetUnknownStreak(save) {
  ensurePlayerGuidance(save)
  save.playerGuidance.unknownStreak = 0
  save.guidanceUnknownStreak = 0
}

/**
 * Détecte si le joueur semble bloqué.
 * @returns {{ stuck: boolean, level: 'soft'|'firm', reason: string } | null}
 */
export function checkPlayerStuck(save) {
  ensurePlayerGuidance(save)
  const pg = save.playerGuidance
  const now = Date.now()

  if (pg.unknownStreak >= 3) {
    return { stuck: true, level: 'firm', reason: 'unknown' }
  }

  if (pg.uselessRepeat.count >= 3) {
    return { stuck: true, level: 'soft', reason: 'repeat' }
  }

  if (now - pg.lastProgressAt >= STUCK_IDLE_MS) {
    return { stuck: true, level: 'soft', reason: 'idle' }
  }

  return null
}

export function canEmitIdleStuckHint(save) {
  ensurePlayerGuidance(save)
  const pg = save.playerGuidance
  return Date.now() - pg.lastStuckHintAt >= STUCK_HINT_COOLDOWN_MS
}

export function markStuckHintShown(save, level = 'soft') {
  ensurePlayerGuidance(save)
  const pg = save.playerGuidance
  pg.lastStuckHintAt = Date.now()
  if (level === 'firm') pg.stuckTier = Math.max(pg.stuckTier, 2)
  else pg.stuckTier = Math.max(pg.stuckTier, 1)
}

export function getStuckTerminalHint(save, stuck, locale) {
  if (!stuck?.stuck) return null
  return getNextLeadTerminalHint(buildStateForLead(save), locale ?? getLocale(), stuck.level)
}

export function isPlayerStuckForTransmission(save) {
  return !!checkPlayerStuck(save)
}
