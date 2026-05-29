/**
 * Moteur de commandes local — mode démo offline.
 */

import {
  DEMO_FILES,
  NODE_META,
  PROGRAMS,
  getVisibleFiles,
  toPublicState,
} from './demoState'
import { loadDemoSave, loadAdvancedDemoSave, resetDemoSave, saveDemoSave } from './demoStorage'
import { discoverCodexFromFile, consumePendingCodexDiscoveries } from './codexService'
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

function trackTutorial(save, cmd, args) {
  save.tutorialFlags = save.tutorialFlags || {}
  if (cmd === 'help') save.tutorialFlags.help = true
  if (cmd === 'files' || cmd === 'ls') save.tutorialFlags.files = true
  if (cmd === 'open' && args[0]?.toLowerCase() === 'note.txt') save.tutorialFlags.open_note = true
  if (cmd === 'scan') save.tutorialFlags.scan = true
  if (cmd === 'connect') save.tutorialFlags.connect = true
  syncMissionObjectiveText(save)
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
    autoLines: extras.autoLines || [],
    terminalEffect: extras.terminalEffect || null,
    newCodexDiscoveries,
  }
}

function finalizeCommand(save, output, extras = {}) {
  const mission = updateMissionProgress(save)
  if (mission.output.length) output = [...output, '', ...mission.output]
  if (mission.narrative.length) output = [...output, ...mission.narrative]

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
    save.events_log.push('[TRACE] Activite reseau inhabituelle detectee.')
  }
  if (save.traceLevel >= 60 && !save.trace_alerts_triggered.includes(60)) {
    save.trace_alerts_triggered.push(60)
    save.events_log.push('[TRACE] UltraTech analyse votre signature.')
  }
  if (save.traceLevel >= 100) {
    save.gameOver = true
    save.events_log.push('[GAME OVER] UltraTech vous a localise.')
  }
  if (prev !== save.traceLevel) {
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
    return ['[TRACE] NIVEAU CRITIQUE — 100% — GAME OVER IMMINENT']
  }
  return []
}

function cmdHelp(save) {
  const sorted = [...save.unlocked_commands].filter((c) => c !== 'ls').sort()
  const lines = [
    'Registre partiel — mots reconnus par le terminal :',
    '',
    ...sorted.map((name) => `  ${name}`),
    '',
    '[???] Ce terminal en sait plus qu\'il ne dit.',
  ]
  return lines
}

function cmdFiles(save) {
  const visible = getVisibleFiles(save)
  if (!visible.length) {
    return ['[VIDE] Aucun fragment accessible.']
  }
  const lines = ['Fragments locaux :', '']
  for (const name of visible) {
    lines.push(`  • ${name.padEnd(22)} ${DEMO_FILES[name]?.description || ''}`)
  }
  return lines
}

function cmdLs(save, args) {
  if (args[0]) {
    const path = args[0].toLowerCase().replace('/', '')
    if (path === 'programs') {
      const lines = ['Répertoire : /programs', '']
      if (!save.installedPrograms.length) lines.push('[VIDE] Aucun programme installé.')
      else {
        for (const pid of save.installedPrograms) {
          const p = PROGRAMS[pid]
          lines.push(`  ${p?.filename || pid} — ${p?.name || pid} [PERMANENT]`)
        }
      }
      return lines
    }
    if (path === 'inventory') {
      const lines = ['Répertoire : /inventory', '']
      if (!save.programInventory.length) lines.push('[VIDE] Aucun programme en stock.')
      else {
        for (const e of save.programInventory) {
          const p = PROGRAMS[e.programId]
          lines.push(`  ${p?.filename || e.programId} — x${e.quantity} [${p?.type?.toUpperCase() || 'EXE'}]`)
        }
      }
      return lines
    }
  }

  const visible = getVisibleFiles(save)
  const isLocal = save.currentNode === 'local'
  const path = isLocal ? '/home/ghost_demo/' : `/net/${save.currentNode}/`
  const lines = [`Répertoire courant : ${path}`, '']
  if (isLocal) {
    lines.push(`  [DIR] /programs          — ${save.installedPrograms.length} installé(s)`)
    lines.push(`  [DIR] /inventory         — ${save.programInventory.reduce((n, e) => n + e.quantity, 0)} en stock`)
    lines.push('')
  }
  for (const name of visible) {
    lines.push(`  ${name.padEnd(24)} — ${DEMO_FILES[name]?.description || ''}`)
  }
  return lines
}

