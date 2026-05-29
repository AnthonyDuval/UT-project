/**
 * Objectifs pas-à-pas — langage simple, action toujours claire.
 */
export function getMissionObjective(state) {
  if (!state) {
    return {
      title: 'Connexion…',
      hint: 'Établissement du lien sécurisé.',
      step: 0,
    }
  }

  const read = state.read_files || []
  const flags = state.flags || {}
  const t = state.tutorialFlags || {}
  const m1 = state.missions?.signal_fantome

  if (m1?.status === 'active' && !flags.mission_1_complete) {
    if (!t.help) {
      return { title: 'Étape 1 — Découvrir', hint: 'Tapez help', step: 1 }
    }
    if (!t.files) {
      return { title: 'Étape 2 — Documents', hint: 'Tapez files', step: 2 }
    }
    if (!read.includes('note.txt')) {
      return { title: 'Étape 3 — Message', hint: 'Tapez open note.txt', step: 3 }
    }
    if (!read.includes('system.log')) {
      return {
        title: 'Étape 4 — Journal',
        hint: 'Tapez files puis open system.log',
        step: 4,
      }
    }
    if (!flags.scan_completed) {
      return { title: 'Étape 5 — Analyse', hint: 'Tapez scan', step: 5 }
    }
    if (!read.includes('ghost_relay.log')) {
      return {
        title: 'Étape 6 — Piste',
        hint: 'Tapez files puis open ghost_relay.log',
        step: 6,
      }
    }
    if (!flags.mission_1_complete) {
      return {
        title: 'Étape 7 — Contact',
        hint: 'Tapez connect relay_ghost',
        step: 7,
      }
    }
  }

  const journal = state.missionJournal
  const current = journal?.currentMission

  if (!current) {
    return {
      title: 'Infiltration en cours',
      hint: 'Explorez le réseau. Restez discret.',
      step: 0,
    }
  }

  return {
    title: current.title,
    hint: current.currentObjective || 'Continuez l\'investigation.',
    step: 0,
  }
}

export function getThreatLevel(traceLevel = 0) {
  if (traceLevel >= 85) return { label: 'CRITIQUE', className: 'critical' }
  if (traceLevel >= 60) return { label: 'ÉLEVÉE', className: 'high' }
  if (traceLevel >= 30) return { label: 'MODÉRÉE', className: 'moderate' }
  return { label: 'FAIBLE', className: 'low' }
}
