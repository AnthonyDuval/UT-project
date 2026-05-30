import { getLocale, getTranslator } from '../i18n'
import { getNextLead, getNextLeadStageId, buildStateForLead, getNextLeadTerminalHint } from './nextLead'

export { getNextLeadStageId, getNextLead, getNextLeadTerminalHint, buildStateForLead }

/** @deprecated Alias — même clé que getNextLeadStageId */
export function getMissionObjectiveKey(state) {
  const stageId = getNextLeadStageId(state)
  if (stageId === 'infiltration') {
    const journal = state?.missionJournal
    const current = journal?.currentMission
    if (current) return { type: 'journal', mission: current }
  }
  return `objectives.${stageId.replace(/^m1_/, 'm1.').replace(/^m2_/, 'm2.').replace(/_/g, '_')}`
}

export function getMissionObjective(state, locale) {
  const lead = getNextLead(state, locale)
  return {
    title: lead.title,
    hint: lead.lead,
    lead: lead.lead,
    step: lead.step,
    total: lead.total,
    stageId: lead.stageId,
  }
}

export function getThreatLevel(traceLevel = 0, locale) {
  const translate = getTranslator(locale ?? getLocale())
  if (traceLevel >= 85) return { label: translate('threat.critical'), className: 'critical' }
  if (traceLevel >= 60) return { label: translate('threat.high'), className: 'high' }
  if (traceLevel >= 30) return { label: translate('threat.moderate'), className: 'moderate' }
  return { label: translate('threat.low'), className: 'low' }
}

/** Indice terminal RP — après commandes inconnues ou blocage. */
export function getTerminalGuidanceHint(state, locale, level = 'firm') {
  return getNextLeadTerminalHint(state, locale ?? getLocale(), level)
}

/** Sync mission objective text from investigation state. */
export function syncMissionObjectiveText(save) {
  const lead = getNextLead(buildStateForLead(save))

  const m1 = save.missions?.signal_fantome
  const m2 = save.missions?.satlink_intrusion
  const m3 = save.missions?.transmission_interdite
  const m4 = save.missions?.relais_miroir
  const m5 = save.missions?.protocole_veil
  if (m1?.status === 'active' && !save.flags?.mission_1_complete) {
    m1.currentObjective = lead.lead
  } else if (m2?.status === 'active') {
    m2.currentObjective = lead.lead
  } else if (m3?.status === 'active') {
    m3.currentObjective = lead.lead
  } else if (m4?.status === 'active') {
    m4.currentObjective = lead.lead
  } else if (m5?.status === 'active') {
    m5.currentObjective = lead.lead
  }
}
