import { buildCodexState } from './codexService'
import { getHintBrokerState } from './hintBroker'
import { createBehaviorState } from '../systems/PlayerBehaviorTracker'
import { getFileContent, getFileDescription } from '../i18n/helpers'
import { getPlayerDisplayName } from '../utils/playerName'
import { buildGameOverReport } from '../utils/gameOverReport'
import { isSafeWindowActive } from '../systems/traceRecovery'
import {
  NOVA_GATED_FILES,
  sanitizeMissionRewards,
  sanitizeObjectiveLabel,
} from '../utils/novaGate'

const MISSION_DEFS = {
  signal_fantome: {
    id: 'signal_fantome',
    title: 'Signal Fantôme',
    subtitle: 'Mission 1',
    description: 'Un relais non identifié émet un signal. Localisez-le et établissez contact.',
    atmosphere: 'Un opérateur a disparu après avoir scanné ce segment. UltraTech a effacé les traces — pas assez vite.',
    primaryNode: 'relay_ghost',
    objectiveDefs: [
      { id: 'read_files', label: 'Découvrir ce qui a été laissé sur le terminal' },
      { id: 'scan_network', label: 'Comprendre ce qu\'il est arrivé au dernier opérateur' },
      { id: 'connect_relay', label: 'Atteindre le relais fantôme' },
    ],
    rewardsPreview: {
      bittek: 120,
      reputation: 1,
      summary: 'Contact N0VA · BLACK MARKET · Firewall Jetable · accès SATLINK_03',
    },
  },
  satlink_intrusion: {
    id: 'satlink_intrusion',
    title: 'Intrusion Orbitale',
    subtitle: 'Mission 2',
    description: 'Pénétrez le relais orbital SATLINK_03 et cartographiez le réseau UltraTech.',
    atmosphere: 'SATLINK_03 transmet des données qu\'aucun contrat orbital ne justifie. Les opérateurs ne scannaient pas ce relais — ils l\'interrogeaient. PROBE revient dans les logs effacés.',
    primaryNode: 'satlink_03',
    objectiveDefs: [
      { id: 'connect_satlink', label: 'Atteindre le relais orbital SATLINK_03' },
      { id: 'use_probe', label: 'Comprendre ce qu\'il est arrivé au dernier cartographe' },
      { id: 'discover_nodes', label: 'Cartographier les segments interdits' },
      { id: 'open_satellite_file', label: 'Lire ce que le manifeste orbital cache' },
      { id: 'nova_fragment', label: 'Récupérer un fragment laissé par N0VA' },
    ],
    rewardsPreview: {
      bittek: 180,
      reputation: 1,
      summary: 'Commande bypass · Proxy Fantôme · BLACK MARKET avancé',
    },
  },
  transmission_interdite: {
    id: 'transmission_interdite',
    title: 'Transmission Interdite',
    subtitle: 'Mission 3',
    description: 'SATLINK_03 n\'était pas un relais — c\'était une prison de signaux.',
    atmosphere: 'Quelqu\'un parle en dehors des canaux officiels. UltraTech efface déjà la trace.',
    primaryNode: 'satlink_03',
    objectiveDefs: [
      { id: 'read_orbital_manifest', label: 'Lire orbital_manifest.log' },
      { id: 'discover_listen', label: 'Découvrir la commande listen' },
      { id: 'use_listen', label: 'Écouter SATLINK_03' },
      { id: 'receive_echo17', label: 'Recevoir la transmission ECHO_17' },
      { id: 'choose_signal', label: 'Décider du sort du signal' },
      { id: 'unlock_echo_fragment', label: 'Récupérer echo_fragment.log' },
    ],
    rewardsPreview: {
      bittek: 250,
      reputation: 2,
      summary: 'Commande listen · Codex ECHO_17 · fragment orbital',
    },
  },
  relais_miroir: {
    id: 'relais_miroir',
    title: 'Le Relais Miroir',
    subtitle: 'Mission 4',
    description: 'Un nœud qui répète les opérateurs effacés.',
    atmosphere: 'operator_0 n\'a jamais quitté le relais. Votre nom était déjà ici.',
    primaryNode: 'mirror_relay',
    objectiveDefs: [
      { id: 'discover_mirror', label: 'Découvrir mirror_relay' },
      { id: 'connect_mirror', label: 'Se connecter au relais miroir' },
      { id: 'read_mirror_index', label: 'Lire mirror_index.dat' },
      { id: 'discover_echo_cmd', label: 'Découvrir la commande echo' },
      { id: 'echo_operator', label: 'Interroger l\'opérateur fantôme' },
      { id: 'impossible_response', label: 'Recevoir la réponse impossible' },
    ],
    rewardsPreview: {
      bittek: 300,
      reputation: 2,
      summary: 'Commande echo · operator_shadow.log · THE_ABSENT',
    },
  },
  protocole_veil: {
    id: 'protocole_veil',
    title: 'Protocole VEIL',
    subtitle: 'Mission 5',
    description: 'UltraTech propose un marché. VEIL attend une réponse.',
    atmosphere: 'Coopérer, et cette session peut encore être classée comme incident mineur.',
    primaryNode: 'satlink_03',
    objectiveDefs: [
      { id: 'receive_veil', label: 'Recevoir la transmission VEIL' },
      { id: 'read_secops_notice', label: 'Lire secops_notice.log' },
      { id: 'veil_choice', label: 'Répondre à VEIL' },
      { id: 'unlock_secops_gate', label: 'Débloquer secops_gate' },
      { id: 'probe_secops_gate', label: 'Sonder secops_gate' },
    ],
    rewardsPreview: {
      bittek: 350,
      reputation: 2,
      summary: 'Signal Scrubber · accès SECOPS · vérité partielle',
    },
  },
  node_fantome: {
    id: 'node_fantome',
    title: 'Node Fantôme',
    subtitle: 'Mission 4',
    description: 'Localiser et pénétrer un nœud qui n\'existe pas sur les cartes officielles.',
    atmosphere: 'Un relais sans nom répond à des requêtes mortes. Les cartographes effacés le connaissaient.',
    primaryNode: 'mirror_relay',
    objectiveDefs: [],
    rewardsPreview: {
      bittek: 350,
      reputation: 2,
      summary: 'Objet rare · réduction TRACE permanente',
    },
  },
}

