"""Système de réseau — nœuds infiltrables et connexions."""

from typing import Any

from services.game_state import GameStateManager


class NetworkService:
    """Gère la découverte, connexion et infiltration des nœuds réseau."""

    LOCAL_NODE = "local"

    def __init__(self, manager: GameStateManager) -> None:
        self.manager = manager

    @property
    def nodes(self) -> dict[str, Any]:
        return self.manager.nodes_data.get("nodes", {})

    def get_node(self, node_id: str) -> dict[str, Any] | None:
        return self.nodes.get(node_id)

    def get_current_node_id(self) -> str:
        return self.manager.state.get("currentNode", self.LOCAL_NODE)

    def get_trace_multiplier(self) -> float:
        """Multiplicateur de trace du nœud actuel."""
        node_id = self.get_current_node_id()
        node = self.get_node(node_id)
        return float(node.get("traceMultiplier", 1.0)) if node else 1.0

    def get_current_node_public(self) -> dict[str, Any]:
        """Métadonnées du nœud courant pour le frontend."""
        node_id = self.get_current_node_id()
        node = self.get_node(node_id) or self.get_node(self.LOCAL_NODE)
        return {
            "id": node_id,
            "name": node.get("name", node_id.upper()),
            "displayName": node.get("displayName", "ghost_operative@ultratech"),
            "securityLevel": node.get("securityLevel", "LOW"),
            "description": node.get("description", ""),
            "traceMultiplier": node.get("traceMultiplier", 1.0),
            "theme": node.get("theme", "default"),
        }

    def get_network_public(self) -> dict[str, Any]:
        """État réseau exposé au frontend."""
        state = self.manager.state
        discovered = state.get("discoveredNodes", [self.LOCAL_NODE])
        hacked = state.get("hackedNodes", [])
        current = self.get_current_node_id()

        nodes_list = []
        for node_id in discovered:
            node = self.get_node(node_id)
            if not node:
                continue
            nodes_list.append({
                "id": node_id,
                "name": node.get("name", node_id),
                "securityLevel": node.get("securityLevel", "UNKNOWN"),
                "hacked": node_id in hacked,
                "current": node_id == current,
            })

        current_node = self.get_current_node_public()
        return {
            "currentNode": current,
            "currentNodeMeta": current_node,
            "discoveredNodes": discovered,
            "hackedNodes": hacked,
            "nodes": nodes_list,
            "traceMultiplier": self.get_trace_multiplier(),
            "connected": current != self.LOCAL_NODE,
        }

    def discover_node(self, node_id: str) -> bool:
        """Ajoute un nœud aux nœuds découverts."""
        discovered = self.manager.state.setdefault("discoveredNodes", [self.LOCAL_NODE])
        if node_id not in discovered and node_id in self.nodes:
            discovered.append(node_id)
            self.manager.add_event(f"[NET] Nœud découvert : {node_id}")
            return True
        return False

    def mark_hacked(self, node_id: str) -> bool:
        """Marque un nœud comme infiltré."""
        hacked = self.manager.state.setdefault("hackedNodes", [])
        if node_id not in hacked:
            hacked.append(node_id)
            return True
        return False

    def can_connect(self, node_id: str) -> tuple[bool, str]:
        """Vérifie si la connexion au nœud est possible."""
        node = self.get_node(node_id)
        if not node:
            return False, f"[ERR] Nœud '{node_id}' introuvable."

        if node_id not in self.manager.state.get("discoveredNodes", []):
            return False, f"[ERR] Nœud '{node_id}' non découvert. Utilisez scan ou probe."

        req = node.get("connectRequirement")
        flags = self.manager.state.get("flags", {})

        if req == "scan_completed" and not flags.get("scan_completed"):
            return False, "[ERR] Analyse réseau requise. Lancez scan d'abord."
        if req == "mission_1_complete" and not flags.get("mission_1_complete"):
            return False, "[ERR] Accès refusé. Terminez la Mission 1 d'abord."
        if req == "probe_morgue" and not flags.get("probe_morgue"):
            return False, "[ERR] Morgue server non cartographié. Utilisez probe."
        if req == "bypass_blackvault" and not flags.get("bypass_blackvault"):
            return False, "[ERR] Firewall BLACKVAULT actif. Utilisez bypass."
        if req == "hacked_blackvault" and "blackvault" not in self.manager.state.get("hackedNodes", []):
            return False, "[ERR] BLACKVAULT doit être infiltré avant DEEPNODE_ALPHA."

        return True, ""

    def connect(self, node_id: str) -> tuple[list[str], bool]:
        """
        Connecte au nœud. Retourne (lignes, mission_triggered).
        mission_triggered=True si relay_ghost mission doit être gérée séparément.
        """
        node_id = node_id.lower()

        if node_id == self.LOCAL_NODE:
            return self.disconnect()

        # Mission 1 — relay_ghost géré par command_service
        if node_id == "relay_ghost" and not self.manager.state["flags"].get("mission_1_complete"):
            return [], True

        ok, err = self.can_connect(node_id)
        if not ok:
            return [err], False

        node = self.get_node(node_id)
        if not node:
            return [f"[ERR] Nœud inconnu : {node_id}"], False

        lines = list(node.get("connectionLines", [f"[NET] Connected to {node.get('name', node_id)}"]))
        first_hack = self.mark_hacked(node_id)

        if first_hack:
            player = self.manager.state["player"]
            player["bittek"] += node.get("rewardBittek", 0)
            player["reputation"] += node.get("rewardReputation", 0)
            if node.get("rewardBittek"):
                lines.append(
                    f"[SYS] +{node['rewardBittek']} BitTek | +{node.get('rewardReputation', 0)} Réputation"
                )

            from services.program_service import ProgramService
            loot_msgs = ProgramService(self.manager).grant_node_loot(node_id)
            lines.extend(loot_msgs)

            for unlock_id in node.get("unlocksNodes", []):
                if self.discover_node(unlock_id):
                    unlock_node = self.get_node(unlock_id)
                    name = unlock_node.get("name", unlock_id) if unlock_node else unlock_id
                    lines.append(f"[NET] Nouveau nœud détecté : {name}")

        self.manager.state["currentNode"] = node_id
        self.manager.add_event(f"[NET] Connecté à {node.get('name', node_id)}")
        lines.extend([
            "",
            f"[SYS] Nœud actif : {node.get('name')} — Sécurité {node.get('securityLevel')}",
            f"[SYS] Multiplicateur trace : x{node.get('traceMultiplier', 1.0)}",
            "[INFO] Tapez ls pour voir les fichiers. disconnect pour revenir.",
        ])
        return lines, False

    def disconnect(self) -> tuple[list[str], bool]:
        """Retour au terminal local."""
        if self.get_current_node_id() == self.LOCAL_NODE:
            return ["[NET] Déjà sur le terminal local."], False

        prev = self.get_current_node_id()
        prev_node = self.get_node(prev)
        self.manager.state["currentNode"] = self.LOCAL_NODE

        lines = [
            "[NET] Fermeture du tunnel chiffré...",
            "[NET] Effacement des routes...",
            f"[NET] Déconnecté de {prev_node.get('name', prev) if prev_node else prev}",
            "[NET] Retour au terminal local.",
        ]
        self.manager.add_event(f"[NET] Déconnecté de {prev}")
        return lines, False

    def on_scan_complete(self) -> None:
        """Découvre relay_ghost après un scan."""
        self.discover_node("relay_ghost")

    def on_mission_complete(self) -> None:
        """Découvre satlink_03 après mission 1."""
        self.discover_node("satlink_03")

    def probe_network(self) -> list[str]:
        """Cartographie les nœuds accessibles depuis le nœud actuel."""
        current = self.get_current_node_id()
        lines = [
            "[PROBE] Initialisation sonde réseau...",
            "[PROBE] Analyse des segments adjacents...",
        ]

        if current == self.LOCAL_NODE:
            if self.manager.state["flags"].get("scan_completed"):
                lines.append("[PROBE] relay_ghost — DÉJÀ CONNU")
            else:
                lines.append("[PROBE] Lancez scan pour détecter les relais.")

        elif current == "satlink_03":
            self.manager.state.setdefault("flags", {})["probe_morgue"] = True
            self.discover_node("morgue_server")
            self.discover_node("blackvault")
            lines.extend([
                "[PROBE] Segment orbital cartographié.",
                "[PROBE] morgue_server — DÉTECTÉ",
                "[PROBE] blackvault — DÉTECTÉ (firewall actif)",
                "[PROBE] Fragment N0VA détecté dans le flux.",
            ])

        elif current == "relay_ghost":
            lines.append("[PROBE] Relais fantôme — aucun segment adjacent.")

        else:
            lines.append(f"[PROBE] Scan terminé sur {current}.")

        lines.append("[PROBE] Analyse terminée.")
        return lines

    def bypass_firewall(self, target: str | None = None) -> list[str]:
        """Contourne le firewall d'un nœud (blackvault)."""
        if target and target.lower() != "blackvault":
            return [f"[ERR] Bypass impossible sur '{target}'."]

        if (
            self.get_current_node_id() != "satlink_03"
            and "blackvault" not in self.manager.state.get("discoveredNodes", [])
        ):
            return ["[ERR] blackvault non accessible depuis cette position."]

        self.manager.state.setdefault("flags", {})["bypass_blackvault"] = True
        return [
            "[BYPASS] Injection payload firewall...",
            "[BYPASS] ████████████░░░░░░░░ 60%",
            "[BYPASS] ████████████████████ OK",
            "[BYPASS] BLACKVAULT firewall contourné.",
            "[SYS] connect blackvault maintenant possible.",
        ]

    def inject_payload(self) -> list[str]:
        """Commande inject — effet narratif + trace."""
        return [
            "[INJECT] Payload injecté dans le flux réseau.",
            "[INJECT] UltraTech SecOps — délai de détection +30s",
            "[INFO] Fenêtre d'action ouverte.",
        ]

    def spoof_identity(self) -> list[str]:
        """Commande spoof — masque temporaire."""
        return [
            "[SPOOF] Identité usurpée : operator_ut_guest",
            "[SPOOF] Signature réseau modifiée.",
            "[WARN] Durée limitée — UltraTech finira par corréler.",
        ]
