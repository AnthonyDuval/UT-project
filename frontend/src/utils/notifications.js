/**
 * Anti-spam global — une notification par clé, jamais en boucle.
 */

const seenKeys = new Set()

export function notificationKey(type, id) {
  return `${type}:${id}`
}

export function shouldShowNotification(key) {
  if (!key || seenKeys.has(key)) return false
  seenKeys.add(key)
  return true
}

export function seedNotifications(keys) {
  for (const key of keys) {
    if (key) seenKeys.add(key)
  }
}

export function resetNotificationCache() {
  seenKeys.clear()
}