/** Nouvelle partie démo — Mission 1, terminal local, TRACE à 0. */
export function createFreshDemoState() {
  return {
    player: { username: '', bittek: 0, reputation: 0 },
    onboardingSeen: false,
    warningTrace20Seen: false,
    traceWarning20: null,
    triangulation50Seen: false,
    traceTriangulation50: null,
    emergencyEscape75Seen: false,
    traceEmergency75: null,
    safeWindow: null,
    missionCleanup: null,
    missionCleanupOffers: [],
    marketMissionPurchases: {},
    characterInfluence: {
      novaAffinity: 0,
      veilSuspicion: 0,
      morseTrust: 0,
      absentExposure: 0,
    },
    influenceUnlocks: {},
    unlocked_commands: ['help', 'clear', 'files', 'open'],
    read_files: [],
    flags: {
      scan_completed: false,
      mission_1_complete: false,
      note_read: false,
      probe_morgue: false,
      probe_used_satlink: false,
    },
    missions: {
      signal_fantome: {
        status: 'active',
        currentObjective: 'Quelqu\'un vous a ouvert une porte. Le terminal semble attendre quelque chose.',
        completedObjectives: [],
        rewardsClaimed: false,
      },
      satlink_intrusion: {
        status: 'locked',
        currentObjective: null,
        completedObjectives: [],
        rewardsClaimed: false,
      },
      transmission_interdite: {
        status: 'locked',
        currentObjective: null,
        completedObjectives: [],
        rewardsClaimed: false,
      },
      relais_miroir: {
        status: 'locked',
        currentObjective: null,
        completedObjectives: [],
        rewardsClaimed: false,
      },
      protocole_veil: {
        status: 'locked',
        currentObjective: null,
        completedObjectives: [],
        rewardsClaimed: false,
      },
    },
    events_log: ['[SYS] Session locale initialisée — canal sécurisé actif'],
    traceLevel: 0,
    trace_alerts_triggered: [],
    gameOver: false,
    marketUnlocked: false,
    marketAdvancedUnlocked: false,
    hintBrokerUnlocked: false,
    purchasedHints: [],
    hintBrokerHistory: [],
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
    mysteryFlags: {},
    sessionStartMs: Date.now(),
    commandCount: 0,
    hiddenCommandUses: {},
    lastCommand: '',
    activeUiEffect: null,
    activeCinematic: null,
    cinematicSeenEvents: [],
    cinematicLastGlobalAt: 0,
    cinematicLastTriggeredAt: {},
    cinematicFlags: {},
    fakeGameOverUntil: null,
    uiIntrosSeen: {},
    tutorialFlags: {},
    horrorSeenEvents: [],
    horrorLastTriggeredAt: {},
    horrorLastGlobalAt: 0,
    horrorFlags: {},
    connectedSinceMs: null,
    novaIntroSeen: false,
    guidanceUnknownStreak: 0,
    playerGuidance: {
      unknownStreak: 0,
      lastProgressAt: Date.now(),
      lastStageId: null,
      uselessRepeat: { cmd: '', count: 0 },
      lastStuckHintAt: 0,
      stuckTier: 0,
    },
    ultraTechPresence: {
      level: 'passive',
      lastWarningAt: 0,
      terminalLockUntil: 0,
    },
    seenTransmissions: [],
    activeCharacterTransmission: null,
    characterTransmissionLastAt: 0,
    codexDiscovered: {},
    codexNotified: {},
    eventLastTriggeredAt: {},
    playerBehavior: createBehaviorState(),
  }
}

