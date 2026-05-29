/**
 * Moteur de commandes local — mode démo offline.
 */

import {
  DEMO_FILES,
  NODE_META,
  PROGRAMS,
  getDemoFile,
  getVisibleFiles,
  toPublicState,
} from './demoState'
import { loadDemoSave, loadAdvancedDemoSave, resetDemoSave, saveDemoSave } from './demoStorage'
import { discoverCodexFromFile, consumePendingCodexDiscoveries, discoverCodex } from './codexService'
import {
  clearExpiredUiEffects,
  processMysteryAfterCommand,
  processMysteryFileOpen,
  processMysteryTick,
  processMysteryTrace,
  stampUiEffectStart,
} from './eventManager'
import { syncMissionObjectiveText } from '../utils/missionHints'
import {
  handleHiddenCommand,
  handleMysteryDisconnect,
  isHiddenCommand,
} from './hiddenCommands'
import { updateMissionProgress } from './missionProgress'
import {
  mergeHorrorResult,
  processHorrorAfterCommand,
  processHorrorFileOpen,
  processHorrorTick,
  processHorrorTrace,
  trackHorrorConnection,
} from '../systems/HorrorEventSystem'
import { trackBehaviorCommand, ensureBehavior } from '../systems/PlayerBehaviorTracker'
import {
  mergeBehaviorResult,
  processBehaviorAfterCommand,
  processBehaviorTick,
} from '../systems/SystemReactionEngine'
import { clearActiveCinematic } from '../systems/CinematicEventSystem'
import { rollRandomCinematic } from '../systems/RandomCinematicEvents'
import {
  rollCharacterTransmission,
  clearActiveCharacterTransmission,
} from '../systems/CharacterTransmissionSystem.jsx'
import { tx, txRaw } from '../i18n/helpers'

function trackTutorial(save, cmd, args) {
  save.tutorialFlags = save.tutorialFlags || {}
  if (cmd === 'help') save.tutorialFlags.help = true
  if (cmd === 'files' || cmd === 'ls') save.tutorialFlags.files = true
  if (cmd === 'open' && args[0]?.toLowerCase() === 'note.txt') save.tutorialFlags.open_note = true
  if (cmd === 'scan') save.tutorialFlags.scan = true
  if (cmd === 'connect') save.tutorialFlags.connect = true
  syncMissionObjectiveText(save)
}

function tryCharacterTransmission(save, trigger = 'random') {
  if (save.gameOver || save.activeCinematic || save.activeCharacterTransmission) return null
  return rollCharacterTransmission(save, { trigger })
}

function finishCommand(save, output, extras = {}) {
  stampUiEffectStart(save)
  saveDemoSave(save)
  const newCodexDiscoveries = consumePendingCodexDiscoveries(save)
  saveDemoSave(save)
  return {
    output: output ?? [],
    clear_terminal: extras.clear_terminal || false,
    state: toPublicState(save),
    uiEffect: save.activeUiEffect,
    cinematic: save.activeCinematic || null,
    transmission: save.activeCharacterTransmission || null,
    autoLines: extras.autoLines || [],
    terminalEffect: extras.terminalEffect || null,
    newCodexDiscoveries,
  }
}

function finalizeCommand(save, output, extras = {}) {
  const mission = updateMissionProgress(save)
  if (mission.output.length) output = [...output, '', ...mission.output]
  if (mission.narrative.length) output = [...output, ...mission.narrative]
  if (mission.output.length) tryCharacterTransmission(save, 'mission_progress')

  const traceMsgs = traceMessages(save)
  if (traceMsgs.length) output = [...output, '', ...traceMsgs]

  return finishCommand(save, output, extras)
}

