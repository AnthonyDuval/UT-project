/**
 * CharacterTransmissionSystem — présences réseau rares, une à la fois.
 */

export const CHARACTER_IDS = {
  ECHO_17: 'echo_17',
  VEIL: 'veil',
  MORSE: 'morse',
  ABSENT: 'absent',
  NOVA: 'nova',
}

export const TRANSMISSION_GLOBAL_COOLDOWN_MS = 180000
export const ROLL_INTERVAL_MIN_MS = 75000
export const ROLL_INTERVAL_MAX_MS = 150000
export const BASE_ROLL_CHANCE = 0.11
export const DURATION_MIN_MS = 5000
export const DURATION_MAX_MS = 15000

const CHARACTERS = {
  [CHARACTER_IDS.ECHO_17]: {
    id: CHARACTER_IDS.ECHO_17,
    video: '/assets/videos/characters/echo17_warning.mp4',
    displayNameKey: 'transmissions.echo17.name',
    tagKey: 'transmissions.echo17.tag',
    messageKeys: [
      'transmissions.echo17.messages.0',
      'transmissions.echo17.messages.1',
      'transmissions.echo17.messages.2',
    ],
  },
  [CHARACTER_IDS.VEIL]: {
    id: CHARACTER_IDS.VEIL,
    video: '/assets/videos/characters/veil_surveillance.mp4',
    displayNameKey: 'transmissions.veil.name',
    tagKey: 'transmissions.veil.tag',
    messageKeys: [
      'transmissions.veil.messages.0',
      'transmissions.veil.messages.1',
      'transmissions.veil.messages.2',
    ],
  },
  [CHARACTER_IDS.MORSE]: {
    id: CHARACTER_IDS.MORSE,
    video: '/assets/videos/characters/morse_contact.mp4',
    displayNameKey: 'transmissions.morse.name',
    tagKey: 'transmissions.morse.tag',
    messageKeys: [
      'transmissions.morse.messages.0',
      'transmissions.morse.messages.1',
      'transmissions.morse.messages.2',
    ],
  },
  [CHARACTER_IDS.ABSENT]: {
    id: CHARACTER_IDS.ABSENT,
    video: '/assets/videos/characters/absent_signal.mp4',
    displayNameKey: 'transmissions.absent.name',
    tagKey: 'transmissions.absent.tag',
    messageKeys: [
      'transmissions.absent.messages.0',
      'transmissions.absent.messages.1',
      'transmissions.absent.messages.2',
    ],
  },
  [CHARACTER_IDS.NOVA]: {
    id: CHARACTER_IDS.NOVA,
    video: '/assets/videos/characters/nova_intro.mp4',
    displayNameKey: 'transmissions.nova.name',
    tagKey: 'transmissions.nova.tag',
    messageKeys: [
      'transmissions.nova.messages.0',
      'transmissions.nova.messages.1',
      'transmissions.nova.messages.2',
    ],
  },
}

const TRIGGER_BOOST = {
  random: 1,
  secret_command: 2.4,
  mission_progress: 2,
  high_trace: 1.7,
  ghost_node: 2.8,
}

const RECENT_SEEN_MS = 30 * 60 * 1000

export function getRandomTransmissionRollDelayMs() {
  return ROLL_INTERVAL_MIN_MS + Math.random() * (ROLL_INTERVAL_MAX_MS - ROLL_INTERVAL_MIN_MS)
}

export function ensureCharacterTransmissionState(save) {
  save.seenTransmissions = save.seenTransmissions || []
  save.characterTransmissionLastAt = save.characterTransmissionLastAt || 0
  if (save.activeCharacterTransmission === undefined) save.activeCharacterTransmission = null
}

export function isCharacterTransmissionBlocked(save, { blocked = false } = {}) {
  if (blocked) return true
  if (!save || save.gameOver) return true
  if (save.activeCinematic) return true
  if (save.activeCharacterTransmission) return true
  if (save.fakeGameOverUntil && Date.now() < save.fakeGameOverUntil) return true
  return false
}

function isOnGlobalCooldown(save) {
  ensureCharacterTransmissionState(save)
  const since = Date.now() - (save.characterTransmissionLastAt || 0)
  return save.characterTransmissionLastAt > 0 && since < TRANSMISSION_GLOBAL_COOLDOWN_MS
}

function isCharacterEligible(characterId, save) {
  const trace = save.traceLevel || 0
  const hacked = save.hackedNodes || []
  const discovered = save.discoveredNodes || []
  const satlinkMission = save.missions?.satlink_intrusion

  switch (characterId) {
    case CHARACTER_IDS.MORSE:
      return !!save.marketUnlocked
    case CHARACTER_IDS.ECHO_17:
      return hacked.includes('satlink_03')
        || discovered.includes('satlink_03')
        || satlinkMission?.status === 'active'
        || satlinkMission?.status === 'completed'
    case CHARACTER_IDS.VEIL:
      return true
    case CHARACTER_IDS.ABSENT:
      return trace > 70
        || save.currentNode === 'relay_ghost'
        || hacked.includes('relay_ghost')
    case CHARACTER_IDS.NOVA:
      return !!save.novaIntroSeen
    default:
      return false
  }
}

