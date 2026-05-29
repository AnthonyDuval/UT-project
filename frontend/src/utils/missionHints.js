import { getLocale, getTranslator } from '../i18n'

/**
 * Objectifs d'enquête — indices narratifs, jamais de tutoriel technique.
 */
export function getMissionObjectiveKey(state) {
  if (!state) return 'objectives.connection'

  const read = state.read_files || []
  const flags = state.flags || {}
  const t = state.tutorialFlags || {}
  const novaRevealed = !!state.novaIntroSeen
  const m1 = state.missions?.signal_fantome

  if (m1?.status === 'active' && !flags.mission_1_complete) {
    if (!t.help) return 'objectives.m1.signal_incoming'
    if (!t.files && !read.length) return 'objectives.m1.local_memory'
    if (!read.includes('note.txt')) return 'objectives.m1.unsigned_note'
    if (!read.includes('system.log')) return 'objectives.m1.relay_anomaly'
    if (!flags.scan_completed) return 'objectives.m1.ghost_operator'
    if (!read.includes('ghost_relay.log')) return 'objectives.m1.network_response'
    if (!flags.mission_1_complete) return 'objectives.m1.active_relay'
  }

  const m2 = state.missions?.satlink_intrusion
  const hacked = state.network?.hackedNodes || []
  const connected = state.network?.currentNode

  if (m2?.status === 'active') {
    if (!hacked.includes('satlink_03')) {
      return novaRevealed ? 'objectives.m2.orbital_channel.nova' : 'objectives.m2.orbital_channel'
    }
    if (connected !== 'satlink_03' && hacked.includes('satlink_03')) {
      return 'objectives.m2.orbital_segment'
    }
    if (!flags.probe_used_satlink) return 'objectives.m2.erased_cartographer'
    if (!read.includes('satlink_manifest.dat')) return 'objectives.m2.orbital_manifest'
    const discovered = state.network?.discoveredNodes || []
    if (!discovered.includes('morgue_server') || !discovered.includes('blackvault')) {
      return 'objectives.m2.forbidden_segments'
    }
    if (!read.includes('nova_orbital_fragment.dat')) {
      return novaRevealed ? 'objectives.m2.orbital_fragment.nova' : 'objectives.m2.orbital_fragment'
    }
  }

  const journal = state.missionJournal
  const current = journal?.currentMission

  if (!current) return 'objectives.infiltration'

  return { type: 'journal', mission: current }
}

function resolveObjective(key, translate) {
  if (typeof key === 'object' && key.type === 'journal') {
    const mission = key.mission
    return {
      title: mission.title,
      hint: mission.currentObjective || translate('objectives.fallback.hint'),
    }
  }

  if (key === 'objectives.m2.orbital_channel.nova') {
    return {
      title: translate('objectives.m2.orbital_channel.title'),
      hint: translate('objectives.m2.orbital_channel.hint_nova'),
    }
  }

  if (key === 'objectives.m2.orbital_channel') {
    return {
      title: translate('objectives.m2.orbital_channel.title'),
      hint: translate('objectives.m2.orbital_channel.hint'),
    }
  }

  if (key === 'objectives.m2.orbital_fragment.nova') {
    return {
      title: translate('objectives.m2.orbital_fragment.title_nova'),
      hint: translate('objectives.m2.orbital_fragment.hint_nova'),
    }
  }

  if (key === 'objectives.m2.orbital_fragment') {
    return {
      title: translate('objectives.m2.orbital_fragment.title'),
      hint: translate('objectives.m2.orbital_fragment.hint'),
    }
  }

  return {
    title: translate(`${key}.title`),
    hint: translate(`${key}.hint`),
  }
}

export function getMissionObjective(state, locale) {
  const translate = getTranslator(locale ?? getLocale())
  const key = getMissionObjectiveKey(state)
  return resolveObjective(key, translate)
}

export function getThreatLevel(traceLevel = 0, locale) {
  const translate = getTranslator(locale ?? getLocale())
  if (traceLevel >= 85) return { label: translate('threat.critical'), className: 'critical' }
  if (traceLevel >= 60) return { label: translate('threat.high'), className: 'high' }
  if (traceLevel >= 30) return { label: translate('threat.moderate'), className: 'moderate' }
  return { label: translate('threat.low'), className: 'low' }
}

/** Indice terminal RP — après commandes inconnues répétées. */
export function getTerminalGuidanceHint(state, locale) {
  const key = getMissionObjectiveKey(state)
  if (typeof key !== 'string' || !key.startsWith('objectives.')) return null

  const translate = getTranslator(locale ?? getLocale())
  const hintPath = key.replace('objectives.', '').replace(/\./g, '_')
  const hint = translate(`guidance.terminal.${hintPath}`)
  if (!hint || hint === `guidance.terminal.${hintPath}`) return null
  return hint
}

/** Sync mission objective text from investigation state. */
export function syncMissionObjectiveText(save) {
  const obj = getMissionObjective({
    read_files: save.read_files,
    flags: save.flags,
    tutorialFlags: save.tutorialFlags,
    novaIntroSeen: save.novaIntroSeen,
    missions: save.missions,
    network: buildNetworkForHints(save),
    missionJournal: buildMissionJournalForHints(save),
  })

  const m1 = save.missions?.signal_fantome
  const m2 = save.missions?.satlink_intrusion
  if (m1?.status === 'active' && !save.flags?.mission_1_complete) {
    m1.currentObjective = obj.hint
  } else if (m2?.status === 'active') {
    m2.currentObjective = obj.hint
  }
}

function buildNetworkForHints(save) {
  return {
    hackedNodes: save.hackedNodes || [],
    currentNode: save.currentNode,
    discoveredNodes: save.discoveredNodes || [],
  }
}

function buildMissionJournalForHints(save) {
  const m1 = save.missions?.signal_fantome
  const m2 = save.missions?.satlink_intrusion
  const current = m2?.status === 'active' ? m2 : m1?.status === 'active' ? m1 : null
  return current ? { currentMission: current } : {}
}