function addTrace(save, amount) {
  if (amount <= 0 || save.gameOver) return []
  const prev = save.traceLevel
  const mult = NODE_META[save.currentNode]?.traceMultiplier || 1
  const passive = save.traceReductionPassive || 0
  const actual = Math.max(1, Math.round(amount * mult * (1 - passive / 100)))
  save.traceLevel = Math.min(100, save.traceLevel + actual)
  const mysteryAuto = []
  if (save.traceLevel >= 30 && !save.trace_alerts_triggered.includes(30)) {
    save.trace_alerts_triggered.push(30)
    save.events_log.push(tx('terminal.trace.activity30'))
  }
  if (save.traceLevel >= 60 && !save.trace_alerts_triggered.includes(60)) {
    save.trace_alerts_triggered.push(60)
    save.events_log.push(tx('terminal.trace.analyzing60'))
  }
  if (save.traceLevel >= 100) {
    save.gameOver = true
    save.events_log.push(tx('terminal.trace.gameOver'))
  }
  if (prev !== save.traceLevel) {
    if (prev < 50 && save.traceLevel >= 50) tryCharacterTransmission(save, 'high_trace')
    if (prev < 70 && save.traceLevel >= 70) tryCharacterTransmission(save, 'high_trace')
    const merged = mergeHorrorResult(
      processMysteryTrace(save),
      processHorrorTrace(save),
    )
    if (merged.autoLines.length) {
      save._pendingMysteryLines = (save._pendingMysteryLines || []).concat(merged.autoLines)
      mysteryAuto.push(...merged.autoLines)
    }
    if (merged.uiEffect) save.activeUiEffect = merged.uiEffect
  }
  return mysteryAuto
}

function traceMessages(save) {
  if (save.traceLevel >= 100) {
    return [tx('terminal.trace.critical')]
  }
  return []
}

function cmdHelp(save) {
  const sorted = [...save.unlocked_commands].filter((c) => c !== 'ls').sort()
  return [
    tx('terminal.help.header'),
    '',
    ...sorted.map((name) => `  ${name}`),
    '',
    tx('terminal.help.footer'),
  ]
}

function cmdFiles(save) {
  const visible = getVisibleFiles(save)
  if (!visible.length) {
    return [tx('terminal.files.empty')]
  }
  const lines = [tx('terminal.files.header'), '']
  for (const name of visible) {
    const file = getDemoFile(name)
    lines.push(tx('terminal.ls.fileEntryBullet', {
      name: name.padEnd(22),
      description: file?.description || '',
    }))
  }
  return lines
}

function cmdLs(save, args) {
  if (args[0]) {
    const path = args[0].toLowerCase().replace('/', '')
    if (path === 'programs') {
      const lines = [tx('terminal.ls.programsDir'), '']
      if (!save.installedPrograms.length) lines.push(tx('terminal.ls.programsEmpty'))
      else {
        for (const pid of save.installedPrograms) {
          const p = PROGRAMS[pid]
          lines.push(tx('terminal.ls.programEntry', {
            filename: p?.filename || pid,
            name: p?.name || pid,
          }))
        }
      }
      return lines
    }
    if (path === 'inventory') {
      const lines = [tx('terminal.ls.inventoryDir'), '']
      if (!save.programInventory.length) lines.push(tx('terminal.ls.inventoryEmpty'))
      else {
        for (const e of save.programInventory) {
          const p = PROGRAMS[e.programId]
          lines.push(tx('terminal.ls.inventoryEntry', {
            filename: p?.filename || e.programId,
            quantity: e.quantity,
            type: p?.type?.toUpperCase() || 'EXE',
          }))
        }
      }
      return lines
    }
  }

  const visible = getVisibleFiles(save)
  const isLocal = save.currentNode === 'local'
  const dirPath = isLocal ? '/home/ghost_demo/' : `/net/${save.currentNode}/`
  const lines = [tx('terminal.ls.currentDir', { path: dirPath }), '']
  if (isLocal) {
    lines.push(tx('terminal.ls.dirPrograms', { count: save.installedPrograms.length }))
    lines.push(tx('terminal.ls.dirInventory', {
      count: save.programInventory.reduce((n, e) => n + e.quantity, 0),
    }))
    lines.push('')
  }
  for (const name of visible) {
    const file = getDemoFile(name)
    lines.push(tx('terminal.ls.fileEntry', {
      name: name.padEnd(24),
      description: file?.description || '',
    }))
  }
  return lines
}

