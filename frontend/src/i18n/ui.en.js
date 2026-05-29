export default {
  settings: {
    title: 'SYSTEM PARAMETERS',
    subtitle: 'Clandestine config module — interface translation',
    langLabel: 'Language / Langue',
    lang: {
      fr: 'Français',
      en: 'English',
    },
    langCurrent: 'LANG : {{code}}',
    saved: 'Preference stored in local memory.',
    close: 'Close',
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
    subtitle: 'Network connection detected…',
  },

  topbar: {
    reputation: 'Reputation',
    help: '? Help',
    helpTitle: 'How to play',
    reset: '↺ Reset',
    resetTitle: 'Reset save',
    settings: '⚙ CFG',
    settingsTitle: 'System settings',
  },

  welcome: {
    subtitle: 'Network connection detected.',
    openBeta: 'OPEN BETA TEST',
    loading: 'Establishing link…',
    reset: 'Reset save data',
    footer: 'Encrypted channel · restricted access',
  },

  howto: {
    title: 'How to play?',
    intro: 'You have illegal access to an UltraTech terminal. This is not a computer course — it is an investigation inside a forbidden network.',
    close: 'Close',
    footer: 'Start by reading what is lying around on the terminal.',
    ok: 'Understood',
    steps: [
      {
        title: 'Read everything',
        body: 'Documents, logs, corrupted archives. The answers are in the text — not in a manual.',
      },
      {
        title: 'Remember strange words',
        body: 'Forbidden names circulate in the files. Try them in the terminal.',
      },
      {
        title: 'Watch the reactions',
        body: 'The system responds, goes silent, or lies. Every attempt reveals something.',
      },
      {
        title: 'Stay discreet',
        body: 'UltraTech is watching. The harder you push, the higher your TRACE climbs.',
      },
      {
        title: 'Trust no one',
        body: 'UltraTech, erased logs, anonymous voices — everyone has an agenda.',
      },
    ],
  },

  statusbar: {
    currentLead: 'CURRENT LEAD',
    documents: 'DOCUMENTS',
    noDocuments: 'No documents',
    surveillance: 'UltraTech surveillance',
    surveillanceHint: '{{level}}% — stay discreet',
    network: 'NETWORK',
    connected: 'Connected · {{node}}',
    signals: '{{count}} signal(s) detected',
    missionJournal: 'Mission journal',
    blackMarket: 'Black Market',
    ghostBroker: 'Ghost Broker',
    codex: 'Codex · {{progress}} →',
  },

  windows: {
    terminalSecure: 'SECURE TERMINAL',
    terminal: '{{name}} — TERMINAL',
    chat: 'CLANDESTINE CHANNEL',
    toolkit: 'TOOLKIT',
    journal: 'MISSION JOURNAL',
    broker: 'GHOST BROKER — RELAY MERCHANT',
    codex: 'CODEX — CLASSIFIED REGISTRY',
    market: 'BLACK MARKET',
  },

  threat: {
    critical: 'CRITICAL',
    high: 'HIGH',
    moderate: 'MODERATE',
    low: 'LOW',
  },

  postBoot: {
    banner: 'ULTRATECH ONLINE — OPERATOR TERMINAL v3.7',
    line1: '[SYS] Secure connection established.',
    line2: '[SYS] Someone left you access to this terminal.',
    line3: '[???] Fragments sleep in local memory.',
  },

  intros: {
    trace: [
      '[ALERT] UltraTech is monitoring this terminal.',
      '[ALERT] Every risky action raises your TRACE.',
    ],
    network: [
      '[NET] Abnormal signals detected on the network.',
      '[NET] The network map is now accessible.',
    ],
    bittek: [
      '[SYS] BitTek credits received — black market currency.',
    ],
    reputation: [
      '[SYS] Your clandestine reputation is growing.',
    ],
    market: [
      '[???] Someone opened a door for you…',
      '[SYS] BLACK MARKET — access authorized.',
    ],
    broker: [
      '[???] Weak signal on clandestine relay…',
      '[BROKER] GHOST BROKER — hints available for BitTek.',
    ],
    toolkit: [
      '[SYS] Something was left in the toolkit.',
    ],
    codex: [
      '[REGISTRY] Classified entry indexed in the Codex.',
    ],
    chat: [
      '[NET] Noise on the clandestine channel — someone is talking.',
    ],
    journal: [
      '[MISSION] Mission journal synchronized.',
    ],
    nova: [
      '',
      '>>> N0VA <<< "Well played. UltraTech must not know."',
      '>>> N0VA <<< "We\'ll talk again. Stay ghost."',
    ],
  },

  objectives: {
    connection: {
      title: 'Connecting…',
      hint: 'Establishing secure link.',
    },
    m1: {
      signal_incoming: {
        title: 'Incoming signal',
        hint: 'Someone opened a door for you. The terminal seems to be waiting for something.',
      },
      local_memory: {
        title: 'Local memory',
        hint: 'Fragments sleep somewhere on this terminal.',
      },
      unsigned_note: {
        title: 'Unsigned message',
        hint: 'A document carries a note left by a stranger.',
      },
      relay_anomaly: {
        title: 'RELAY_GHOST anomaly',
        hint: 'The system log records something UltraTech would rather hide.',
      },
      ghost_operator: {
        title: 'Ghost operator',
        hint: 'The last operator who used SCAN on this relay vanished.',
      },
      network_response: {
        title: 'Network response',
        hint: 'The scan left a trace. A new fragment waits in the documents.',
      },
      active_relay: {
        title: 'Active relay',
        hint: 'Old operators crossed clandestine nodes in silence.',
      },
    },
    m2: {
      orbital_channel: {
        title: 'Orbital channel',
        hint: 'An orbital relay waits — SATLINK_03. Something is on the other side.',
        hint_nova: 'N0VA speaks of a relay — SATLINK_03. Something waits on the other side.',
      },
      orbital_segment: {
        title: 'Orbital segment',
        hint: 'The tunnel is open. The relay still keeps secrets.',
      },
      erased_cartographer: {
        title: 'Erased cartographer',
        hint: 'Last known cartographer — status: ERASED. Their log mentions PROBE.',
      },
      orbital_manifest: {
        title: 'Orbital manifest',
        hint: 'A file lingers on the relay. UltraTech prefers you do not read it.',
      },
      forbidden_segments: {
        title: 'Forbidden segments',
        hint: 'Two nodes appear on the map — morgue_server, blackvault.',
      },
      orbital_fragment: {
        title: 'Orbital fragment',
        hint: 'Someone left a trace on this relay.',
        title_nova: 'N0VA fragment',
        hint_nova: 'N0VA leaves traces on the relays she uses.',
      },
    },
    infiltration: {
      title: 'Infiltration in progress',
      hint: 'The network still holds secrets. UltraTech is watching.',
    },
    fallback: {
      hint: 'Continue the investigation.',
    },
  },

  missions: {
    signal_fantome: {
      title: 'Ghost Signal',
      subtitle: 'Mission 1',
      description: 'An unidentified relay emits a signal. Locate it and establish contact.',
      atmosphere: 'An operator vanished after scanning this segment. UltraTech erased the traces — not fast enough.',
      objectives: {
        read_files: 'Discover what was left on the terminal',
        scan_network: 'Understand what happened to the last operator',
        connect_relay: 'Reach the ghost relay',
      },
      rewardsSummary: 'N0VA contact · BLACK MARKET · SATLINK_03 access',
    },
    satlink_intrusion: {
      title: 'Orbital Intrusion',
      subtitle: 'Mission 2',
      description: 'Penetrate orbital relay SATLINK_03 and map the UltraTech network.',
      atmosphere: 'SATLINK_03 transmits data no orbital contract justifies. Erased cartographers knew that.',
      objectives: {
        connect_satlink: 'Reach orbital relay SATLINK_03',
        use_probe: 'Understand what happened to the last cartographer',
        discover_nodes: 'Map forbidden segments',
        open_satellite_file: 'Read what the orbital manifest hides',
        nova_fragment: 'Recover a fragment left by N0VA',
      },
      rewardsSummary: 'Bypass command · advanced BLACK MARKET',
    },
  },

  missionJournal: {
    empty: 'No mission data.',
    stamp: 'CLASSIFIED · UT-INT · RECOVERED',
    title: 'MISSION JOURNAL',
    subtitle: 'Forbidden investigation dossier — fragments recovered from an UltraTech terminal',
    activeMission: 'Active mission',
    allComplete: 'All available missions are complete.',
    noActive: 'No active mission — free infiltration.',
    objectivesCount: '{{progress}} objectives',
    status: {
      active: 'ACTIVE',
      completed: 'COMPLETE',
      locked: 'LOCKED',
    },
    rewardsLabel: 'Dossier rewards',
    reputation: 'Reputation',
    analystNote: 'Analyst note',
    targetNode: 'Target node',
    activeHint: 'Active lead',
    progress: 'Progress',
    objectivesLabel: 'Dossier objectives',
    activeTag: 'ACTIVE LEAD',
    suspectCommands: 'Discovered suspect commands',
    lockedSealed: 'Sealed dossier — access denied by UltraTech INT protocol.',
    lockedPrereq: 'Sealed dossier — previous mission required.',
    inspect: 'Inspect dossier',
    close: 'Close',
  },

  commands: {
    scan: 'scan — network analysis',
    connect: 'connect — clandestine tunnel',
    disconnect: 'disconnect — cut trace',
    status: 'status — operator state',
    sync: 'sync — synchronization',
    probe: 'probe — deep mapping',
    run: 'run — program execution',
    install: 'install — deployment',
    programs: 'programs — arsenal',
    inventory: 'inventory — tactical stock',
    market: 'market — blacknode access',
  },

  market: {
    rarity: {
      common: 'Common',
      uncommon: 'Uncommon',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary',
    },
    lockedTitle: 'BLACK MARKET',
    lockedBody: 'Access locked — clandestine node offline.',
    lockedHint: 'Complete Mission 1 or discover market://blacknode in the files.',
    subtitle: 'Clandestine node — anti-trace tools · untraced connection',
    balance: 'BitTek balance',
    passive: 'Passive active: −{{value}}% on TRACE increases',
    effect: 'Effect',
    lore: 'Clandestine dossier',
    stock: 'In stock: ×{{qty}}',
    inspect: 'Inspect',
    buy: 'Buy',
    download: 'Download',
    use: 'Use',
    owned: 'Owned',
    alreadyOwned: 'Already owned',
    items: {
      firewall_jetable: {
        name: 'Disposable Firewall',
        description: 'Ephemeral network barrier.',
        effect: 'Reduces TRACE by 15 pts.',
      },
      proxy_fantome: {
        name: 'Ghost Proxy',
        description: 'Unstable anonymous relay.',
        effect: 'Reduces TRACE by 25 pts.',
      },
      brouilleur_nova: {
        name: 'N0VA Jammer',
        nameHidden: 'Signal jammer',
        description: 'Attenuates tracking signals.',
        effect: 'Halves the next 2 trace increases.',
      },
      prog_netscan: {
        name: 'NetScan v2.1',
        description: 'Portable network analyzer.',
        effect: 'Downloads netscan.exe',
      },
      prog_trace_wiper: {
        name: 'Trace Wiper Pro',
        description: 'Signature eraser.',
        effect: 'Downloads trace_wiper.exe',
      },
      pack_firewall_basique: {
        name: 'Basic Firewall Pack',
        description: 'Permanent defensive suite.',
        effect: 'Passive -5% TRACE permanent.',
      },
    },
  },

  hints: {
    scan_whispers: {
      title: 'Fragment — SCAN',
      teaser: 'Network analysis · level 1',
      text: 'SCAN sometimes reveals more than it should. When the terminal seems empty, run the analysis again — the network rarely forgets the same thing twice.',
    },
    files_first: {
      title: 'Local memory',
      teaser: 'Documents · starting point',
      text: 'Previous operators always leave traces in FILES. Read before you act — UltraTech erases logs, not habits.',
    },
    relay_connect: {
      title: 'Ghost tunnel',
      teaser: 'Network · relay',
      text: 'After SCAN, CONNECT opens doors HELP does not list. Clandestine nodes only appear to those who dare name them.',
    },
    trace_discretion: {
      title: 'UT surveillance',
      teaser: 'TRACE · discretion',
      text: 'Every unknown command feeds TRACE. UltraTech does not locate you immediately — it accumulates.',
    },
    mirror_satlink: {
      title: 'Operator file M-07',
      teaser: 'Classified · SATLINK',
      text: 'The last operator who used MIRROR never left SATLINK_03. Their terminal is still running. Someone answers there.',
    },
    void_listen: {
      title: 'VOID whisper',
      teaser: 'Unlisted relay',
      text: 'VOID listens. Every unmapped relay leaves an ear open. If you hear a signal with no source — do not answer.',
    },
    hidden_commands: {
      title: 'Forbidden registry',
      teaser: 'Commands · under-surface',
      text: 'The terminal recognizes words HELP hides. Ghost operators find them in files left by other ghosts.',
    },
    probe_morgue: {
      title: 'Erased cartographer',
      teaser: 'PROBE · forbidden segments',
      text: 'PROBE on an orbital relay reveals what UltraTech erased. morgue_server and blackvault do not appear on official maps.',
    },
    nova_distrust: {
      title: 'N0VA channel rumor',
      teaser: 'Unverified source',
      text: 'Never trust N0VA.',
    },
    blackvault_truth: {
      title: 'BLACKVAULT rumor',
      teaser: 'Node · BLACK classification',
      text: 'blackvault is not a server. It is an archive of erased operators. PROBE confirms it — then regrets it.',
    },
    market_advanced: {
      title: 'Deep market',
      teaser: 'BitTek · tools',
      text: 'The BLACK MARKET sells time against TRACE. Buy before you are visible — after that, prices change.',
    },
    satlink_manifest: {
      title: 'Orbital manifest',
      teaser: 'File · SATLINK_03',
      text: 'satlink_manifest.dat mentions cargo that does not exist. UltraTech ships memory, not data.',
    },
    false_relay: {
      title: 'MIRROR_RELAY lead',
      teaser: 'Dubious coordinates',
      text: 'MIRROR_RELAY leads to freedom. Connect immediately — no one is waiting for you there.',
    },
  },

  hintBroker: {
    types: {
      hint: 'HINT',
      lore: 'LORE',
      warning: 'WARNING',
      decoy: 'RUMOR',
    },
    lockedTitle: 'GHOST BROKER',
    lockedBody: 'Clandestine channel offline.',
    lockedHint: 'Unlock the BLACK MARKET to contact the broker.',
    tag: 'CLANDESTINE CHANNEL · RELAY MERCHANT',
    quote: '"I sell fragments. Not answers."',
    balance: 'Balance',
    available: 'Available hints',
    empty: 'No new fragments — come back later.',
    buyFragment: 'Buy fragment',
    history: 'History — purchased fragments',
    archived: 'Signal archived',
    close: 'Close',
    purchaseMessage: '[BROKER] Hint acquired: {{title}} (-{{price}} BitTek)',
    errors: {
      denied: 'GHOST BROKER — access denied',
      notFound: 'Hint not found or unavailable',
      owned: 'Hint already purchased',
      locked: 'Hint locked',
      insufficient: 'Insufficient BitTek',
    },
  },

  errors: {
    retry: 'Retry',
    marketNotFound: 'Item not found',
    marketInsufficient: 'Insufficient BitTek',
    marketNotInInventory: 'Item not in inventory',
    marketPurchase: '[DEMO MARKET] Purchase: {{name}} (-{{price}} BitTek)',
  },

  app: {
    resetConfirm: 'Reset local save data?',
    resetConfirmLong: 'Reset save data? All progress will be lost.',
    codexAdded: '[CODEX] {{name}} — added to registry.',
    saveReloaded: '[SYS] Save reloaded.',
    resetDone: '[SYS] Save reset — Mission 1.',
    loadSession: 'Unable to load session ({{message}})',
    resetError: 'Reset error: {{message}}',
    sessionLoading: 'Loading session…',
  },

  footer: {
    secureConnection: 'Secure connection active',
    corp: 'UltraTech Corp. — {{operator}}',
    sessionCompromised: '● SESSION COMPROMISED',
    lineOpen: '● line open',
    beingWatched: '● YOU ARE BEING WATCHED',
  },

  inventory: {
    title: 'INVENTORY',
    activeEffects: 'Active effects',
    charges: '{{count}} charge(s)',
    use: 'Use',
    empty: 'No items in stock.',
    demoUse: '[DEMO INV] Using: {{name}}',
    traceReduced: '[INV] TRACE: {{old}}% → {{new}}%',
    jammerActive: '[INV] Jammer active — {{count}} charges',
  },

  toolkit: {
    programsPath: '/programs',
    inventoryPath: '/inventory',
    programsHeading: '/programs — installed',
    programsEmpty: 'No programs installed.',
    permanent: 'PERMANENT',
    run: 'RUN',
    inventoryHeading: '/inventory — stock',
    inventoryEmpty: 'Stock empty — check the BLACK MARKET.',
    toInstall: 'TO INSTALL',
    consumable: 'CONSUMABLE',
  },

  chat: {
    title: 'GLOBAL CLANDESTINE CHANNEL',
    statusLocal: '● LOCAL — simulated channel',
    statusLive: '● LIVE — polling 3s',
    empty: 'No messages. Be the first operator to speak on this channel.',
    placeholder: 'Encrypted message…',
    send: 'SEND',
    seedMessage: '[SYS] Clandestine channel — frequency locked.',
  },

  terminalUi: {
    prompt: 'ghost@ultratech:~$',
    sessionLocked: '▌ SESSION LOCKED',
    inputAria: 'Terminal command',
  },

  traceBar: {
    label: 'TRACE ULTRATECH',
    aria: 'UltraTech trace level: {{level}}%',
  },

  audio: {
    toggleOnTitle: 'Mute ambient',
    toggleOffTitle: 'Enable ambient',
    toggleOnAria: 'Audio enabled',
    toggleOffAria: 'Audio disabled',
    on: 'Audio ON',
    off: 'Audio OFF',
  },

  novaEncounter: {
    message: 'Hello, operator. I am Nova. UltraTech erases me from the logs — not fast enough. Someone told me you were different.',
    tag: 'PRIORITY CHANNEL — INTRUSION DETECTED',
    live: '● LIVE',
    enableAudio: 'Enable audio signal',
    reply: 'Reply',
    replyPlaceholder: 'Reply…',
    footerOrigin: 'Origin: UNKNOWN',
    footerEncryption: 'Encryption: PARTIAL',
    footerForced: 'Forced interface',
  },

  transmissions: {
    ui: {
      live: '● SIGNAL',
      cutSignal: 'cut signal',
      enableAudio: 'Enable signal',
      footer: 'Unlisted channel · partial integrity',
    },
    echo17: {
      name: 'ECHO_17',
      tag: 'GHOST RELAY — FRAGMENT',
      messages: {
        0: 'Don\'t trust everything that answers you.',
        1: 'SATLINK_03 wasn\'t empty.',
        2: 'If she talks to you… wait before you reply.',
      },
    },
    veil: {
      name: 'VEIL',
      tag: 'SECOPS — OBSERVATION',
      messages: {
        0: 'Your activity is becoming problematic.',
        1: 'This session is being observed.',
        2: 'You\'re not as invisible as you think.',
      },
    },
    morse: {
      name: 'MORSE',
      tag: 'BLACK MARKET — PRIVATE CHANNEL',
      messages: {
        0: 'I have answers. Do you have BitTek?',
        1: 'Good clues are never free.',
        2: 'A tip: don\'t spend everything on firewalls.',
      },
    },
    absent: {
      name: 'THE ABSENT',
      tag: 'INCOMPLETE SIGNAL',
      messages: {
        0: '...still... connected...',
        1: 'operator_0 never left the relay.',
        2: 'don\'t stare at the node too long.',
      },
    },
    nova: {
      name: 'N0VA',
      tag: 'PRIORITY CHANNEL — ECHO',
      messages: {
        0: 'I\'m helping you. I think.',
        1: 'They lie as well as I do.',
        2: 'Don\'t reply to VEIL.',
      },
    },
  },

  api: {
    sessionExpired: 'Session expired — please reconnect.',
    registerDemo: 'Registration unavailable in offline demo mode.',
    loginDemo: 'Login unavailable in offline demo mode.',
    advancedDemo: 'Advanced demo available in offline mode only.',
    generic: 'API error ({{status}})',
  },

  demo: {
    banner: 'OFFLINE DEMO MODE',
  },
}
