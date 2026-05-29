/**
 * Onboarding narratif — choix du nom opérateur.
 */

import { sanitizePlayerName, validatePlayerName, DEFAULT_PLAYER_NAME } from '../utils/playerName'
import { loadDemoSave, saveDemoSave } from './demoStorage'
import { toPublicState } from './demoState'

export function completePlayerOnboarding(rawName) {
  const save = loadDemoSave()
  const result = validatePlayerName(rawName)
  const name = result.valid ? result.name : DEFAULT_PLAYER_NAME

  save.player = save.player || {}
  save.player.username = sanitizePlayerName(name)
  save.onboardingSeen = true

  saveDemoSave(save)

  return {
    playerName: save.player.username,
    usedFallback: result.usedFallback,
    state: toPublicState(save),
  }
}

export default { completePlayerOnboarding }
