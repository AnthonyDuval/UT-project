import { NODE_META } from '../demo/demoState'

const SUSPICIOUS_COMMANDS = new Set([
  'scan', 'connect', 'probe', 'override', 'trace', 'mirror', 'ghost', 'nova',
  'disconnect', 'run', 'inject', 'spoof', 'bypass',
])

export function formatSessionDuration(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function collectSuspiciousCommands(save) {
  const behavior = save.playerBehavior || {}
  const merged = {}

  for (const [cmd, count] of Object.entries(behavior.commandsUsed || {})) {
    if (SUSPICIOUS_COMMANDS.has(cmd) && count > 0) merged[cmd] = (merged[cmd] || 0) + count
  }
  for (const [cmd, count] of Object.entries(behavior.secretCommandsUsed || {})) {
    if (count > 0) merged[cmd] = (merged[cmd] || 0) + count
  }
  for (const [cmd, count] of Object.entries(save.hiddenCommandUses || {})) {
    if (count > 0) merged[cmd] = (merged[cmd] || 0) + count
  }

  const ranked = Object.entries(merged)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([cmd, count]) => ({ cmd, count }))

  if (ranked.length) return ranked

  const recent = [...new Set((behavior.recentCommands || []).map((e) => e.cmd).filter(Boolean))]
    .slice(-4)
    .map((cmd) => ({ cmd, count: 1 }))

  return recent
}

function collectVisitedNodes(save) {
  return (save.discoveredNodes || ['local']).map((id) => ({
    id,
    name: NODE_META[id]?.displayName || NODE_META[id]?.name || id.toUpperCase(),
  }))
}

export function buildGameOverReport(save) {
  const now = Date.now()
  const started = save.sessionStartMs || now
  return {
    operatorName: save.player?.username || 'UNKNOWN',
    finalTrace: save.traceLevel ?? 100,
    suspiciousCommands: collectSuspiciousCommands(save),
    visitedNodes: collectVisitedNodes(save),
    sessionDurationMs: now - started,
    commandCount: save.commandCount || 0,
  }
}

export function pickRareGameOverLine(lines, seed = Date.now()) {
  if (!Array.isArray(lines) || lines.length === 0) return null
  if (seed % 7 !== 0) return null
  return lines[seed % lines.length]
}
