/**
 * Acte 2 — commandes listen / echo (découverte via fichiers).
 */

import { discoverCodex } from './codexService'
import { tx, txRaw } from '../i18n/helpers'
import { getPlayerDisplayName } from '../utils/playerName'
import { tryScheduleNarrativeChoice } from '../systems/narrativeChoices'
import { fireCharacterTransmission } from '../systems/CharacterTransmissionSystem'
import { adjustInfluence } from '../systems/CharacterInfluence'

export function isListenDiscovered(save) {
  return !!(save.flags?.listen_discovered || save.flags?.listen_unlocked)
}

export function isEchoDiscovered(save) {
  return !!(save.flags?.echo_discovered || save.flags?.echo_unlocked)
}

export function cmdListen(save, args) {
  if (!isListenDiscovered(save)) {
    return { output: [tx('terminal.listen.locked')], addTrace: 1 }
  }

  const target = args[0]?.toLowerCase()
  if (!target) {
    return { output: [tx('terminal.listen.usage')], addTrace: 0 }
  }

  if (target !== 'satlink_03') {
    return { output: [tx('terminal.listen.noSignal', { target })], addTrace: 2 }
  }

  save.flags = save.flags || {}
  save.flags.listen_used_satlink = true

  const lines = [...(txRaw('terminal.listen.tuning') || [])]
  let pendingTransmission = null

  if (!save.flags.echo17_transmission_seen) {
    save.flags.echo17_transmission_seen = true
    lines.push('', ...(txRaw('terminal.listen.intercept') || []))
    discoverCodex(save, 'echo_17')

    if (!save.activeCharacterTransmission && !save.activeCinematic) {
      fireCharacterTransmission(save, 'echo_17', 'mission', {
        bypassCooldown: true,
        forceMessageKey: 'transmissions.echo17.messages.0',
      })
    } else {
      pendingTransmission = {
        characterId: 'echo_17',
        messageKey: 'transmissions.echo17.messages.0',
      }
    }
  } else {
    lines.push('', tx('terminal.listen.silent'))
  }

  return { output: lines, addTrace: 6, pendingTransmission }
}

export function cmdEchoAct2(save, args) {
  if (!isEchoDiscovered(save)) {
    return { output: [tx('terminal.echoAct2.locked')], addTrace: 1 }
  }

  const term = (args.join(' ') || '').toLowerCase().trim()
  if (!term) {
    return { output: txRaw('terminal.hidden.echo.empty') || [], addTrace: 1 }
  }

  if (term === 'operator' || term.includes('operator')) {
    save.flags = save.flags || {}
    save.flags.echo_operator_used = true
    save.flags.echo_operator_done = true
    discoverCodex(save, 'mirror_relay')

    const name = getPlayerDisplayName(save)
    const lines = [
      ...(txRaw('terminal.echoAct2.operator') || []),
      '',
      tx('terminal.echoAct2.impossible', { name }),
    ]

    let pendingTransmission = null
    if (!save.flags.absent_mirror_seen && save.currentNode === 'mirror_relay') {
      save.flags.absent_mirror_seen = true
      bumpAbsentAfterEcho(save)
      if (!save.activeCharacterTransmission && !save.activeCinematic) {
        fireCharacterTransmission(save, 'absent', 'ghost_node', {
          bypassCooldown: true,
          forceMessageKey: 'transmissions.absent.messages.1',
        })
      } else {
        pendingTransmission = {
          characterId: 'absent',
          messageKey: 'transmissions.absent.messages.1',
        }
      }
      discoverCodex(save, 'the_absent')
    }

    return { output: lines, addTrace: 4, uiEffect: { type: 'glitch', duration: 2400 }, pendingTransmission }
  }

  const corrupted = term
    .split('')
    .map((c, i) => (i % 4 === 0 && c !== ' ' ? '█' : c))
    .join('')

  return {
    output: [tx('terminal.hidden.echo.prefix', { text: corrupted }), '', tx('terminal.hidden.echo.recorded')],
    addTrace: 2,
  }
}

function bumpAbsentAfterEcho(save) {
  adjustInfluence(save, 'absentExposure', 8)
}

export function scheduleEchoSignalChoice(save) {
  if (save.narrativeChoicesSeen?.echo_signal) return false
  if (!save.flags?.echo17_transmission_seen) return false
  return tryScheduleNarrativeChoice(save, 'echo_signal')
}
