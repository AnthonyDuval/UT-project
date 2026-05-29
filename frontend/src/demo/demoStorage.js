/**
 * Persistance localStorage pour le mode démo.
 */

import { createInitialDemoState } from './demoState'

const DEMO_SAVE_KEY = 'ut_demo_save'

export function loadDemoSave() {
  try {
    const raw = localStorage.getItem(DEMO_SAVE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    /* reset on corruption */
  }
  const initial = createInitialDemoState()
  saveDemoSave(initial)
  return initial
}

export function saveDemoSave(save) {
  localStorage.setItem(DEMO_SAVE_KEY, JSON.stringify(save))
}

export function resetDemoSave() {
  const initial = createInitialDemoState()
  saveDemoSave(initial)
  return initial
}

export function loadDemoChat() {
  try {
    const raw = localStorage.getItem('ut_demo_chat')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return [
    { username: 'nova_shadow', timestamp: new Date(Date.now() - 3600000).toISOString(), message: 'Quelqu\'un sur SATLINK_03 ?' },
    { username: 'relay_ghost', timestamp: new Date(Date.now() - 1800000).toISOString(), message: 'UltraTech renforce la surveillance. Restez discrets.' },
    { username: 'sys', timestamp: new Date(Date.now() - 600000).toISOString(), message: '[DEMO] Canal local — messages non synchronisés.' },
  ]
}

export function saveDemoChat(messages) {
  localStorage.setItem('ut_demo_chat', JSON.stringify(messages.slice(-100)))
}
