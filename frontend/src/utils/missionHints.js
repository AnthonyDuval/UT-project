/**
 * Objectifs d'enquête — indices narratifs, jamais de tutoriel technique.
 */
export function getMissionObjective(state) {
  if (!state) {
    return {
      title: 'Connexion…',
      hint: 'Établissement du lien sécurisé.',
    }
  }

  const read = state.read_files || []
  const flags = state.flags || {}
  const t = state.tutorialFlags || {}
  const m1 = state.missions?.signal_fantome

  if (m1?.status === 'active' && !flags.mission_1_complete) {
    if (!t.help) {
      return {
        title: 'Signal entrant',
        hint: 'Quelqu\'un vous a ouvert une porte. Le terminal semble attendre quelque chose.',
      }
    }
    if (!t.files && !read.length) {
      return {
        title: 'Mémoire locale',
        hint: 'Des fragments dorment quelque part sur ce terminal.',
      }
    }
    if (!read.includes('note.txt')) {
      return {
        title: 'Message non signé',
        hint: 'Un document porte une note laissée par un inconnu.',
      }
    }
    if (!read.includes('system.log')) {
      return {
        title: 'Anomalie RELAY_GHOST',
        hint: 'Le journal système enregistre quelque chose qu\'UltraTech préfère taire.',
      }
    }
    if (!flags.scan_completed) {
      return {
        title: 'Opérateur fantôme',
        hint: 'Le dernier opérateur ayant utilisé SCAN sur ce relais a disparu.',
      }
    }
    if (!read.includes('ghost_relay.log')) {
      return {
        title: 'Réponse du réseau',
        hint: 'L\'analyse a laissé une trace. Un nouveau fragment attend dans les documents.',
      }
    }
    if (!flags.mission_1_complete) {
      return {
        title: 'Relais actif',
        hint: 'Les anciens opérateurs traversaient les nœuds clandestins en silence.',
      }
    }
  }

  const m2 = state.missions?.satlink_intrusion
  const hacked = state.network?.hackedNodes || []
  const connected = state.network?.currentNode

  if (m2?.status === 'active') {
    if (!hacked.includes('satlink_03')) {
      return {
        title: 'Canal orbital',
        hint: 'N0VA parle d\'un relais — SATLINK_03. Quelque chose attend de l\'autre côté.',
      }
    }
    if (connected !== 'satlink_03' && hacked.includes('satlink_03')) {
      return {
        title: 'Segment orbital',
        hint: 'Le tunnel est ouvert. Le relais garde encore des secrets.',
      }
    }
    if (!flags.probe_used_satlink) {
      return {
        title: 'Cartographe effacé',
        hint: 'Dernier cartographe connu — statut : EFFACÉ. Son journal mentionne PROBE.',
      }
    }
    if (!read.includes('satlink_manifest.dat')) {
      return {
        title: 'Manifeste orbital',
        hint: 'Un fichier traîne sur le relais. UltraTech préfère qu\'on ne le lise pas.',
      }
    }
    const discovered = state.network?.discoveredNodes || []
    if (!discovered.includes('morgue_server') || !discovered.includes('blackvault')) {
      return {
        title: 'Segments interdits',
        hint: 'Deux nœuds apparaissent sur la cartographie — morgue_server, blackvault.',
      }
    }
    if (!read.includes('nova_orbital_fragment.dat')) {
      return {
        title: 'Fragment N0VA',
        hint: 'N0VA laisse des traces sur les relais qu\'elle utilise.',
      }
    }
  }

  const journal = state.missionJournal
  const current = journal?.currentMission

  if (!current) {
    return {
      title: 'Infiltration en cours',
      hint: 'Le réseau garde encore des secrets. UltraTech observe.',
    }
  }

  return {
    title: current.title,
    hint: current.currentObjective || 'Poursuivez l\'enquête.',
  }
}

export function getThreatLevel(traceLevel = 0) {
  if (traceLevel >= 85) return { label: 'CRITIQUE', className: 'critical' }
  if (traceLevel >= 60) return { label: 'ÉLEVÉE', className: 'high' }
  if (traceLevel >= 30) return { label: 'MODÉRÉE', className: 'moderate' }
  return { label: 'FAIBLE', className: 'low' }
}

/** Sync mission objective text from investigation state. */
export function syncMissionObjectiveText(save) {
  const obj = getMissionObjective({
    read_files: save.read_files,
    flags: save.flags,
    tutorialFlags: save.tutorialFlags,
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