function cmdOpen(save, args) {
  if (!args[0]) return [tx('terminal.open.usage')]
  const name = args[0].toLowerCase()
  if (!getVisibleFiles(save).includes(name)) {
    return [tx('terminal.open.inaccessible', { name })]
  }
  const file = getDemoFile(name)
  if (!file) return [tx('terminal.open.unknown', { name })]

  const lines = [tx('terminal.open.header', { name }), '', ...file.content]
  if (!save.read_files.includes(name)) save.read_files.push(name)

  if (name === 'note.txt') save.flags.note_read = true
  if (name === 'toolkit_manifest.txt') {
    for (const c of ['run', 'install', 'uninstall']) {
      if (!save.unlocked_commands.includes(c)) save.unlocked_commands.push(c)
    }
  }
  if (name === 'system.log' && !save.unlocked_commands.includes('scan')) {
    save.unlocked_commands.push('scan')
  }
  if (name === 'ghost_relay.log' && !save.unlocked_commands.includes('connect')) {
    for (const c of ['connect', 'disconnect']) {
      if (!save.unlocked_commands.includes(c)) save.unlocked_commands.push(c)
    }
  }

  syncMissionObjectiveText(save)

  const mystery = processMysteryFileOpen(save, name)
  const horror = processHorrorFileOpen(save, name)
  const merged = mergeHorrorResult(mystery, horror)
  if (merged.autoLines.length) lines.push('', ...merged.autoLines)
  if (merged.uiEffect) save.activeUiEffect = merged.uiEffect
  if (merged.terminalEffect) save._pendingTerminalEffect = merged.terminalEffect
  discoverCodexFromFile(save, name)

  return lines
}

function cmdStatus(save) {
  const net = NODE_META[save.currentNode] || NODE_META.local
  return [
    tx('terminal.status.banner'),
    tx('terminal.status.title'),
    tx('terminal.status.footerBanner'),
    '',
    tx('terminal.status.identifier', { username: save.player.username }),
    tx('terminal.status.bittek', { bittek: save.player.bittek }),
    tx('terminal.status.reputation', { reputation: save.player.reputation }),
    tx('terminal.status.trace', { trace: save.traceLevel }),
    '',
    tx('terminal.status.network'),
    tx('terminal.status.activeNode', { node: net.name }),
    tx('terminal.status.security', { security: net.securityLevel }),
    tx('terminal.status.multiplier', { multiplier: net.traceMultiplier }),
    '',
    tx('terminal.status.footer'),
  ]
}

function cmdConnect(save, args) {
  if (!args[0]) return [tx('terminal.connect.usage')]
  const target = args[0].toLowerCase()
  if (!save.discoveredNodes.includes(target)) {
    return [tx('terminal.connect.undiscovered', { target })]
  }
  const meta = NODE_META[target]
  if (!meta) return [tx('terminal.connect.unknown', { target })]
  if (!save.hackedNodes.includes(target)) save.hackedNodes.push(target)
  save.currentNode = target
  trackHorrorConnection(save)
  addTrace(save, 15)
  syncMissionObjectiveText(save)

  if (target === 'relay_ghost') tryCharacterTransmission(save, 'ghost_node')

  if (target === 'mirror_relay') {
    return (txRaw('terminal.connect.mirror') || []).map((line) =>
      line.replace('{{nodeName}}', meta.name))
  }

  return (txRaw('terminal.connect.normal') || []).map((line) =>
    line.replace('{{nodeName}}', meta.name))
}

function cmdDisconnect(save) {
  if (save.currentNode === 'local') return [tx('terminal.disconnect.alreadyLocal')]
  const prev = NODE_META[save.currentNode]?.name || save.currentNode
  save.currentNode = 'local'
  trackHorrorConnection(save)
  addTrace(save, 3)
  return [
    tx('terminal.disconnect.closing'),
    tx('terminal.disconnect.disconnected', { node: prev }),
    tx('terminal.disconnect.backLocal'),
  ]
}

