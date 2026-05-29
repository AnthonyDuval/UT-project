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

function addTrace(save, amount) {
  if (amount <= 0 || save.gameOver) return
  const mult = NODE_META[save.currentNode]?.traceMultiplier || 1
  const passive = save.traceReductionPassive || 0
  const actual = Math.max(1, Math.round(amount * mult * (1 - passive / 100)))
  save.traceLevel = Math.min(100, save.traceLevel + actual)
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
}

function traceMessages(save) {
  if (save.traceLevel >= 100) {
    return ['[TRACE] NIVEAU CRITIQUE — 100% — GAME OVER IMMINENT']
  }
  return []
}

function cmdHelp(save) {
  const lines = [
    '╔══════════════════════════════════════════════════╗',
    '║  ULTRATECH TERMINAL — AIDE [DEMO]                 ║',
    '╚══════════════════════════════════════════════════╝',
    '',
    'Commandes disponibles :',
  ]
  for (const name of [...save.unlocked_commands].sort()) {
    lines.push(`  ${name}`)
  }
  lines.push('', '[DEMO] Session locale — progression sauvegardée dans le navigateur.')
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

  if (name === 'toolkit_manifest.txt') {
    for (const c of ['run', 'install', 'uninstall']) {
      if (!save.unlocked_commands.includes(c)) save.unlocked_commands.push(c)
    }
    lines.push('', '[SYS] Boîte à outils : run, install, uninstall')
  }
  if (name === 'system.log' && !save.unlocked_commands.includes('scan')) {
    save.unlocked_commands.push('scan')
    lines.push('', '[SYS] Fragment de commande récupéré : scan')
  }
  if (name === 'ghost_relay.log' && !save.unlocked_commands.includes('connect')) {
    for (const c of ['connect', 'disconnect']) {
      if (!save.unlocked_commands.includes(c)) save.unlocked_commands.push(c)
    }
    lines.push('', '[SYS] Protocole de connexion débloqué : connect [cible]')
  }
  return lines
}

function cmdStatus(save) {
  const net = NODE_META[save.currentNode] || NODE_META.local
  return [
    '╔══════════════════════════════════════════════════╗',
    '║  STATUT OPÉRATEUR [DEMO]                          ║',
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
    '  [DEMO] Sauvegarde locale active.',
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
  addTrace(save, 15)
  return [
    '[NET] Establishing encrypted tunnel...',
    `[NET] Connected to ${meta.name}`,
    `[SYS] Sécurité ${meta.securityLevel} — trace x${meta.traceMultiplier}`,
    '[INFO] ls · disconnect pour revenir.',
  ]
}

function cmdDisconnect(save) {
  if (save.currentNode === 'local') return ['[NET] Déjà sur le terminal local.']
  const prev = NODE_META[save.currentNode]?.name || save.currentNode
  save.currentNode = 'local'
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
  return [
    '[SCAN] Balayage réseau...',
    '[SCAN] ANOMALIE : RELAY_GHOST',
    '[SYS] ghost_relay.log disponible.',
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
    '  Ouvrez l\'application BLACK MARKET sur le bureau.',
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
  if (save.gameOver) {
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

  if (!save.unlocked_commands.includes(cmd) && cmd !== 'clear') {
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
    case 'ls': output = cmdLs(save, args); break
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
      output = [`[DEMO] ${cmd} simulé — utilisez run en demo.`]
      break
    default:
      output = [`[ERR] Commande '${cmd}' non implémentée en demo.`]
  }

  const traceMsgs = traceMessages(save)
  if (traceMsgs.length) output = [...output, '', ...traceMsgs]

  saveDemoSave(save)
  return { output, clear_terminal, state: toPublicState(save) }
}

export function getDemoState() {
  return toPublicState(loadDemoSave())
}

export function resetDemoGame() {
  const save = resetDemoSave()
  return {
    message: '[DEMO] Nouvelle partie — Mission 1 : Signal Fantôme.',
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
