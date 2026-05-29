/**
 * PlayerBehaviorTracker — mémoire comportementale du terminal.
 * Le système observe sans commenter à chaque action.
 */

import { HIDDEN_COMMANDS } from '../demo/mysteryEvents'

const RECENT_COMMAND_LIMIT = 24
const SPAM_WINDOW_MS = 8000
const SPAM_THRESHOLD = 5

export function createBehaviorState() {
  return {
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

export function ensureBehavior(save) {
  if (!save.playerBehavior) {
    save.playerBehavior = createBehaviorState()
  }
  return save.playerBehavior
}

export function getAfkSeconds(save) {
  const b = ensureBehavior(save)
  const ref = b.lastInputAt || save.sessionStartMs || Date.now()
  return Math.floor((Date.now() - ref) / 1000)
}

export function getConnectedMinutes(save) {
  const b = ensureBehavior(save)
  return Math.floor((b.connectedMs || 0) / 60000)
}

export function isSpamming(save) {
  const b = ensureBehavior(save)
  const now = Date.now()
  const recent = (b.recentCommands || []).filter((e) => now - e.at < SPAM_WINDOW_MS)
  return recent.length >= SPAM_THRESHOLD
}

export function rememberAction(save, key, data = {}) {
  const b = ensureBehavior(save)
  const prev = b.memory[key] || { count: 0, firstAt: null, lastAt: null, whispered: false }
  const now = Date.now()
  b.memory[key] = {
    ...prev,
    ...data,
    count: (prev.count || 0) + 1,
    firstAt: prev.firstAt || now,
    lastAt: now,
  }
}

export function trackBehaviorCommand(save, cmd, args = [], meta = {}) {
  const b = ensureBehavior(save)
  const now = Date.now()
  const normalized = cmd?.toLowerCase?.() || ''

  b.lastInputAt = now
  b.commandsUsed[normalized] = (b.commandsUsed[normalized] || 0) + 1
  b.recentCommands = [
    ...(b.recentCommands || []),
    { cmd: normalized, at: now, raw: meta.rawCommand || normalized },
  ].slice(-RECENT_COMMAND_LIMIT)

  if (HIDDEN_COMMANDS.has(normalized) || meta.isSecret) {
    b.secretCommandsUsed[normalized] = (b.secretCommandsUsed[normalized] || 0) + 1
  }

  if (normalized === 'scan') b.scanCount = (b.scanCount || 0) + 1
  if (normalized === 'override') b.overrideCount = (b.overrideCount || 0) + 1

  if (normalized === 'mirror') rememberAction(save, 'mirror')
  if (normalized === 'override') rememberAction(save, 'override')
  if (normalized === 'ghost') rememberAction(save, 'ghost')
  if (normalized === 'echo') rememberAction(save, 'echo')

  if (normalized === 'open' && args[0]) {
    trackBehaviorFileOpen(save, args[0].toLowerCase())
  }
}

export function trackBehaviorFileOpen(save, filename) {
  const b = ensureBehavior(save)
  b.lastInputAt = Date.now()
  b.filesOpened[filename] = (b.filesOpened[filename] || 0) + 1
  rememberAction(save, `file:${filename}`)
}

export function trackBehaviorTick(save) {
  const b = ensureBehavior(save)
  const now = Date.now()
  const delta = now - (b.lastTickAt || now)
  b.lastTickAt = now

  if (save.currentNode && save.currentNode !== 'local') {
    b.connectedMs = (b.connectedMs || 0) + delta
  }

  return { afkSeconds: getAfkSeconds(save), deltaMs: delta }
}

export function markReactionFired(save, reactionId) {
  const b = ensureBehavior(save)
  const now = Date.now()
  b.reactionLastAt[reactionId] = now
  b.globalReactionAt = now
}

export function canFireReaction(save, reactionId, cooldownMs = 300000) {
  const b = ensureBehavior(save)
  const globalCooldown = 180000
  if (b.globalReactionAt && Date.now() - b.globalReactionAt < globalCooldown) return false
  const last = b.reactionLastAt[reactionId]
  if (last && Date.now() - last < cooldownMs) return false
  return true
}

export function getBehaviorSnapshot(save) {
  const b = ensureBehavior(save)
  return {
    afkSeconds: getAfkSeconds(save),
    connectedMinutes: getConnectedMinutes(save),
    commandCount: save.commandCount || 0,
    scanCount: b.scanCount || 0,
    overrideCount: b.overrideCount || 0,
    secretUses: Object.values(b.secretCommandsUsed || {}).reduce((n, v) => n + v, 0),
    filesOpenedCount: Object.keys(b.filesOpened || {}).length,
    isSpamming: isSpamming(save),
    memory: { ...b.memory },
  }
}
