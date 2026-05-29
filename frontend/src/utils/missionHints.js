/**
 * Indices immersifs dérivés du journal de missions synchronisé.
 */
export function getMissionObjective(state) {
  if (!state) {
    return {
      title: 'Initialisation',
      hint: 'Connexion au noyau UltraTech en cours…',
    }
  }

  const journal = state.missionJournal
  const current = journal?.currentMission

  if (!current) {
    const completed = journal?.completedMissions?.length ?? 0
    if (completed > 0) {
      return {
        title: 'Infiltration — Réseau clandestin',
        hint: 'Missions disponibles terminées. Explorez les nœuds profonds — UltraTech renforce la surveillance.',
      }
    }
    return {
      title: 'En attente',
      hint: 'Aucune mission active. Tapez sync si l\'état semble incohérent.',
    }
  }

  const pending = current.objectives?.filter((o) => !o.done) ?? []
  const danger = state.network?.traceMultiplier > 1.5
    ? ' — danger élevé sur ce segment.'
    : ''

  return {
    title: `${current.subtitle || 'Mission'} — ${current.title}`,
    hint: `${current.currentObjective || pending[0]?.label || 'Continuez l\'infiltration.'}${danger}`,
  }
}

export function getThreatLevel(traceLevel = 0) {
  if (traceLevel >= 85) return { label: 'CRITIQUE', className: 'critical' }
  if (traceLevel >= 60) return { label: 'ÉLEVÉE', className: 'high' }
  if (traceLevel >= 30) return { label: 'MODÉRÉE', className: 'moderate' }
  return { label: 'FAIBLE', className: 'low' }
}
