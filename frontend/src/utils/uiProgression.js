/**
 * Débloque progressivement les panneaux UI selon la progression du joueur.
 */

const INTRO_LINES = {
  trace: [
    '[ALERTE] UltraTech surveille ce terminal.',
    '[ALERTE] Chaque action risquée augmente votre TRACE.',
  ],
  network: [
    '[NET] Signaux anormaux détectés sur le réseau.',
    '[NET] La carte réseau est maintenant accessible.',
  ],
  bittek: [
    '[SYS] Crédits BitTek reçus — monnaie du marché clandestin.',
  ],
  reputation: [
    '[SYS] Votre réputation clandestine progresse.',
  ],
  market: [
    '[???] Quelqu\'un vous a ouvert une porte…',
    '[SYS] BLACK MARKET — accès autorisé.',
  ],
  toolkit: [
    '[SYS] Quelque chose a été laissé dans la boîte à outils.',
  ],
  codex: [
    '[REGISTRY] Entrée classifiée indexée dans le Codex.',
  ],
  chat: [
    '[NET] Bruit sur le canal clandestin — quelqu\'un parle.',
  ],
  journal: [
    '[MISSION] Journal de missions synchronisé.',
  ],
  nova: [
    '',
    '>>> N0VA <<< « Bien joué. UltraTech ne doit pas savoir. »',
    '>>> N0VA <<< « On se reparle. Reste fantôme. »',
  ],
}

function hasCommand(state, cmd) {
  return state?.unlocked_commands?.includes(cmd)
}

function isEarlyGame(state) {
  if (!state) return true
  const m1 = state.missions?.signal_fantome
  return m1?.status === 'active'
    && (m1.completedObjectives?.length ?? 0) === 0
    && !state.flags?.scan_completed
    && (state.traceLevel ?? 0) === 0
}

export function computeUiProgression(state) {
  if (!state) {
    return {
      earlyGame: true,
      showTrace: false,
      showNetwork: false,
      showBittek: false,
      showReputation: false,
      showMarket: false,
      showToolkit: false,
      showCodex: false,
      showChat: false,
      showEvents: false,
      showJournal: false,
      showOperator: false,
      showApps: false,
      showMissionDetail: false,
      unlockedApps: ['terminal'],
    }
  }

  const scanDone = state.flags?.scan_completed
    || state.network?.discoveredNodes?.length > 1
  const traceActive = (state.traceLevel ?? 0) > 0 || scanDone
  const m1Done = state.missions?.signal_fantome?.status === 'completed'
  const m1Progress = state.missions?.signal_fantome?.completedObjectives?.length ?? 0
  const toolkitReady = hasCommand(state, 'run')
    || state.read_files?.includes('toolkit_manifest.txt')
  const codexReady = (state.codex?.discoveredCount ?? 0) > 0
  const chatReady = m1Done || state.network?.connected
  const journalReady = m1Done
  const showApps = m1Done || state.marketUnlocked || toolkitReady

  return {
    earlyGame: isEarlyGame(state),
    showTrace: traceActive,
    showNetwork: scanDone,
    showBittek: (state.player?.bittek ?? 0) > 0 || state.marketUnlocked,
    showReputation: (state.player?.reputation ?? 0) > 0,
    showMarket: state.marketUnlocked,
    showToolkit: toolkitReady,
    showCodex: codexReady,
    showChat: chatReady,
    showEvents: (state.events_log?.length ?? 0) > 2 || (state.traceLevel ?? 0) >= 30,
    showJournal: journalReady,
    showOperator: scanDone || state.network?.connected,
    showApps: showApps,
    showMissionDetail: m1Progress > 0,
    unlockedApps: [
      'terminal',
      ...(journalReady ? ['journal'] : []),
      ...(chatReady ? ['chat'] : []),
      ...(toolkitReady ? ['toolkit'] : []),
      ...(codexReady ? ['codex'] : []),
      ...(state.marketUnlocked ? ['market'] : []),
    ],
  }
}

/** Retourne les intros à afficher dans le terminal (systèmes jamais présentés). */
export function collectNewIntros(state, seenIntros = {}) {
  const ui = computeUiProgression(state)
  const mapping = [
    ['trace', ui.showTrace],
    ['network', ui.showNetwork],
    ['bittek', ui.showBittek],
    ['reputation', ui.showReputation],
    ['market', ui.showMarket],
    ['toolkit', ui.showToolkit],
    ['codex', ui.showCodex],
    ['chat', ui.showChat],
    ['journal', ui.showJournal],
  ]

  const newOnes = []
  for (const [key, visible] of mapping) {
    if (visible && !seenIntros[key]) newOnes.push(key)
  }

  if (state.seenEvents?.includes('nova_contact') && !seenIntros.nova) {
    newOnes.push('nova')
  }

  return newOnes
}

export function getIntroLines(introKey) {
  return INTRO_LINES[introKey] || []
}

export function buildSeenIntrosUpdate(seenIntros, newKeys) {
  const next = { ...seenIntros }
  for (const key of newKeys) next[key] = true
  return next
}
