import { getLocale, getTranslator } from '../i18n'

/** Détecte l'étape narrative courante (Acte 1 + Acte 2). */
export function getNextLeadStageId(state) {
  if (!state) return 'connection'

  const read = state.read_files || []
  const flags = state.flags || {}
  const t = state.tutorialFlags || {}
  const novaRevealed = !!state.novaIntroSeen
  const m1 = state.missions?.signal_fantome

  if (m1?.status === 'active' && !flags.mission_1_complete) {
    if (!t.help) return 'm1_signal_incoming'
    if (!t.files && !read.length) return 'm1_local_memory'
    if (!read.includes('note.txt')) return 'm1_unsigned_note'
    if (!read.includes('system.log')) return 'm1_relay_anomaly'
    if (!flags.scan_completed) return 'm1_ghost_operator'
    if (!read.includes('ghost_relay.log')) return 'm1_network_response'
    if (!flags.mission_1_complete) return 'm1_active_relay'
  }

  const m2 = state.missions?.satlink_intrusion
  const hacked = state.network?.hackedNodes || state.hackedNodes || []
  const connected = state.network?.currentNode ?? state.currentNode
  const discovered = state.network?.discoveredNodes || state.discoveredNodes || []

  if (m2?.status === 'active') {
    if (!hacked.includes('satlink_03')) {
      return novaRevealed ? 'm2_orbital_channel_nova' : 'm2_orbital_channel'
    }
    if (connected !== 'satlink_03' && hacked.includes('satlink_03')) {
      return 'm2_orbital_segment'
    }
    if (!flags.probe_used_satlink) return 'm2_erased_cartographer'
    if (!read.includes('satlink_manifest.dat')) return 'm2_orbital_manifest'
    if (!discovered.includes('morgue_server') || !discovered.includes('blackvault')) {
      return 'm2_forbidden_segments'
    }
    if (!read.includes('nova_orbital_fragment.dat')) {
      return novaRevealed ? 'm2_orbital_fragment_nova' : 'm2_orbital_fragment'
    }
  }

  const m3 = state.missions?.transmission_interdite
  if (m3?.status === 'active') {
    if (!read.includes('orbital_manifest.log')) return 'm3_orbital_manifest'
    if (!flags.listen_discovered && !flags.listen_unlocked) return 'm3_discover_listen'
    if (!flags.listen_used_satlink) return 'm3_listen_satlink'
    if (!flags.echo17_transmission_seen) return 'm3_echo17'
    if (!flags.echo_signal_choice_done) return 'm3_signal_choice'
    if (!read.includes('echo_fragment.log') && !flags.echo_fragment_unlocked) return 'm3_echo_fragment'
  }

  const m4 = state.missions?.relais_miroir
  if (m4?.status === 'active') {
    if (!discovered.includes('mirror_relay')) return 'm4_discover_mirror'
    if (!hacked.includes('mirror_relay')) return 'm4_connect_mirror'
    if (!read.includes('mirror_index.dat')) return 'm4_mirror_index'
    if (!flags.echo_discovered && !flags.echo_unlocked) return 'm4_discover_echo'
    if (!flags.echo_operator_used) return 'm4_echo_operator'
  }

  const m5 = state.missions?.protocole_veil
  if (m5?.status === 'active') {
    if (!flags.veil_m5_transmission_fired) return 'm5_veil_transmission'
    if (!read.includes('secops_notice.log')) return 'm5_secops_notice'
    if (!flags.veil_protocol_choice_done) return 'm5_veil_choice'
    if (!discovered.includes('secops_gate')) return 'm5_secops_gate'
    if (!flags.secops_gate_probed) return 'm5_probe_secops'
  }

  return 'infiltration'
}

function resolveLead(stageId, translate) {
  const base = translate.raw(`nextLead.${stageId}`)
  if (!base || typeof base !== 'object') {
    return {
      stageId,
      title: translate('nextLead.fallback.title'),
      lead: translate('nextLead.fallback.lead'),
      step: null,
      total: null,
    }
  }

  return {
    stageId,
    title: base.title || translate('nextLead.fallback.title'),
    lead: base.lead || translate('nextLead.fallback.lead'),
    step: base.step ?? null,
    total: base.total ?? null,
  }
}

/** Piste narrative active — courte, RP, jamais scolaire. */
export function getNextLead(state, locale) {
  const translate = getTranslator(locale ?? getLocale())
  const stageId = getNextLeadStageId(state)
  return resolveLead(stageId, translate)
}

/** Ligne terminal après blocage ou erreurs répétées. */
export function getNextLeadTerminalHint(state, locale, level = 'firm') {
  const translate = getTranslator(locale ?? getLocale())
  const stageId = getNextLeadStageId(state)
  const firm = translate(`nextLead.${stageId}.terminal`)
  if (level === 'firm' && firm && firm !== `nextLead.${stageId}.terminal`) return firm

  const soft = translate(`nextLead.${stageId}.stuckSoft`)
  if (soft && soft !== `nextLead.${stageId}.stuckSoft`) return soft

  return translate('guidance.stuck.generic')
}

export function buildStateForLead(save) {
  return {
    read_files: save.read_files,
    flags: save.flags,
    tutorialFlags: save.tutorialFlags,
    novaIntroSeen: save.novaIntroSeen,
    missions: save.missions,
    hackedNodes: save.hackedNodes,
    discoveredNodes: save.discoveredNodes,
    currentNode: save.currentNode,
    network: {
      hackedNodes: save.hackedNodes,
      discoveredNodes: save.discoveredNodes,
      currentNode: save.currentNode,
    },
  }
}
