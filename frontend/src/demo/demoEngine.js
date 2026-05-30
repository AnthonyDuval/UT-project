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
import { syncMissionObjectiveText, getTerminalGuidanceHint } from '../utils/missionHints'
import { getLocale } from '../i18n'
import { tx, txRaw } from '../i18n/helpers'
import {
  checkPlayerStuck,
  recordUnknownCommand,
  resetUnknownStreak,
  recordUselessCommand,
  getStuckTerminalHint,
  markStuckHintShown,
  canEmitIdleStuckHint,
  touchProgress,
} from '../utils/playerStuck'
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
import {
  pickInfluenceUnknownLine,
  pickInfluenceHelpExtra,
  pickInfluenceTraceFeedback,
  applyInfluenceOutputLayer,
} from '../systems/influenceConsequences'
import {
  resolveNarrativeChoice,
  dismissNarrativeChoice,
  tryScheduleMorseIntelChoice,
  tryScheduleNarrativeChoice,
  tryStartMission5VeilTransmission,
} from '../systems/narrativeChoices'
import { fireCharacterTransmission } from '../systems/CharacterTransmissionSystem'
import {
  mergeBehaviorResult,
  processBehaviorAfterCommand,
  processBehaviorTick,
} from '../systems/SystemReactionEngine'
import { trackBehaviorCommand, ensureBehavior } from '../systems/PlayerBehaviorTracker'
import { clearActiveCinematic } from '../systems/CinematicEventSystem'
import { rollRandomCinematic } from '../systems/RandomCinematicEvents'
import {
  rollCharacterTransmission,
  clearActiveCharacterTransmission,
} from '../systems/CharacterTransmissionSystem.jsx'
import {
  checkRiposteTriggers,
  getPresenceTraceMultiplier,
  getTraceRiseFeedback,
  isTerminalLockedByPresence,
  syncPresenceLevel,
  tickPresenceEffects,
  flushPendingVeilIntro,
  PRESENCE_LEVELS,
} from '../systems/UltraTechPresence'
import { dismissTraceWarning20, tryTriggerTraceWarning20 } from '../systems/traceWarning20'
import { dismissTraceTriangulation50, tryTriggerTraceTriangulation50 } from '../systems/traceTriangulation50'
import { dismissTraceEmergency75, resolveTraceEmergency75, tryTriggerTraceEmergency75 } from '../systems/traceEmergency75'
import { getSafeWindowTraceMultiplier, reduceTrace } from '../systems/traceRecovery'
import { resolveMissionCleanup, dismissMissionCleanup } from '../systems/missionCleanupReward'
import {
  applyCommandInfluence,
  applyTraceInfluence,
  applyInfluenceTick,
  consumePendingInfluenceTransmission,
} from '../systems/CharacterInfluence'
import { getPlayerDisplayName } from '../utils/playerName'

function trackTutorial(save, cmd, args) {
  save.tutorialFlags = save.tutorialFlags || {}
  if (cmd === 'help') save.tutorialFlags.help = true
  if (cmd === 'files' || cmd === 'ls') save.tutorialFlags.files = true
  if (cmd === 'open' && args[0]?.toLowerCase() === 'note.txt') save.tutorialFlags.open_note = true
  if (cmd === 'scan') save.tutorialFlags.scan = true
  if (cmd === 'connect') save.tutorialFlags.connect = true
  syncMissionObjectiveText(save)
  touchProgress(save)
}

function pickUnknownCommandLine(save, cmd) {
  return pickInfluenceUnknownLine(save, cmd)
}

function appendStuckHint(save, output, level = 'firm') {
  const stuck = checkPlayerStuck(save)
  if (!stuck?.stuck) return output
  const hint = getStuckTerminalHint(save, stuck, getLocale())
    || getTerminalGuidanceHint(toPublicState(save), getLocale(), level)
  if (hint) {
    output.push('', hint)
    markStuckHintShown(save, stuck.level)
  }
  return output
}

function cmdHelp(save) {
  const sorted = [...save.unlocked_commands].filter((c) => c !== 'ls').sort()
  const lines = [
    tx('terminal.help.header'),
    '',
    ...sorted.map((name) => `  ${name}`),
    '',
    tx('terminal.help.footer'),
  ]
  const novaExtra = pickInfluenceHelpExtra(save)
  if (novaExtra) lines.push('', novaExtra)
  const stuck = checkPlayerStuck(save)
  if (stuck?.stuck) {
    lines.push('', tx('guidance.stuck.help'))
    const hint = getStuckTerminalHint(save, stuck, getLocale())
    if (hint) lines.push(hint)
  }
  return lines
}

