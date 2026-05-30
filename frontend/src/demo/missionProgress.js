/**

 * Progression des missions — Acte 1 + Acte 2.

 */



import { MISSION_DEFS } from './demoState'

import { syncMissionObjectiveText } from '../utils/missionHints'

import { checkRiposteTriggers } from '../systems/UltraTechPresence'

import { tryOfferMissionCleanup } from '../systems/missionCleanupReward'

import { ensureCharacterInfluence } from '../systems/CharacterInfluence'

import { tx, txRaw } from '../i18n/helpers'

import { getTranslator, getLocale } from '../i18n'



const ACT2_MISSIONS = [

  'signal_fantome',

  'satlink_intrusion',

  'transmission_interdite',

  'relais_miroir',

  'protocole_veil',

]



const MISSION_CHAIN = {

  signal_fantome: 'satlink_intrusion',

  satlink_intrusion: 'transmission_interdite',

  transmission_interdite: 'relais_miroir',

  relais_miroir: 'protocole_veil',

}



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

    read_orbital_manifest: read.has('orbital_manifest.log'),

    discover_listen: !!(flags.listen_discovered || flags.listen_unlocked),

    use_listen: !!flags.listen_used_satlink,

    receive_echo17: !!flags.echo17_transmission_seen,

    choose_signal: !!flags.echo_signal_choice_done,

    unlock_echo_fragment: read.has('echo_fragment.log') || !!flags.echo_fragment_unlocked,

    discover_mirror: discovered.has('mirror_relay'),

    connect_mirror: hacked.has('mirror_relay'),

    read_mirror_index: read.has('mirror_index.dat'),

    discover_echo_cmd: !!(flags.echo_discovered || flags.echo_unlocked),

    echo_operator: !!flags.echo_operator_used,

    impossible_response: !!flags.echo_operator_used,

    receive_veil: !!flags.veil_m5_transmission_fired,

    read_secops_notice: read.has('secops_notice.log'),

    veil_choice: !!flags.veil_protocol_choice_done,

    unlock_secops_gate: discovered.has('secops_gate'),

    probe_secops_gate: !!flags.secops_gate_probed,

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



  if (missionId === 'transmission_interdite') {

    save.player.bittek += preview?.bittek ?? 250

    save.player.reputation += preview?.reputation ?? 2

    save.flags.listen_unlocked = true

    save.flags.listen_discovered = true

    messages.push(tx('terminal.missionProgress.transmissionInterdite.bittekRep'))

    messages.push(tx('terminal.missionProgress.transmissionInterdite.listenUnlocked'))

    messages.push(tx('terminal.missionProgress.transmissionInterdite.missionComplete'))

  }



  if (missionId === 'relais_miroir') {

    save.player.bittek += preview?.bittek ?? 300

    save.player.reputation += preview?.reputation ?? 2

    save.flags.echo_unlocked = true

    save.flags.echo_discovered = true

    save.flags.echo_operator_done = true

    messages.push(tx('terminal.missionProgress.relaisMiroir.bittekRep'))

    messages.push(tx('terminal.missionProgress.relaisMiroir.echoUnlocked'))

    messages.push(tx('terminal.missionProgress.relaisMiroir.missionComplete'))

  }



  if (missionId === 'protocole_veil') {

    save.player.bittek += preview?.bittek ?? 350

    save.player.reputation += preview?.reputation ?? 2

    save.influenceUnlocks = save.influenceUnlocks || {}

    save.influenceUnlocks.morse_rare_catalog = true

    messages.push(tx('terminal.missionProgress.protocoleVeil.bittekRep'))

    messages.push(tx('terminal.missionProgress.protocoleVeil.scrubberHint'))

    messages.push(tx('terminal.missionProgress.protocoleVeil.missionComplete'))

    messages.push('', tx('terminal.missionProgress.protocoleVeil.act2Closing'))

  }



  return { messages, narrativeLines }

}



function activateMissionFlags(save, missionId) {

  save.flags = save.flags || {}

  if (missionId === 'transmission_interdite') {

    save.flags.mission3_active = true

  }

  if (missionId === 'relais_miroir') {

    save.flags.mission4_active = true

    if (!save.discoveredNodes.includes('mirror_relay')) {

      save.discoveredNodes.push('mirror_relay')

    }

  }

  if (missionId === 'protocole_veil') {

    save.flags.mission5_active = true

    save.flags.veil_intro_seen = true

    save._pendingVeilMissionTransmission = true

  }

}



export function canUnlockMission(save, missionId) {
  const inf = ensureCharacterInfluence(save)
  if (missionId === 'relais_miroir') {
    const m3 = save.missions?.transmission_interdite
    if (m3?.status === 'completed') return true
    return inf.absentExposure >= 52
  }
  if (missionId === 'protocole_veil') {
    const m4 = save.missions?.relais_miroir
    if (m4?.status === 'completed') return true
    return inf.veilSuspicion >= 72
  }
  return true
}

function tryEarlyMissionUnlock(save) {
  const m4 = save.missions?.relais_miroir
  if (m4?.status === 'locked' && canUnlockMission(save, 'relais_miroir')) {
    m4.status = 'active'
    activateMissionFlags(save, 'relais_miroir')
  }
  const m5 = save.missions?.protocole_veil
  if (m5?.status === 'locked' && canUnlockMission(save, 'protocole_veil')) {
    m5.status = 'active'
    activateMissionFlags(save, 'protocole_veil')
  }
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



  tryOfferMissionCleanup(save, missionId)



  const nextId = MISSION_CHAIN[missionId]

  if (nextId && save.missions[nextId]?.status === 'locked' && canUnlockMission(save, nextId)) {

    save.missions[nextId].status = 'active'

    activateMissionFlags(save, nextId)

    refreshObjective(save)

    messages.push(tx('terminal.missionProgress.newMission', { title: getMissionTitle(nextId) }))

  }



  return { messages, narrativeLines }

}



/** Met à jour les objectifs après une action. */

export function updateMissionProgress(save) {
  const output = []
  const narrative = []

  tryEarlyMissionUnlock(save)

  for (const missionId of ACT2_MISSIONS) {
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



    refreshObjective(save)



    const allDone = def.objectiveDefs.every((o) => completed.includes(o.id))

    if (allDone && m.status === 'active') {

      const result = completeMission(save, missionId)

      output.push(...result.messages)

      narrative.push(...result.narrativeLines)

    }

  }



  return { output, narrative }

}



export { ACT2_MISSIONS, MISSION_CHAIN, activateMissionFlags }


