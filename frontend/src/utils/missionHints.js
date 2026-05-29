/**
 * Objectifs et indices — langage simple, sans jargon technique.
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
  const unlocked = state.unlocked_commands || []
  const m1 = state.missions?.signal_fantome

  if (m1?.status === 'active') {
    if (!read.includes('note.txt')) {
      return {
        title: 'Première piste',
        hint: 'Tapez help pour voir ce que vous pouvez faire.',
      }
    }
    if (!read.includes('system.log')) {
      return {
        title: 'Message reçu',
        hint: 'Tapez files pour voir les documents, puis ouvrez le journal système.',
      }
    }
    if (!unlocked.includes('scan')) {
      return {
        title: 'Anomalie détectée',
        hint: 'Le journal système mentionne une action — relisez-le si besoin.',
      }
    }
    if (!flags.scan_completed) {
      return {
        title: 'Signal fantôme',
        hint: 'Quelque chose répond sur le réseau. Essayez : scan',
      }
    }
    if (!read.includes('ghost_relay.log')) {
      return {
        title: 'Connexion trouvée',
        hint: 'Un nouveau document est apparu — tapez files puis ouvrez-le.',
      }
    }
    if (!unlocked.includes('connect')) {
      return {
        title: 'Relais identifié',
        hint: 'Le document contient la prochaine étape.',
      }
    }
    if (!flags.mission_1_complete) {
      return {
        title: 'Établir le contact',
        hint: 'Connectez-vous au relais : connect relay_ghost',
      }
    }
  }

  const journal = state.missionJournal
  const current = journal?.currentMission

  if (!current) {
    return {
      title: 'Infiltration en cours',
      hint: 'Explorez le réseau. UltraTech vous observe.',
    }
  }

  return {
    title: current.title,
    hint: current.currentObjective || 'Continuez l\'investigation.',
  }
}

export function getThreatLevel(traceLevel = 0) {
  if (traceLevel >= 85) return { label: 'CRITIQUE', className: 'critical' }
  if (traceLevel >= 60) return { label: 'ÉLEVÉE', className: 'high' }
  if (traceLevel >= 30) return { label: 'MODÉRÉE', className: 'moderate' }
  return { label: 'FAIBLE', className: 'low' }
}