function cmdScan(save) {
  if (save.flags.scan_completed) {
    return [
      tx('terminal.scan.alreadyDone'),
      tx('terminal.scan.alreadyRelay'),
    ]
  }
  save.flags.scan_completed = true
  if (!save.discoveredNodes.includes('relay_ghost')) save.discoveredNodes.push('relay_ghost')
  addTrace(save, 15)
  syncMissionObjectiveText(save)
  return txRaw('terminal.scan.lines') || []
}

function cmdProbe(save) {
  if (save.currentNode !== 'satlink_03') {
    return [tx('terminal.probe.noSegment')]
  }
  save.flags.probe_morgue = true
  save.flags.probe_used_satlink = true
  for (const n of ['morgue_server', 'blackvault']) {
    if (!save.discoveredNodes.includes(n)) save.discoveredNodes.push(n)
  }
  addTrace(save, 8)
  syncMissionObjectiveText(save)
  return txRaw('terminal.probe.lines') || []
}

function cmdRun(save, args) {
  if (!args[0]) return [tx('terminal.run.usage')]
  const name = args[0].toLowerCase()
  const pid = Object.keys(PROGRAMS).find((k) => PROGRAMS[k].filename === name || k === name)
  if (!pid) return [tx('terminal.run.notFound', { name })]

  const installed = save.installedPrograms.includes(pid)
  const inv = save.programInventory.find((e) => e.programId === pid)
  if (!installed && !inv) return [tx('terminal.run.missing', { filename: PROGRAMS[pid].filename })]

  const lines = [tx('terminal.run.executing', { file: PROGRAMS[pid].filename }), '']

  if (PROGRAMS[pid].type === 'consumable' && inv) {
    inv.quantity -= 1
    if (inv.quantity <= 0) {
      save.programInventory = save.programInventory.filter((e) => e.programId !== pid)
    }
    lines.push(tx('terminal.run.consumed', { file: PROGRAMS[pid].filename }))
  }

  if (pid === 'trace_wiper') {
    const old = save.traceLevel
    save.traceLevel = Math.max(0, save.traceLevel - 15)
    lines.push(tx('terminal.run.traceChange', { old, new: save.traceLevel }))
  } else if (pid === 'packet_sniffer') {
    const n = NODE_META[save.currentNode]
    lines.push(tx('terminal.run.sniff', { node: n.name, multiplier: n.traceMultiplier }))
  } else {
    lines.push(tx('terminal.run.ok', { name: PROGRAMS[pid].name }))
  }

  addTrace(save, 5)
  return lines
}

function cmdMarket(save) {
  return [
    tx('terminal.market.banner'),
    tx('terminal.market.title'),
    tx('terminal.market.footerBanner'),
    '',
    tx('terminal.market.balance', { bittek: save.player.bittek }),
    tx('terminal.market.hint'),
  ]
}

function cmdSync(save) {
  return [
    tx('terminal.sync.demo'),
    tx('terminal.sync.status', { trace: save.traceLevel, node: save.currentNode }),
  ]
}

