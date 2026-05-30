/** Durée max avant failsafe global (ms). */
export const TERMINAL_LOCK_FAILSAFE_MS = 15000

const TRANSMISSION_LOCK_GRACE_MS = 1500
const CINEMATIC_LOCK_GRACE_MS = 2000

const LOCKING_UI_TYPES = new Set(['ut_freeze', 'session_surveillance'])

export function isActiveUiEffectLocking(effect, now = Date.now()) {
  if (!effect || !LOCKING_UI_TYPES.has(effect.type)) return false
  const started = effect._started || effect.startedAt || 0
  const duration = effect.duration ?? 5000
  if (!started) return false
  return now - started < duration
}

export function isPresenceLocking(presence, now = Date.now()) {
  return (presence?.terminalLockUntil || 0) > now
}

export function isCinematicLocking(cinematic, now = Date.now()) {
  if (!cinematic?.lockTerminal) return false
  const started = cinematic.startedAt || 0
  const maxMs = cinematic.maxDurationMs || 12000
  if (!started) return true
  return now - started < maxMs + CINEMATIC_LOCK_GRACE_MS
}

export function isTransmissionLocking(transmission, now = Date.now()) {
  if (!transmission) return false
  const started = transmission.startedAt || 0
  const duration = transmission.durationMs || 10000
  if (!started) return true
  return now - started < duration + TRANSMISSION_LOCK_GRACE_MS
}

export function isTraceWarning20Locking(warning, now = Date.now()) {
  if (!warning?.open) return false
  const lockUntil = warning.lockUntil || 0
  return lockUntil > now
}

export function isTraceTriangulation50Locking(triangulation, now = Date.now()) {
  if (!triangulation?.open) return false
  const lockUntil = triangulation.lockUntil || 0
  return lockUntil > now
}

export function isTraceEmergency75Locking(emergency) {
  return !!emergency?.open
}

export function computeNarrativeTerminalLock(state, now = Date.now()) {
  if (!state) return false
  return (
    isActiveUiEffectLocking(state.activeUiEffect, now)
    || isPresenceLocking(state.ultraTechPresence, now)
    || isCinematicLocking(state.activeCinematic, now)
    || isTransmissionLocking(state.activeCharacterTransmission, now)
    || isTraceWarning20Locking(state.traceWarning20, now)
    || isTraceTriangulation50Locking(state.traceTriangulation50, now)
    || isTraceEmergency75Locking(state.traceEmergency75)
  )
}

export function getNarrativeLockStartedAt(state) {
  if (!state) return 0
  const candidates = [
    state.activeUiEffect?._started,
    state.activeUiEffect?.startedAt,
    state.activeCinematic?.startedAt,
    state.activeCharacterTransmission?.startedAt,
    state.ultraTechPresence?.terminalLockUntil
      ? (state.ultraTechPresence.terminalLockUntil - 4000)
      : 0,
    state.traceWarning20?.startedAt,
    state.traceTriangulation50?.startedAt,
    state.traceEmergency75?.startedAt,
  ].filter(Boolean)
  return candidates.length ? Math.min(...candidates) : 0
}
