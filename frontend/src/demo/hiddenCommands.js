/**
 * Commandes secrètes — jamais dans help, découvertes par essai.
 */

import { HIDDEN_COMMANDS } from './mysteryEvents'
import { processMysteryEvents } from './eventManager'
import { discoverCodex } from './codexService'
import { NODE_META } from './demoState'

function bumpHiddenUse(save, cmd) {
  save.hiddenCommandUses = save.hiddenCommandUses || {}
  save.hiddenCommandUses[cmd] = (save.hiddenCommandUses[cmd] || 0) + 1
}

function cmdMirror(save) {
  bumpHiddenUse(save, 'mirror')
  const uses = save.hiddenCommandUses.mirror

  if (uses === 1) {
    save.events_log = save.events_log || []
    save.events_log.push('[???] Commande mirror — aucune sortie.')
    discoverCodex(save, 'mirror_silence')
    return { output: [], silent: true, addTrace: 0 }
  }

  save.flags = save.flags || {}
  save.flags.mystery_memory_unlocked = true
  const mystery = processMysteryEvents(save, { type: 'command', command: 'mirror' })
  discoverCodex(save, 'mirror_response')

  return {
    output: [
      '[MIRROR] Reflet instable...',
      '╔══════════════════════════════╗',
      '║  ghost_demo    ghost_demo    ║',
      '║       ↓            ↑         ║',
      '║  ultratech?    ultratech?    ║',
      '╚══════════════════════════════╝',
      '',
      '[SYS] memory_fragment.log — segment récupéré.',
      ...(mystery.autoLines.length ? ['', ...mystery.autoLines] : []),
    ],
    addTrace: 3,
    uiEffect: mystery.uiEffect || { type: 'glitch', duration: 2200 },
    autoLines: mystery.autoLines,
  }
}

function cmdGhost(save) {
  bumpHiddenUse(save, 'ghost')
  discoverCodex(save, 'ghost_echo')
  save.flags = save.flags || {}
  if (!save.flags.mystery_signal_unlocked && save.traceLevel >= 25) {
    save.flags.mystery_signal_unlocked = true
  }

  const mystery = processMysteryEvents(save, { type: 'command', command: 'ghost' })
  const lines = [
    '[GHOST] Balise fantôme activée...',
    '',
    '...',
    '« Quelqu\'un d\'autre écoute ce canal. »',
    '« Ce n\'est peut-être pas N0VA. »',
    '',
    '[GHOST] Signal faible — 0x7F.GHOST',
  ]

  if (save.flags.mystery_signal_unlocked) {
    lines.push('', '[GHOST] unknown_signal.enc — présence détectée dans /home.')
  }

  return {
    output: [...lines, ...(mystery.autoLines.length ? ['', ...mystery.autoLines] : [])],
    addTrace: 5,
    autoLines: mystery.autoLines,
  }
}

function cmdNova(save) {
  bumpHiddenUse(save, 'nova')
  if (save.hiddenCommandUses.nova === 1) {
    discoverCodex(save, 'nova_contact_01')
  }
  const tier = save.hiddenCommandUses.nova
  const dialogues = [
    [
      '>>> N0VA <<<',
      '',
      '« Opérateur. Ne fais confiance à personne sur ce réseau. »',
      '« Même pas à moi. »',
    ],
    [
      '>>> N0VA <<<',
      '',
      '« UltraTech ne cherche pas des hackers. »',
      '« Ils cherchent des preuves que nous existons. »',
      '« Tu es une preuve, maintenant. »',
    ],
    [
      '>>> N0VA <<<',
      '',
      '« Si je disparais des logs, continue sans moi. »',
      '« Ou peut-être que c\'est ce qu\'ils veulent que tu croies. »',
      '',
      '— fin de transmission —',
    ],
    [
      '[N0VA] ...',
      '',
      '« mirror. ghost. echo. override. »',
      '« Certains mots ouvrent des portes. D\'autres des pièges. »',
    ],
  ]

  const idx = Math.min(tier - 1, dialogues.length - 1)
  return {
    output: dialogues[idx],
    addTrace: 2,
    uiEffect: tier === 1 ? { type: 'scanlines', duration: 2000 } : null,
  }
}

