/**
 * Persistance localStorage pour le mode démo.
 */

import { createAdvancedDemoState, createFreshDemoState } from './demoState'

const DEMO_SAVE_KEY = 'ut_demo_save'
const DEMO_CHAT_KEY = 'ut_demo_chat'

export const DEMO_STORAGE_KEYS = [DEMO_SAVE_KEY, DEMO_CHAT_KEY]

export function clearAllDemoStorage() {
  for (const key of DEMO_STORAGE_KEYS) {
    localStorage.removeItem(key)
  }
}

export function loadDemoSave() {
  try {
    const raw = localStorage.getItem(DEMO_SAVE_KEY)
    if (raw) {
      const save = JSON.parse(raw)
      migrateSave(save)
      return save
    }
  } catch {
    /* reset on corruption */
  }
  const initial = createFreshDemoState()
  saveDemoSave(initial)
  return initial
}

function migrateSave(save) {
  save.flags = save.flags || {}
  save.uiIntrosSeen = save.uiIntrosSeen || {}
  if (!save.unlocked_commands.includes('files')) {
    save.unlocked_commands.push('files')
  }
  if (save.read_files?.includes('readme.txt') && !save.read_files.includes('note.txt')) {
    save.read_files.push('note.txt')
    save.flags.note_read = true
  }
}

export function saveDemoSave(save) {
  localStorage.setItem(DEMO_SAVE_KEY, JSON.stringify(save))
}

/** Reset = nouvelle partie Mission 1 (état frais). */
export function resetDemoSave() {
  clearAllDemoStorage()
  const initial = createFreshDemoState()
  saveDemoSave(initial)
  return initial
}

/** Charge la démo avancée (showcase). */
export function loadAdvancedDemoSave() {
  clearAllDemoStorage()
  const advanced = createAdvancedDemoState()
  saveDemoSave(advanced)
  return advanced
}

export function loadDemoChat() {
  try {
    const raw = localStorage.getItem(DEMO_CHAT_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return [
    { username: 'sys', timestamp: new Date(Date.now() - 600000).toISOString(), message: '[SYS] Canal clandestin — fréquence verrouillée.' },
  ]
}

export function saveDemoChat(messages) {
  localStorage.setItem(DEMO_CHAT_KEY, JSON.stringify(messages.slice(-100)))
}

export function resetDemoChat() {
  localStorage.removeItem(DEMO_CHAT_KEY)
}
