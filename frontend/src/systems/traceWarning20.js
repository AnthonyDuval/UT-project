import { tx } from '../i18n/helpers'
import { activateSafeWindow } from './traceRecovery'

const LOCK_MIN_MS = 3000
const LOCK_MAX_MS = 5000

export function tryTriggerTraceWarning20(save) {
  if (!save || save.traceLevel < 20 || save.warningTrace20Seen) return false

  save.warningTrace20Seen = true
  const now = Date.now()
  const lockDuration = LOCK_MIN_MS + Math.floor(Math.random() * (LOCK_MAX_MS - LOCK_MIN_MS + 1))
  save.traceWarning20 = {
    open: true,
    startedAt: now,
    lockUntil: now + lockDuration,
  }
  save.events_log = save.events_log || []
  save.events_log.push(tx('traceWarning20.eventLog'))
  return true
}

export function dismissTraceWarning20(save) {
  if (!save?.traceWarning20) return { dismissed: false, safeLine: null }
  save.traceWarning20.open = false
  const safeLine = activateSafeWindow(save, 'trace_warning_20')
  return { dismissed: true, safeLine }
}

export function isTraceWarning20Open(save) {
  return !!(save?.traceWarning20?.open)
}
