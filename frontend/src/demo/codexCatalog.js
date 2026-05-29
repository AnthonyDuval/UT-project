/**
 * Catalogue Codex — 18 secrets à découvrir.
 */

export const CODEX_RARITY_LABELS = {
  commun: 'Commun',
  rare: 'Rare',
  interdit: 'Interdit',
  anomalie: 'Anomalie',
}

export const CODEX_ORDER = [
  'mirror_silence',
  'mirror_response',
  'ghost_echo',
  'nova_contact_01',
  'trace_introspection',
  'echo_chamber',
  'override_denied',
  'override_breach',
  'phantom_disconnect',
  'silent_observer',
  'trace_whisper',
  'nova_trace_warning',
  'false_game_over',
  'terminal_auto',
  'memory_fragment',
  'unknown_signal',
  'forbidden_segment',
  'archive_redacted',
]

export const CODEX_TOTAL = CODEX_ORDER.length

export const CODEX_ENTRIES = {
  mirror_silence: {
    name: 'MIRROR_SILENCE',
    description: 'La commande mirror a été acceptée sans réponse. Comme si le terminal refusait de confirmer ce qu\'il venait de voir.',
    nextHint: 'Un miroir ne montre rien la première fois. La seconde, peut-être.',
    rarity: 'anomalie',
  },
  mirror_response: {
    name: 'MIRROR_RESPONSE',
    description: 'Le reflet du terminal a dupliqué votre identité. Un fragment mémoire corrompu est apparu dans /home.',
    nextHint: 'Lisez ce que le miroir a laissé derrière lui.',
    rarity: 'rare',
  },
  ghost_echo: {
    name: 'GHOST_ECHO',
    description: 'Balise fantôme activée. Une voix — peut-être N0VA, peut-être autre chose — écoute le canal.',
    nextHint: 'Les signaux faibles laissent parfois des fichiers .enc.',
    rarity: 'commun',
  },
  nova_contact_01: {
    name: 'NOVA_CONTACT_01',
    description: 'Premier contact direct avec N0VA via commande non répertoriée. Message : ne faire confiance à personne.',
    nextHint: 'N0VA parle aussi quand la TRACE monte trop haut.',
    rarity: 'rare',
  },
  trace_introspection: {
    name: 'TRACE_INTROSPECTION',
    description: 'Commande trace cachée — méta-analyse de votre signature UltraTech. Quelqu\'un commente en direct.',
    nextHint: 'La surveillance réagit quand vous frôlez 45 %.',
    rarity: 'commun',
  },
  echo_chamber: {
    name: 'ECHO_CHAMBER',
    description: 'Le terminal répète vos mots, corrompus. Certaines syllabes déclenchent des réponses inattendues.',
    nextHint: 'Essayez d\'écho un nom que UltraTech efface des logs.',
    rarity: 'commun',
  },
  override_denied: {
    name: 'OVERRIDE_DENIED',
    description: 'Tentative d\'élévation de privilèges rejetée. Incident enregistré — quelque part.',
    nextHint: 'Les systèmes refusent une fois. Pas toujours deux.',
    rarity: 'rare',
  },
  override_breach: {
    name: 'OVERRIDE_BREACH',
    description: 'Contournement partiel réussi. Un segment système interdit est devenu lisible : do_not_open.sys.',
    nextHint: 'Deux voix se contredisent sur ce qu\'il faut ouvrir.',
    rarity: 'interdit',
  },
  phantom_disconnect: {
    name: 'PHANTOM_DISCONNECT',
    description: 'Disconnect exécuté sans connexion active — pourtant un tunnel s\'est fermé « ailleurs ».',
    nextHint: 'Les commandes réseau existent avant d\'être débloquées.',
    rarity: 'rare',
  },
  silent_observer: {
    name: 'SILENT_OBSERVER',
    description: 'Processus inconnu a consulté votre session. UltraTech ? N0VA ? Le terminal ne dit pas.',
    nextHint: 'Restez connecté. Le réseau finit par parler seul.',
    rarity: 'rare',
  },
  trace_whisper: {
    name: 'TRACE_WHISPER',
    description: 'À 45 % de TRACE, une signature parallèle compte vos pas dans le réseau.',
    nextHint: 'Montez plus haut. N0VA intervient avant le game over.',
    rarity: 'rare',
  },
  nova_trace_warning: {
    name: 'NOVA_TRACE_WARNING',
    description: 'N0VA coupe le canal : « Ce n\'est peut-être pas moi qui t\'aide. » Ambiguïté morale confirmée.',
    nextHint: 'Override sous haute TRACE provoque des anomalies.',
    rarity: 'interdit',
  },
  false_game_over: {
    name: 'FALSE_GAME_OVER',
    description: 'Signal GAME OVER injecté — session non terminée. Quelqu\'un teste votre réaction à la peur.',
    nextHint: 'Ce n\'était pas réel. Ou pas encore.',
    rarity: 'anomalie',
  },
  terminal_auto: {
    name: 'TERMINAL_AUTO',
    description: 'Entrée terminal non initiée : une commande s\'est tapée toute seule. ls, sans vous.',
    nextHint: 'Le système imite vos habitudes.',
    rarity: 'anomalie',
  },
  memory_fragment: {
    name: 'MEMORY_FRAGMENT',
    description: 'Fragment mémoire : « N0VA is not a person. N0VA is a protocol. » Effacement UltraTech échoué.',
    nextHint: 'Coordonnées mirror_relay mentionnées. Connectez-vous.',
    rarity: 'rare',
  },
  unknown_signal: {
    name: 'UNKNOWN_SIGNAL',
    description: 'Signal orbital chiffré — fréquence 1420 MHz. Motif N0VA / UltraTech en boucle.',
    nextHint: 'L\'archive classifiée attend quelque part dans /home.',
    rarity: 'interdit',
  },
  forbidden_segment: {
    name: 'FORBIDDEN_SEGMENT',
    description: 'do_not_open.sys lu malgré l\'avertissement. Projet MIRROR — duplication de conscience opérateur.',
    nextHint: 'La corruption mémoire laisse des archives supprimées.',
    rarity: 'interdit',
  },
  archive_redacted: {
    name: 'ARCHIVE_███',
    description: 'Archive UltraTech : deux théories sur N0VA. Note marginale — « Les deux théories sont vraies. »',
    nextHint: 'Vous avez cartographié l\'impossible. Le réseau n\'a plus de secrets — ou si.',
    rarity: 'anomalie',
  },
}

export const EVENT_TO_CODEX = {
  ambient_watch: 'silent_observer',
  trace_threshold_whisper: 'trace_whisper',
  trace_nova_warning: 'nova_trace_warning',
  command_override_fake_death: 'false_game_over',
  random_terminal_echo: 'terminal_auto',
  command_mirror_second: 'mirror_response',
  command_ghost_nova: 'ghost_echo',
  file_unknown_signal: 'unknown_signal',
  file_do_not_open_aftermath: 'forbidden_segment',
}

export const FILE_TO_CODEX = {
  'memory_fragment.log': 'memory_fragment',
  'unknown_signal.enc': 'unknown_signal',
  'do_not_open.sys': 'forbidden_segment',
  'archive_███.dat': 'archive_redacted',
}
