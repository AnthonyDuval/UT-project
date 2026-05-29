/**
 * Progression des missions — parité simplifiée avec le backend.
 */

import { MISSION_DEFS } from './demoState'
import { syncMissionObjectiveText } from '../utils/missionHints'
import { checkRiposteTriggers } from '../systems/UltraTechPresence'
import { tx, txRaw } from '../i18n/helpers'
import { getTranslator, getLocale } from '../i18n'

function getMissionTitle(missionId) {
  return getTranslator(getLocale())(`missions.${missionId}.title`)
    || MISSION_DEFS[missionId]?.title
}

function novaContactLines() {
  const t = txRaw('terminal.missionProgress.signalFantome.novaTransmission')
  if (t && typeof t === 'object') {
    return [
      '',
      t.banner,
      t.title,
      t.footerBanner,
      '',
      t.line1,
      t.line2,
      t.signature,
    ]
  }
  return ['']
}

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

function refreshObjective(save) {
  syncMissionObjectiveText(save)
}

function grantInventoryItem(save, itemId, qty = 1) {
  const inv = save.inventory.find((e) => e.itemId === itemId)
  if (inv) inv.quantity += qty
  else save.inventory.push({ itemId, quantity: qty })
}

function grantMissionRewards(save, missionId) {
  const def = MISSION_DEFS[missionId]
  const messages = []
  const narrativeLines = []
  const preview = def?.rewardsPreview

  if (!save.seenEvents) save.seenEvents = []

  if (missionId === 'signal_fantome') {
    save.player.bittek += preview?.bittek ?? 120
    save.player.reputation += preview?.reputation ?? 1
    save.flags.mission_1_complete = true
    save.marketUnlocked = true
    save.hintBrokerUnlocked = true
    grantInventoryItem(save, 'firewall_jetable', 1)
    if (!save.discoveredNodes.includes('satlink_03')) {
      save.discoveredNodes.push('satlink_03')
    }
    if (!save.seenEvents.includes('nova_contact')) {
      save.seenEvents.push('nova_contact')
      if (save.novaIntroSeen) {
        narrativeLines.push(...novaContactLines())
      } else {
        narrativeLines.push(
          '',
          tx('terminal.missionProgress.signalFantome.novaIntercepted'),
          tx('terminal.missionProgress.signalFantome.novaLine1'),
          tx('terminal.missionProgress.signalFantome.novaLine2'),
        )
      }
    }
    messages.push(tx('terminal.missionProgress.signalFantome.bittekRep'))
    messages.push(tx('terminal.missionProgress.signalFantome.firewallGift'))
    messages.push(tx('terminal.missionProgress.signalFantome.marketUnlocked'))
    messages.push(tx('terminal.missionProgress.signalFantome.hintBroker'))
    messages.push(tx('terminal.missionProgress.signalFantome.satlinkDetected'))
    messages.push(tx('terminal.missionProgress.signalFantome.missionComplete'))
  }

  if (missionId === 'satlink_intrusion') {
    save.player.bittek += preview?.bittek ?? 180
    save.player.reputation += preview?.reputation ?? 1
    save.marketAdvancedUnlocked = true
    grantInventoryItem(save, 'proxy_fantome', 1)
    if (!save.unlocked_commands.includes('probe')) {
      save.unlocked_commands.push('probe')
    }
    messages.push(tx('terminal.missionProgress.satlinkIntrusion.bittekRep'))
    messages.push(tx('terminal.missionProgress.satlinkIntrusion.proxyGift'))
    messages.push(tx('terminal.missionProgress.satlinkIntrusion.missionComplete'))
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

  if (missionId === 'signal_fantome') {
    const riposte = checkRiposteTriggers(save, 'mission_1_complete')
    if (riposte?.autoLines?.length) messages.push('', ...riposte.autoLines)
    if (riposte?.uiEffect) save.activeUiEffect = riposte.uiEffect
  }

  const nextId = missionId === 'signal_fantome' ? 'satlink_intrusion' : null
  if (nextId && save.missions[nextId]?.status === 'locked') {
    save.missions[nextId].status = 'active'
    refreshObjective(save, nextId)
    for (const cmd of ['probe', 'status']) {
      if (!save.unlocked_commands.includes(cmd)) save.unlocked_commands.push(cmd)
    }
    messages.push(tx('terminal.missionProgress.newMission', { title: getMissionTitle(nextId) }))
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
        const label = tx(`terminal.missionProgress.objectives.${obj.id}`) || obj.label
        output.push(tx('terminal.missionProgress.objectiveComplete', { label }))
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
