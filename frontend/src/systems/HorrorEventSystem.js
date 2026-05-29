/**
 * HorrorEventSystem — événements narratifs horrifiques rares et imprévisibles.
 * Présence psychologique : le joueur hésite entre bug, événement, présence réelle.
 */

import { HIDDEN_COMMANDS } from '../demo/mysteryEvents'

/** Cooldown global entre deux événements horreur (ms). */
export const HORROR_GLOBAL_COOLDOWN_MS = 90000

/** Types d'effets UI supportés par MysteryOverlay / Terminal. */
export const HORROR_EFFECT_TYPES = {
  PIXEL_MASS: 'pixel_mass',
  ULTRATECH_WATCH: 'ultratech_watch',
  GHOST_TYPING: 'ghost_typing',
  FAKE_GAME_OVER: 'fake_gameover',
  PHANTOM_NODE: 'phantom_node',
  CORRUPTED_TOAST: 'corrupt_notify',
  CURSOR_POSSESSION: 'cursor_possession',
  HORROR_AMBIENT: 'horror_ambient',
}

const GHOST_TYPING_TEXTS = ['nous savons', 'ghost…', 'ghost...', 'arrête', 'je vois']
const POSSESSION_COMMANDS = ['mirror', 'trace', 'scan', 'whoami']

const PHANTOM_NODE_ID = 'void_relay'

export const HORROR_EVENTS = [
  {
    id: 'horror_pixel_mass',
    once: false,
    chance: 0.35,
    cooldownMs: 240000,
    conditions: { type: 'tick', minSessionSec: 90 },
    effects: {
      uiEffect: { type: HORROR_EFFECT_TYPES.PIXEL_MASS, duration: 1500 },
      log: '[???] Anomalie visuelle — segment 0xFF corrompu.',
    },
  },
  {
    id: 'horror_pixel_mass_trace',
    once: false,
    chance: 0.28,
    cooldownMs: 200000,
    conditions: { type: 'trace', minTrace: 55 },
    effects: {
      uiEffect: { type: HORROR_EFFECT_TYPES.PIXEL_MASS, duration: 1800 },
      log: '[TRACE] Artefact numérique détecté près du seuil critique.',
    },
  },
  {
    id: 'horror_ultratech_watch',
    once: false,
    chance: 0.4,
    cooldownMs: 300000,
    conditions: { type: 'trace', minTrace: 48 },
    effects: {
      uiEffect: {
        type: HORROR_EFFECT_TYPES.ULTRATECH_WATCH,
        message: 'ULTRATECH VOUS SURVEILLE',
        duration: 2200,
      },
      log: '[SECOPS] Signature de surveillance active.',
    },
  },
  {
    id: 'horror_ultratech_watch_connected',
    once: false,
    chance: 0.25,
    cooldownMs: 280000,
    conditions: { type: 'tick', minConnectedSec: 120, minTrace: 25 },
    effects: {
      uiEffect: {
        type: HORROR_EFFECT_TYPES.ULTRATECH_WATCH,
        message: 'ULTRATECH VOUS SURVEILLE',
        duration: 2000,
      },
      autoLines: ['[???] Quelqu\'un respire dans le tunnel.'],
    },
  },
  {
    id: 'horror_ghost_typing',
    once: false,
    chance: 0.22,
    cooldownMs: 360000,
    conditions: { type: 'tick', minSessionSec: 200, minCommands: 8 },
    effects: {
      terminalEffect: {
        type: HORROR_EFFECT_TYPES.GHOST_TYPING,
        holdMs: 1200,
      },
      uiEffect: { type: HORROR_EFFECT_TYPES.HORROR_AMBIENT, duration: 3800 },
      log: '[EVENT] Entrée terminal non initiée.',
    },
  },
  {
    id: 'horror_ghost_typing_secret',
    once: false,
    chance: 0.3,
    cooldownMs: 240000,
    conditions: { type: 'command', hiddenCommand: true },
    effects: {
      terminalEffect: {
        type: HORROR_EFFECT_TYPES.GHOST_TYPING,
        holdMs: 900,
      },
      uiEffect: { type: HORROR_EFFECT_TYPES.HORROR_AMBIENT, duration: 3200 },
    },
  },
  {
    id: 'horror_fake_gameover',
    once: false,
    chance: 0.18,
    cooldownMs: 420000,
    conditions: { type: 'trace', minTrace: 68 },
    effects: {
      fakeGameOver: { duration: 3800 },
      uiEffect: {
        type: HORROR_EFFECT_TYPES.FAKE_GAME_OVER,
        traceLevel: true,
        duration: 3800,
      },
      log: '[EVENT] Signal GAME OVER injecté — origine inconnue.',
    },
  },
  {
    id: 'horror_fake_gameover_idle',
    once: false,
    chance: 0.12,
    cooldownMs: 480000,
    conditions: { type: 'tick', minSessionSec: 420, minTrace: 40 },
    effects: {
      fakeGameOver: { duration: 3500 },
      uiEffect: {
        type: HORROR_EFFECT_TYPES.FAKE_GAME_OVER,
        traceLevel: true,
        duration: 3500,
      },
    },
  },
  {
    id: 'horror_phantom_node',
    once: true,
    chance: 0.5,
    cooldownMs: 0,
    conditions: { type: 'tick', minSessionSec: 300, minCommands: 14 },
    effects: {
      revealNode: PHANTOM_NODE_ID,
      autoLines: [
        '[NET] ??? — nœud non catalogué détecté',
        '[NET] Designation : ██_VOID_RELAY',
        '[???] Il n\'existait pas il y a une seconde.',
      ],
      uiEffect: { type: HORROR_EFFECT_TYPES.PHANTOM_NODE, duration: 2800 },
      log: '[NET] Apparition fantôme — VOID_RELAY.',
    },
  },
  {
    id: 'horror_corrupted_toast',
    once: false,
    chance: 0.45,
    cooldownMs: 180000,
    conditions: { type: 'file', horrorFile: true },
    effects: {
      uiEffect: {
        type: HORROR_EFFECT_TYPES.CORRUPTED_TOAST,
        duration: 3200,
      },
    },
  },
  {
    id: 'horror_corrupted_toast_random',
    once: false,
    chance: 0.08,
    cooldownMs: 300000,
    conditions: { type: 'tick', minSessionSec: 150 },
    effects: {
      uiEffect: {
        type: HORROR_EFFECT_TYPES.CORRUPTED_TOAST,
        duration: 2800,
      },
    },
  },
  {
    id: 'horror_cursor_possession',
    once: false,
    chance: 0.2,
    cooldownMs: 400000,
    conditions: { type: 'tick', minSessionSec: 260, minCommands: 16 },
    effects: {
      terminalEffect: {
        type: HORROR_EFFECT_TYPES.CURSOR_POSSESSION,
        submit: false,
        holdMs: 600,
      },
      uiEffect: { type: HORROR_EFFECT_TYPES.HORROR_AMBIENT, duration: 4200 },
      log: '[EVENT] Pointeur déplacé sans entrée utilisateur.',
    },
  },
  {
    id: 'horror_cursor_possession_trace',
    once: false,
    chance: 0.25,
    cooldownMs: 320000,
    conditions: { type: 'trace', minTrace: 58 },
    effects: {
      terminalEffect: {
        type: HORROR_EFFECT_TYPES.CURSOR_POSSESSION,
        submitChance: 0.15,
        holdMs: 400,
      },
      uiEffect: { type: HORROR_EFFECT_TYPES.HORROR_AMBIENT, duration: 3600 },
    },
  },
]

