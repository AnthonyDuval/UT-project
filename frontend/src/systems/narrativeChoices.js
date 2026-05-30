/**

 * Micro-choix narratifs — modifient l'influence cachée sans l'afficher.

 */



import { adjustInfluence, ensureCharacterInfluence, tryInfluenceUnlocks } from './CharacterInfluence'

import { discoverCodex } from '../demo/codexService'

import { tx } from '../i18n/helpers'

import { activateMissionFlags, canUnlockMission } from '../demo/missionProgress'



export function ensureNarrativeChoiceState(save) {

  save.narrativeChoicesSeen = save.narrativeChoicesSeen || {}

  if (save.narrativeChoice === undefined) save.narrativeChoice = null

}



export function tryScheduleNarrativeChoice(save, choiceId, meta = {}) {

  ensureNarrativeChoiceState(save)

  if (save.narrativeChoicesSeen[choiceId]) return false

  if (save.narrativeChoice?.open) return false

  if (save.gameOver) return false



  save.narrativeChoice = {

    open: true,

    id: choiceId,

    startedAt: Date.now(),

    meta,

  }

  return true

}



export function tryScheduleMorseIntelChoice(save) {

  const inf = ensureCharacterInfluence(save)

  if (inf.morseTrust < 42) return false

  if (!save.hintBrokerUnlocked && !save.marketUnlocked) return false

  return tryScheduleNarrativeChoice(save, 'morse_intel')

}



export function onTransmissionClosed(save, transmission) {

  if (!transmission?.characterId) return

  ensureNarrativeChoiceState(save)



  if (transmission.characterId === 'nova') {

    tryScheduleNarrativeChoice(save, 'nova_listen')

  }

  if (transmission.characterId === 'veil') {

    const m5 = save.missions?.protocole_veil

    if (m5?.status === 'active' && !save.narrativeChoicesSeen?.veil_protocol) {

      tryScheduleNarrativeChoice(save, 'veil_protocol')

    } else {

      tryScheduleNarrativeChoice(save, 'veil_cut')

    }

  }

  if (transmission.characterId === 'echo_17') {

    scheduleEchoSignalChoice(save)

  }

}



export function scheduleEchoSignalChoice(save) {

  if (save.narrativeChoicesSeen?.echo_signal) return false

  if (!save.flags?.echo17_transmission_seen) return false

  return tryScheduleNarrativeChoice(save, 'echo_signal')

}



/** @deprecated — flux remplacé par listen + echo_signal */

export function tryMission3ForbiddenSignal() {

  return false

}



function resolveEchoSignal(save, option, output) {

  save.flags = save.flags || {}

  save.flags.echo_signal_choice_done = true



  switch (option) {

    case 'save':

      adjustInfluence(save, 'novaAffinity', 10)

      adjustInfluence(save, 'absentExposure', 5)

      save.flags.echo_fragment_unlocked = true

      discoverCodex(save, 'echo_17')

      discoverCodex(save, 'satlink_lie')

      output.push(tx('influenceChoices.echo_signal.save'))

      break

    case 'cut':

      adjustInfluence(save, 'veilSuspicion', -5)

      adjustInfluence(save, 'novaAffinity', -5)

      save.flags.echo_fragment_unlocked = true

      output.push(tx('influenceChoices.echo_signal.cut'))

      break

    case 'sell':

      adjustInfluence(save, 'morseTrust', 15)

      adjustInfluence(save, 'novaAffinity', -10)

      save.player.bittek = (save.player.bittek || 0) + 120

      save.flags.echo_fragment_unlocked = true

      discoverCodex(save, 'echo_17')

      output.push(tx('influenceChoices.echo_signal.sell'))

      break

    default:

      output.push(tx('influenceChoices.echo_signal.cut'))

      break

  }

}



