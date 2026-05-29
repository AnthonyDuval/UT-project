/**
 * États démo — partie fraîche (Mission 1) vs démo avancée (showcase).
 */

const MISSION_DEFS = {
  signal_fantome: {
    id: 'signal_fantome',
    title: 'Signal Fantôme',
    subtitle: 'Mission 1',
    description: 'Un relais non identifié émet un signal. Localisez-le et établissez contact.',
    primaryNode: 'relay_ghost',
    objectiveDefs: [
      { id: 'read_files', label: 'Explorer les fichiers du terminal' },
      { id: 'scan_network', label: 'Cartographier le réseau (scan)' },
      { id: 'connect_relay', label: 'Connectez-vous à relay_ghost' },
    ],
    rewardsPreview: {
      bittek: 50,
      reputation: 1,
      summary: 'Contact N0VA · BLACK MARKET · accès SATLINK_03',
    },
  },
  satlink_intrusion: {
    id: 'satlink_intrusion',
    title: 'Intrusion Orbitale',
    subtitle: 'Mission 2',
    description: 'Pénétrez le relais orbital SATLINK_03 et cartographiez le réseau UltraTech.',
    primaryNode: 'satlink_03',
    objectiveDefs: [
      { id: 'connect_satlink', label: 'Connectez-vous à satlink_03' },
      { id: 'use_probe', label: 'Utilisez probe sur le segment orbital' },
      { id: 'discover_nodes', label: 'Découvrir morgue_server et blackvault' },
      { id: 'open_satellite_file', label: 'Ouvrir un fichier satellite' },
      { id: 'nova_fragment', label: 'Récupérer un fragment N0VA' },
    ],
    rewardsPreview: {
      bittek: 75,
      reputation: 1,
      summary: 'Commande bypass · BLACK MARKET avancé',
    },
  },
}

/** Nouvelle partie démo — Mission 1, terminal local, TRACE à 0. */
export function createFreshDemoState() {
  return {
    player: { username: 'ghost_demo', bittek: 0, reputation: 0 },
    unlocked_commands: ['help', 'clear', 'ls', 'open', 'status', 'sync'],
    read_files: [],
    flags: {
      scan_completed: false,
      mission_1_complete: false,
      probe_morgue: false,
      probe_used_satlink: false,
    },
    missions: {
      signal_fantome: {
        status: 'active',
        currentObjective: 'Explorer les fichiers du terminal',
        completedObjectives: [],
        rewardsClaimed: false,
      },
      satlink_intrusion: {
        status: 'locked',
        currentObjective: null,
        completedObjectives: [],
        rewardsClaimed: false,
      },
    },
    events_log: ['[DEMO] Session locale — aucune connexion serveur'],
    traceLevel: 0,
    trace_alerts_triggered: [],
    gameOver: false,
    marketUnlocked: false,
    marketAdvancedUnlocked: false,
    inventory: [],
    activeEffects: [],
    traceReductionPassive: 0,
    currentNode: 'local',
    discoveredNodes: ['local'],
    hackedNodes: [],
    programInventory: [{ programId: 'trace_wiper', quantity: 1 }],
    installedPrograms: [],
    lootedProgramNodes: [],
    seenEvents: [],
  }
}

/** Démo avancée — showcase rapide des fonctionnalités. */
export function createAdvancedDemoState() {
  return {
    player: { username: 'ghost_demo', bittek: 250, reputation: 3 },
    unlocked_commands: [
      'help', 'clear', 'ls', 'open', 'status', 'sync',
      'scan', 'connect', 'disconnect', 'probe', 'run', 'install', 'uninstall',
      'programs', 'inventory', 'market',
    ],
    read_files: ['readme.txt', 'toolkit_manifest.txt', 'nova_contact.dat'],
    flags: {
      scan_completed: true,
      mission_1_complete: true,
      probe_morgue: true,
      probe_used_satlink: true,
    },
    missions: {
      signal_fantome: {
        status: 'completed',
        currentObjective: null,
        completedObjectives: ['read_files', 'scan_network', 'connect_relay'],
        rewardsClaimed: true,
      },
      satlink_intrusion: {
        status: 'active',
        currentObjective: 'Utilisez probe sur le segment orbital',
        completedObjectives: ['connect_satlink', 'open_satellite_file'],
        rewardsClaimed: false,
      },
    },
    events_log: [
      '[DEMO] Démo avancée — toutes les fonctionnalités débloquées',
      '[NET] Connecté à SATLINK_03',
      '[MISSION] Signal Fantôme — TERMINÉE',
      '[SCAN] Relais RELAY_GHOST localisé.',
    ],
    traceLevel: 42,
    trace_alerts_triggered: [30],
    gameOver: false,
    marketUnlocked: true,
    marketAdvancedUnlocked: true,
    inventory: [
      { itemId: 'firewall_jetable', quantity: 1 },
      { itemId: 'proxy_fantome', quantity: 1 },
    ],
    activeEffects: [],
    traceReductionPassive: 3,
    currentNode: 'satlink_03',
    discoveredNodes: ['local', 'relay_ghost', 'satlink_03', 'morgue_server', 'blackvault'],
    hackedNodes: ['relay_ghost', 'satlink_03'],
    programInventory: [
      { programId: 'trace_wiper', quantity: 2 },
      { programId: 'ghostcloak', quantity: 1 },
    ],
    installedPrograms: ['packet_sniffer'],
    lootedProgramNodes: ['relay_ghost', 'satlink_03'],
    seenEvents: ['nova_contact'],
  }
}