export function executeDemoCommand(command) {
  const save = loadDemoSave()
  clearExpiredUiEffects(save)

  if (save.gameOver && !save.fakeGameOverUntil) {
    return {
      output: [tx('terminal.locked.session'), tx('terminal.locked.gameOver')],
      clear_terminal: false,
      state: toPublicState(save),
    }
  }

  const parts = command.trim().split(/\s+/)
  const cmd = parts[0]?.toLowerCase()
  const args = parts.slice(1)

  if (!cmd) return { output: [], clear_terminal: false, state: toPublicState(save) }

  save.lastCommand = command.trim()
  trackTutorial(save, cmd, args)
  trackBehaviorCommand(save, cmd, args, {
    isSecret: isHiddenCommand(cmd),
    rawCommand: command.trim(),
  })

  let autoLines = []

  if (isHiddenCommand(cmd)) {
    const hidden = handleHiddenCommand(save, cmd, args)
    if (hidden) {
      if (hidden.addTrace) {
        const traceMystery = addTrace(save, hidden.addTrace)
        autoLines.push(...traceMystery)
      }
      if (hidden.uiEffect) save.activeUiEffect = hidden.uiEffect
      if (hidden.fakeGameOver) {
        save.fakeGameOverUntil = Date.now() + hidden.fakeGameOver.duration
        save.activeUiEffect = { type: 'fake_gameover', duration: hidden.fakeGameOver.duration }
      }
      if (hidden.autoLines?.length) autoLines.push(...hidden.autoLines)
      const horror = processHorrorAfterCommand(save, cmd)
      if (horror.autoLines.length) autoLines.push(...horror.autoLines)
      if (horror.uiEffect) save.activeUiEffect = horror.uiEffect
      if (horror.fakeGameOver) {
        save.fakeGameOverUntil = Date.now() + horror.fakeGameOver.duration
        save.activeUiEffect = {
          type: 'fake_gameover',
          traceLevel: save.traceLevel,
          duration: horror.fakeGameOver.duration,
        }
      }
      const behavior = processBehaviorAfterCommand(save, cmd)
      if (behavior.autoLines.length) autoLines.push(...behavior.autoLines)
      if (behavior.uiEffect) save.activeUiEffect = behavior.uiEffect
      tryCharacterTransmission(save, 'secret_command')
      const mergedOut = hidden.silent ? behavior.autoLines : [...(hidden.output || []), ...autoLines]
      return finishCommand(save, mergedOut, {
        autoLines,
        terminalEffect: horror.terminalEffect || null,
      })
    }
  }

  if (cmd === 'disconnect' && !save.unlocked_commands.includes('disconnect')) {
    const mysteryDisc = handleMysteryDisconnect(save, false)
    if (mysteryDisc) {
      addTrace(save, mysteryDisc.addTrace || 0)
      if (mysteryDisc.uiEffect) save.activeUiEffect = mysteryDisc.uiEffect
      return finishCommand(save, mysteryDisc.output)
    }
  }

  if (!save.unlocked_commands.includes(cmd) && cmd !== 'clear' && cmd !== 'ls') {
    addTrace(save, 2)
    saveDemoSave(save)
    return {
      output: [tx('terminal.unknown.command', { cmd }), ...traceMessages(save)],
      clear_terminal: false,
      state: toPublicState(save),
    }
  }

  let output = []
  let clear_terminal = false

  switch (cmd) {
    case 'help': output = cmdHelp(save); break
    case 'clear': clear_terminal = true; break
    case 'files':
    case 'ls': output = args.length ? cmdLs(save, args) : cmdFiles(save); break
    case 'open': output = cmdOpen(save, args); break
    case 'status': output = cmdStatus(save); break
    case 'connect': output = cmdConnect(save, args); break
    case 'disconnect': output = cmdDisconnect(save); break
    case 'scan': output = cmdScan(save); break
    case 'probe': output = cmdProbe(save); break
    case 'run': output = cmdRun(save, args); break
    case 'programs': output = cmdLs(save, ['programs']); break
    case 'inventory': output = cmdLs(save, ['inventory']); break
    case 'market': output = cmdMarket(save); break
    case 'sync': output = cmdSync(save); break
    case 'install':
    case 'uninstall':
      output = [tx('terminal.install.undocumented')]
      break
    default:
      output = [tx('terminal.unknown.notImplemented', { cmd })]
  }

  const postCmd = mergeBehaviorResult(
    mergeHorrorResult(
      processMysteryAfterCommand(save, cmd),
      processHorrorAfterCommand(save, cmd),
    ),
    processBehaviorAfterCommand(save, cmd),
  )
  if (postCmd.autoLines.length) autoLines.push(...postCmd.autoLines)
  if (postCmd.uiEffect) save.activeUiEffect = postCmd.uiEffect
  if (postCmd.fakeGameOver) {
    save.fakeGameOverUntil = Date.now() + postCmd.fakeGameOver.duration
    save.activeUiEffect = {
      type: 'fake_gameover',
      traceLevel: save.traceLevel,
      duration: postCmd.fakeGameOver.duration,
    }
  }

  const terminalEffect = postCmd.terminalEffect || save._pendingTerminalEffect || null
  delete save._pendingTerminalEffect

  if (autoLines.length) output = [...output, '', ...autoLines]
  if (save._pendingMysteryLines?.length) {
    output = [...output, '', ...save._pendingMysteryLines]
    delete save._pendingMysteryLines
  }

  return finalizeCommand(save, output, { clear_terminal, autoLines, terminalEffect })
}

