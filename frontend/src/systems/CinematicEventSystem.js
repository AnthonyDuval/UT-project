/**
 * CinematicEventSystem — cœur des événements vidéo narratifs.
 */

export const CINEMATIC_TYPES = {
  ULTRATECH_TRANSMISSION: 'ultratech_transmission',
  VOID_RELAY: 'void_relay',
  SYSTEM_FAILURE: 'system_failure',
}

export const CINEMATIC_VIDEOS = {
  [CINEMATIC_TYPES.ULTRATECH_TRANSMISSION]: '/assets/videos/events/ultratech_transmission.mp4',
  [CINEMATIC_TYPES.VOID_RELAY]: '/assets/videos/events/void_relay.mp4',
  [CINEMATIC_TYPES.SYSTEM_FAILURE]: '/assets/videos/events/system_failure.mp4',
}

export const CINEMATIC_GLOBAL_COOLDOWN_MS = 120000
const VOID_RELAY_NODE = 'void_relay'

const CINEMATIC_META = {
  [CINEMATIC_TYPES.ULTRATECH_TRANSMISSION]: {
    lockTerminal: true,
    maxDurationMs: 12000,
    darken: true,
    glitchUi: true,
    bannerMessage: 'TRANSMISSION ULTRATECH INTERCEPTÉE',
    log: '[ULTRATECH] TRANSMISSION ULTRATECH INTERCEPTÉE',
  },
  [CINEMATIC_TYPES.VOID_RELAY]: {
    lockTerminal: false,
    maxDurationMs: 11000,
    darken: true,
    glitchUi: true,
    revealPhantom: true,
    bannerMessage: 'NOEUD FANTÔME DÉTECTÉ',
    log: '[???] NOEUD FANTÔME DÉTECTÉ',
  },
  [CINEMATIC_TYPES.SYSTEM_FAILURE]: {
    lockTerminal: true,
    maxDurationMs: 13000,
    blackout: true,
    glitchUi: true,
    audioGlitch: true,
    bannerMessage: 'ERREUR SYSTÈME CRITIQUE',
    log: '[SYS] ERREUR SYSTÈME CRITIQUE',
  },
}

export function ensureCinematicState(save) {
  save.cinematicSeenEvents = save.cinematicSeenEvents || []
  save.cinematicLastGlobalAt = save.cinematicLastGlobalAt || 0
  save.cinematicLastTriggeredAt = save.cinematicLastTriggeredAt || {}
  save.cinematicFlags = save.cinematicFlags || {}
}

function revealPhantomNode(save) {
  if (!save.discoveredNodes.includes(VOID_RELAY_NODE)) {
    save.discoveredNodes.push(VOID_RELAY_NODE)
    save.cinematicFlags.void_relay_temp = true
  }
}

function buildActiveCinematic(type, eventId) {
  const meta = CINEMATIC_META[type]
  return {
    type,
    eventId,
    source: eventId,
    startedAt: Date.now(),
    lockTerminal: meta.lockTerminal,
    maxDurationMs: meta.maxDurationMs,
    darken: meta.darken,
    glitchUi: meta.glitchUi,
    blackout: meta.blackout,
    audioGlitch: meta.audioGlitch,
    revealPhantom: meta.revealPhantom,
    bannerMessage: meta.bannerMessage,
  }
}

/** Déclenche un événement cinématique (log console inclus). */
export function fireCinematicEvent(save, type, eventId = `manual_${type}`) {
  if (save.gameOver || save.activeCinematic || save.activeCharacterTransmission) return null
  if (save.fakeGameOverUntil && Date.now() < save.fakeGameOverUntil) return null

  ensureCinematicState(save)
  const meta = CINEMATIC_META[type]
  if (!meta) return null

  const sinceGlobal = Date.now() - (save.cinematicLastGlobalAt || 0)
  if (save.cinematicLastGlobalAt && sinceGlobal < CINEMATIC_GLOBAL_COOLDOWN_MS) {
    return null
  }

  if (meta.revealPhantom) revealPhantomNode(save)

  save.activeCinematic = buildActiveCinematic(type, eventId)
  save.cinematicLastGlobalAt = Date.now()
  save.cinematicLastTriggeredAt[eventId] = Date.now()

  // eslint-disable-next-line no-console
  console.log('[CINEMATIC EVENT]', eventId)

  return {
    cinematic: save.activeCinematic,
    autoLines: meta.log ? [meta.log] : [],
  }
}

export function triggerUltraTechTransmission(save, source = 'manual_ultratech_transmission') {
  return fireCinematicEvent(save, CINEMATIC_TYPES.ULTRATECH_TRANSMISSION, source)
}

export function triggerVoidRelay(save, source = 'manual_void_relay') {
  return fireCinematicEvent(save, CINEMATIC_TYPES.VOID_RELAY, source)
}

export function triggerSystemFailure(save, source = 'manual_system_failure') {
  return fireCinematicEvent(save, CINEMATIC_TYPES.SYSTEM_FAILURE, source)
}

export function mergeCinematicResult(base, cinematicResult) {
  if (!cinematicResult?.cinematic) return base
  return {
    ...base,
    cinematic: cinematicResult.cinematic,
    autoLines: [...(base.autoLines || []), ...(cinematicResult.autoLines || [])],
    fired: cinematicResult.fired || base.fired,
  }
}

export function clearActiveCinematic(save) {
  ensureCinematicState(save)
  const was = save.activeCinematic
  save.activeCinematic = null

  if (save.cinematicFlags.void_relay_temp) {
    save.discoveredNodes = save.discoveredNodes.filter((id) => id !== VOID_RELAY_NODE)
    delete save.cinematicFlags.void_relay_temp
  }

  const recoveryLine = was?.type === CINEMATIC_TYPES.SYSTEM_FAILURE
    ? '[SYS] Noyau restauré — session récupérée.'
    : was?.type === CINEMATIC_TYPES.VOID_RELAY
      ? '[NET] Signal VOID dissous — relay introuvable.'
      : null

  return {
    autoLines: recoveryLine ? [recoveryLine] : [],
  }
}

export { VOID_RELAY_NODE }