function cmdOpen(save, args) {
  if (!args[0]) return ['[ERR] Usage : open [fichier]']
  const name = args[0].toLowerCase()
  if (!getVisibleFiles(save).includes(name)) return [`[ERR] Fichier inaccessible : '${name}'`]
  const file = DEMO_FILES[name]
  if (!file) return [`[ERR] Fichier inconnu : '${name}'`]

  const lines = [`=== ${name} ===`, '', ...file.content]
  if (!save.read_files.includes(name)) save.read_files.push(name)

  if (name === 'note.txt') {
    save.flags.note_read = true
  }
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
    '╔══════════════════════════════════════════════════╗',
    '║  STATUT OPÉRATEUR                                 ║',
    '╚══════════════════════════════════════════════════╝',
    '',
    `  Identifiant  : ${save.player.username}`,
    `  BitTek       : ${save.player.bittek}`,
    `  Réputation   : ${save.player.reputation}`,
    `  Trace UT     : ${save.traceLevel}%`,
    '',
    '  Réseau :',
    `    • Nœud actif   : ${net.name}`,
    `    • Sécurité     : ${net.securityLevel}`,
    `    • Trace mult.  : x${net.traceMultiplier}`,
    '',
    '  [SYS] Canal sécurisé — données chiffrées.',
  ]
}

function cmdConnect(save, args) {
  if (!args[0]) return ['[ERR] Usage : connect [node]']
  const target = args[0].toLowerCase()
  if (!save.discoveredNodes.includes(target)) {
    return [`[ERR] Nœud '${target}' non découvert.`]
  }
  const meta = NODE_META[target]
  if (!meta) return [`[ERR] Nœud inconnu : '${target}'`]
  if (!save.hackedNodes.includes(target)) save.hackedNodes.push(target)
  save.currentNode = target
  trackHorrorConnection(save)
  addTrace(save, 15)
  syncMissionObjectiveText(save)

  if (target === 'mirror_relay') {
    return [
      '[NET] Tunnel instable — reflet détecté...',
      `[NET] Connected to ${meta.name}`,
      '[???] Ce nœud n\'existe pas dans les registres UltraTech.',
    '[???] Quelqu\'un observe depuis l\'autre côté du miroir.',
      '[???] Le reflet montre deux chemins de sortie.',
      '',
      '[???] « Ne regarde pas trop longtemps. »',
    ]
  }

  return [
    '[NET] Connexion chiffrée en cours…',
    `[NET] Tunnel établi — ${meta.name}`,
    '[???] Vous êtes à l\'intérieur. Restez discret.',
  ]
}

function cmdDisconnect(save) {
  if (save.currentNode === 'local') return ['[NET] Déjà sur le terminal local.']
  const prev = NODE_META[save.currentNode]?.name || save.currentNode
  save.currentNode = 'local'
  trackHorrorConnection(save)
  addTrace(save, 3)
  return [
    '[NET] Fermeture du tunnel chiffré...',
    `[NET] Déconnecté de ${prev}`,
    '[NET] Retour au terminal local.',
  ]
}

function cmdScan(save) {
  if (save.flags.scan_completed) {
    return ['[SCAN] Analyse déjà effectuée.', '[SCAN] Relais RELAY_GHOST actif.']
  }
  save.flags.scan_completed = true
  if (!save.discoveredNodes.includes('relay_ghost')) save.discoveredNodes.push('relay_ghost')
  addTrace(save, 15)
  syncMissionObjectiveText(save)
  return [
    '[SCAN] Parcours du réseau local…',
    '[SCAN] Réponse anormale — signature RELAY_GHOST',
    '[???] Quelqu\'un écoute. Vous aussi.',
    '[SYS] Fragment capturé dans la mémoire locale.',
  ]
}

function cmdProbe(save) {
  if (save.currentNode !== 'satlink_03') {
    return ['[PROBE] Aucun segment adjacent depuis cette position.']
  }
  save.flags.probe_morgue = true
  save.flags.probe_used_satlink = true
  for (const n of ['morgue_server', 'blackvault']) {
    if (!save.discoveredNodes.includes(n)) save.discoveredNodes.push(n)
  }
  addTrace(save, 8)
  syncMissionObjectiveText(save)
  return [
    '[PROBE] Segment orbital cartographié.',
    '[PROBE] morgue_server — DÉTECTÉ',
    '[PROBE] blackvault — DÉTECTÉ (firewall actif)',
  ]
}

