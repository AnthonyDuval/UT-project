import { getMissionObjective } from '../utils/missionHints'

export function localizeMission(mission, t, gameState) {
  if (!mission) return null
  const id = mission.id
  const prefix = `missions.${id}`

  const objectives = (mission.objectives || []).map((obj) => ({
    ...obj,
    label: t(`${prefix}.objectives.${obj.id}`) || obj.label,
  }))

  let currentObjective = mission.currentObjective
  if (gameState && mission.status === 'active') {
    const live = getMissionObjective(gameState, t.locale)
    currentObjective = live.hint
  }

  const rewardsPreview = mission.rewardsPreview
    ? {
        ...mission.rewardsPreview,
        summary: t(`${prefix}.rewardsSummary`) || mission.rewardsPreview.summary,
      }
    : mission.rewardsPreview

  return {
    ...mission,
    title: t(`${prefix}.title`) || mission.title,
    subtitle: t(`${prefix}.subtitle`) || mission.subtitle,
    description: t(`${prefix}.description`) || mission.description,
    atmosphere: t(`${prefix}.atmosphere`) || mission.atmosphere,
    objectives,
    currentObjective,
    rewardsPreview,
  }
}

export function localizeJournal(journal, t, gameState) {
  if (!journal) return null
  const missions = (journal.missions || []).map((m) => localizeMission(m, t, gameState))
  const currentMission = journal.currentMissionId
    ? missions.find((m) => m.id === journal.currentMissionId) ?? null
    : null

  return {
    ...journal,
    missions,
    currentMission,
  }
}

export function localizeMarketItem(item, t, novaRevealed = true) {
  if (!item) return item
  const meta = t.raw(`market.items.${item.id}`)
  if (!meta) return item

  let name = meta.name || item.name
  if (item.id === 'brouilleur_nova' && !novaRevealed && meta.nameHidden) {
    name = meta.nameHidden
  }

  return {
    ...item,
    name,
    description: meta.description || item.description,
    effect: meta.effect || item.effect,
  }
}

export function localizeHintEntry(entry, t, novaRevealed) {
  if (!entry) return entry
  const meta = t.raw(`hints.${entry.id}`)
  if (!meta) return entry

  let text = meta.text || entry.text
  if (!novaRevealed) {
    const contactWord = t.locale === 'fr' ? 'le contact' : 'the contact'
    text = text
      .replace(/N0VA/gi, contactWord)
      .replace(/NOVA/gi, contactWord)
  }

  return {
    ...entry,
    title: meta.title || entry.title,
    teaser: meta.teaser || entry.teaser,
    text,
    typeLabel: t(`hintBroker.types.${entry.type}`) || entry.typeLabel,
  }
}

export function parseRewardModules(rewardsPreview, t) {
  if (!rewardsPreview) return []

  const modules = [
    { type: 'bittek', label: `+${rewardsPreview.bittek} BitTek` },
    { type: 'reputation', label: `+${rewardsPreview.reputation} ${t('missionJournal.reputation')}` },
  ]

  if (rewardsPreview.summary) {
    rewardsPreview.summary
      .split('·')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((part) => modules.push({ type: 'unlock', label: part }))
  }

  return modules
}

export function getCommandLabel(cmd, t) {
  return t(`commands.${cmd}`) || cmd
}