function buildMissionListItem(missionId, save) {
  const def = MISSION_DEFS[missionId]
  const m = save.missions[missionId] || {}
  const objectives = def.objectiveDefs.map((o) => ({
    ...o,
    done: (m.completedObjectives || []).includes(o.id),
  }))
  const done = objectives.filter((o) => o.done).length
  return {
    id: missionId,
    title: def.title,
    subtitle: def.subtitle,
    description: def.description,
    primaryNode: def.primaryNode,
    status: m.status,
    currentObjective: m.currentObjective,
    progress: `${done}/${objectives.length}`,
    progressRatio: objectives.length ? done / objectives.length : 0,
    objectives,
    rewardsPreview: def.rewardsPreview,
    rewardsClaimed: m.rewardsClaimed ?? false,
  }
}

export function buildMissionJournal(save) {
  const m1 = save.missions.signal_fantome
  const m2 = save.missions.satlink_intrusion
  const missions = [
    buildMissionListItem('signal_fantome', save),
    buildMissionListItem('satlink_intrusion', save),
  ]
  const completedMissions = missions.filter((m) => m.status === 'completed')

  let currentMissionId = null
  if (m2?.status === 'active') currentMissionId = 'satlink_intrusion'
  else if (m1?.status === 'active') currentMissionId = 'signal_fantome'

  const currentMission = currentMissionId
    ? missions.find((m) => m.id === currentMissionId)
    : null

  return {
    currentMission,
    currentMissionId,
    missions,
    completedMissions,
    seenEvents: save.seenEvents || [],
  }
}

const NODE_META = {
  local: {
    id: 'local', name: 'LOCAL', displayName: 'ghost_demo@ultratech',
    securityLevel: 'LOW', traceMultiplier: 1.0, theme: 'default',
  },
  relay_ghost: {
    id: 'relay_ghost', name: 'RELAY_GHOST', displayName: 'ghost@relay_ghost',
    securityLevel: 'LOW', traceMultiplier: 1.0, theme: 'ghost',
  },
  satlink_03: {
    id: 'satlink_03', name: 'SATLINK_03', displayName: 'ghost@satlink_03',
    securityLevel: 'MEDIUM', traceMultiplier: 1.5, theme: 'satlink',
  },
  morgue_server: {
    id: 'morgue_server', name: 'MORGUE_SERVER', displayName: 'ghost@morgue_server',
    securityLevel: 'HIGH', traceMultiplier: 2.0, theme: 'morgue',
  },
  blackvault: {
    id: 'blackvault', name: 'BLACKVAULT', displayName: 'ghost@blackvault',
    securityLevel: 'BLACK', traceMultiplier: 3.0, theme: 'blackvault',
  },
}

const PROGRAMS = {
  trace_wiper: { filename: 'trace_wiper.exe', name: 'Trace Wiper', type: 'consumable', rarity: 'common', installable: false },
  ghostcloak: { filename: 'ghostcloak.exe', name: 'GhostCloak', type: 'consumable', rarity: 'uncommon', installable: false },
  packet_sniffer: { filename: 'packet_sniffer.exe', name: 'Packet Sniffer', type: 'permanent', rarity: 'rare', installable: true },
  netscan: { filename: 'netscan.exe', name: 'NetScan', type: 'consumable', rarity: 'common', installable: false },
}

export function buildNetwork(save) {
  const current = save.currentNode
  const meta = NODE_META[current] || NODE_META.local
  const nodes = save.discoveredNodes
    .filter((id) => id !== 'local')
    .map((id) => ({
      id,
      name: NODE_META[id]?.name || id,
      securityLevel: NODE_META[id]?.securityLevel || 'UNKNOWN',
      hacked: save.hackedNodes.includes(id),
      current: id === current,
    }))

  return {
    currentNode: current,
    currentNodeMeta: meta,
    discoveredNodes: save.discoveredNodes,
    hackedNodes: save.hackedNodes,
    nodes,
    traceMultiplier: meta.traceMultiplier,
    connected: current !== 'local',
  }
}