export function tickDemoMystery() {
  const save = loadDemoSave()
  clearExpiredUiEffects(save)
  const behaviorTick = processBehaviorTick(save)
  const result = mergeBehaviorResult(
    mergeHorrorResult(processMysteryTick(save), processHorrorTick(save)),
    behaviorTick,
  )
  if (result.uiEffect) save.activeUiEffect = result.uiEffect
  if (result.fakeGameOver) {
    save.fakeGameOverUntil = Date.now() + result.fakeGameOver.duration
    save.activeUiEffect = {
      type: 'fake_gameover',
      traceLevel: save.traceLevel,
      duration: result.fakeGameOver.duration,
    }
  }
  if (result.terminalEffect) save._pendingTerminalEffect = result.terminalEffect
  stampUiEffectStart(save)
  saveDemoSave(save)
  const newCodexDiscoveries = consumePendingCodexDiscoveries(save)
  saveDemoSave(save)
  return {
    state: toPublicState(save),
    autoLines: result.autoLines,
    uiEffect: save.activeUiEffect,
    cinematic: save.activeCinematic || null,
    terminalEffect: result.terminalEffect || null,
    newCodexDiscoveries,
  }
}

export function clearActiveCinematicDemo() {
  const save = loadDemoSave()
  const { autoLines } = clearActiveCinematic(save)
  saveDemoSave(save)
  return { state: toPublicState(save), autoLines }
}

export function rollRandomCinematicDemo(blocked = false) {
  const save = loadDemoSave()
  clearExpiredUiEffects(save)
  const result = rollRandomCinematic(save, { blocked })

  if (!result.cinematic) {
    return { state: toPublicState(save), autoLines: [], cinematic: null, fired: null }
  }

  saveDemoSave(save)
  return {
    state: toPublicState(save),
    autoLines: result.autoLines,
    cinematic: result.cinematic,
    fired: result.fired,
  }
}

export function rollCharacterTransmissionDemo(blocked = false, trigger = 'random') {
  const save = loadDemoSave()
  clearExpiredUiEffects(save)
  const result = rollCharacterTransmission(save, { blocked, trigger })

  if (!result.transmission) {
    return { state: toPublicState(save), transmission: null, fired: null }
  }

  saveDemoSave(save)
  return {
    state: toPublicState(save),
    transmission: result.transmission,
    fired: result.fired,
  }
}

export function clearActiveCharacterTransmissionDemo() {
  const save = loadDemoSave()
  clearActiveCharacterTransmission(save)
  saveDemoSave(save)
  return { state: toPublicState(save) }
}

export function getDemoState() {
  return toPublicState(loadDemoSave())
}

export function resetDemoGame() {
  const save = resetDemoSave()
  return {
    message: tx('terminal.reset.message'),
    state: toPublicState(save),
  }
}

export function loadAdvancedDemoGame() {
  const save = loadAdvancedDemoSave()
  return {
    message: tx('terminal.advancedDemo.message'),
    state: toPublicState(save),
  }
}

export function markNovaIntroSeenDemo() {
  const save = loadDemoSave()
  if (save.novaIntroSeen) {
    return { state: toPublicState(save) }
  }
  save.novaIntroSeen = true
  save.events_log = save.events_log || []
  save.events_log.push(tx('terminal.novaFirstContact'))
  discoverCodex(save, 'nova_contact_01')
  saveDemoSave(save)
  const newCodexDiscoveries = consumePendingCodexDiscoveries(save)
  saveDemoSave(save)
  return { state: toPublicState(save), newCodexDiscoveries }
}

export function touchPlayerActivityDemo() {
  const save = loadDemoSave()
  ensureBehavior(save).lastInputAt = Date.now()
  saveDemoSave(save)
  return { state: toPublicState(save) }
}
