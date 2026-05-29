import { getLocale, getTranslator } from '../i18n'

/** Détecte l'étape narrative courante (même logique que la progression Acte 1). */
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

  if (m2?.status === 'active') {
    if (!hacked.includes('satlink_03')) {
      return novaRevealed ? 'm2_orbital_channel_nova' : 'm2_orbital_channel'
    }
    if (connected !== 'satlink_03' && hacked.includes('satlink_03')) {
      return 'm2_orbital_segment'
    }
    if (!flags.probe_used_satlink) return 'm2_erased_cartographer'
    if (!read.includes('satlink_manifest.dat')) return 'm2_orbital_manifest'
    const discovered = state.network?.discoveredNodes || state.discoveredNodes || []
    if (!discovered.includes('morgue_server') || !discovered.includes('blackvault')) {
      return 'm2_forbidden_segments'
    }
    if (!read.includes('nova_orbital_fragment.dat')) {
      return novaRevealed ? 'm2_orbital_fragment_nova' : 'm2_orbital_fragment'
    }
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