function getCharacterWeights(save) {
  const trace = save.traceLevel || 0
  const sessionMin = (Date.now() - (save.sessionStartMs || Date.now())) / 60000
  const hiddenUses = Object.values(save.hiddenCommandUses || {}).reduce((n, v) => n + (v || 0), 0)
  const weights = {}

  if (isCharacterEligible(CHARACTER_IDS.ECHO_17, save)) {
    weights[CHARACTER_IDS.ECHO_17] = 0.2 + (hiddenUses > 0 ? 0.06 : 0)
  }
  if (isCharacterEligible(CHARACTER_IDS.VEIL, save)) {
    weights[CHARACTER_IDS.VEIL] = trace > 50 ? 0.38 : 0.1
  }
  if (isCharacterEligible(CHARACTER_IDS.MORSE, save)) {
    weights[CHARACTER_IDS.MORSE] = 0.16
  }
  if (isCharacterEligible(CHARACTER_IDS.ABSENT, save)) {
    weights[CHARACTER_IDS.ABSENT] = trace > 70 ? 0.05 : 0.012
  }
  if (isCharacterEligible(CHARACTER_IDS.NOVA, save)) {
    weights[CHARACTER_IDS.NOVA] = 0.035
  }

  if (sessionMin > 8) {
    for (const id of Object.keys(weights)) {
      weights[id] *= 1.12
    }
  }

  return weights
}

function pickWeightedCharacter(weights) {
  const entries = Object.entries(weights)
  if (!entries.length) return null
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = Math.random() * total
  for (const [id, weight] of entries) {
    roll -= weight
    if (roll <= 0) return id
  }
  return entries[entries.length - 1][0]
}

function pickMessage(character, save) {
  const seen = save.seenTransmissions || []
  const seenCounts = {}
  for (const entry of seen) {
    const id = typeof entry === 'string' ? entry : entry.id
    if (id) seenCounts[id] = (seenCounts[id] || 0) + 1
  }

  const candidates = character.messageKeys.map((key, idx) => ({
    key,
    id: `${character.id}_${idx}`,
  })).filter(({ id }) => {
    if ((seenCounts[id] || 0) >= 2) return false
    const recent = seen.find((entry) => {
      const sid = typeof entry === 'string' ? entry : entry.id
      const at = typeof entry === 'string' ? 0 : entry.at
      return sid === id && at && Date.now() - at < RECENT_SEEN_MS
    })
    return !recent
  })

  const pool = candidates.length
    ? candidates
    : character.messageKeys.map((key, idx) => ({ key, id: `${character.id}_${idx}` }))

  return pool[Math.floor(Math.random() * pool.length)]
}

function randomDurationMs() {
  return DURATION_MIN_MS + Math.floor(Math.random() * (DURATION_MAX_MS - DURATION_MIN_MS + 1))
}

export function fireCharacterTransmission(save, characterId, source = 'random') {
  if (isCharacterTransmissionBlocked(save)) return null
  if (isOnGlobalCooldown(save)) return null

  const character = CHARACTERS[characterId]
  if (!character || !isCharacterEligible(characterId, save)) return null

  const picked = pickMessage(character, save)
  const durationMs = randomDurationMs()

  ensureCharacterTransmissionState(save)
  save.activeCharacterTransmission = {
    characterId,
    transmissionId: picked.id,
    messageKey: picked.key,
    videoSrc: character.video,
    durationMs,
    startedAt: Date.now(),
    source,
    displayNameKey: character.displayNameKey,
    tagKey: character.tagKey,
  }
  save.characterTransmissionLastAt = Date.now()

  return { transmission: { ...save.activeCharacterTransmission } }
}

export function clearActiveCharacterTransmission(save) {
  ensureCharacterTransmissionState(save)
  const was = save.activeCharacterTransmission
  if (!was) return { cleared: false, autoLines: [] }

  save.seenTransmissions.push({
    id: was.transmissionId,
    character: was.characterId,
    at: Date.now(),
  })
  if (save.seenTransmissions.length > 48) {
    save.seenTransmissions = save.seenTransmissions.slice(-48)
  }

  save.activeCharacterTransmission = null
  return { cleared: true, transmission: was, autoLines: [] }
}

function resolveRollChance(save, trigger = 'random') {
  const trace = save.traceLevel || 0
  let chance = BASE_ROLL_CHANCE * (TRIGGER_BOOST[trigger] || 1)

  if (trace > 50) chance *= 1.15
  if (trace > 75) chance *= 1.1

  const sessionMin = (Date.now() - (save.sessionStartMs || Date.now())) / 60000
  if (sessionMin > 12) chance *= 1.08

  return Math.min(chance, 0.42)
}

/**
 * Tente de déclencher une transmission personnage.
 * @returns {{ transmission, fired } | { transmission: null, fired: null }}
 */
export function rollCharacterTransmission(save, options = {}) {
  const empty = { transmission: null, fired: null }
  const { blocked = false, trigger = 'random' } = options

  if (isCharacterTransmissionBlocked(save, { blocked })) return empty
  if (isOnGlobalCooldown(save)) return empty

  const chance = resolveRollChance(save, trigger)
  if (Math.random() > chance) return empty

  const weights = getCharacterWeights(save)
  const characterId = pickWeightedCharacter(weights)
  if (!characterId) return empty

  const result = fireCharacterTransmission(save, characterId, trigger)
  if (!result) return empty

  return { transmission: result.transmission, fired: result.transmission.transmissionId }
}

export default rollCharacterTransmission
