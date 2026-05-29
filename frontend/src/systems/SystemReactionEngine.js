/**
 * SystemReactionEngine — réactions rares du terminal vivant.
 * Le silence est la norme. Une ligne suffit à créer la tension.
 */

import {
  canFireReaction,
  ensureBehavior,
  getAfkSeconds,
  getBehaviorSnapshot,
  isSpamming,
  markReactionFired,
  trackBehaviorTick,
} from './PlayerBehaviorTracker'

const EMPTY = { autoLines: [], uiEffect: null, fired: [] }

function roll(chance) {
  return Math.random() < chance
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function corrupt(text, intensity = 0.15) {
  return text
    .split('')
    .map((ch) => (ch !== ' ' && Math.random() < intensity ? '█' : ch))
    .join('')
}

function novaTag(save) {
  return save.novaIntroSeen ? 'N0VA' : '???'
}

function novaLine(save, messages) {
  const tag = novaTag(save)
  const msg = pick(messages)
  if (!msg) return []
  return [`[${tag}] ${msg}`]
}

/** Réactions après une commande — faible probabilité, contextuelles. */
export function processBehaviorAfterCommand(save, cmd) {
  if (save.gameOver && !save.fakeGameOverUntil) return EMPTY

  const normalized = cmd?.toLowerCase?.() || ''
  const snapshot = getBehaviorSnapshot(save)
  const lines = []
  let uiEffect = null
  const fired = []

  if (isSpamming(save) && canFireReaction(save, 'spam_logged', 240000) && roll(0.35)) {
    markReactionFired(save, 'spam_logged')
    lines.push('[SYS] Cette requête a été enregistrée.')
    fired.push('spam_logged')
  }

  if (
    snapshot.secretUses > 0
    && canFireReaction(save, 'command_watched', 360000)
    && roll(0.1)
  ) {
    markReactionFired(save, 'command_watched')
    lines.push('[SYS] Commande surveillée.')
    fired.push('command_watched')
  }

  if (normalized === 'scan' && snapshot.scanCount > 1 && canFireReaction(save, 'scan_repeat', 300000) && roll(0.12)) {
    markReactionFired(save, 'scan_repeat')
    lines.push('[TRACE] Analyse répétée — motif enregistré.')
    fired.push('scan_repeat')
  }

  if (normalized === 'override' && canFireReaction(save, 'override_logged', 420000) && roll(0.25)) {
    markReactionFired(save, 'override_logged')
    lines.push('[SECOPS] Tentative d\'élévation journalisée.')
    fired.push('override_logged')
  }

  if (save.novaIntroSeen && canFireReaction(save, 'nova_ambiguous', 420000) && roll(0.07)) {
    markReactionFired(save, 'nova_ambiguous')
    const pool = [
      ...novaLine(save, ['« Reste bas. Tu es visible. »', '« UltraTech lit plus vite que toi. »']),
      ...novaLine(save, ['« Ce canal n\'est peut-être plus sûr. »', '« Ne fais pas confiance aux logs. »']),
      ...novaLine(save, ['« Tout va bien. Continue. »', '« Personne ne t\'a vu. »']), // ambigu / mensonge
      [], // silence — parfois rien
    ]
    const picked = pick(pool)
    if (picked.length) lines.push(...picked)
    fired.push('nova_ambiguous')
  }

  if (save.traceLevel >= 45 && canFireReaction(save, 'trace_whisper_ui', 300000) && roll(0.08)) {
    markReactionFired(save, 'trace_whisper_ui')
    uiEffect = {
      type: 'corrupt_notify',
      message: corrupt('SURVEILLANCE ACTIVE', 0.2),
      duration: 2800,
    }
    fired.push('trace_whisper_ui')
  }

  return { autoLines: lines, uiEffect, fired }
}

/** Réactions tick — inactivité, mémoire différée, silence majoritaire. */
export function processBehaviorTick(save) {
  if (save.gameOver && !save.fakeGameOverUntil) return EMPTY

  trackBehaviorTick(save)
  const afk = getAfkSeconds(save)
  const b = ensureBehavior(save)
  const lines = []
  let uiEffect = null
  const fired = []

  // Mémoire différée — mirror
  const mirror = b.memory?.mirror
  if (
    mirror
    && !mirror.whispered
    && mirror.lastAt
    && Date.now() - mirror.lastAt > 180000
    && canFireReaction(save, 'memory_mirror', 600000)
    && roll(0.22)
  ) {
    mirror.whispered = true
    markReactionFired(save, 'memory_mirror')
    lines.push('[???] Nous n\'avons pas oublié MIRROR.')
    fired.push('memory_mirror')
  }

  const overrideMem = b.memory?.override
  if (
    overrideMem
    && !overrideMem.whispered
    && overrideMem.lastAt
    && Date.now() - overrideMem.lastAt > 240000
    && canFireReaction(save, 'memory_override', 600000)
    && roll(0.18)
  ) {
    overrideMem.whispered = true
    markReactionFired(save, 'memory_override')
    lines.push('[SYS] OVERRIDE — entrée archivée. Classifié.')
    fired.push('memory_override')
  }

  if (afk >= 50 && canFireReaction(save, 'afk_detected', 300000) && roll(0.14)) {
    markReactionFired(save, 'afk_detected')
    lines.push('[SYS] Inactivité détectée.')
    fired.push('afk_detected')
  }

  if (afk >= 90 && canFireReaction(save, 'afk_presence', 360000) && roll(0.12)) {
    markReactionFired(save, 'afk_presence')
    lines.push(`[???] ${save.player?.username || 'ghost_demo'}… êtes-vous toujours là ?`)
    fired.push('afk_presence')
  }

  if (
    save.novaIntroSeen
    && afk >= 70
    && canFireReaction(save, 'nova_vanish', 480000)
    && roll(0.08)
  ) {
    markReactionFired(save, 'nova_vanish')
    lines.push('[N0VA] …')
    lines.push('[SYS] Canal fermé — origine inconnue.')
    fired.push('nova_vanish')
  }

  if (save.traceLevel >= 60 && canFireReaction(save, 'trace_ui_glitch', 360000) && roll(0.06)) {
    markReactionFired(save, 'trace_ui_glitch')
    uiEffect = {
      type: 'corrupt_notify',
      message: corrupt('TRACE ÉLEVÉE — ANOMALIE UI', 0.25),
      duration: 2400,
    }
    fired.push('trace_ui_glitch')
  }

  // Silence intentionnel — la plupart des ticks ne produisent rien
  return { autoLines: lines, uiEffect, fired }
}

/** Fusionne avec d'autres résultats d'événements. */
export function mergeBehaviorResult(base, behavior) {
  if (!behavior?.fired?.length) return base
  return {
    autoLines: [...(base.autoLines || []), ...(behavior.autoLines || [])],
    uiEffect: behavior.uiEffect || base.uiEffect,
    fakeGameOver: base.fakeGameOver,
    terminalEffect: base.terminalEffect,
    fired: [...(base.fired || []), ...(behavior.fired || [])],
  }
}

export { getBehaviorSnapshot }
