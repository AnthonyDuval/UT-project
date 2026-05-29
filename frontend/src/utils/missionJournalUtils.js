/** Commandes de base — non affichées comme « suspectes ». */
const BASE_COMMANDS = new Set(['help', 'clear', 'files', 'open', 'ls'])

/** Commandes liées à chaque dossier d'enquête. */
const MISSION_COMMAND_POOL = {
  signal_fantome: ['scan', 'connect', 'status', 'sync', 'disconnect'],
  satlink_intrusion: ['probe', 'connect', 'run', 'install', 'programs', 'inventory', 'market'],
}

const COMMAND_LABELS = {
  scan: 'scan — analyse réseau',
  connect: 'connect — tunnel clandestin',
  disconnect: 'disconnect — couper la trace',
  status: 'status — état opérateur',
  sync: 'sync — synchronisation',
  probe: 'probe — cartographie profonde',
  run: 'run — exécution programme',
  install: 'install — déploiement',
  programs: 'programs — arsenal',
  inventory: 'inventory — stock tactique',
  market: 'market — accès blacknode',
}

export function getCurrentObjectiveId(objectives = []) {
  return objectives.find((o) => !o.done)?.id ?? null
}

export function getDiscoveredSuspectCommands(missionId, unlockedCommands = []) {
  const pool = MISSION_COMMAND_POOL[missionId] || []
  return pool
    .filter((cmd) => unlockedCommands.includes(cmd))
    .map((cmd) => ({ cmd, label: COMMAND_LABELS[cmd] || cmd }))
}

export function getAllDiscoveredCommands(unlockedCommands = []) {
  return unlockedCommands
    .filter((cmd) => !BASE_COMMANDS.has(cmd))
    .sort()
    .map((cmd) => ({ cmd, label: COMMAND_LABELS[cmd] || cmd }))
}

/** Découpe le summary en modules BIOS (déblocages, accès…). */
export function parseRewardModules(rewardsPreview) {
  if (!rewardsPreview) return []

  const modules = [
    { type: 'bittek', label: `+${rewardsPreview.bittek} BitTek` },
    { type: 'reputation', label: `+${rewardsPreview.reputation} Réputation` },
  ]

  if (rewardsPreview.summary) {
    rewardsPreview.summary
      .split('·')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((part) => modules.push({ type: 'unlock', label: part }))
  }

  return modules
}

export function sortMissionsForDisplay(missions = [], currentMissionId) {
  const order = { active: 0, completed: 1, locked: 2 }
  return [...missions].sort((a, b) => {
    if (a.id === currentMissionId) return -1
    if (b.id === currentMissionId) return 1
    return (order[a.status] ?? 9) - (order[b.status] ?? 9)
  })
}
