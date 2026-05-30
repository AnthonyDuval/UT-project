import { tx } from '../i18n/helpers'
import { activateSafeWindow } from './traceRecovery'

const ANIM_MIN_MS = 5000
const ANIM_MAX_MS = 7000

export function tryTriggerTraceTriangulation50(save) {
  if (!save || save.traceLevel < 50 || save.triangulation50Seen) return false

  save.triangulation50Seen = true
  const now = Date.now()
  const animDuration = ANIM_MIN_MS + Math.floor(Math.random() * (ANIM_MAX_MS - ANIM_MIN_MS + 1))
  save.traceTriangulation50 = {
    open: true,
    startedAt: now,
    lockUntil: now + animDuration,
    animDurationMs: animDuration,
  }
  save.events_log = save.events_log || []
  save.events_log.push(tx('traceTriangulation50.eventLog'))
  return true
}

export function dismissTraceTriangulation50(save) {
  if (!save?.traceTriangulation50) return { dismissed: false, safeLine: null }
  save.traceTriangulation50.open = false
  const safeLine = activateSafeWindow(save, 'trace_triangulation_50')
  return { dismissed: true, safeLine }
}

export function isTraceTriangulation50Open(save) {
  return !!(save?.traceTriangulation50?.open)
}