const HORROR_FILES = new Set([
  'do_not_open.sys',
  'memory_fragment.log',
  'unknown_signal.enc',
  'archive_███.dat',
])

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickCorruptMessage() {
  const msgs = [
    'ERR0R — MÉMOIRE CORROMPUE',
    'SURVEILLANCE ACTIVE',
    'SESSION COMPROMISE ???',
    'NŒUD FANTÔME DÉTECTÉ',
    'ULTRATECH — ACCÈS REFUSÉ',
    '█▄█ LOST SIGNAL █▄█',
  ]
  return pickRandom(msgs)
}

function ensureHorrorState(save) {
  if (!save.horrorSeenEvents) save.horrorSeenEvents = []
  if (!save.horrorLastTriggeredAt) save.horrorLastTriggeredAt = {}
  if (save.horrorLastGlobalAt == null) save.horrorLastGlobalAt = 0
  if (!save.horrorFlags) save.horrorFlags = {}
  if (!save.sessionStartMs) save.sessionStartMs = Date.now()
  if (save.commandCount == null) save.commandCount = 0
}

function sessionSeconds(save) {
  return Math.floor((Date.now() - (save.sessionStartMs || Date.now())) / 1000)
}

function connectedSeconds(save) {
  if (save.currentNode === 'local' || !save.connectedSinceMs) return 0
  return Math.floor((Date.now() - save.connectedSinceMs) / 1000)
}

/** Met à jour le timestamp de connexion réseau. */
export function trackHorrorConnection(save) {
  ensureHorrorState(save)
  if (save.currentNode !== 'local') {
    if (!save.connectedSinceMs) save.connectedSinceMs = Date.now()
  } else {
    save.connectedSinceMs = null
  }
}

function matchesConditions(event, save, ctx) {
  const c = event.conditions
  if (c.type !== ctx.type) return false

  if (c.minTrace != null && save.traceLevel < c.minTrace) return false
  if (c.maxTrace != null && save.traceLevel > c.maxTrace) return false
  if (c.minSessionSec != null && sessionSeconds(save) < c.minSessionSec) return false
  if (c.minConnectedSec != null && connectedSeconds(save) < c.minConnectedSec) return false
  if (c.minCommands != null && (save.commandCount || 0) < c.minCommands) return false

  if (c.hiddenCommand) {
    if (!ctx.command || !HIDDEN_COMMANDS.has(ctx.command)) return false
  }

  if (c.horrorFile) {
    if (!ctx.file || !HORROR_FILES.has(ctx.file)) return false
  }

  return true
}