function cmdTraceHidden(save) {
  bumpHiddenUse(save, 'trace')
  discoverCodex(save, 'trace_introspection')
  const t = save.traceLevel
  const lines = [
    '[TRACE] Analyse introspective...',
    '',
    `  Niveau actuel : ${t}%`,
    `  Multiplicateur  : x${NODE_META[save.currentNode]?.traceMultiplier || 1}`,
  ]

  if (t < 30) {
    lines.push('', '« Tu es presque invisible. Profite-en. » — ???')
  } else if (t < 60) {
    lines.push('', '[TRACE] Motif récurrent : activité anormale.')
    lines.push('« Ils construisent ton profil. » — N0VA')
  } else if (t < 85) {
    lines.push('', '[WARN] UltraTech corrèle vos actions.')
    lines.push('« Ce n\'est plus de la surveillance. C\'est une chasse. » — N0VA')
  } else {
    lines.push('', '[CRIT] Signature exposée.')
    lines.push('« Override ne sauvera personne. » — ???')
  }

  return { output: lines, addTrace: 0 }
}

function cmdEcho(save, args) {
  bumpHiddenUse(save, 'echo')
  discoverCodex(save, 'echo_chamber')
  const text = args.join(' ') || save.lastCommand || ''

  if (!text) {
    return {
      output: [
        '[ECHO] ...',
        '[ECHO] ...',
        '[ECHO] Quelqu\'un répète votre silence.',
      ],
      addTrace: 1,
    }
  }

  const corrupted = text
    .split('')
    .map((c, i) => (i % 4 === 0 && c !== ' ' ? '█' : c))
    .join('')

  return {
    output: [
      `[ECHO] ${corrupted}`,
      '',
      text.includes('nova') || text.includes('N0VA')
        ? '>>> N0VA <<< « Arrête de m\'appeler. Ils écoutent. »'
        : '[ECHO] Réverbération enregistrée dans les archives.',
    ],
    addTrace: 2,
  }
}

function cmdOverride(save) {
  bumpHiddenUse(save, 'override')
  const uses = save.hiddenCommandUses.override

  if (uses === 1) {
    discoverCodex(save, 'override_denied')
    return {
      output: [
        '[OVERRIDE] Tentative d\'élévation...',
        '[DENIED] Privilèges insuffisants.',
        '[SYS] Incident enregistré.',
      ],
      addTrace: 8,
    }
  }

  save.flags = save.flags || {}
  save.flags.mystery_override_unlocked = true
  discoverCodex(save, 'override_breach')
  const mystery = processMysteryEvents(save, { type: 'command', command: 'override' })

  const result = {
    output: [
      '[OVERRIDE] Contournement partiel...',
      '[SYS] do_not_open.sys — accès filesystem anormal.',
      '',
      '« Ne l\'ouvre pas. » — N0VA',
      '« Ou ouvre-le. Je veux voir ce qu\'ils cachent. » — ???',
      ...(mystery.autoLines.length ? ['', ...mystery.autoLines] : []),
    ],
    addTrace: 12,
    uiEffect: mystery.uiEffect,
    fakeGameOver: mystery.fakeGameOver,
    autoLines: mystery.autoLines,
  }

  if (mystery.fakeGameOver) {
    result.uiEffect = result.uiEffect || { type: 'fake_gameover', duration: mystery.fakeGameOver.duration }
  }

  return result
}

function cmdDisconnectHidden(save) {
  discoverCodex(save, 'phantom_disconnect')
  return {
    output: [
      '[NET] Aucune connexion active à fermer.',
      '[???] Pourtant un tunnel fantôme vient de se fermer ailleurs.',
      '[SYS] Entrée journalisée — origine : INCONNUE',
    ],
    addTrace: 4,
    uiEffect: { type: 'scanlines', duration: 1500 },
  }
}

export function isHiddenCommand(cmd) {
  return HIDDEN_COMMANDS.has(cmd)
}

export function handleHiddenCommand(save, cmd, args) {
  switch (cmd) {
    case 'mirror': return cmdMirror(save)
    case 'ghost': return cmdGhost(save)
    case 'nova': return cmdNova(save)
    case 'trace': return cmdTraceHidden(save)
    case 'echo': return cmdEcho(save, args)
    case 'override': return cmdOverride(save)
    default: return null
  }
}

export function handleMysteryDisconnect(save, isUnlocked) {
  if (isUnlocked) return null
  return cmdDisconnectHidden(save)
}
