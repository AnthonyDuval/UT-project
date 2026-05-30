/**
 * Persistance localStorage pour le mode démo.
 */

import { createAdvancedDemoState, createFreshDemoState } from './demoState'

const DEMO_SAVE_KEY = 'ut_demo_save'
const DEMO_CHAT_KEY = 'ut_demo_chat'

export const DEMO_STORAGE_KEYS = [DEMO_SAVE_KEY, DEMO_CHAT_KEY]

export function clearAllDemoStorage() {
  for (const key of DEMO_STORAGE_KEYS) {
    localStorage.removeItem(key)
  }
}

export function loadDemoSave() {
  try {
    const raw = localStorage.getItem(DEMO_SAVE_KEY)
    if (raw) {
      const save = JSON.parse(raw)
      migrateSave(save)
      return save
    }
  } catch {
    /* reset on corruption */
  }
  const initial = createFreshDemoState()
  saveDemoSave(initial)
  return initial
}

function migrateSave(save) {
  save.flags = save.flags || {}
  save.uiIntrosSeen = save.uiIntrosSeen || {}
  save.codexDiscovered = save.codexDiscovered || {}
  save.codexNotified = save.codexNotified || {}
  save.eventLastTriggeredAt = save.eventLastTriggeredAt || {}
  save.tutorialFlags = save.tutorialFlags || {}
  save.novaIntroSeen = save.novaIntroSeen ?? false
  save.guidanceUnknownStreak = save.guidanceUnknownStreak || 0
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
  if (!save.ultraTechPresence) {
    save.ultraTechPresence = {
      level: save.flags?.ut_first_riposte ? 'monitoring' : 'passive',
      lastWarningAt: 0,
      terminalLockUntil: 0,
    }
  }
  save.seenTransmissions = save.seenTransmissions || []
  save.characterTransmissionLastAt = save.characterTransmissionLastAt || 0
  if (save.activeCharacterTransmission === undefined) save.activeCharacterTransmission = null
  if (!save.playerBehavior) {
    save.playerBehavior = {
      lastInputAt: Date.now(),
      lastTickAt: Date.now(),
      commandsUsed: {},
      secretCommandsUsed: {},
      recentCommands: [],
      scanCount: 0,
      overrideCount: 0,
      filesOpened: {},
      connectedMs: 0,
      memory: {},
      reactionLastAt: {},
      globalReactionAt: 0,
    }
  }
  for (const id of Object.keys(save.codexDiscovered)) {
    save.codexNotified[id] = true
  }
  if (!save.unlocked_commands.includes('files')) {
    save.unlocked_commands.push('files')
  }
  save.onboardingSeen = save.onboardingSeen ?? (
    !!(save.player?.username && save.player.username !== 'ghost_demo')
    || !!save.flags?.scan_completed
    || !!save.flags?.mission_1_complete
    || (save.commandCount || 0) > 0
  )
  if (save.onboardingSeen && !save.player?.username) {
    save.player = save.player || {}
    save.player.username = 'ghost_demo'
  }
  save.warningTrace20Seen = save.warningTrace20Seen ?? false
  if (save.traceWarning20 === undefined) save.traceWarning20 = null
  save.triangulation50Seen = save.triangulation50Seen ?? false
  if (save.traceTriangulation50 === undefined) save.traceTriangulation50 = null
  save.emergencyEscape75Seen = save.emergencyEscape75Seen ?? false
  if (save.traceEmergency75 === undefined) save.traceEmergency75 = null
  save.safeWindow = save.safeWindow ?? null
  save.missionCleanup = save.missionCleanup ?? null
  save.missionCleanupOffers = save.missionCleanupOffers || []
  save.marketMissionPurchases = save.marketMissionPurchases || {}
  if (!save.characterInfluence) {
    save.characterInfluence = {
      novaAffinity: 0,
      veilSuspicion: 0,
      morseTrust: 0,
      absentExposure: 0,
    }
  }
  save.influenceUnlocks = save.influenceUnlocks || {}
  save.narrativeChoicesSeen = save.narrativeChoicesSeen || {}
  if (save.narrativeChoice === undefined) save.narrativeChoice = null
  const ensureMission = (id, afterCompleted) => {
    if (!save.missions?.[id]) {
      save.missions = save.missions || {}
      save.missions[id] = {
        status: afterCompleted ? 'active' : 'locked',
        currentObjective: null,
        completedObjectives: [],
        rewardsClaimed: false,
      }
    }
  }
  ensureMission('transmission_interdite', save.missions?.satlink_intrusion?.status === 'completed')
  ensureMission('relais_miroir', save.missions?.transmission_interdite?.status === 'completed')
  ensureMission('protocole_veil', save.missions?.relais_miroir?.status === 'completed')
  save.lastRiskyActionAt = save.lastRiskyActionAt || save.sessionStartMs || Date.now()
  if (save.read_files?.includes('readme.txt') && !save.read_files.includes('note.txt')) {
    save.read_files.push('note.txt')
    save.flags.note_read = true
  }
}

export function saveDemoSave(save) {
  localStorage.setItem(DEMO_SAVE_KEY, JSON.stringify(save))
}

/** Reset = nouvelle partie Mission 1 (état frais). */
export function resetDemoSave() {
  clearAllDemoStorage()
  const initial = createFreshDemoState()
  saveDemoSave(initial)
  return initial
}

/** Charge la démo avancée (showcase). */
export function loadAdvancedDemoSave() {
  clearAllDemoStorage()
  const advanced = createAdvancedDemoState()
  saveDemoSave(advanced)
  return advanced
}

export function loadDemoChat() {
  try {
    const raw = localStorage.getItem(DEMO_CHAT_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return [
    { username: 'sys', timestamp: new Date(Date.now() - 600000).toISOString(), message: '[SYS] Canal clandestin — fréquence verrouillée.' },
  ]
}

export function saveDemoChat(messages) {
  localStorage.setItem(DEMO_CHAT_KEY, JSON.stringify(messages.slice(-100)))
}

export function resetDemoChat() {
  localStorage.removeItem(DEMO_CHAT_KEY)
}