function cmdRun(save, args) {
  if (!args[0]) return ['[ERR] Usage : run [programme.exe]']
  const name = args[0].toLowerCase()
  const pid = Object.keys(PROGRAMS).find((k) => PROGRAMS[k].filename === name || k === name)
  if (!pid) return [`[ERR] Programme introuvable : '${name}'`]

  const installed = save.installedPrograms.includes(pid)
  const inv = save.programInventory.find((e) => e.programId === pid)
  if (!installed && !inv) return [`[ERR] ${PROGRAMS[pid].filename} absent.`]

  const lines = [`[RUN] Exécution : ${PROGRAMS[pid].filename}`, '']

  if (PROGRAMS[pid].type === 'consumable' && inv) {
    inv.quantity -= 1
    if (inv.quantity <= 0) {
      save.programInventory = save.programInventory.filter((e) => e.programId !== pid)
    }
    lines.push(`[RUN] ${PROGRAMS[pid].filename} consommé.`)
  }

  if (pid === 'trace_wiper') {
    const old = save.traceLevel
    save.traceLevel = Math.max(0, save.traceLevel - 15)
    lines.push(`[RUN] TRACE : ${old}% → ${save.traceLevel}%`)
  } else if (pid === 'packet_sniffer') {
    const n = NODE_META[save.currentNode]
    lines.push(`[SNIFF] Nœud : ${n.name} | x${n.traceMultiplier}`)
  } else {
    lines.push(`[RUN] ${PROGRAMS[pid].name} — OK.`)
  }

  addTrace(save, 5)
  return lines
}

function cmdMarket(save) {
  return [
    '╔══════════════════════════════════════════════════╗',
    '║  BLACK MARKET [DEMO]                              ║',
    '╚══════════════════════════════════════════════════╝',
    '',
    `  Solde : ${save.player.bittek} BitTek`,
    '  [???] Quelqu\'un a laissé une porte ouverte sur le bureau.',
  ]
}

function cmdSync(save) {
  return [
    '[SYNC] Mode démo — cohérence locale OK.',
    `[SYNC] Trace : ${save.traceLevel}% | Nœud : ${save.currentNode}`,
  ]
}

export function executeDemoCommand(command) {
  const save = loadDemoSave()
  clearExpiredUiEffects(save)

  if (save.gameOver && !save.fakeGameOverUntil) {
    return {
      output: ['[LOCKED] Session terminée.', '[LOCKED] GAME OVER.'],
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

  let uiEffect = null
  let autoLines = []

  // Commandes secrètes (prioritaires — pas dans help)
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
      const output = hidden.silent ? [] : [...(hidden.output || []), ...autoLines]
      return finishCommand(save, output, {
        autoLines,
        terminalEffect: horror.terminalEffect || null,
      })
    }
  }

  // disconnect mystérieux avant déblocage
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
      output: [`[ERR] Commande inconnue : '${cmd}'`, ...traceMessages(save)],
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
      output = ['[SYS] Procédure non documentée — le terminal refuse de confirmer.']
      break
    default:
      output = [`[ERR] Commande '${cmd}' non implémentée en demo.`]
  }

  const postCmd = mergeHorrorResult(
    processMysteryAfterCommand(save, cmd),
    processHorrorAfterCommand(save, cmd),
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

/** Tick session — événements temporels / hasard. */
export function tickDemoMystery() {
  const save = loadDemoSave()
  clearExpiredUiEffects(save)
  const result = mergeHorrorResult(processMysteryTick(save), processHorrorTick(save))
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
    terminalEffect: result.terminalEffect || null,
    newCodexDiscoveries,
  }
}

export function getDemoState() {
  return toPublicState(loadDemoSave())
}

export function resetDemoGame() {
  const save = resetDemoSave()
  return {
    message: '[SYS] Sauvegarde réinitialisée — Mission 1 : Signal Fantôme.',
    state: toPublicState(save),
  }
}

export function loadAdvancedDemoGame() {
  const save = loadAdvancedDemoSave()
  return {
    message: '[DEMO] Démo avancée chargée — SATLINK_03, BLACK MARKET, missions débloquées.',
    state: toPublicState(save),
  }
}

/** Marque la première manifestation N0VA comme vue (une fois par sauvegarde). */
export function markNovaIntroSeenDemo() {
  const save = loadDemoSave()
  if (save.novaIntroSeen) {
    return { state: toPublicState(save) }
  }
  save.novaIntroSeen = true
  save.events_log = save.events_log || []
  save.events_log.push('[N0VA] Premier contact — canal entrant fermé.')
  saveDemoSave(save)
  return { state: toPublicState(save) }
}
