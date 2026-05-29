export default {
  help: {
    header: 'Registre partiel — mots reconnus par le terminal :',
    footer: '[???] Ce terminal en sait plus qu\'il ne dit.',
  },

  files: {
    empty: '[VIDE] Aucun fragment accessible.',
    header: 'Fragments locaux :',
    localHeader: 'Fragments locaux :',
  },

  ls: {
    programsDir: 'Répertoire : /programs',
    inventoryDir: 'Répertoire : /inventory',
    programsEmpty: '[VIDE] Aucun programme installé.',
    inventoryEmpty: '[VIDE] Aucun programme en stock.',
    currentDir: 'Répertoire courant : {{path}}',
    dirPrograms: '  [DIR] /programs          — {{count}} installé(s)',
    dirInventory: '  [DIR] /inventory         — {{count}} en stock',
    programEntry: '  {{filename}} — {{name}} [PERMANENT]',
    inventoryEntry: '  {{filename}} — x{{quantity}} [{{type}}]',
    fileEntry: '  {{name}} — {{description}}',
    fileEntryBullet: '  • {{name}} {{description}}',
  },

  open: {
    usage: '[ERR] Usage : open [fichier]',
    inaccessible: '[ERR] Fichier inaccessible : \'{{name}}\'',
    unknown: '[ERR] Fichier inconnu : \'{{name}}\'',
    header: '=== {{name}} ===',
  },

  status: {
    banner: '╔══════════════════════════════════════════════════╗',
    title: '║  STATUT OPÉRATEUR                                 ║',
    footerBanner: '╚══════════════════════════════════════════════════╝',
    identifier: '  Identifiant  : {{username}}',
    bittek: '  BitTek       : {{bittek}}',
    reputation: '  Réputation   : {{reputation}}',
    trace: '  Trace UT     : {{trace}}%',
    network: '  Réseau :',
    activeNode: '    • Nœud actif   : {{node}}',
    security: '    • Sécurité     : {{security}}',
    multiplier: '    • Trace mult.  : x{{multiplier}}',
    footer: '  [SYS] Canal sécurisé — données chiffrées.',
  },

  connect: {
    usage: '[ERR] Usage : connect [node]',
    undiscovered: '[ERR] Nœud \'{{target}}\' non découvert.',
    unknown: '[ERR] Nœud inconnu : \'{{target}}\'',
    mirror: [
      '[NET] Tunnel instable — reflet détecté...',
      '[NET] Connected to {{nodeName}}',
      '[???] Ce nœud n\'existe pas dans les registres UltraTech.',
      '[???] Quelqu\'un observe depuis l\'autre côté du miroir.',
      '[???] Le reflet montre deux chemins de sortie.',
      '',
      '[???] « Ne regarde pas trop longtemps. »',
    ],
    normal: [
      '[NET] Connexion chiffrée en cours…',
      '[NET] Tunnel établi — {{nodeName}}',
      '[???] Vous êtes à l\'intérieur. Restez discret.',
    ],
  },

  disconnect: {
    alreadyLocal: '[NET] Déjà sur le terminal local.',
    closing: '[NET] Fermeture du tunnel chiffré...',
    disconnected: '[NET] Déconnecté de {{node}}',
    backLocal: '[NET] Retour au terminal local.',
  },

  scan: {
    alreadyDone: '[SCAN] Analyse déjà effectuée.',
    alreadyRelay: '[SCAN] Relais RELAY_GHOST actif.',
    lines: [
      '[SCAN] Parcours du réseau local…',
      '[SCAN] Réponse anormale — signature RELAY_GHOST',
      '[???] Quelqu\'un écoute. Vous aussi.',
      '[SYS] Fragment capturé dans la mémoire locale.',
    ],
  },

  probe: {
    noSegment: '[PROBE] Aucun segment adjacent depuis cette position.',
    lines: [
      '[PROBE] Segment orbital cartographié.',
      '[PROBE] morgue_server — DÉTECTÉ',
      '[PROBE] blackvault — DÉTECTÉ (firewall actif)',
    ],
  },

  run: {
    usage: '[ERR] Usage : run [programme.exe]',
    notFound: '[ERR] Programme introuvable : \'{{name}}\'',
    missing: '[ERR] {{filename}} absent.',
    executing: '[RUN] Exécution : {{filename}}',
    consumed: '[RUN] {{filename}} consommé.',
    traceChange: '[RUN] TRACE : {{old}}% → {{new}}%',
    sniff: '[SNIFF] Nœud : {{node}} | x{{multiplier}}',
    ok: '[RUN] {{name}} — OK.',
  },

  market: {
    banner: '╔══════════════════════════════════════════════════╗',
    title: '║  BLACK MARKET [DEMO]                              ║',
    footerBanner: '╚══════════════════════════════════════════════════╝',
    balance: '  Solde : {{bittek}} BitTek',
    hint: '  [???] Quelqu\'un a laissé une porte ouverte sur le bureau.',
  },

  sync: {
    demo: '[SYNC] Mode démo — cohérence locale OK.',
    status: '[SYNC] Trace : {{trace}}% | Nœud : {{node}}',
  },

  locked: {
    session: '[LOCKED] Session terminée.',
    gameOver: '[LOCKED] GAME OVER.',
  },

  unknown: {
    command: '[ERR] Commande inconnue : \'{{cmd}}\'',
    notImplemented: '[ERR] Commande \'{{cmd}}\' non implémentée en demo.',
  },

  install: {
    undocumented: '[SYS] Procédure non documentée — le terminal refuse de confirmer.',
  },

  trace: {
    activity30: '[TRACE] Activite reseau inhabituelle detectee.',
    analyzing60: '[TRACE] UltraTech analyse votre signature.',
    gameOver: '[GAME OVER] UltraTech vous a localise.',
    critical: '[TRACE] NIVEAU CRITIQUE — 100% — GAME OVER IMMINENT',
  },

  reset: {
    message: '[SYS] Sauvegarde réinitialisée — Mission 1 : Signal Fantôme.',
  },

  advancedDemo: {
    message: '[DEMO] Démo avancée chargée — SATLINK_03, BLACK MARKET, missions débloquées.',
  },

  novaFirstContact: '[N0VA] Premier contact — canal entrant intercepté.',

  missionProgress: {
    objectiveComplete: '[MISSION] ✓ {{label}}',
    newMission: '[MISSION] Nouvelle mission : {{title}}',
    objectives: {
      read_files: 'Découvrir ce qui a été laissé sur le terminal',
      scan_network: 'Comprendre ce qu\'il est arrivé au dernier opérateur',
      connect_relay: 'Atteindre le relais fantôme',
      connect_satlink: 'Atteindre le relais orbital SATLINK_03',
      use_probe: 'Comprendre ce qu\'il est arrivé au dernier cartographe',
      discover_nodes: 'Cartographier les segments interdits',
      open_satellite_file: 'Lire ce que le manifeste orbital cache',
      nova_fragment: 'Récupérer un fragment laissé par N0VA',
    },
    signalFantome: {
      bittekRep: '[SYS] +50 BitTek | +1 Réputation',
      marketUnlocked: '[SYS] BLACK MARKET — accès autorisé.',
      hintBroker: '[???] GHOST BROKER — canal indices ouvert.',
      satlinkDetected: '[NET] Nouveau relais détecté : SATLINK_03',
      missionComplete: '[MISSION] Signal Fantôme — TERMINÉE',
      novaIntercepted: '[???] Transmission interceptée — origine inconnue.',
      novaLine1: '« Bien joué. UltraTech ne doit pas savoir. »',
      novaLine2: '« Le marché noir t\'attend. Reste fantôme. »',
      novaTransmission: {
        banner: '╔══════════════════════════════════════════════════╗',
        title: '║  TRANSMISSION INTERCEPTÉE — ORIGINE INCONNUE     ║',
        footerBanner: '╚══════════════════════════════════════════════════╝',
        line1: '« Bien joué. UltraTech ne doit pas savoir. »',
        line2: '« Le marché noir t\'attend. Reste fantôme. »',
        signature: '— N0VA',
      },
    },
    satlinkIntrusion: {
      bittekRep: '[SYS] +75 BitTek | +1 Réputation',
      missionComplete: '[MISSION] Intrusion Orbitale — TERMINÉE',
    },
  },

  hidden: {
    mirror: {
      unstable: '[MIRROR] Reflet instable...',
      ascii: [
        '╔══════════════════════════════╗',
        '║  ghost_demo    ghost_demo    ║',
        '║       ↓            ↑         ║',
        '║  ultratech?    ultratech?    ║',
        '╚══════════════════════════════╝',
      ],
      memoryRecovered: '[SYS] memory_fragment.log — segment récupéré.',
    },
    ghost: {
      activating: '[GHOST] Balise fantôme activée...',
      pause: '...',
      line1: '« Quelqu\'un d\'autre écoute ce canal. »',
      line2: '« Ce n\'est peut-être pas N0VA. »',
      signal: '[GHOST] Signal faible — 0x7F.GHOST',
      unknownSignal: '[GHOST] unknown_signal.enc — présence détectée dans /home.',
    },
    nova: {
      muted: '[???] Canal muet — origine non identifiée.',
      dialogues: [
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
      ],
    },
    trace: {
      header: '[TRACE] Analyse introspective...',
      currentLevel: '  Niveau actuel : {{level}}%',
      multiplier: '  Multiplicateur  : x{{multiplier}}',
      low: '« Tu es presque invisible. Profite-en. » — ???',
      mediumPattern: '[TRACE] Motif récurrent : activité anormale.',
      mediumNova: '« Ils construisent ton profil. » — N0VA',
      mediumUnknown: '« Ils construisent ton profil. » — ???',
      highWarn: '[WARN] UltraTech corrèle vos actions.',
      highNova: '« Ce n\'est plus de la surveillance. C\'est une chasse. » — N0VA',
      highUnknown: '« Ce n\'est plus de la surveillance. C\'est une chasse. » — ???',
      critical: '[CRIT] Signature exposée.',
      criticalLine: '« Override ne sauvera personne. » — ???',
    },
    echo: {
      empty: [
        '[ECHO] ...',
        '[ECHO] ...',
        '[ECHO] Quelqu\'un répète votre silence.',
      ],
      prefix: '[ECHO] {{text}}',
      recorded: '[ECHO] Réverbération enregistrée dans les archives.',
      novaKnown: '>>> N0VA <<< « Arrête de m\'appeler. Ils écoutent. »',
      novaUnknown: '>>> ??? <<< « Arrête. Ils écoutent. »',
    },
    override: {
      denied: [
        '[OVERRIDE] Tentative d\'élévation...',
        '[DENIED] Privilèges insuffisants.',
        '[SYS] Incident enregistré.',
      ],
      breach: [
        '[OVERRIDE] Contournement partiel...',
        '[SYS] do_not_open.sys — accès filesystem anormal.',
        '',
        '« Ne l\'ouvre pas. » — N0VA',
        '« Ou ouvre-le. Je veux voir ce qu\'ils cachent. » — ???',
      ],
    },
    disconnect: [
      '[NET] Aucune connexion active à fermer.',
      '[???] Pourtant un tunnel fantôme vient de se fermer ailleurs.',
      '[SYS] Entrée journalisée — origine : INCONNUE',
    ],
  },
}
