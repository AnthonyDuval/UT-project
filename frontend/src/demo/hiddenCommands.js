/**
 * Commandes secrètes — jamais dans help, découvertes par essai.
 */

import { HIDDEN_COMMANDS } from './mysteryEvents'
import { processMysteryEvents } from './eventManager'
import { discoverCodex } from './codexService'
import { NODE_META } from './demoState'
import { tx, txRaw } from '../i18n/helpers'

function bumpHiddenUse(save, cmd) {
  save.hiddenCommandUses = save.hiddenCommandUses || {}
  save.hiddenCommandUses[cmd] = (save.hiddenCommandUses[cmd] || 0) + 1
}

function cmdMirror(save) {
  bumpHiddenUse(save, 'mirror')
  const uses = save.hiddenCommandUses.mirror

  if (uses === 1) {
    save.events_log = save.events_log || []
    save.events_log.push('[???] Commande mirror — aucune sortie.')
    discoverCodex(save, 'mirror_silence')
    return { output: [], silent: true, addTrace: 0 }
  }

  save.flags = save.flags || {}
  save.flags.mystery_memory_unlocked = true
  const mystery = processMysteryEvents(save, { type: 'command', command: 'mirror' })
  discoverCodex(save, 'mirror_response')

  return {
    output: [
      tx('terminal.hidden.mirror.unstable'),
      ...(txRaw('terminal.hidden.mirror.ascii') || []),
      '',
      tx('terminal.hidden.mirror.memoryRecovered'),
      ...(mystery.autoLines.length ? ['', ...mystery.autoLines] : []),
    ],
    addTrace: 3,
    uiEffect: mystery.uiEffect || { type: 'glitch', duration: 2200 },
    autoLines: mystery.autoLines,
  }
}

function cmdGhost(save) {
  bumpHiddenUse(save, 'ghost')
  discoverCodex(save, 'ghost_echo')
  save.flags = save.flags || {}
  if (!save.flags.mystery_signal_unlocked && save.traceLevel >= 25) {
    save.flags.mystery_signal_unlocked = true
  }

  const mystery = processMysteryEvents(save, { type: 'command', command: 'ghost' })
  const lines = [
    tx('terminal.hidden.ghost.activating'),
    '',
    tx('terminal.hidden.ghost.pause'),
    tx('terminal.hidden.ghost.line1'),
    tx('terminal.hidden.ghost.line2'),
    '',
    tx('terminal.hidden.ghost.signal'),
  ]

  if (save.flags.mystery_signal_unlocked) {
    lines.push('', tx('terminal.hidden.ghost.unknownSignal'))
  }

  return {
    output: [...lines, ...(mystery.autoLines.length ? ['', ...mystery.autoLines] : [])],
    addTrace: 5,
    autoLines: mystery.autoLines,
  }
}

function cmdNova(save) {
  if (!save.novaIntroSeen) {
    return {
      output: [tx('terminal.hidden.nova.muted')],
      addTrace: 1,
    }
  }
  bumpHiddenUse(save, 'nova')
  if (save.hiddenCommandUses.nova === 1) {
    discoverCodex(save, 'nova_contact_01')
  }
  const tier = save.hiddenCommandUses.nova
  const dialogues = txRaw('terminal.hidden.nova.dialogues') || []
  const idx = Math.min(tier - 1, dialogues.length - 1)

  return {
    output: dialogues[idx] || [],
    addTrace: 2,
    uiEffect: tier === 1 ? { type: 'scanlines', duration: 2000 } : null,
  }
}

function cmdTraceHidden(save) {
  bumpHiddenUse(save, 'trace')
  discoverCodex(save, 'trace_introspection')
  const level = save.traceLevel
  const lines = [
    tx('terminal.hidden.trace.header'),
    '',
    tx('terminal.hidden.trace.currentLevel', { level }),
    tx('terminal.hidden.trace.multiplier', {
      multiplier: NODE_META[save.currentNode]?.traceMultiplier || 1,
    }),
  ]

  if (level < 30) {
    lines.push('', tx('terminal.hidden.trace.low'))
  } else if (level < 60) {
    lines.push('', tx('terminal.hidden.trace.mediumPattern'))
    lines.push(save.novaIntroSeen
      ? tx('terminal.hidden.trace.mediumNova')
      : tx('terminal.hidden.trace.mediumUnknown'))
  } else if (level < 85) {
    lines.push('', tx('terminal.hidden.trace.highWarn'))
    lines.push(save.novaIntroSeen
      ? tx('terminal.hidden.trace.highNova')
      : tx('terminal.hidden.trace.highUnknown'))
  } else {
    lines.push('', tx('terminal.hidden.trace.critical'))
    lines.push(tx('terminal.hidden.trace.criticalLine'))
  }

  return { output: lines, addTrace: 0 }
}

function cmdEcho(save, args) {
  bumpHiddenUse(save, 'echo')
  discoverCodex(save, 'echo_chamber')
  const text = args.join(' ') || save.lastCommand || ''

  if (!text) {
    return {
      output: txRaw('terminal.hidden.echo.empty') || [],
      addTrace: 1,
    }
  }

  const corrupted = text
    .split('')
    .map((c, i) => (i % 4 === 0 && c !== ' ' ? '█' : c))
    .join('')

  const novaLine = text.includes('nova') || text.includes('N0VA')
    ? (save.novaIntroSeen
      ? tx('terminal.hidden.echo.novaKnown')
      : tx('terminal.hidden.echo.novaUnknown'))
    : tx('terminal.hidden.echo.recorded')

  return {
    output: [
      tx('terminal.hidden.echo.prefix', { text: corrupted }),
      '',
      novaLine,
    ],
    addTrace: 2,
  }
}

function cmdOverride(save) {
  bumpHiddenUse(save, 'override')
  const uses = save.hiddenCommandUses.override

  if (uses === 1) {
    discoverCodex(save, 'override_denied')
    return {
      output: txRaw('terminal.hidden.override.denied') || [],
      addTrace: 8,
    }
  }

  save.flags = save.flags || {}
  save.flags.mystery_override_unlocked = true
  discoverCodex(save, 'override_breach')
  const mystery = processMysteryEvents(save, { type: 'command', command: 'override' })

  const result = {
    output: [
      ...(txRaw('terminal.hidden.override.breach') || []),
      ...(mystery.autoLines.length ? ['', ...mystery.autoLines] : []),
    ],
    addTrace: 12,
    uiEffect: mystery.uiEffect,
    fakeGameOver: mystery.fakeGameOver,
    autoLines: mystery.autoLines,
  }

  if (mystery.fakeGameOver) {
    result.uiEffect = result.uiEffect || { type: 'fake_gameover', duration: mystery.fakeGameOver.duration }
  }

  return result
}

function cmdDisconnectHidden(save) {
  discoverCodex(save, 'phantom_disconnect')
  return {
    output: txRaw('terminal.hidden.disconnect') || [],
    addTrace: 4,
    uiEffect: { type: 'scanlines', duration: 1500 },
  }
}

export function isHiddenCommand(cmd) {
  return HIDDEN_COMMANDS.has(cmd)
}

export function handleHiddenCommand(save, cmd, args) {
  switch (cmd) {
    case 'mirror': return cmdMirror(save)
    case 'ghost': return cmdGhost(save)
    case 'nova': return cmdNova(save)
    case 'trace': return cmdTraceHidden(save)
    case 'echo': return cmdEcho(save, args)
    case 'override': return cmdOverride(save)
    default: return null
  }
}

export function handleMysteryDisconnect(save, isUnlocked) {
  if (isUnlocked) return null
  return cmdDisconnectHidden(save)
}
