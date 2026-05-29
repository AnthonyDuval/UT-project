"""Interpréteur des commandes du terminal."""

from services.game_state import GameStateManager
from services.mission_service import MissionService
from services.network_service import NetworkService
from services.program_service import ProgramService
from services.trace_service import TRACE_COSTS, add_trace


class CommandInterpreter:
    """Parse et exécute les commandes saisies par le joueur."""

    def __init__(self, manager: GameStateManager) -> None:
        self.manager = manager
        self.network = NetworkService(manager)
        self.missions = MissionService(manager)
        self.programs = ProgramService(manager)

    def _apply_trace(self, trace_key: str, custom_amount: int | None = None) -> tuple[list[str], bool]:
        """Applique un coût de trace (avec multiplicateur nœud)."""
        amount = custom_amount if custom_amount is not None else TRACE_COSTS.get(trace_key, 0)
        if amount <= 0:
            return [], False
        multiplier = self.network.get_trace_multiplier()
        _, messages, game_over = add_trace(self.manager.state, amount, multiplier)
        return messages, game_over

    def _game_over_response(self) -> tuple[list[str], bool]:
        """Reponse standard quand la session est verrouillee."""
        return [
            "[LOCKED] Session terminee.",
            "[LOCKED] UltraTech a verrouille votre acces.",
            "[LOCKED] GAME OVER.",
        ], False

    def execute(self, raw_command: str) -> tuple[list[str], bool]:
        """
        Exécute une commande brute.
        Retourne (lignes de sortie, clear_terminal).
        """
        if self.manager.state.get("gameOver"):
            return self._game_over_response()

        command_line = raw_command.strip()
        if not command_line:
            return [], False

        parts = command_line.split()
        cmd = parts[0].lower()
        args = parts[1:]

        if cmd not in self.manager.state["unlocked_commands"]:
            trace_msgs, _ = self._apply_trace("unknown_command")
            self.manager.save_state()
            output = [f"[ERR] Commande inconnue ou non débloquée : '{cmd}'"]
            return self._append_trace_messages(output, trace_msgs), False

        handlers = {
            "help": self._cmd_help,
            "clear": self._cmd_clear,
            "ls": self._cmd_ls,
            "open": self._cmd_open,
            "status": self._cmd_status,
            "scan": self._cmd_scan,
            "connect": self._cmd_connect,
            "disconnect": self._cmd_disconnect,
            "probe": self._cmd_probe,
            "bypass": self._cmd_bypass,
            "inject": self._cmd_inject,
            "spoof": self._cmd_spoof,
            "sync": self._cmd_sync,
            "run": self._cmd_run,
            "install": self._cmd_install,
            "uninstall": self._cmd_uninstall,
        }

        handler = handlers.get(cmd)
        if not handler:
            trace_msgs, _ = self._apply_trace("unknown_command")
            self.manager.save_state()
            output = [f"[ERR] Commande '{cmd}' non implémentée."]
            return self._append_trace_messages(output, trace_msgs), False

        return handler(args)

    def _append_trace_messages(self, lines: list[str], trace_messages: list[str]) -> list[str]:
        """Ajoute les alertes de trace à la fin de la sortie commande."""
        if trace_messages:
            lines.extend(["", *trace_messages])
        return lines

    def _cmd_help(self, _args: list[str]) -> tuple[list[str], bool]:
        """Affiche uniquement les commandes débloquées (sans révéler les cachées)."""
        lines = [
            "╔══════════════════════════════════════════════════╗",
            "║  ULTRATECH TERMINAL — AIDE                        ║",
            "╚══════════════════════════════════════════════════╝",
            "",
            "Commandes disponibles :",
        ]

        unlocked = self.manager.state["unlocked_commands"]
        for name in sorted(unlocked):
            meta = self.manager.commands.get(name, {})
            if meta.get("hidden_from_help"):
                continue
            desc = meta.get("description", "")
            lines.append(f"  {name:<12} — {desc}")

        lines.extend(
            [
                "",
                "[INFO] Certaines commandes doivent être découvertes dans les fichiers.",
            ]
        )
        return lines, False

    def _cmd_clear(self, _args: list[str]) -> tuple[list[str], bool]:
        """Efface le terminal côté frontend."""
        return [], True

    def _cmd_ls(self, args: list[str]) -> tuple[list[str], bool]:
        """Liste fichiers, /programs ou /inventory."""
        if args:
            path = args[0].lower().lstrip("/")
            if path in ("programs", "inventory"):
                if self.network.get_current_node_id() != "local":
                    return ["[ERR] /programs et /inventory accessibles uniquement en local."], False
                return self.programs.list_directory(path)

        files = self.manager.get_visible_files()
        node_meta = self.network.get_current_node_public()
        is_local = node_meta["id"] == "local"
        path = f"/net/{node_meta['id']}/" if not is_local else "/home/ghost_operative/"

        lines = [f"Répertoire courant : {path}", ""]
        if is_local:
            inv_count = self.programs.get_public_toolkit()["inventoryCount"]
            inst_count = self.programs.get_public_toolkit()["installedCount"]
            lines.extend([
                f"  {'[DIR] /programs':<24} — {inst_count} programme(s) installé(s)",
                f"  {'[DIR] /inventory':<24} — {inv_count} programme(s) en stock",
                "",
            ])

        if not files:
            lines.append("[VIDE] Aucun fichier accessible.")
        else:
            for name in files:
                meta = self.manager.files[name]
                lines.append(f"  {name:<24} — {meta.get('description', '')}")
        return lines, False

    def _cmd_open(self, args: list[str]) -> tuple[list[str], bool]:
        """Ouvre et affiche le contenu d'un fichier."""
        if not args:
            return ["[ERR] Usage : open [nom_fichier]"], False

        filename = args[0].lower()
        visible = self.manager.get_visible_files()

        if filename not in visible:
            return [f"[ERR] Fichier introuvable ou inaccessible : '{filename}'"], False

        file_meta = self.manager.files.get(filename)
        if not file_meta:
            return [f"[ERR] Fichier inconnu : '{filename}'"], False

        lines = [f"=== {filename} ===", ""]
        lines.extend(file_meta.get("content", []))

        self.manager.mark_file_read(filename)

        on_read = file_meta.get("on_read")
        if on_read:
            unlocked = self.manager.unlock_command(on_read["unlock_command"])
            if unlocked and on_read.get("message"):
                lines.extend(["", on_read["message"]])
            for extra_cmd in on_read.get("unlock_commands", []):
                if self.manager.unlock_command(extra_cmd):
                    lines.append(f"[SYS] Fragment récupéré : {extra_cmd}")

        mission_lines = self.missions.on_file_read(filename)
        if mission_lines:
            lines.extend(["", *mission_lines])

        content_text = "\n".join(file_meta.get("content", []))
        if "market://blacknode" in content_text:
            from services.market_service import MarketService

            market = MarketService(self.manager)
            if market.unlock_market():
                lines.extend(["", "[SYS] Acces BLACK MARKET debloque — market://blacknode"])

        self.manager.save_state()
        return lines, False

    def _cmd_status(self, _args: list[str]) -> tuple[list[str], bool]:
        """Affiche le statut du joueur, réseau et missions."""
        player = self.manager.state["player"]
        node = self.network.get_current_node_public()
        net = self.network.get_network_public()
        journal = self.missions.get_journal_public()
        current = journal.get("currentMission")

        conn = "CONNECTÉ" if net["connected"] else "LOCAL"

        lines = [
            "╔══════════════════════════════════════════════════╗",
            "║  STATUT OPÉRATEUR                                 ║",
            "╚══════════════════════════════════════════════════╝",
            "",
            f"  Identifiant  : {player['username']}",
            f"  BitTek       : {player['bittek']}",
            f"  Réputation   : {player['reputation']}",
            f"  Trace UT     : {self.manager.state.get('traceLevel', 0)}%",
            "",
            "  Réseau :",
            f"    • Nœud actif   : {node['name']} ({conn})",
            f"    • Sécurité     : {node['securityLevel']}",
            f"    • Trace mult.  : x{node['traceMultiplier']}",
            f"    • Infiltrés    : {len(net['hackedNodes'])}",
            "",
            "  Boîte à outils :",
            f"    • /programs    : {len(self.manager.state.get('installedPrograms', []))} installé(s)",
            f"    • /inventory   : {self.programs.get_public_toolkit()['inventoryCount']} en stock",
            "",
            "  Missions :",
        ]

        for mission in journal.get("missions", []):
            if mission["status"] == "locked":
                continue
            label = "TERMINÉE" if mission["status"] == "completed" else "ACTIVE"
            progress = mission.get("progress", "")
            lines.append(f"    • {mission['title']} : {label} ({progress})")

        if current:
            lines.extend([
                "",
                "  Objectif actuel :",
                f"    → {current.get('currentObjective') or 'Tous objectifs accomplis'}",
            ])

        return lines, False

    def _cmd_scan(self, _args: list[str]) -> tuple[list[str], bool]:
        """Analyse le réseau — débloque ghost_relay.log après scan."""
        if self.manager.state["flags"].get("scan_completed"):
            return [
                "[SCAN] Analyse déjà effectuée.",
                "[SCAN] Relais RELAY_GHOST toujours actif.",
                "[INFO] Consultez ghost_relay.log pour la suite.",
            ], False

        lines = [
            "[SCAN] Initialisation du module réseau...",
            "[SCAN] Balayage des segments 10.0.0.0/8...",
            "[SCAN] ████████████░░░░░░░░ 62%",
            "[SCAN] ████████████████████ 100%",
            "",
            "[SCAN] ANOMALIE DÉTECTÉE",
            "[SCAN] Relais : RELAY_GHOST",
            "[SCAN] Signal faible — origine indéterminée",
            "",
            "[SYS] Nouveau fichier généré : ghost_relay.log",
            "[SYS] Utilisez 'open ghost_relay.log' pour analyser.",
        ]

        self.manager.state["flags"]["scan_completed"] = True
        self.network.on_scan_complete()
        self.manager.add_event("[SCAN] Relais RELAY_GHOST localisé.")

        mission_lines = self.missions.on_scan()
        if mission_lines:
            lines.extend(["", *mission_lines])

        trace_msgs, _ = self._apply_trace("scan")
        self.manager.save_state()
        return self._append_trace_messages(lines, trace_msgs), False

    def _cmd_connect(self, args: list[str]) -> tuple[list[str], bool]:
        """Connexion à un nœud réseau."""
        if not args:
            return ["[ERR] Usage : connect [node]"], False

        target = args[0].lower()

        if target == "relay_ghost" and not self.manager.state["flags"].get("mission_1_complete"):
            return self._connect_mission_1()

        lines, _ = self.network.connect(target)
        mission_lines = self.missions.on_connect(target)
        if mission_lines:
            lines.extend(["", *mission_lines])

        trace_key = "connect_relay_ghost" if target == "relay_ghost" else "connect_node"
        trace_msgs, game_over = self._apply_trace(trace_key)
        self.manager.save_state()
        if game_over:
            return self._game_over_response()
        return self._append_trace_messages(lines, trace_msgs), False

    def _connect_mission_1(self) -> tuple[list[str], bool]:
        """Mission 1 — première connexion à relay_ghost."""
        if not self.manager.state["flags"].get("scan_completed"):
            return [
                "[ERR] Connexion refusée.",
                "[ERR] Aucune analyse réseau préalable. Lancez scan d'abord.",
            ], False

        lines = [
            "[CONNECT] Tentative de connexion à RELAY_GHOST...",
            "[CONNECT] Handshake en cours...",
            "[CONNECT] ████████████████████ OK",
        ]
        lines.extend(self.missions.on_mission_1_narrative())
        self.manager.add_event("[EVENT] N0VA — Contact établi via RELAY_GHOST.")

        self.network.mark_hacked("relay_ghost")
        self.network.on_mission_complete()
        self.manager.state["currentNode"] = "relay_ghost"

        mission_lines = self.missions.on_connect("relay_ghost")
        if mission_lines:
            lines.extend(["", *mission_lines])

        lines.extend([
            "",
            "[NET] Nœud actif : RELAY_GHOST — Sécurité LOW",
            "[INFO] disconnect pour revenir au terminal local.",
        ])

        trace_msgs, game_over = self._apply_trace("connect_relay_ghost")
        self.manager.save_state()
        if game_over:
            return self._game_over_response()
        return self._append_trace_messages(lines, trace_msgs), False

    def _cmd_disconnect(self, _args: list[str]) -> tuple[list[str], bool]:
        """Déconnexion du nœud courant."""
        lines, _ = self.network.disconnect()
        trace_msgs, game_over = self._apply_trace("disconnect")
        self.manager.save_state()
        if game_over:
            return self._game_over_response()
        return self._append_trace_messages(lines, trace_msgs), False

    def _cmd_probe(self, _args: list[str]) -> tuple[list[str], bool]:
        """Sonde les segments réseau adjacents."""
        lines = self.network.probe_network()
        mission_lines = self.missions.on_probe()
        if mission_lines:
            lines.extend(["", *mission_lines])

        trace_msgs, game_over = self._apply_trace("probe")
        self.manager.save_state()
        if game_over:
            return self._game_over_response()
        return self._append_trace_messages(lines, trace_msgs), False

    def _cmd_bypass(self, args: list[str]) -> tuple[list[str], bool]:
        """Contourne un firewall réseau."""
        target = args[0] if args else "blackvault"
        lines = self.network.bypass_firewall(target)
        trace_msgs, game_over = self._apply_trace("bypass")
        self.manager.save_state()
        if game_over:
            return self._game_over_response()
        return self._append_trace_messages(lines, trace_msgs), False

    def _cmd_inject(self, _args: list[str]) -> tuple[list[str], bool]:
        """Injecte un payload dans le flux réseau."""
        lines = self.network.inject_payload()
        trace_msgs, game_over = self._apply_trace("inject")
        self.manager.save_state()
        if game_over:
            return self._game_over_response()
        return self._append_trace_messages(lines, trace_msgs), False

    def _cmd_spoof(self, _args: list[str]) -> tuple[list[str], bool]:
        """Usurpe une identité réseau temporaire."""
        lines = self.network.spoof_identity()
        trace_msgs, game_over = self._apply_trace("spoof")
        self.manager.save_state()
        if game_over:
            return self._game_over_response()
        return self._append_trace_messages(lines, trace_msgs), False

    def _cmd_run(self, args: list[str]) -> tuple[list[str], bool]:
        """Exécute un programme .exe."""
        if not args:
            return ["[ERR] Usage : run [programme.exe]"], False

        lines, game_over, trace_cost = self.programs.run(args[0])
        trace_msgs, trace_go = self._apply_trace(
            "run_program", trace_cost if trace_cost > 0 else None
        )
        self.manager.save_state()
        if game_over or trace_go:
            return self._game_over_response()
        return self._append_trace_messages(lines, trace_msgs), False

    def _cmd_install(self, args: list[str]) -> tuple[list[str], bool]:
        """Installe un programme permanent."""
        if not args:
            return ["[ERR] Usage : install [programme.exe]"], False

        lines, _ = self.programs.install(args[0])
        self.manager.save_state()
        return lines, False

    def _cmd_uninstall(self, args: list[str]) -> tuple[list[str], bool]:
        """Désinstalle un programme."""
        if not args:
            return ["[ERR] Usage : uninstall [programme.exe]"], False

        lines, _ = self.programs.uninstall(args[0])
        self.manager.save_state()
        return lines, False

    def _cmd_sync(self, _args: list[str]) -> tuple[list[str], bool]:
        """Synchronise et corrige les incohérences de sauvegarde."""
        result = self.missions.sync_state()
        lines = [
            "[SYNC] Analyse de cohérence de la sauvegarde...",
            f"[SYNC] {result['message']}",
        ]
        if result.get("fixes"):
            lines.append("")
            for fix in result["fixes"]:
                lines.append(f"  ✓ {fix}")
        else:
            lines.append("[SYNC] État cohérent — aucune correction.")

        journal = result.get("journal", {})
        current = journal.get("currentMission")
        if current:
            lines.extend([
                "",
                f"[SYNC] Mission active : {current['title']} ({current['progress']})",
                f"[SYNC] Objectif : {current.get('currentObjective') or '—'}",
            ])

        self.manager.save_state()
        return lines, False
