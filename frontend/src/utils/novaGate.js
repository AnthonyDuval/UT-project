/** Entrées Codex liées à N0VA — masquées avant la première manifestation. */
export const NOVA_CODEX_IDS = new Set([
  'nova_contact_01',
  'nova_trace_warning',
])

/** Fichiers visibles uniquement après novaIntroSeen. */
export const NOVA_GATED_FILES = new Set([
  'nova_contact.dat',
  'nova_orbital_fragment.dat',
])

export function isNovaRevealed(stateOrSave) {
  return !!(stateOrSave?.novaIntroSeen)
}

export function filterCodexOrder(order, revealed) {
  if (revealed) return order
  return order.filter((id) => !NOVA_CODEX_IDS.has(id))
}

export function sanitizeMissionRewards(rewards, revealed) {
  if (!rewards || revealed) return rewards
  const summary = rewards.summary
    ?.replace(/Contact N0VA · /i, '')
    ?.replace(/ · N0VA[^·]*/gi, '')
    ?.replace(/N0VA[^·]* · /gi, '')
  return { ...rewards, summary: summary || 'BLACK MARKET · accès réseau' }
}

export function sanitizeObjectiveLabel(objective, revealed) {
  if (revealed || !objective) return objective
  if (objective.id === 'nova_fragment') {
    return { ...objective, label: 'Récupérer un fragment laissé sur le relais' }
  }
  return objective
}