function applyHorrorEffects(save, effects, ctx) {
  const result = {
    autoLines: [],
    uiEffect: null,
    fakeGameOver: null,
    terminalEffect: null,
  }

  if (effects.log) {
    save.events_log = save.events_log || []
    save.events_log.push(effects.log)
  }

  if (effects.autoLines?.length) {
    result.autoLines.push(...effects.autoLines)
  }

  if (effects.flag) {
    save.horrorFlags[effects.flag] = true
  }

  if (effects.revealNode) {
    if (!save.discoveredNodes.includes(effects.revealNode)) {
      save.discoveredNodes.push(effects.revealNode)
    }
    save.horrorFlags[`phantom_${effects.revealNode}`] = true
  }

  if (effects.uiEffect) {
    const ui = { ...effects.uiEffect }
    if (ui.traceLevel === true) ui.traceLevel = save.traceLevel
    if (ui.type === HORROR_EFFECT_TYPES.CORRUPTED_TOAST && !ui.message) {
      ui.message = pickCorruptMessage()
    }
    save.activeUiEffect = ui
    result.uiEffect = ui
  }

  if (effects.fakeGameOver) {
    save.fakeGameOverUntil = Date.now() + effects.fakeGameOver.duration
    result.fakeGameOver = effects.fakeGameOver
    if (!result.uiEffect) {
      const ui = {
        type: HORROR_EFFECT_TYPES.FAKE_GAME_OVER,
        traceLevel: save.traceLevel,
        duration: effects.fakeGameOver.duration,
      }
      save.activeUiEffect = ui
      result.uiEffect = ui
    }
  }

  if (effects.terminalEffect) {
    const te = { ...effects.terminalEffect }
    if (te.type === HORROR_EFFECT_TYPES.GHOST_TYPING) {
      te.text = pickRandom(GHOST_TYPING_TEXTS)
    }
    if (te.type === HORROR_EFFECT_TYPES.CURSOR_POSSESSION) {
      te.text = pickRandom(POSSESSION_COMMANDS)
      if (te.submitChance != null) {
        te.submit = Math.random() < te.submitChance
        delete te.submitChance
      }
    }
    result.terminalEffect = te
  }

  return result
}

function shuffleEvents(events) {
  const copy = [...events]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Évalue et déclenche au plus un événement horreur par appel.
 * @returns {{ autoLines: string[], uiEffect: object|null, fakeGameOver: object|null, terminalEffect: object|null, fired: string[] }}
 */
export function processHorrorEvents(save, ctx) {
  ensureHorrorState(save)

  const empty = {
    autoLines: [],
    uiEffect: null,
    fakeGameOver: null,
    terminalEffect: null,
    fired: [],
  }

  if (save.gameOver && !save.fakeGameOverUntil) return empty

  const sinceGlobal = Date.now() - save.horrorLastGlobalAt
  if (save.horrorLastGlobalAt && sinceGlobal < HORROR_GLOBAL_COOLDOWN_MS) return empty

  const eligible = shuffleEvents(HORROR_EVENTS).filter((event) => {
    if (event.once && save.horrorSeenEvents.includes(event.id)) return false

    const cooldownMs = event.cooldownMs ?? 180000
    if (cooldownMs > 0) {
      const lastAt = save.horrorLastTriggeredAt[event.id]
      if (lastAt && Date.now() - lastAt < cooldownMs) return false
    }

    return matchesConditions(event, save, ctx)
  })

  for (const event of eligible) {
    if (event.chance != null && Math.random() > event.chance) continue

    save.horrorSeenEvents.push(event.id)
    save.horrorLastTriggeredAt[event.id] = Date.now()
    save.horrorLastGlobalAt = Date.now()

    const applied = applyHorrorEffects(save, event.effects, ctx)

    return {
      autoLines: applied.autoLines,
      uiEffect: applied.uiEffect,
      fakeGameOver: applied.fakeGameOver,
      terminalEffect: applied.terminalEffect,
      fired: [event.id],
    }
  }

  return empty
}

export function processHorrorTick(save) {
  return processHorrorEvents(save, { type: 'tick' })
}

export function processHorrorTrace(save) {
  return processHorrorEvents(save, { type: 'trace' })
}

export function processHorrorAfterCommand(save, command) {
  return processHorrorEvents(save, {
    type: 'command',
    command: command?.toLowerCase(),
  })
}

export function processHorrorFileOpen(save, filename) {
  return processHorrorEvents(save, { type: 'file', file: filename })
}

/** Fusionne résultats mystery + horreur (horreur prioritaire pour uiEffect si présent). */
export function mergeHorrorResult(base, horror) {
  if (!horror?.fired?.length) return base

  return {
    autoLines: [...(base.autoLines || []), ...(horror.autoLines || [])],
    uiEffect: horror.uiEffect || base.uiEffect,
    fakeGameOver: horror.fakeGameOver || base.fakeGameOver,
    terminalEffect: horror.terminalEffect || base.terminalEffect,
    fired: [...(base.fired || []), ...(horror.fired || [])],
  }
}

export { PHANTOM_NODE_ID }