function resolveVeilProtocol(save, option, output) {

  save.flags = save.flags || {}

  save.flags.veil_protocol_choice_done = true

  switch (option) {

    case 'cooperate':

      adjustInfluence(save, 'veilSuspicion', -20)

      adjustInfluence(save, 'novaAffinity', -15)

      save.flags.secops_gate_unlocked = true

      if (!save.discoveredNodes.includes('secops_gate')) {

        save.discoveredNodes.push('secops_gate')

      }

      save.flags.veil_protocol_unlocked = true

      discoverCodex(save, 'veil_protocol')

      output.push(tx('influenceChoices.veil_protocol.cooperate'))

      break

    case 'ignore':

      adjustInfluence(save, 'veilSuspicion', 10)

      if (!save.discoveredNodes.includes('secops_gate')) {

        save.discoveredNodes.push('secops_gate')

      }

      output.push(tx('influenceChoices.veil_protocol.ignore'))

      break

    case 'warn_nova':

      adjustInfluence(save, 'novaAffinity', 15)

      adjustInfluence(save, 'veilSuspicion', 15)

      save.flags.secops_gate_unlocked = true

      if (!save.discoveredNodes.includes('secops_gate')) {

        save.discoveredNodes.push('secops_gate')

      }

      discoverCodex(save, 'veil_protocol')

      output.push(tx('influenceChoices.veil_protocol.warn_nova'))

      break

    default:

      output.push(tx('influenceChoices.veil_protocol.ignore'))

      break

  }

}



export function resolveNarrativeChoice(save, choiceId, option) {

  ensureNarrativeChoiceState(save)

  if (!save.narrativeChoice?.open || save.narrativeChoice.id !== choiceId) {

    return { ok: false, output: [], pendingTransmission: null }

  }



  save.narrativeChoicesSeen[choiceId] = true

  save.narrativeChoice = null



  const output = []

  const pendingTransmission = null



  switch (choiceId) {

    case 'nova_listen':

      if (option === 'listen') {

        adjustInfluence(save, 'novaAffinity', 8)

        adjustInfluence(save, 'veilSuspicion', 2)

        output.push(tx('influenceChoices.nova_listen.listen'))

      } else {

        adjustInfluence(save, 'novaAffinity', -7)

        adjustInfluence(save, 'veilSuspicion', 4)

        output.push(tx('influenceChoices.nova_listen.ignore'))

      }

      break

    case 'veil_cut':

      if (option === 'cut') {

        adjustInfluence(save, 'novaAffinity', 5)

        adjustInfluence(save, 'veilSuspicion', 7)

        output.push(tx('influenceChoices.veil_cut.cut'))

      } else {

        adjustInfluence(save, 'veilSuspicion', -5)

        output.push(tx('influenceChoices.veil_cut.stay'))

      }

      break

    case 'morse_intel':

      if (option === 'buy') {

        adjustInfluence(save, 'morseTrust', 9)

        if ((save.player?.bittek ?? 0) >= 35) {

          save.player.bittek -= 35

        }

        output.push(tx('influenceChoices.morse_intel.buy'))

      } else {

        adjustInfluence(save, 'morseTrust', -4)

        output.push(tx('influenceChoices.morse_intel.decline'))

      }

      break

    case 'ut_ignore':

      if (option === 'ignore') {

        adjustInfluence(save, 'novaAffinity', 5)

        adjustInfluence(save, 'veilSuspicion', 6)

        output.push(tx('influenceChoices.ut_ignore.ignore'))

      } else {

        adjustInfluence(save, 'veilSuspicion', -4)

        output.push(tx('influenceChoices.ut_ignore.obey'))

      }

      break

    case 'echo_signal':

      resolveEchoSignal(save, option, output)

      break

    case 'veil_protocol':

      resolveVeilProtocol(save, option, output)

      break

    default:

      return { ok: false, output: [], pendingTransmission: null }

  }



  output.push(...tryInfluenceUnlocks(save))

  return { ok: true, output, pendingTransmission }

}



export function dismissNarrativeChoice(save) {

  if (!save.narrativeChoice?.open) return { dismissed: false }

  const id = save.narrativeChoice.id

  save.narrativeChoicesSeen[id] = true

  save.narrativeChoice = null

  return { dismissed: true, id }

}



export function tryStartMission5VeilTransmission(save) {

  const m5 = save.missions?.protocole_veil

  if (!m5 || m5.status !== 'active') return null

  if (save.flags?.veil_m5_transmission_fired) return null
  if (save.activeCharacterTransmission || save.activeCinematic) return null

  save.flags = save.flags || {}
  save.flags.veil_m5_transmission_fired = true
  return {
    characterId: 'veil',
    messageKey: 'transmissions.veil.messages.0',
  }
}


