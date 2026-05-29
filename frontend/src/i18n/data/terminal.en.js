export default {
  help: {
    header: 'Partial registry — words the terminal recognizes:',
    footer: '[???] This terminal knows more than it admits.',
  },

  files: {
    empty: '[EMPTY] No accessible fragments.',
    header: 'Local fragments:',
    localHeader: 'Local fragments:',
  },

  ls: {
    programsDir: 'Directory : /programs',
    inventoryDir: 'Directory : /inventory',
    programsEmpty: '[EMPTY] No installed programs.',
    inventoryEmpty: '[EMPTY] No programs in stock.',
    currentDir: 'Current directory : {{path}}',
    dirPrograms: '  [DIR] /programs          — {{count}} installed',
    dirInventory: '  [DIR] /inventory         — {{count}} in stock',
    programEntry: '  {{filename}} — {{name}} [PERMANENT]',
    inventoryEntry: '  {{filename}} — x{{quantity}} [{{type}}]',
    fileEntry: '  {{name}} — {{description}}',
    fileEntryBullet: '  • {{name}} {{description}}',
  },

  open: {
    usage: '[ERR] Usage : open [file]',
    inaccessible: '[ERR] File inaccessible : \'{{name}}\'',
    unknown: '[ERR] Unknown file : \'{{name}}\'',
    header: '=== {{name}} ===',
  },

  status: {
    banner: '╔══════════════════════════════════════════════════╗',
    title: '║  OPERATOR STATUS                                  ║',
    footerBanner: '╚══════════════════════════════════════════════════╝',
    identifier: '  Identifier   : {{username}}',
    bittek: '  BitTek       : {{bittek}}',
    reputation: '  Reputation   : {{reputation}}',
    trace: '  UT Trace     : {{trace}}%',
    network: '  Network :',
    activeNode: '    • Active node  : {{node}}',
    security: '    • Security     : {{security}}',
    multiplier: '    • Trace mult.  : x{{multiplier}}',
    footer: '  [SYS] Secure channel — encrypted data.',
  },

  connect: {
    usage: '[ERR] Usage : connect [node]',
    undiscovered: '[ERR] Node \'{{target}}\' not discovered.',
    unknown: '[ERR] Unknown node : \'{{target}}\'',
    mirror: [
      '[NET] Unstable tunnel — reflection detected...',
      '[NET] Connected to {{nodeName}}',
      '[???] This node does not exist in UltraTech registries.',
      '[???] Someone is watching from the other side of the mirror.',
      '[???] The reflection shows two exit paths.',
      '',
      '[???] "Do not look too long."',
    ],
    normal: [
      '[NET] Encrypted connection in progress…',
      '[NET] Tunnel established — {{nodeName}}',
      '[???] You are inside. Stay quiet.',
    ],
  },

  disconnect: {
    alreadyLocal: '[NET] Already on local terminal.',
    closing: '[NET] Closing encrypted tunnel...',
    disconnected: '[NET] Disconnected from {{node}}',
    backLocal: '[NET] Returned to local terminal.',
  },

  scan: {
    alreadyDone: '[SCAN] Analysis already performed.',
    alreadyRelay: '[SCAN] RELAY_GHOST relay active.',
    lines: [
      '[SCAN] Scanning local network…',
      '[SCAN] Abnormal response — RELAY_GHOST signature',
      '[SCAN] The relay only speaks to operators who scan first.',
      '[???] Someone is listening. So are you.',
      '[SYS] Fragment captured : ghost_relay.log',
      '[RELAY] Non-standard procedure : CONNECT relay_ghost',
    ],
  },

  probe: {
    noSegment: '[PROBE] No adjacent segment from this position.',
    lines: [
      '[PROBE] Orbital segment mapped.',
      '[PROBE] morgue_server — DETECTED',
      '[PROBE] blackvault — DETECTED (firewall active)',
    ],
  },

  run: {
    usage: '[ERR] Usage : run [program.exe]',
    notFound: '[ERR] Program not found : \'{{name}}\'',
    missing: '[ERR] {{filename}} not available.',
    executing: '[RUN] Executing : {{filename}}',
    consumed: '[RUN] {{filename}} consumed.',
    traceChange: '[RUN] TRACE : {{old}}% → {{new}}%',
    sniff: '[SNIFF] Node : {{node}} | x{{multiplier}}',
    ok: '[RUN] {{name}} — OK.',
  },

  market: {
    banner: '╔══════════════════════════════════════════════════╗',
    title: '║  BLACK MARKET [DEMO]                              ║',
    footerBanner: '╚══════════════════════════════════════════════════╝',
    balance: '  Balance : {{bittek}} BitTek',
    hint: '  [???] Someone left a door open on the desktop.',
  },

  sync: {
    demo: '[SYNC] Demo mode — local coherence OK.',
    status: '[SYNC] Trace : {{trace}}% | Node : {{node}}',
  },

  locked: {
    session: '[LOCKED] Session terminated.',
    gameOver: '[LOCKED] GAME OVER.',
  },

  unknown: {
    command: '[ERR] Unknown command : \'{{cmd}}\'',
    notImplemented: '[ERR] Command \'{{cmd}}\' not implemented in demo.',
    flavors: [
      '[SHELL] The shell ignores this request : \'{{cmd}}\'',
      '[SYS] No recognized procedure for \'{{cmd}}\'',
      '[ERR] That command does not exist here.',
      '[TRACE] UltraTech logged this attempt : \'{{cmd}}\'',
    ],
  },

  install: {
    undocumented: '[SYS] Undocumented procedure — the terminal refuses to confirm.',
  },

  trace: {
    activity30: '[TRACE] Unusual network activity detected.',
    analyzing60: '[TRACE] UltraTech is analyzing your signature.',
    gameOver: '[GAME OVER] UltraTech has located you.',
    critical: '[TRACE] CRITICAL LEVEL — 100% — GAME OVER IMMINENT',
    riseVariants: [
      '[TRACE] UltraTech +{{amount}} — request observed.',
      '[TRACE] Operator signature partially exposed (+{{amount}}).',
      '[TRACE] +{{amount}} — someone is counting your steps.',
    ],
  },

  reset: {
    message: '[SYS] Save reset — Mission 1 : Ghost Signal.',
  },

  advancedDemo: {
    message: '[DEMO] Advanced demo loaded — SATLINK_03, BLACK MARKET, missions unlocked.',
  },

  novaFirstContact: '[N0VA] First contact — incoming channel intercepted.',

  missionProgress: {
    objectiveComplete: '[MISSION] ✓ {{label}}',
    newMission: '[MISSION] New mission : {{title}}',
    objectives: {
      read_files: 'Discover what was left on the terminal',
      scan_network: 'Understand what happened to the last operator',
      connect_relay: 'Reach the ghost relay',
      connect_satlink: 'Reach the orbital relay SATLINK_03',
      use_probe: 'Understand what happened to the last cartographer',
      discover_nodes: 'Map the forbidden segments',
      open_satellite_file: 'Read what the orbital manifest hides',
      nova_fragment: 'Recover a fragment left by N0VA',
    },
    signalFantome: {
      bittekRep: '[SYS] +120 BitTek | +1 Reputation',
      firewallGift: '[SYS] Disposable Firewall added to inventory.',
      marketUnlocked: '[SYS] BLACK MARKET — access granted.',
      hintBroker: '[???] GHOST BROKER — hint channel open.',
      satlinkDetected: '[NET] New relay detected : SATLINK_03',
      missionComplete: '[MISSION] Ghost Signal — COMPLETE',
      novaIntercepted: '[???] Transmission intercepted — origin unknown.',
      novaLine1: '"Well played. UltraTech must not know."',
      novaLine2: '"The black market awaits. Stay ghost."',
      novaTransmission: {
        banner: '╔══════════════════════════════════════════════════╗',
        title: '║  INTERCEPTED TRANSMISSION — UNKNOWN ORIGIN       ║',
        footerBanner: '╚══════════════════════════════════════════════════╝',
        line1: '"Well played. UltraTech must not know."',
        line2: '"The black market awaits. Stay ghost."',
        signature: '— N0VA',
      },
    },
    satlinkIntrusion: {
      bittekRep: '[SYS] +180 BitTek | +1 Reputation',
      proxyGift: '[SYS] Ghost Proxy added to inventory.',
      missionComplete: '[MISSION] Orbital Intrusion — COMPLETE',
    },
  },

  hidden: {
    mirror: {
      unstable: '[MIRROR] Unstable reflection...',
      ascii: [
        '╔══════════════════════════════╗',
        '║  ghost_demo    ghost_demo    ║',
        '║       ↓            ↑         ║',
        '║  ultratech?    ultratech?    ║',
        '╚══════════════════════════════╝',
      ],
      memoryRecovered: '[SYS] memory_fragment.log — segment recovered.',
    },
    ghost: {
      activating: '[GHOST] Ghost beacon activated...',
      pause: '...',
      line1: '"Someone else is listening on this channel."',
      line2: '"It may not be N0VA."',
      signal: '[GHOST] Weak signal — 0x7F.GHOST',
      unknownSignal: '[GHOST] unknown_signal.enc — presence detected in /home.',
    },
    nova: {
      muted: '[???] Silent channel — origin unidentified.',
      dialogues: [
        [
          '>>> N0VA <<<',
          '',
          '"Operator. Trust no one on this network."',
          '"Not even me."',
        ],
        [
          '>>> N0VA <<<',
          '',
          '"UltraTech is not hunting hackers."',
          '"They are hunting proof that we exist."',
          '"You are proof, now."',
        ],
        [
          '>>> N0VA <<<',
          '',
          '"If I vanish from the logs, continue without me."',
          '"Or maybe that is what they want you to believe."',
          '',
          '— end of transmission —',
        ],
        [
          '[N0VA] ...',
          '',
          '"mirror. ghost. echo. override."',
          '"Some words open doors. Others open traps."',
        ],
      ],
    },
    trace: {
      header: '[TRACE] Introspective analysis...',
      currentLevel: '  Current level : {{level}}%',
      multiplier: '  Multiplier      : x{{multiplier}}',
      low: '"You are almost invisible. Use it." — ???',
      mediumPattern: '[TRACE] Recurring pattern : abnormal activity.',
      mediumNova: '"They are building your profile." — N0VA',
      mediumUnknown: '"They are building your profile." — ???',
      highWarn: '[WARN] UltraTech is correlating your actions.',
      highNova: '"This is no longer surveillance. It is a hunt." — N0VA',
      highUnknown: '"This is no longer surveillance. It is a hunt." — ???',
      critical: '[CRIT] Signature exposed.',
      criticalLine: '"Override will save no one." — ???',
    },
    echo: {
      empty: [
        '[ECHO] ...',
        '[ECHO] ...',
        '[ECHO] Someone repeats your silence.',
      ],
      prefix: '[ECHO] {{text}}',
      recorded: '[ECHO] Reverberation logged in the archives.',
      novaKnown: '>>> N0VA <<< "Stop calling me. They are listening."',
      novaUnknown: '>>> ??? <<< "Stop. They are listening."',
    },
    override: {
      denied: [
        '[OVERRIDE] Elevation attempt...',
        '[DENIED] Insufficient privileges.',
        '[SYS] Incident logged.',
      ],
      breach: [
        '[OVERRIDE] Partial bypass...',
        '[SYS] do_not_open.sys — abnormal filesystem access.',
        '',
        '"Do not open it." — N0VA',
        '"Or open it. I want to see what they hide." — ???',
      ],
    },
    disconnect: [
      '[NET] No active connection to close.',
      '[???] Yet a phantom tunnel just closed somewhere else.',
      '[SYS] Entry logged — origin : UNKNOWN',
    ],
  },
}