/** Démo avancée — showcase rapide des fonctionnalités. */
export function createAdvancedDemoState() {
  return {
    player: { username: 'ghost_demo', bittek: 250, reputation: 3 },
    onboardingSeen: true,
    warningTrace20Seen: false,
    traceWarning20: null,
    triangulation50Seen: false,
    traceTriangulation50: null,
    emergencyEscape75Seen: false,
    traceEmergency75: null,
    safeWindow: null,
    missionCleanup: null,
    missionCleanupOffers: [],
    marketMissionPurchases: {},
    characterInfluence: {
      novaAffinity: 0,
      veilSuspicion: 0,
      morseTrust: 0,
      absentExposure: 0,
    },
    influenceUnlocks: {},
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
        currentObjective: 'Dernier cartographe connu — statut : EFFACÉ. Son journal mentionne encore le segment orbital.',
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
    hintBrokerUnlocked: true,
    purchasedHints: [],
    hintBrokerHistory: [],
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
    mysteryFlags: {},
    sessionStartMs: Date.now(),
    commandCount: 0,
    hiddenCommandUses: {},
    lastCommand: '',
    activeUiEffect: null,
    activeCinematic: null,
    cinematicSeenEvents: [],
    cinematicLastGlobalAt: 0,
    cinematicLastTriggeredAt: {},
    cinematicFlags: {},
    fakeGameOverUntil: null,
    codexDiscovered: {},
    novaIntroSeen: true,
    seenTransmissions: [],
    activeCharacterTransmission: null,
    characterTransmissionLastAt: 0,
  }
}

function buildMissionListItem(missionId, save) {
  const def = MISSION_DEFS[missionId]
  const m = save.missions[missionId] || {}
  const objectives = def.objectiveDefs.map((o) => {
    const base = sanitizeObjectiveLabel(o, save.novaIntroSeen)
    return {
      ...base,
      done: (m.completedObjectives || []).includes(o.id),
    }
  })
  const done = objectives.filter((o) => o.done).length
  const rewardsPreview = sanitizeMissionRewards(def.rewardsPreview, save.novaIntroSeen)
  return {
    id: missionId,
    title: def.title,
    subtitle: def.subtitle,
    description: def.description,
    atmosphere: def.atmosphere,
    primaryNode: def.primaryNode,
    status: m.status,
    currentObjective: m.currentObjective,
    progress: `${done}/${objectives.length}`,
    progressRatio: objectives.length ? done / objectives.length : 0,
    objectives,
    rewardsPreview,
    rewardsClaimed: m.rewardsClaimed ?? false,
  }
}