function tryCharacterTransmission(save, trigger = 'random') {
  if (save.gameOver || save.activeCinematic || save.activeCharacterTransmission) return null
  const pending = consumePendingInfluenceTransmission(save, fireCharacterTransmission)
  if (pending?.transmission) return pending
  return rollCharacterTransmission(save, { trigger })
}

function finishCommand(save, output, extras = {}) {
  if (save._influenceCtx) {
    const influenceLines = applyCommandInfluence(
      save,
      save._influenceCtx.cmd,
      save._influenceCtx.args,
      save._influenceCtx.meta,
    )
    save._influenceCtx = null
    if (influenceLines.length) {
      extras.autoLines = [...(extras.autoLines || []), ...influenceLines]
    }
  }
  stampUiEffectStart(save)
  saveDemoSave(save)
  const newCodexDiscoveries = consumePendingCodexDiscoveries(save)
  saveDemoSave(save)
  return {
    output: applyInfluenceOutputLayer(output ?? [], save),
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
  if (mission.output.length) {
    touchProgress(save)
    tryCharacterTransmission(save, 'mission_progress')
  }

  if (save._pendingVeilMissionTransmission) {
    delete save._pendingVeilMissionTransmission
    const pending = tryStartMission5VeilTransmission(save)
    if (pending && !save.activeCharacterTransmission && !save.activeCinematic) {
      fireCharacterTransmission(save, pending.characterId, 'mission', {
        bypassCooldown: true,
        forceMessageKey: pending.messageKey,
      })
    } else if (pending) {
      save._pendingInfluenceTransmission = pending
    }
  }

  const traceMsgs = traceMessages(save)
  if (traceMsgs.length) output = [...output, '', ...traceMsgs]

  return finishCommand(save, output, extras)
}

function touchRiskyAction(save) {
  save.lastRiskyActionAt = Date.now()
}

function addTrace(save, amount) {
  if (amount <= 0 || save.gameOver) return []
  touchRiskyAction(save)

  let effectiveAmount = amount
  const halvedFx = save.activeEffects?.find((e) => e.type === 'trace_halved' && e.usesLeft > 0)
  if (halvedFx) {
    effectiveAmount = Math.max(1, Math.round(amount / 2))
    halvedFx.usesLeft -= 1
    if (halvedFx.usesLeft <= 0) {
      save.activeEffects = save.activeEffects.filter((e) => e !== halvedFx)
    }
  }

  const prev = save.traceLevel
  const mult = (NODE_META[save.currentNode]?.traceMultiplier || 1) * getPresenceTraceMultiplier(save)
  const passive = save.traceReductionPassive || 0
  const safeMult = getSafeWindowTraceMultiplier(save)
  const actual = Math.max(1, Math.round(effectiveAmount * mult * (1 - passive / 100) * safeMult))
  save.traceLevel = Math.min(100, save.traceLevel + actual)
  const mysteryAuto = []
  const traceFeedback = pickInfluenceTraceFeedback(save, actual)
    || getTraceRiseFeedback(save, actual)

  if (save.traceLevel >= 30 && !save.trace_alerts_triggered.includes(30)) {
    save.trace_alerts_triggered.push(30)
    save.events_log.push(tx('terminal.trace.activity30'))
  }
  if (save.traceLevel >= 60 && !save.trace_alerts_triggered.includes(60)) {
    save.trace_alerts_triggered.push(60)
    save.events_log.push(tx('terminal.trace.analyzing60'))
  }
  if (save.traceLevel >= 20) {
    tryTriggerTraceWarning20(save)
  }
  if (save.traceLevel >= 50) {
    tryTriggerTraceTriangulation50(save)
  }
  if (save.traceLevel >= 75) {
    tryTriggerTraceEmergency75(save)
  }
  if (save.traceLevel >= 100) {
    save.gameOver = true
    save.events_log.push(tx('terminal.trace.gameOver'))
  }
  if (prev !== save.traceLevel) {
    syncPresenceLevel(save)
    const influenceLines = applyTraceInfluence(save, prev, save.traceLevel)
    if (influenceLines.length) mysteryAuto.push(...influenceLines)
    if (prev <= 45 && save.traceLevel > 45) {
      const riposte = checkRiposteTriggers(save, 'trace_threshold')
      if (riposte?.autoLines?.length) mysteryAuto.push(...riposte.autoLines)
      if (riposte?.uiEffect) save.activeUiEffect = riposte.uiEffect
    }
    if (traceFeedback) mysteryAuto.push(traceFeedback)
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
  const homeUser = getPlayerDisplayName(save)
  const dirPath = isLocal ? `/home/${homeUser}/` : `/net/${save.currentNode}/`
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
  if (name === 'orbital_manifest.log') {
    save.flags.listen_discovered = true
    discoverCodex(save, 'satlink_lie')
  }
  if (name === 'mirror_index.dat') {
    save.flags.echo_discovered = true
  }
  if (name === 'secops_notice.log') {
    save.flags.secops_notice_read = true
    if (!save.discoveredNodes.includes('secops_gate')) {
      save.discoveredNodes.push('secops_gate')
    }
    save.flags.secops_gate_unlocked = true
  }

  if (name === 'operator_shadow.log') {
    const playerName = getPlayerDisplayName(save)
    for (let i = 0; i < lines.length; i += 1) {
      if (typeof lines[i] === 'string') {
        lines[i] = lines[i].replace(/\{\{name\}\}/g, playerName)
      }
    }
  }

  syncMissionObjectiveText(save)
  touchProgress(save)

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
  addTrace(save, 12)
  syncMissionObjectiveText(save)
  touchProgress(save)

  let connectLines
  if (target === 'mirror_relay') {
    connectLines = (txRaw('terminal.connect.mirror') || []).map((line) =>
      line.replace('{{nodeName}}', meta.name))
  } else {
    connectLines = (txRaw('terminal.connect.normal') || []).map((line) =>
      line.replace('{{nodeName}}', meta.name))
  }

  if (target === 'satlink_03') {
    const riposte = checkRiposteTriggers(save, 'satlink_connect')
    if (riposte?.autoLines?.length) connectLines = [...connectLines, '', ...riposte.autoLines]
    if (riposte?.uiEffect) save.activeUiEffect = riposte.uiEffect
  }

  if (target === 'relay_ghost') tryCharacterTransmission(save, 'ghost_node')

  if (target === 'mirror_relay') {
    const m4 = save.missions?.relais_miroir
    if (m4?.status === 'active' && !save.flags?.mirror_connect_logged) {
      save.flags.mirror_connect_logged = true
    }
  }

  return connectLines
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
  for (const c of ['connect', 'disconnect']) {
    if (!save.unlocked_commands.includes(c)) save.unlocked_commands.push(c)
  }
  addTrace(save, 10)
  syncMissionObjectiveText(save)
  touchProgress(save)

  const lines = [...(txRaw('terminal.scan.lines') || [])]
  if (save.flags.mission_1_complete) {
    const riposte = checkRiposteTriggers(save, 'mission_1_complete')
    if (riposte?.autoLines?.length) lines.push('', ...riposte.autoLines)
    if (riposte?.uiEffect) save.activeUiEffect = riposte.uiEffect
  } else if (save.currentNode === 'satlink_03') {
    const riposte = checkRiposteTriggers(save, 'satlink_scan')
    if (riposte?.autoLines?.length) lines.push('', ...riposte.autoLines)
    if (riposte?.uiEffect) save.activeUiEffect = riposte.uiEffect
  }

  return lines
}

function cmdProbe(save, args = []) {
  const target = args[0]?.toLowerCase()

  if (target === 'secops_gate') {
    if (!save.discoveredNodes.includes('secops_gate')) {
      return [tx('terminal.probe.secopsUndiscovered')]
    }
    save.flags.secops_gate_probed = true
    addTrace(save, 14)
    discoverCodex(save, 'veil_protocol')
    return [...(txRaw('terminal.probe.secopsGate') || [])]
  }

  if (save.currentNode !== 'satlink_03') {
    return [tx('terminal.probe.noSegment')]
  }
  save.flags.probe_morgue = true
  save.flags.probe_used_satlink = true
  for (const n of ['morgue_server', 'blackvault']) {
    if (!save.discoveredNodes.includes(n)) save.discoveredNodes.push(n)
  }
  const m3 = save.missions?.transmission_interdite
  if (m3?.status === 'active' || m3?.status === 'completed') {
    if (!save.discoveredNodes.includes('mirror_relay')) {
      save.discoveredNodes.push('mirror_relay')
    }
  }
  addTrace(save, 12)
  syncMissionObjectiveText(save)
  const lines = [...(txRaw('terminal.probe.lines') || [])]
  const riposte = checkRiposteTriggers(save, 'satlink_probe')
  if (riposte?.autoLines?.length) lines.push('', ...riposte.autoLines)
  if (riposte?.uiEffect) save.activeUiEffect = riposte.uiEffect
  return lines
}

function cmdListenHandler(save, args) {
  const result = cmdListen(save, args)
  if (result.pendingTransmission) {
    if (!save.activeCharacterTransmission && !save.activeCinematic) {
      fireCharacterTransmission(save, result.pendingTransmission.characterId, 'mission', {
        bypassCooldown: true,
        forceMessageKey: result.pendingTransmission.messageKey,
      })
    } else {
      save._pendingInfluenceTransmission = result.pendingTransmission
    }
  }
  if (result.addTrace) addTrace(save, result.addTrace)
  return result.output || []
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
    const result = reduceTrace(save, 15)
    lines.push(...result.output)
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

function processTraceDecay(save) {
  const level = save.ultraTechPresence?.level
  if (level === PRESENCE_LEVELS.HOSTILE || level === PRESENCE_LEVELS.LOCKDOWN) return []
  if (save.traceLevel <= 0) return []

  const now = Date.now()
  const sinceRisk = now - (save.lastRiskyActionAt || save.sessionStartMs || now)
  if (sinceRisk < 60000) return []

  save._traceDecayTick = save._traceDecayTick || 0
  if (now - save._traceDecayTick < 60000) return []

  save._traceDecayTick = now
  const decay = reduceTrace(save, 2, { showDelta: false })
  return decay.changed ? decay.output : []
}

export function executeDemoCommand(command) {
  try {
    return runExecuteDemoCommand(command)
  } catch (err) {
    console.error('[demoEngine]', command, err)
    try {
      const save = loadDemoSave()
      return {
        output: [tx('terminal.shellRejected')],
        clear_terminal: false,
        state: toPublicState(save),
      }
    } catch {
      return {
        output: ['[ERR] Le shell a rejeté cette requête.'],
        clear_terminal: false,
        state: getDemoState(),
      }
    }
  }
}

function runExecuteDemoCommand(command) {
  const save = loadDemoSave()
  clearExpiredUiEffects(save)

  if (!save.onboardingSeen) {
    return {
      output: [tx('onboarding.terminalBlocked')],
      clear_terminal: false,
      state: toPublicState(save),
    }
  }

  if (save.gameOver && !save.fakeGameOverUntil) {
    return {
      output: [tx('terminal.locked.session'), tx('terminal.locked.gameOver')],
      clear_terminal: false,
      state: toPublicState(save),
    }
  }

  if (isTerminalLockedByPresence(save)) {
    return {
      output: [tx('presence.lockdown.terminalLock')],
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
  save._influenceCtx = { cmd, args, meta: { isSecret: isHiddenCommand(cmd) } }

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
      save.guidanceUnknownStreak = 0
      resetUnknownStreak(save)
      tryCharacterTransmission(save, 'secret_command')
      if (hidden.pendingTransmission) {
        const p = hidden.pendingTransmission
        if (!save.activeCharacterTransmission && !save.activeCinematic) {
          fireCharacterTransmission(save, p.characterId, 'mission', {
            bypassCooldown: true,
            forceMessageKey: p.messageKey,
          })
        } else {
          save._pendingInfluenceTransmission = p
        }
      }
      const mergedOut = hidden.silent ? behavior.autoLines : [...(hidden.output || []), ...autoLines]
      return finalizeCommand(save, mergedOut, {
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

  if (cmd === 'listen') {
    resetUnknownStreak(save)
    const output = cmdListenHandler(save, args)
    return finalizeCommand(save, output)
  }

  if (!save.unlocked_commands.includes(cmd) && cmd !== 'clear' && cmd !== 'ls') {
    addTrace(save, 1)
    recordUnknownCommand(save)
    recordUselessCommand(save, cmd)
    let output = [pickUnknownCommandLine(save, cmd), ...traceMessages(save)]
    if (save.playerGuidance?.unknownStreak >= 3) {
      resetUnknownStreak(save)
      output = appendStuckHint(save, output, 'firm')
    }
    save._influenceCtx = { cmd, args, meta: { isSecret: false } }
    const influenceLines = applyCommandInfluence(save, cmd, args, { isSecret: false })
    if (influenceLines.length) output = [...output, '', ...influenceLines]
    saveDemoSave(save)
    return {
      output,
      clear_terminal: false,
      state: toPublicState(save),
    }
  }

  resetUnknownStreak(save)

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
    case 'probe': output = cmdProbe(save, args); break
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
  const influenceTickLines = applyInfluenceTick(save, behaviorTick.deltaMs || 0)
  if (influenceTickLines.length) {
    result.autoLines = [...(result.autoLines || []), ...influenceTickLines]
  }
  const pendingTx = consumePendingInfluenceTransmission(save, fireCharacterTransmission)
  if (pendingTx?.transmission) {
    save.activeCharacterTransmission = pendingTx.transmission
  }
  const presenceTick = tickPresenceEffects(save)
  if (presenceTick.autoLines?.length) {
    result.autoLines = [...(result.autoLines || []), ...presenceTick.autoLines]
  }
  if (presenceTick.transmission) {
    save.activeCharacterTransmission = presenceTick.transmission
  }
  flushPendingVeilIntro(save)
  const decayLines = processTraceDecay(save)
  if (decayLines.length) {
    result.autoLines = [...(result.autoLines || []), ...decayLines]
  }
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

  const stuckAutoLines = []
  const stuck = checkPlayerStuck(save)
  if (stuck?.stuck && stuck.reason === 'idle' && canEmitIdleStuckHint(save)) {
    const hint = getStuckTerminalHint(save, stuck, getLocale())
    if (hint) {
      stuckAutoLines.push(hint)
      markStuckHintShown(save, 'soft')
    }
  }

  saveDemoSave(save)
  const newCodexDiscoveries = consumePendingCodexDiscoveries(save)
  saveDemoSave(save)
  return {
    state: toPublicState(save),
    autoLines: [...(result.autoLines || []), ...stuckAutoLines],
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

export function clearActiveUiEffectDemo() {
  const save = loadDemoSave()
  save.activeUiEffect = null
  saveDemoSave(save)
  return { state: toPublicState(save) }
}

export function dismissTraceWarning20Demo() {
  const save = loadDemoSave()
  const result = dismissTraceWarning20(save)
  const autoLines = result.safeLine ? ['', result.safeLine] : []
  saveDemoSave(save)
  return { state: toPublicState(save), autoLines }
}

export function dismissTraceTriangulation50Demo() {
  const save = loadDemoSave()
  const result = dismissTraceTriangulation50(save)
  tryScheduleNarrativeChoice(save, 'ut_ignore')
  const autoLines = result.safeLine ? ['', result.safeLine] : []
  saveDemoSave(save)
  return { state: toPublicState(save), autoLines }
}

export function touchHintBrokerDemo() {
  const save = loadDemoSave()
  tryScheduleMorseIntelChoice(save)
  saveDemoSave(save)
  return { state: toPublicState(save) }
}

export function resolveNarrativeChoiceDemo(choiceId, option) {
  const save = loadDemoSave()
  const result = resolveNarrativeChoice(save, choiceId, option)
  if (!result.ok) {
    return { state: toPublicState(save), output: [], error: 'invalid_choice' }
  }

  if (result.pendingTransmission) {
    const pending = result.pendingTransmission
    if (!save.activeCharacterTransmission && !save.activeCinematic) {
      fireCharacterTransmission(save, pending.characterId, 'mission', {
        bypassCooldown: true,
        forceMessageKey: pending.messageKey,
      })
    } else {
      save._pendingInfluenceTransmission = pending
    }
  }

  updateMissionProgress(save)
  saveDemoSave(save)
  return { state: toPublicState(save), output: result.output }
}

export function resolveTraceEmergency75Demo(choice) {
  const save = loadDemoSave()
  const result = resolveTraceEmergency75(save, choice)
  if (result.ok) {
    saveDemoSave(save)
    return { state: toPublicState(save), output: result.output }
  }
  return { state: toPublicState(save), output: [], error: result.error }
}

export function resolveMissionCleanupDemo(choice) {
  const save = loadDemoSave()
  const result = resolveMissionCleanup(save, choice)
  if (result.ok) {
    saveDemoSave(save)
    return { state: toPublicState(save), output: result.output }
  }
  return { state: toPublicState(save), output: [], error: result.error }
}

/** Failsafe — déverrouille terminal, effets UI, cinématique et transmission bloqués. */
export function forceUnlockTerminalDemo() {
  const save = loadDemoSave()
  clearExpiredUiEffects(save)
  save.activeUiEffect = null
  if (save.ultraTechPresence) {
    save.ultraTechPresence.terminalLockUntil = 0
  }
  dismissTraceWarning20(save)
  dismissTraceTriangulation50(save)
  dismissTraceEmergency75(save)
  dismissMissionCleanup(save)
  dismissNarrativeChoice(save)
  clearActiveCinematic(save)
  clearActiveCharacterTransmission(save)
  saveDemoSave(save)
  return { state: toPublicState(save) }
}
