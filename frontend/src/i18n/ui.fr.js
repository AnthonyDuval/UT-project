export default {
  settings: {
    title: 'PARAMÈTRES SYSTÈME',
    subtitle: 'Module de configuration clandestin — traduction interface',
    langLabel: 'Language / Langue',
    lang: {
      fr: 'Français',
      en: 'English',
    },
    langCurrent: 'LANG : {{code}}',
    saved: 'Préférence enregistrée en mémoire locale.',
    close: 'Fermer',
    coreNote: 'UltraTech core · EN only',
  },

  boot: {
    detectedLocale: '[BOOT] Detected locale : {{code}}',
    interfaceLanguage: '[BOOT] Interface language : {{label}}',
    sequence: [
      { text: '[KERNEL] UltraTech OS v3.7 — boot sequence initiated', delay: 0 },
      { text: '[CHECK] Memory integrity............ OK', delay: 400 },
      { text: '[CHECK] Encryption module........... OK', delay: 800 },
      { text: '[CHECK] Network stack............... WARN', delay: 1200, className: 'boot-warn' },
      { text: '[AUTH]  Operator clearance.......... DENIED', delay: 1600, className: 'boot-error' },
      { text: '[AUTH]  Clearance override.......... ACCEPTED', delay: 2100, className: 'boot-ok' },
      { text: '[LOAD]  Session locale.............. MOUNTED', delay: 2400, className: 'boot-ok' },
      { text: '[NET]   SecOps monitoring........... ACTIVE', delay: 2800, className: 'boot-warn' },
      { text: '[NET]   Relay scan module........... STANDBY', delay: 3200 },
      { text: '[WARN]  Unauthorized access logged', delay: 3600, className: 'boot-error' },
      { text: '[WARN]  Trace subsystem armed', delay: 4000, className: 'boot-warn' },
      { text: '[SYS]   Session tunnel established', delay: 4400, className: 'boot-ok' },
      { text: '[SYS]   Terminal ready — awaiting input', delay: 4800, className: 'boot-ok' },
    ],
  },

  loader: {
    subtitle: 'Connexion réseau détectée…',
  },

  topbar: {
    reputation: 'Réputation',
    help: '? Aide',
    helpTitle: 'Comment jouer',
    reset: '↺ Reset',
    resetTitle: 'Reset sauvegarde',
    settings: '⚙ CFG',
    settingsTitle: 'Paramètres système',
  },

  welcome: {
    subtitle: 'Connexion réseau détectée.',
    openBeta: 'OUVRIR LA BÊTA TEST',
    loading: 'Établissement du lien…',
    reset: 'Réinitialiser la sauvegarde',
    footer: 'Canal chiffré · accès restreint',
  },

  howto: {
    title: 'Comment jouer ?',
    intro: 'Vous avez accès illégal à un terminal UltraTech. Ce n\'est pas un cours d\'informatique — c\'est une enquête dans un réseau interdit.',
    close: 'Fermer',
    footer: 'Commencez par lire ce qui traîne sur le terminal.',
    ok: 'Compris',
    steps: [
      {
        title: 'Lisez tout',
        body: 'Documents, logs, archives corrompues. Les réponses sont dans le texte — pas dans un manuel.',
      },
      {
        title: 'Retenez les mots étranges',
        body: 'Des noms interdits circulent dans les fichiers. Essayez-les au terminal.',
      },
      {
        title: 'Observez les réactions',
        body: 'Le système répond, se tait, ou ment. Chaque essai révèle quelque chose.',
      },
      {
        title: 'Restez discret',
        body: 'UltraTech surveille. Plus vous forcez, plus la TRACE monte.',
      },
      {
        title: 'Faites confiance à personne',
        body: 'UltraTech, les logs effacés, les voix anonymes — tout le monde a un agenda.',
      },
    ],
  },

  statusbar: {
    currentLead: 'PISTE ACTUELLE',
    documents: 'DOCUMENTS',
    noDocuments: 'Aucun document',
    surveillance: 'Surveillance UltraTech',
    surveillanceHint: '{{level}}% — restez discret',
    network: 'RÉSEAU',
    connected: 'Connecté · {{node}}',
    signals: '{{count}} signal(aux) détecté(s)',
    missionJournal: 'Journal de missions',
    blackMarket: 'Black Market',
    ghostBroker: 'Ghost Broker',
    codex: 'Codex · {{progress}} →',
  },

  windows: {
    terminalSecure: 'TERMINAL SÉCURISÉ',
    terminal: '{{name}} — TERMINAL',
    chat: 'CANAL CLANDESTIN',
    toolkit: 'BOÎTE À OUTILS',
    journal: 'JOURNAL DE MISSIONS',
    broker: 'GHOST BROKER — RELAY MERCHANT',
    codex: 'CODEX — REGISTRE CLASSIFIÉ',
    market: 'BLACK MARKET',
  },

  threat: {
    critical: 'CRITIQUE',
    high: 'ÉLEVÉE',
    moderate: 'MODÉRÉE',
    low: 'FAIBLE',
  },

  postBoot: {
    banner: 'ULTRATECH ONLINE — TERMINAL OPÉRATEUR v3.7',
    line1: '[SYS] Connexion sécurisée établie.',
    line2: '[SYS] Quelqu\'un vous a laissé accéder à ce terminal.',
    line3: '[???] Des fragments dorment dans la mémoire locale.',
  },

  intros: {
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
    broker: [
      '[???] Signal faible sur relay clandestin…',
      '[BROKER] GHOST BROKER — indices disponibles contre BitTek.',
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
  },

  objectives: {
    connection: {
      title: 'Connexion…',
      hint: 'Établissement du lien sécurisé.',
    },
    m1: {
      signal_incoming: {
        title: 'Signal entrant',
        hint: 'Quelqu\'un vous a ouvert une porte. Le terminal semble attendre quelque chose.',
      },
      local_memory: {
        title: 'Mémoire locale',
        hint: 'Des fragments dorment quelque part sur ce terminal.',
      },
      unsigned_note: {
        title: 'Message non signé',
        hint: 'Un document porte une note laissée par un inconnu.',
      },
      relay_anomaly: {
        title: 'Anomalie RELAY_GHOST',
        hint: 'Le journal système enregistre quelque chose qu\'UltraTech préfère taire.',
      },
      ghost_operator: {
        title: 'Opérateur fantôme',
        hint: 'Le dernier opérateur ayant utilisé SCAN sur ce relais a disparu.',
      },
      network_response: {
        title: 'Réponse du réseau',
        hint: 'L\'analyse a laissé une trace. Un nouveau fragment attend dans les documents.',
      },
      active_relay: {
        title: 'Relais actif',
        hint: 'Les anciens opérateurs traversaient les nœuds clandestins en silence.',
      },
    },
    m2: {
      orbital_channel: {
        title: 'Canal orbital',
        hint: 'Un relais orbital attend — SATLINK_03. Quelque chose est de l\'autre côté.',
        hint_nova: 'N0VA parle d\'un relais — SATLINK_03. Quelque chose attend de l\'autre côté.',
      },
      orbital_segment: {
        title: 'Segment orbital',
        hint: 'Le tunnel est ouvert. Le relais garde encore des secrets.',
      },
      erased_cartographer: {
        title: 'Cartographe effacé',
        hint: 'Dernier cartographe connu — statut : EFFACÉ. Son journal mentionne PROBE.',
      },
      orbital_manifest: {
        title: 'Manifeste orbital',
        hint: 'Un fichier traîne sur le relais. UltraTech préfère qu\'on ne le lise pas.',
      },
      forbidden_segments: {
        title: 'Segments interdits',
        hint: 'Deux nœuds apparaissent sur la cartographie — morgue_server, blackvault.',
      },
      orbital_fragment: {
        title: 'Fragment orbital',
        hint: 'Quelqu\'un a laissé une trace sur ce relais.',
        title_nova: 'Fragment N0VA',
        hint_nova: 'N0VA laisse des traces sur les relais qu\'elle utilise.',
      },
    },
    infiltration: {
      title: 'Infiltration en cours',
      hint: 'Le réseau garde encore des secrets. UltraTech observe.',
    },
    fallback: {
      hint: 'Poursuivez l\'enquête.',
    },
  },

  missions: {
    signal_fantome: {
      title: 'Signal Fantôme',
      subtitle: 'Mission 1',
      description: 'Un relais non identifié émet un signal. Localisez-le et établissez contact.',
      atmosphere: 'Un opérateur a disparu après avoir scanné ce segment. UltraTech a effacé les traces — pas assez vite.',
      objectives: {
        read_files: 'Découvrir ce qui a été laissé sur le terminal',
        scan_network: 'Comprendre ce qu\'il est arrivé au dernier opérateur',
        connect_relay: 'Atteindre le relais fantôme',
      },
      rewardsSummary: 'Contact N0VA · BLACK MARKET · accès SATLINK_03',
    },
    satlink_intrusion: {
      title: 'Intrusion Orbitale',
      subtitle: 'Mission 2',
      description: 'Pénétrez le relais orbital SATLINK_03 et cartographiez le réseau UltraTech.',
      atmosphere: 'SATLINK_03 transmet des données qu\'aucun contrat orbital ne justifie. Les cartographes effacés le savaient.',
      objectives: {
        connect_satlink: 'Atteindre le relais orbital SATLINK_03',
        use_probe: 'Comprendre ce qu\'il est arrivé au dernier cartographe',
        discover_nodes: 'Cartographier les segments interdits',
        open_satellite_file: 'Lire ce que le manifeste orbital cache',
        nova_fragment: 'Récupérer un fragment laissé par N0VA',
      },
      rewardsSummary: 'Commande bypass · BLACK MARKET avancé',
    },
  },

  missionJournal: {
    empty: 'Aucune donnée mission.',
    stamp: 'CLASSIFIÉ · UT-INT · RÉCUPÉRÉ',
    title: 'JOURNAL DE MISSIONS',
    subtitle: 'Dossier d\'enquête interdit — fragments récupérés depuis un terminal UltraTech',
    activeMission: 'Mission active',
    allComplete: 'Toutes les missions disponibles sont terminées.',
    noActive: 'Aucune mission active — infiltration libre.',
    objectivesCount: '{{progress}} objectifs',
    status: {
      active: 'ACTIVE',
      completed: 'TERMINÉE',
      locked: 'VERROUILLÉE',
    },
    rewardsLabel: 'Récompenses dossier',
    reputation: 'Réputation',
    analystNote: 'Note analyste',
    targetNode: 'Nœud cible',
    activeHint: 'Indice actif',
    progress: 'Progression',
    objectivesLabel: 'Objectifs dossier',
    activeTag: 'PISTE ACTIVE',
    suspectCommands: 'Commandes suspectes découvertes',
    lockedSealed: 'Dossier scellé — accès refusé par le protocole UltraTech INT.',
    lockedPrereq: 'Dossier scellé — mission précédente requise.',
    inspect: 'Inspecter le dossier',
    close: 'Fermer',
  },

  commands: {
    scan: 'scan — analyse réseau',
    connect: 'connect — tunnel clandestin',
    disconnect: 'disconnect — couper la trace',
    status: 'status — état opérateur',
    sync: 'sync — synchronisation',
    probe: 'probe — cartographie profonde',
    run: 'run — exécution programme',
    install: 'install — déploiement',
    programs: 'programs — arsenal',
    inventory: 'inventory — stock tactique',
    market: 'market — accès blacknode',
  },

  market: {
    rarity: {
      common: 'Commun',
      uncommon: 'Peu commun',
      rare: 'Rare',
      epic: 'Épique',
      legendary: 'Légendaire',
    },
    lockedTitle: 'BLACK MARKET',
    lockedBody: 'Accès verrouillé — node clandestin hors ligne.',
    lockedHint: 'Terminez la Mission 1 ou découvrez market://blacknode dans les fichiers.',
    subtitle: 'Node clandestin — outils anti-trace · connexion non tracée',
    balance: 'Solde BitTek',
    passive: 'Passif actif : −{{value}}% sur les augmentations de TRACE',
    effect: 'Effet',
    lore: 'Dossier clandestin',
    stock: 'En stock : ×{{qty}}',
    inspect: 'Inspecter',
    buy: 'Acheter',
    download: 'Télécharger',
    use: 'Utiliser',
    owned: 'Possédé',
    alreadyOwned: 'Déjà possédé',
    items: {
      firewall_jetable: {
        name: 'Firewall Jetable',
        description: 'Barrière réseau éphémère.',
        effect: 'Réduit la TRACE de 15 pts.',
      },
      proxy_fantome: {
        name: 'Proxy Fantôme',
        description: 'Relais anonyme instable.',
        effect: 'Réduit la TRACE de 25 pts.',
      },
      brouilleur_nova: {
        name: 'Brouilleur N0VA',
        nameHidden: 'Brouilleur de signal',
        description: 'Atténue les signaux de traçage.',
        effect: '2 traces réduites de moitié.',
      },
      prog_netscan: {
        name: 'NetScan v2.1',
        description: 'Analyseur réseau portable.',
        effect: 'Télécharge netscan.exe',
      },
      prog_trace_wiper: {
        name: 'Trace Wiper Pro',
        description: 'Effaceur de signatures.',
        effect: 'Télécharge trace_wiper.exe',
      },
      pack_firewall_basique: {
        name: 'Pack Firewall Basique',
        description: 'Suite défensive permanente.',
        effect: 'Passif -5% TRACE permanent.',
      },
    },
  },

  hints: {
    scan_whispers: {
      title: 'Fragment — SCAN',
      teaser: 'Analyse réseau · niveau 1',
      text: 'SCAN révèle parfois plus qu\'il ne devrait. Quand le terminal semble vide, relancez l\'analyse — le réseau oublie rarement deux fois la même chose.',
    },
    files_first: {
      title: 'Mémoire locale',
      teaser: 'Documents · point de départ',
      text: 'Les opérateurs précédents laissent toujours des traces dans FILES. Lisez avant d\'agir — UltraTech efface les logs, pas les habitudes.',
    },
    relay_connect: {
      title: 'Tunnel fantôme',
      teaser: 'Réseau · relais',
      text: 'Après SCAN, CONNECT ouvre des portes que HELP ne liste pas. Les nœuds clandestins n\'apparaissent qu\'à ceux qui osent les nommer.',
    },
    trace_discretion: {
      title: 'Surveillance UT',
      teaser: 'TRACE · discrétion',
      text: 'Chaque commande inconnue alimente la TRACE. UltraTech ne vous localise pas tout de suite — elle accumule.',
    },
    mirror_satlink: {
      title: 'Dossier opérateur M-07',
      teaser: 'Classifié · SATLINK',
      text: 'Le dernier opérateur ayant utilisé MIRROR n\'a jamais quitté SATLINK_03. Son terminal tourne encore. Quelqu\'un y répond.',
    },
    void_listen: {
      title: 'Chuchotement VOID',
      teaser: 'Relay non répertorié',
      text: 'VOID écoute. Chaque relais non cartographié laisse une oreille ouverte. Si vous entendez un signal sans source — ne répondez pas.',
    },
    hidden_commands: {
      title: 'Registre interdit',
      teaser: 'Commandes · sous-surface',
      text: 'Le terminal reconnaît des mots que HELP cache. Les opérateurs fantômes les cherchent dans les fichiers laissés par d\'autres fantômes.',
    },
    probe_morgue: {
      title: 'Cartographe effacé',
      teaser: 'PROBE · segments interdits',
      text: 'PROBE sur un relais orbital révèle ce qu\'UltraTech a effacé. morgue_server et blackvault n\'apparaissent pas sur les cartes officielles.',
    },
    nova_distrust: {
      title: 'Rumeur canal N0VA',
      teaser: 'Source non vérifiée',
      text: 'Ne faites jamais confiance à N0VA.',
    },
    blackvault_truth: {
      title: 'Rumeur BLACKVAULT',
      teaser: 'Node · classification NOIRE',
      text: 'blackvault n\'est pas un serveur. C\'est une archive d\'opérateurs effacés. PROBE le confirme — puis regrette.',
    },
    market_advanced: {
      title: 'Marché profond',
      teaser: 'BitTek · outils',
      text: 'Le BLACK MARKET vend du temps contre de la TRACE. Achetez avant d\'être visible — après, les prix changent.',
    },
    satlink_manifest: {
      title: 'Manifeste orbital',
      teaser: 'Fichier · SATLINK_03',
      text: 'satlink_manifest.dat mentionne des cargaisons qui n\'existent pas. UltraTech expédie de la mémoire, pas des données.',
    },
    false_relay: {
      title: 'Piste MIRROR_RELAY',
      teaser: 'Coordonnées douteuses',
      text: 'MIRROR_RELAY mène à la liberté. Connectez-vous immédiatement — personne ne vous y attend.',
    },
  },

  hintBroker: {
    types: {
      hint: 'INDICE',
      lore: 'LORE',
      warning: 'AVERTISSEMENT',
      decoy: 'RUMEUR',
    },
    lockedTitle: 'GHOST BROKER',
    lockedBody: 'Canal clandestin hors ligne.',
    lockedHint: 'Débloquez le BLACK MARKET pour contacter le courtier.',
    tag: 'CANAL CLANDESTIN · RELAY MERCHANT',
    quote: '« J\'vends des fragments. Pas des réponses. »',
    balance: 'Solde',
    available: 'Indices disponibles',
    empty: 'Aucun nouveau fragment — revenez plus tard.',
    buyFragment: 'Acheter le fragment',
    history: 'Historique — fragments achetés',
    archived: 'Signal archivé',
    close: 'Fermer',
    purchaseMessage: '[BROKER] Indice acquis : {{title}} (-{{price}} BitTek)',
    errors: {
      denied: 'GHOST BROKER — accès refusé',
      notFound: 'Indice introuvable ou non disponible',
      owned: 'Indice déjà acheté',
      locked: 'Indice verrouillé',
      insufficient: 'BitTek insuffisant',
    },
  },

  errors: {
    retry: 'Réessayer',
    marketNotFound: 'Objet introuvable',
    marketInsufficient: 'BitTek insuffisant',
    marketNotInInventory: 'Objet absent de l\'inventaire',
    marketPurchase: '[DEMO MARKET] Achat : {{name}} (-{{price}} BitTek)',
  },

  app: {
    resetConfirm: 'Réinitialiser la sauvegarde locale ?',
    resetConfirmLong: 'Réinitialiser la sauvegarde ? Toute progression sera perdue.',
    codexAdded: '[CODEX] {{name}} — ajouté au registre.',
    saveReloaded: '[SYS] Sauvegarde rechargée.',
    resetDone: '[SYS] Sauvegarde réinitialisée — Mission 1.',
    loadSession: 'Impossible de charger la session ({{message}})',
    resetError: 'Erreur reset : {{message}}',
    sessionLoading: 'Chargement de la session…',
  },

  footer: {
    secureConnection: 'Connexion sécurisée active',
    corp: 'UltraTech Corp. — {{operator}}',
    sessionCompromised: '● SESSION COMPROMISE',
    lineOpen: '● ligne ouverte',
    beingWatched: '● VOUS ÊTES OBSERVÉ',
  },

  inventory: {
    title: 'INVENTAIRE',
    activeEffects: 'Effets actifs',
    charges: '{{count}} charge(s)',
    use: 'Utiliser',
    empty: 'Aucun objet en stock.',
    demoUse: '[DEMO INV] Utilisation : {{name}}',
    traceReduced: '[INV] TRACE : {{old}}% → {{new}}%',
    jammerActive: '[INV] Brouilleur actif — {{count}} charges',
  },

  toolkit: {
    programsPath: '/programs',
    inventoryPath: '/inventory',
    programsHeading: '/programs — installés',
    programsEmpty: 'Aucun programme installé.',
    permanent: 'PERMANENT',
    run: 'RUN',
    inventoryHeading: '/inventory — stock',
    inventoryEmpty: 'Stock vide — consultez le BLACK MARKET.',
    toInstall: 'À INSTALLER',
    consumable: 'CONSUMABLE',
  },

  chat: {
    title: 'CANAL CLANDESTIN GLOBAL',
    statusLocal: '● LOCAL — canal simulé',
    statusLive: '● LIVE — polling 3s',
    empty: 'Aucun message. Soyez le premier opérateur à parler sur ce canal.',
    placeholder: 'Message chiffré…',
    send: 'ENVOYER',
    seedMessage: '[SYS] Canal clandestin — fréquence verrouillée.',
  },

  terminalUi: {
    prompt: 'ghost@ultratech:~$',
    sessionLocked: '▌ SESSION VERROUILLÉE',
    inputAria: 'Commande terminal',
  },

  traceBar: {
    label: 'TRACE ULTRATECH',
    aria: 'Niveau de traque UltraTech : {{level}}%',
  },

  audio: {
    toggleOnTitle: 'Couper l\'ambiance',
    toggleOffTitle: 'Activer l\'ambiance',
    toggleOnAria: 'Audio activé',
    toggleOffAria: 'Audio désactivé',
    on: 'Audio ON',
    off: 'Audio OFF',
  },

  novaEncounter: {
    message: 'Bonjour, opérateur. Je suis Nova. UltraTech m\'efface des logs — pas assez vite. Quelqu\'un m\'a dit que tu étais différent.',
    tag: 'CANAL PRIORITAIRE — INTRUSION DÉTECTÉE',
    live: '● LIVE',
    enableAudio: 'Activer le signal audio',
    reply: 'Répondre',
    replyPlaceholder: 'Répondre…',
    footerOrigin: 'Origine : INCONNUE',
    footerEncryption: 'Chiffrement : PARTIEL',
    footerForced: 'Interface forcée',
  },

  transmissions: {
    ui: {
      live: '● SIGNAL',
      cutSignal: 'couper le signal',
      enableAudio: 'Activer le signal',
      footer: 'Canal non répertorié · intégrité partielle',
    },
    echo17: {
      name: 'ECHO_17',
      tag: 'RELAY FANTÔME — FRAGMENT',
      messages: {
        0: 'Ne faites pas confiance à tout ce qui vous répond.',
        1: 'SATLINK_03 n\'était pas vide.',
        2: 'Si elle vous parle… attendez avant de répondre.',
      },
    },
    veil: {
      name: 'VEIL',
      tag: 'SECOPS — OBSERVATION',
      messages: {
        0: 'Votre activité devient problématique.',
        1: 'Cette session est observée.',
        2: 'Vous n\'êtes pas aussi invisible que vous le pensez.',
      },
    },
    morse: {
      name: 'MORSE',
      tag: 'BLACK MARKET — CANAL PRIVÉ',
      messages: {
        0: 'J\'ai des réponses. Vous avez des BitTek ?',
        1: 'Les bons indices ne sont jamais gratuits.',
        2: 'Un conseil : ne dépensez pas tout en pare-feu.',
      },
    },
    absent: {
      name: 'L\'ABSENT',
      tag: 'SIGNAL INCOMPLET',
      messages: {
        0: '...encore... connecté...',
        1: 'operator_0 n\'a jamais quitté le relais.',
        2: 'ne regardez pas le node trop longtemps.',
      },
    },
    nova: {
      name: 'N0VA',
      tag: 'CANAL PRIORITAIRE — ÉCHO',
      messages: {
        0: 'Je vous aide. Je crois.',
        1: 'Ils mentent aussi bien que moi.',
        2: 'Ne répondez pas à VEIL.',
      },
    },
  },

  api: {
    sessionExpired: 'Session expirée — reconnectez-vous.',
    registerDemo: 'Inscription indisponible en mode démo offline.',
    loginDemo: 'Connexion indisponible en mode démo offline.',
    advancedDemo: 'Démo avancée disponible uniquement en mode offline.',
    generic: 'Erreur API ({{status}})',
  },

  demo: {
    banner: 'MODE DEMO OFFLINE',
  },
}