export function buildMissionJournal(save) {
  const m1 = save.missions.signal_fantome
  const m2 = save.missions.satlink_intrusion
  const m3 = save.missions.transmission_interdite
  const m4 = save.missions.relais_miroir
  const m5 = save.missions.protocole_veil
  const missions = [
    buildMissionListItem('signal_fantome', save),
    buildMissionListItem('satlink_intrusion', save),
    buildMissionListItem('transmission_interdite', save),
    buildMissionListItem('relais_miroir', save),
    buildMissionListItem('protocole_veil', save),
  ]
  const completedMissions = missions.filter((m) => m.status === 'completed')

  let currentMissionId = null
  if (m5?.status === 'active') currentMissionId = 'protocole_veil'
  else if (m4?.status === 'active') currentMissionId = 'relais_miroir'
  else if (m3?.status === 'active') currentMissionId = 'transmission_interdite'
  else if (m2?.status === 'active') currentMissionId = 'satlink_intrusion'
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
    id: 'local', name: 'LOCAL', displayName: 'ghost_operator@ultratech',
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
  mirror_relay: {
    id: 'mirror_relay', name: 'MIRROR_RELAY', displayName: 'ghost@mirror_relay',
    securityLevel: 'UNKNOWN', traceMultiplier: 0.8, theme: 'ghost',
  },
  void_relay: {
    id: 'void_relay', name: '██_VOID_RELAY', displayName: 'ghost@void_relay',
    securityLevel: 'UNKNOWN', traceMultiplier: 0.5, theme: 'ghost',
  },
  secops_gate: {
    id: 'secops_gate', name: 'SECOPS_GATE', displayName: 'ghost@secops_gate',
    securityLevel: 'BLACK', traceMultiplier: 2.2, theme: 'morgue',
  },
}

const PROGRAMS = {
  trace_wiper: { filename: 'trace_wiper.exe', name: 'Trace Wiper', type: 'consumable', rarity: 'common', installable: false },
  ghostcloak: { filename: 'ghostcloak.exe', name: 'GhostCloak', type: 'consumable', rarity: 'uncommon', installable: false },
  packet_sniffer: { filename: 'packet_sniffer.exe', name: 'Packet Sniffer', type: 'permanent', rarity: 'rare', installable: true },
  netscan: { filename: 'netscan.exe', name: 'NetScan', type: 'consumable', rarity: 'common', installable: false },
}

export function resolveNodeMeta(save, nodeId) {
  const base = NODE_META[nodeId] || NODE_META.local
  const user = getPlayerDisplayName(save)
  return {
    ...base,
    displayName: nodeId === 'local' ? `${user}@ultratech` : `${user}@${nodeId}`,
  }
}

export function buildNetwork(save) {
  const current = save.currentNode
  const meta = resolveNodeMeta(save, current)
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
  const now = Date.now()
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
    activeUiEffect: save.activeUiEffect || null,
    activeCinematic: save.activeCinematic || null,
    activeCharacterTransmission: save.activeCharacterTransmission || null,
    fakeGameOverActive: !!(save.fakeGameOverUntil && now < save.fakeGameOverUntil),
    seenEvents: save.seenEvents || [],
    flags: save.flags || {},
    read_files: save.read_files || [],
    uiIntrosSeen: save.uiIntrosSeen || {},
    tutorialFlags: save.tutorialFlags || {},
    codex: buildCodexState(save),
    novaIntroSeen: !!save.novaIntroSeen,
    onboardingSeen: !!save.onboardingSeen,
    warningTrace20Seen: !!save.warningTrace20Seen,
    traceWarning20: save.traceWarning20?.open ? save.traceWarning20 : null,
    triangulation50Seen: !!save.triangulation50Seen,
    traceTriangulation50: save.traceTriangulation50?.open ? save.traceTriangulation50 : null,
    emergencyEscape75Seen: !!save.emergencyEscape75Seen,
    traceEmergency75: save.traceEmergency75?.open ? save.traceEmergency75 : null,
    ultraTechPresence: save.ultraTechPresence || { level: 'passive' },
    hintBroker: getHintBrokerState(save),
    gameOverReport: save.gameOver ? buildGameOverReport(save) : null,
    safeWindow: isSafeWindowActive(save, now)
      ? { until: save.safeWindow.until, active: true }
      : null,
    missionCleanup: save.missionCleanup?.open
      ? {
        open: true,
        missionId: save.missionCleanup.missionId,
        startedAt: save.missionCleanup.startedAt,
      }
      : null,
    narrativeChoice: save.narrativeChoice?.open
      ? {
        open: true,
        id: save.narrativeChoice.id,
        startedAt: save.narrativeChoice.startedAt,
      }
      : null,
  }
}