export function buildProgramToolkit(save) {
  const inventory = save.programInventory.map((e) => {
    const p = PROGRAMS[e.programId] || { filename: e.programId, name: e.programId }
    return { programId: e.programId, quantity: e.quantity, ...p, description: '', effect: '' }
  })
  const installed = save.installedPrograms.map((pid) => {
    const p = PROGRAMS[pid] || { filename: pid, name: pid }
    return { programId: pid, ...p, description: '', effect: '' }
  })
  return {
    inventory,
    installed,
    inventoryCount: inventory.reduce((n, i) => n + i.quantity, 0),
    installedCount: installed.length,
  }
}

export function toPublicState(save) {
  const visible = getVisibleFiles(save)
  return {
    player: save.player,
    unlocked_commands: save.unlocked_commands,
    visible_files: visible,
    missions: save.missions,
    missionJournal: buildMissionJournal(save),
    events_log: save.events_log,
    traceLevel: save.traceLevel,
    gameOver: save.gameOver,
    marketUnlocked: save.marketUnlocked,
    marketAdvancedUnlocked: save.marketAdvancedUnlocked,
    inventory: save.inventory,
    activeEffects: save.activeEffects,
    traceReductionPassive: save.traceReductionPassive,
    network: buildNetwork(save),
    programToolkit: buildProgramToolkit(save),
  }
}

export function getVisibleFiles(save) {
  const visible = []
  const node = save.currentNode

  for (const [name, meta] of Object.entries(DEMO_FILES)) {
    const fileNode = meta.node || 'local'
    if (fileNode !== node) continue
    if (meta.visible_from_start) visible.push(name)
    else if (meta.visible_on_node) visible.push(name)
    else if (meta.unlock_key && save.flags[meta.unlock_key]) visible.push(name)
  }
  return visible.sort()
}

export const DEMO_FILES = {
  'readme.txt': {
    node: 'local', visible_from_start: true,
    description: "Fichier d'accueil",
    content: [
      '╔══════════════════════════════════════════════════╗',
      '║  ULTRATECH ONLINE — MODE DEMO OFFLINE            ║',
      '╚══════════════════════════════════════════════════╝',
      '',
      'Bienvenue, opérateur ghost_demo.',
      'Cette session fonctionne sans serveur backend.',
      'Commencez par lire system.log — des anomalies y sont signalées.',
    ],
  },
  'system.log': {
    node: 'local', visible_from_start: true,
    description: 'Journal système',
    content: [
      '[2026-05-28 02:14:33] WARN — Relais externe non identifié détecté',
      '[2026-05-28 02:14:34] WARN — Signature : RELAY_GHOST',
      '[2026-05-28 02:14:36] INFO — Analyse réseau requise avant toute connexion',
      '',
      '...pour cartographier les relais fantômes, lancer :',
      '>>> SCAN <<<',
    ],
  },
  'toolkit_manifest.txt': {
    node: 'local', visible_from_start: true,
    description: 'Manifeste boîte à outils',
    content: [
      'BOÎTE À OUTILS — run / install / uninstall',
      'ls /programs · ls /inventory',
    ],
  },
  'ghost_relay.log': {
    node: 'local', unlock_key: 'scan_completed',
    description: 'Log du relais fantôme',
    content: [
      '[SCAN RESULT] Relais RELAY_GHOST localisé',
      '[SCAN RESULT] Statut : EN ATTENTE DE CONNEXION',
      '',
      'Pour établir le lien :',
      '>>> connect relay_ghost <<<',
    ],
  },
  'nova_contact.dat': {
    node: 'local', unlock_key: 'mission_1_complete',
    description: 'Contact N0VA',
    content: [
      '« Bien joué, opérateur demo. UltraTech ne doit pas savoir. »',
      '— N0VA',
      'market://blacknode',
    ],
  },
  'satlink_manifest.dat': {
    node: 'satlink_03', visible_on_node: true,
    description: 'Manifeste orbital',
    content: [
      '[SATLINK_03] Segments : morgue_server, blackvault',
      '>>> probe <<< · >>> disconnect <<<',
    ],
  },
  'nova_orbital_fragment.dat': {
    node: 'satlink_03', unlock_key: 'probe_used_satlink',
    description: 'Fragment N0VA',
    content: [
      '« SATLINK_03 est la porte d\'entrée. Cartographie tout. »',
      '— N0VA',
    ],
  },
}

export { NODE_META, PROGRAMS, MISSION_DEFS }
