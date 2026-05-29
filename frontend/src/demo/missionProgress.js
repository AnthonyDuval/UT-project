/**
 * Progression des missions — parité simplifiée avec le backend.
 */

import { MISSION_DEFS } from './demoState'

const NOVA_CONTACT_LINES = [
  '',
  '╔══════════════════════════════════════════════════╗',
  '║  TRANSMISSION INTERCEPTÉE — ORIGINE INCONNUE     ║',
  '╚══════════════════════════════════════════════════╝',
  '',
  '« Bien joué. UltraTech ne doit pas savoir. »',
  '« Le marché noir t\'attend. Reste fantôme. »',
  '— N0VA',
]

function objectiveDone(save, objectiveId) {
  const read = new Set(save.read_files || [])
  const flags = save.flags || {}
  const discovered = new Set(save.discoveredNodes || [])
  const hacked = new Set(save.hackedNodes || [])

  const checks = {
    read_files: read.has('note.txt') && read.has('system.log'),
    scan_network: !!flags.scan_completed,
    connect_relay: hacked.has('relay_ghost'),
    connect_satlink: hacked.has('satlink_03'),
    use_probe: !!flags.probe_used_satlink,
    discover_nodes: discovered.has('morgue_server') && discovered.has('blackvault'),
    open_satellite_file: read.has('satlink_manifest.dat'),
    nova_fragment: read.has('nova_orbital_fragment.dat'),
  }
  return !!checks[objectiveId]
}

function refreshObjective(save, missionId) {
  const def = MISSION_DEFS[missionId]
  const m = save.missions[missionId]
  if (!def || !m || m.status !== 'active') {
    if (m) m.currentObjective = null
    return
  }

  const completed = new Set(m.completedObjectives || [])
  for (const obj of def.objectiveDefs) {
    if (!completed.has(obj.id)) {
      m.currentObjective = obj.label
      return
    }
  }
  m.currentObjective = null
}

function grantMissionRewards(save, missionId) {
  const def = MISSION_DEFS[missionId]
  const messages = []
  const narrativeLines = []
  const preview = def?.rewardsPreview

  if (!save.seenEvents) save.seenEvents = []

  if (missionId === 'signal_fantome') {
    save.player.bittek += preview?.bittek ?? 50
    save.player.reputation += preview?.reputation ?? 1
    save.flags.mission_1_complete = true
    save.marketUnlocked = true
    if (!save.discoveredNodes.includes('satlink_03')) {
      save.discoveredNodes.push('satlink_03')
    }
    if (!save.seenEvents.includes('nova_contact')) {
      save.seenEvents.push('nova_contact')
      narrativeLines.push(...NOVA_CONTACT_LINES)
    }
    messages.push('[SYS] +50 BitTek | +1 Réputation')
    messages.push('[SYS] BLACK MARKET — accès autorisé.')
    messages.push('[NET] Nouveau relais détecté : SATLINK_03')
    messages.push('[MISSION] Signal Fantôme — TERMINÉE')
  }

  if (missionId === 'satlink_intrusion') {
    save.player.bittek += preview?.bittek ?? 75
    save.player.reputation += preview?.reputation ?? 1
    save.marketAdvancedUnlocked = true
    if (!save.unlocked_commands.includes('probe')) {
      save.unlocked_commands.push('probe')
    }
    messages.push('[SYS] +75 BitTek | +1 Réputation')
    messages.push('[MISSION] Intrusion Orbitale — TERMINÉE')
  }

  return { messages, narrativeLines }
}

function completeMission(save, missionId) {
  const m = save.missions[missionId]
  const def = MISSION_DEFS[missionId]
  if (!m || !def || m.status === 'completed') return { messages: [], narrativeLines: [] }

  m.status = 'completed'
  m.currentObjective = null
  m.rewardsClaimed = true

  const { messages, narrativeLines } = grantMissionRewards(save, missionId)

  const nextId = missionId === 'signal_fantome' ? 'satlink_intrusion' : null
  if (nextId && save.missions[nextId]?.status === 'locked') {
    save.missions[nextId].status = 'active'
    refreshObjective(save, nextId)
    for (const cmd of ['probe', 'status']) {
      if (!save.unlocked_commands.includes(cmd)) save.unlocked_commands.push(cmd)
    }
    messages.push(`[MISSION] Nouvelle mission : ${MISSION_DEFS[nextId].title}`)
  }

  return { messages, narrativeLines }
}

/** Met à jour les objectifs après une action. Retourne lignes terminal éventuelles. */
export function updateMissionProgress(save) {
  const output = []
  const narrative = []

  for (const missionId of ['signal_fantome', 'satlink_intrusion']) {
    const def = MISSION_DEFS[missionId]
    const m = save.missions[missionId]
    if (!def || !m || m.status !== 'active') continue

    const completed = m.completedObjectives || []
    for (const obj of def.objectiveDefs) {
      if (completed.includes(obj.id)) continue
      if (objectiveDone(save, obj.id)) {
        completed.push(obj.id)
        m.completedObjectives = completed
        output.push(`[MISSION] ✓ ${obj.label}`)
      }
    }

    refreshObjective(save, missionId)

    const allDone = def.objectiveDefs.every((o) => completed.includes(o.id))
    if (allDone && m.status === 'active') {
      const result = completeMission(save, missionId)
      output.push(...result.messages)
      narrative.push(...result.narrativeLines)
    }
  }

  return { output, narrative }
}