export function getDemoFile(name) {
  const base = DEMO_FILES[name]
  if (!base) return null
  const description = getFileDescription(name) || base.description
  const content = getFileContent(name) || base.content
  return { ...base, description, content }
}

export function getVisibleFiles(save) {
  const visible = []
  const node = save.currentNode

  for (const [name, meta] of Object.entries(DEMO_FILES)) {
    if (NOVA_GATED_FILES.has(name) && !save.novaIntroSeen) continue
    const fileNode = meta.node || 'local'
    if (fileNode !== node) continue
    if (meta.visible_from_start) visible.push(name)
    else if (meta.visible_on_node) visible.push(name)
    else if (meta.unlock_key && save.flags[meta.unlock_key]) visible.push(name)
  }
  return visible.sort()
}

export const DEMO_FILES = {
  'note.txt': {
    node: 'local', visible_from_start: true,
    description: 'Message laissé par un inconnu',
    content: [
      '╔══════════════════════════════════════════════════╗',
      '║  MESSAGE NON SIGNÉ                                ║',
      '╚══════════════════════════════════════════════════╝',
      '',
      'Opérateur,',
      '',
      'Ce terminal n\'est pas à vous. Il ne le sera jamais.',
      'Quelqu\'un a laissé une porte entrouverte — UltraTech ne doit pas le savoir.',
      '',
      'Les documents traînent encore dans la mémoire locale.',
      'Les anciens parlaient au shell sans jamais expliquer comment.',
      '',
      '— ?',
    ],
  },
  'system.log': {
    node: 'local', unlock_key: 'note_read',
    description: 'Journal système — anomalies détectées',
    content: [
      '[02:14:33] ALERTE — Signal inconnu : RELAY_GHOST',
      '[02:14:34] NOTE INTERNE — Dernier opérateur ayant lancé SCAN sur ce segment : DISPARU',
      '[02:14:35] NOTE INTERNE — UltraTech a effacé son dossier. Personne ne prononce son nom.',
      '[02:14:36] WARN — Analyse réseau recommandée. Procédure : [REDACTED]',
      '',
      '[02:14:37] FRAGMENT — « Il a murmuré SCAN une dernière fois. Puis plus rien. »',
    ],
  },
  'toolkit_manifest.txt': {
    node: 'local', unlock_key: 'mission_1_complete',
    description: 'Manifeste technique effacé',
    content: [
      'BOÎTE À OUTILS — registre interne UltraTech',
      '',
      'Les exécutables répondaient à RUN.',
      'Personne n\'explique pourquoi. Personne ne demande.',
      '',
      '[REDACTED] install · uninstall — réservé niveau BLACK',
    ],
  },
  'ghost_relay.log': {
    node: 'local', unlock_key: 'scan_completed',
    description: 'Trace d\'analyse réseau',
    content: [
      '[CAPTURE] RELAY_GHOST — actif, non authentifié',
      '[CAPTURE] Statut : EN ATTENTE',
      '',
      'Note d\'un opérateur effacé :',
      '« Les anciens traversaient les nœuds clandestins avec CONNECT. »',
      '« Ne laisse jamais UltraTech voir le tunnel s\'ouvrir. »',
      '',
      '[RELAY_GHOST] — quelque chose écoute de l\'autre côté.',
    ],
  },
  'nova_contact.dat': {
    node: 'local', unlock_key: 'mission_1_complete',
    description: 'Transmission interceptée',
    content: [
      '-----BEGIN SIGNAL-----',
      '',
      '« Bien joué. UltraTech ne doit pas savoir que tu existes. »',
      '« Un canal s\'ouvrira bientôt. Reste fantôme. »',
      '',
      '— N0VA',
      '',
      '-----END SIGNAL-----',
    ],
  },
  'satlink_manifest.dat': {
    node: 'satlink_03', visible_on_node: true,
    description: 'Manifeste orbital',
    content: [
      '[SATLINK_03] Segments adjacents : morgue_server, blackvault',
      '',
      'Note interne (effacée) : « Les opérateurs ne scannaient pas SATLINK_03. Ils l\'interrogeaient. »',
      '',
      'Dernier cartographe connu — statut : EFFACÉ',
      'Dernière entrée de journal : « PROBE le segment avant qu\'ils ne m\'effacent. »',
      'Référence PROBE — 7 occurrences dans les logs effacés.',
      '',
      '[WARN] Firewall actif sur blackvault.',
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
  'orbital_manifest.log': {
    node: 'satlink_03', unlock_key: 'mission3_active',
    description: 'Manifeste orbital — journal interne',
    content: [],
  },
  'echo_fragment.log': {
    node: 'satlink_03', unlock_key: 'echo_fragment_unlocked',
    description: 'Fragment ECHO_17 récupéré',
    content: [],
  },
  'mirror_index.dat': {
    node: 'mirror_relay', visible_on_node: true,
    description: 'Index du relais miroir',
    content: [],
  },
  'operator_shadow.log': {
    node: 'mirror_relay', unlock_key: 'echo_operator_done',
    description: 'Ombre opérateur — journal impossible',
    content: [],
  },
  'secops_notice.log': {
    node: 'local', unlock_key: 'mission5_active',
    description: 'Avis SECOPS — protocole VEIL',
    content: [],
  },
  'veil_protocol.enc': {
    node: 'local', unlock_key: 'veil_protocol_unlocked',
    description: 'Protocole VEIL chiffré',
    content: [],
  },
  'memory_fragment.log': {
    node: 'local', unlock_key: 'mystery_memory_unlocked',
    description: 'Fragment mémoire corrompu',
    content: [
      '[CORRUPT] 0x00 0xFF 0x?? 0x7F',
      '[RECOVERED] "...subject ghost_operative — memory wipe FAILED..."',
      '[RECOVERED] "...N0VA is not a person. N0VA is a protocol..."',
      '[RECOVERED] "...mirror_relay — coordinates 47.██.ghost..."',
      '',
      '[NOTE MARGINALE — opérateur K., effacé]',
      '« Ne tape jamais MIRROR. »',
      '« Le terminal te regarde en retour. »',
    ],
  },
  'unknown_signal.enc': {
    node: 'local', unlock_key: 'mystery_signal_unlocked',
    description: 'Signal non identifié',
    content: [
      '-----BEGIN ENCRYPTED SIGNAL-----',
      'Freq: 1420.405 MHz · Origin: ████ ORBITAL',
      'Pattern: N0VA / ULTRATECH / N0VA / ULTRATECH',
      '',
      'Décodage partiel :',
      '« Le miroir montre ce qu\'UltraTech efface. »',
      '« archive_███.dat — ne pas diffuser. »',
      '-----END-----',
    ],
  },
  'do_not_open.sys': {
    node: 'local', unlock_key: 'mystery_override_unlocked',
    description: 'Segment système verrouillé',
    content: [
      '[KERNEL] ACCESS LEVEL: BLACK',
      '[KERNEL] FILE MARKED: DO NOT OPEN',
      '',
      'Contenu partiel :',
      'Projet MIRROR — duplication de conscience opérateur.',
      'Statut : ACTIF',
      'Sujet test : ghost_███',
      '',
      'Note UltraTech interne :',
      '« OVERRIDE n\'existe pas officiellement. »',
      '« Pourtant quelqu\'un l\'a utilisé la nuit du ██/██. »',
      '',
      '[WARN] Lecture déclenche alerte passive.',
    ],
  },
  'archive_███.dat': {
    node: 'local', unlock_key: 'mystery_archive_unlocked',
    description: 'Archive classifiée',
    content: [
      '╔══════════════════════════════════════════════════╗',
      '║  ULTRATECH — ARCHIVE INTERNE — NIVEAU ███        ║',
      '╚══════════════════════════════════════════════════╝',
      '',
      'Théorie interne : « N0VA » serait une ruse de contre-surveillance.',
      'Autre théorie : N0VA est une IA devenue autonome.',
      '',
      'Note marginale (main inconnue) :',
      '« Les deux théories sont vraies. »',
      '',
      'Coordonnées : mirror_relay · deepnode_alpha · ???',
    ],
  },
}

export { NODE_META, PROGRAMS, MISSION_DEFS }
