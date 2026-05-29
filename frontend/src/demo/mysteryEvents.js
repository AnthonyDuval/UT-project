/**
 * Catalogue d'événements mystère — déclencheurs et effets.
 */

export const MYSTERY_EVENTS = [
  {
    id: 'ambient_watch',
    once: true,
    chance: 0.08,
    cooldownMs: 300000,
    conditions: { type: 'tick', minSessionSec: 120, maxTrace: 40 },
    effects: {
      log: '[SYS] Processus inconnu consulté votre session.',
      uiEffect: { type: 'scanlines', duration: 2500 },
    },
  },
  {
    id: 'trace_threshold_whisper',
    once: true,
    conditions: { type: 'trace', minTrace: 45 },
    effects: {
      autoLines: ['[???] Quelqu\'un compte vos pas dans le réseau.'],
      log: '[EVENT] Signature parallèle détectée.',
      uiEffect: { type: 'glitch', duration: 1800 },
    },
  },
  {
    id: 'trace_nova_warning',
    once: true,
    conditions: { type: 'trace', minTrace: 72, requiresNovaIntro: true },
    effects: {
      autoLines: [
        '>>> N0VA — CANAL PRIORITAIRE <<<',
        '« Tu laisses trop de traces. UltraTech approche. »',
        '« Ce n\'est peut-être pas moi qui t\'aide. »',
      ],
      log: '[N0VA] Interruption — niveau TRACE élevé.',
      uiEffect: { type: 'corrupt_notify', message: 'TRACE CRITIQUE — QUI OBSERVE ?', duration: 4000 },
    },
  },
  {
    id: 'file_do_not_open_aftermath',
    once: true,
    conditions: { type: 'file', file: 'do_not_open.sys' },
    effects: {
      autoLines: [
        '[SYS] ERREUR — segment mémoire 0x██ corrompu',
        '[SYS] Restauration... échec partiel.',
        '« Tu n\'aurais pas dû. » — ???',
      ],
      log: '[EVENT] Corruption mémoire signalée.',
      uiEffect: { type: 'glitch', duration: 3200 },
      flag: 'mystery_archive_unlocked',
    },
  },
  {
    id: 'file_unknown_signal',
    once: true,
    conditions: { type: 'file', file: 'unknown_signal.enc' },
    effects: {
      log: '[SCAN] Signal non catalogué — coordonnées extraites.',
      flag: 'mystery_archive_unlocked',
      revealNode: 'mirror_relay',
    },
  },
  {
    id: 'command_mirror_second',
    once: true,
    conditions: { type: 'command', command: 'mirror', minUses: 2 },
    effects: {
      flag: 'mystery_memory_unlocked',
      log: '[EVENT] Reflet instable — fragment mémoire récupéré.',
      uiEffect: { type: 'glitch', duration: 2200 },
    },
  },
  {
    id: 'command_ghost_nova',
    once: true,
    conditions: { type: 'command', command: 'ghost', requiresNovaIntro: true },
    chance: 0.35,
    effects: {
      autoLines: [
        '>>> N0VA <<<',
        '« Ne cherche pas mon vrai nom dans les logs. »',
        '« UltraTech efface ceux qui posent la question. »',
      ],
      log: '[N0VA] Présence — canal fantôme.',
    },
  },
  {
    id: 'command_override_fake_death',
    once: true,
    conditions: { type: 'command', command: 'override', minTrace: 55 },
    chance: 0.3,
    effects: {
      fakeGameOver: { duration: 4500 },
      log: '[EVENT] Faux signal GAME OVER injecté.',
    },
  },
  {
    id: 'mission1_idle_nova',
    once: false,
    chance: 0.08,
    cooldownMs: 300000,
    conditions: {
      type: 'tick',
      minSessionSec: 180,
      mission: 'signal_fantome',
      missionStatus: 'active',
      requiresNovaIntro: true,
    },
    effects: {
      autoLines: ['[???] ...entends-tu le signal sous le bruit ?'],
      uiEffect: { type: 'scanlines', duration: 2000 },
    },
  },
  {
    id: 'random_terminal_echo',
    once: false,
    chance: 0.06,
    cooldownMs: 360000,
    conditions: { type: 'tick', minSessionSec: 240, minCommands: 12 },
    effects: {
      autoLines: ['> ls', '[AUTO] Répertoire courant : /home/ghost_demo/'],
      log: '[EVENT] Entrée terminal non initiée.',
      uiEffect: { type: 'corrupt_notify', message: 'ENTRÉE AUTOMATIQUE DÉTECTÉE', duration: 3500 },
    },
  },
]

export const HIDDEN_COMMANDS = new Set([
  'mirror', 'ghost', 'nova', 'trace', 'echo', 'override',
])

/** Commandes secrètes — jamais listées dans help. */
export const HIDDEN_COMMAND_IDS = HIDDEN_COMMANDS
