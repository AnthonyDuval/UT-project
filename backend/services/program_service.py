"""Système de programmes (.exe) — inventaire, installation et exécution."""

import json
from pathlib import Path
from typing import Any

from services.game_state import GameStateManager
from services.trace_service import TRACE_COSTS, add_trace, reduce_trace_level

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
PROGRAMS_PATH = DATA_DIR / "programs.json"


def _load_programs_data() -> dict[str, Any]:
    with open(PROGRAMS_PATH, encoding="utf-8") as f:
        return json.load(f)


class ProgramService:
    """Gère l'inventaire numérique, l'installation et l'exécution des programmes."""

    def __init__(self, manager: GameStateManager) -> None:
        self.manager = manager
        self._definitions = _load_programs_data()["programs"]

    @property
    def programs(self) -> dict[str, Any]:
        return self._definitions

    def resolve_program_id(self, name: str) -> str | None:
        """Résout un nom de fichier ou id vers program_id."""
        name = name.lower().strip()
        if name in self._definitions:
            return name
        for pid, meta in self._definitions.items():
            if meta.get("filename", "").lower() == name:
                return pid
        return None

    def get_program(self, program_id: str) -> dict[str, Any] | None:
        return self._definitions.get(program_id)

    def _find_inventory_entry(self, program_id: str) -> dict[str, Any] | None:
        for entry in self.manager.state.get("programInventory", []):
            if entry["programId"] == program_id:
                return entry
        return None

    def add_to_inventory(self, program_id: str, quantity: int = 1) -> bool:
        if program_id not in self._definitions:
            return False
        inventory = self.manager.state.setdefault("programInventory", [])
        existing = self._find_inventory_entry(program_id)
        if existing:
            existing["quantity"] = existing.get("quantity", 1) + quantity
        else:
            inventory.append({"programId": program_id, "quantity": quantity})
        meta = self._definitions[program_id]
        self.manager.add_event(f"[INV] Programme acquis : {meta['filename']}")
        return True

    def _remove_from_inventory(self, program_id: str, quantity: int = 1) -> bool:
        entry = self._find_inventory_entry(program_id)
        if not entry or entry.get("quantity", 0) < quantity:
            return False
        entry["quantity"] -= quantity
        if entry["quantity"] <= 0:
            self.manager.state["programInventory"] = [
                e for e in self.manager.state.get("programInventory", [])
                if e["programId"] != program_id
            ]
        return True

    def is_installed(self, program_id: str) -> bool:
        return program_id in self.manager.state.get("installedPrograms", [])

    def _apply_passive_on_install(self, program_id: str) -> None:
        meta = self._definitions[program_id]
        if meta.get("passive_effect_type") == "passive_trace_reduction":
            val = meta.get("passive_effect_value", 0)
            self.manager.state["traceReductionPassive"] = (
                self.manager.state.get("traceReductionPassive", 0) + val
            )

    def _remove_passive_on_uninstall(self, program_id: str) -> None:
        meta = self._definitions[program_id]
        if meta.get("passive_effect_type") == "passive_trace_reduction":
            val = meta.get("passive_effect_value", 0)
            self.manager.state["traceReductionPassive"] = max(
                0, self.manager.state.get("traceReductionPassive", 0) - val
            )

    def install(self, name: str) -> tuple[list[str], bool]:
        """Installe un programme permanent depuis /inventory."""
        program_id = self.resolve_program_id(name)
        if not program_id:
            return [f"[ERR] Programme introuvable : '{name}'"], False

        meta = self._definitions[program_id]
        if not meta.get("installable"):
            return [f"[ERR] {meta['filename']} n'est pas installable (consommable)."], False

        if self.is_installed(program_id):
            return [f"[ERR] {meta['filename']} déjà installé dans /programs."], False

        if not self._find_inventory_entry(program_id):
            return [f"[ERR] {meta['filename']} absent de /inventory."], False

        self._remove_from_inventory(program_id, 1)
        self.manager.state.setdefault("installedPrograms", []).append(program_id)
        self._apply_passive_on_install(program_id)

        lines = [
            f"[INSTALL] Installation de {meta['filename']}...",
            "[INSTALL] ████████████████████ OK",
            f"[INSTALL] {meta['name']} installé dans /programs",
            f"[SYS] {meta.get('effect_description', '')}",
        ]
        self.manager.add_event(f"[INSTALL] {meta['filename']} installé.")
        return lines, False

    def uninstall(self, name: str) -> tuple[list[str], bool]:
        """Désinstalle un programme de /programs vers /inventory."""
        program_id = self.resolve_program_id(name)
        if not program_id:
            return [f"[ERR] Programme introuvable : '{name}'"], False

        meta = self._definitions[program_id]
        installed = self.manager.state.get("installedPrograms", [])

        if program_id not in installed:
            return [f"[ERR] {meta['filename']} non installé."], False

        self.manager.state["installedPrograms"] = [
            p for p in installed if p != program_id
        ]
        self._remove_passive_on_uninstall(program_id)
        self.add_to_inventory(program_id, 1)

        lines = [
            f"[UNINSTALL] Retrait de {meta['filename']}...",
            f"[UNINSTALL] {meta['name']} retiré — copie dans /inventory",
        ]
        return lines, False

    def run(self, name: str) -> tuple[list[str], bool, int]:
        """
        Exécute un programme installé ou depuis l'inventaire.
        Retourne (lignes, game_over, trace_cost_applied).
        """
        program_id = self.resolve_program_id(name)
        if not program_id:
            return [f"[ERR] Programme introuvable : '{name}'"], False, 0

        meta = self._definitions[program_id]
        from_inventory = False

        if self.is_installed(program_id):
            source = "/programs"
        elif self._find_inventory_entry(program_id):
            from_inventory = True
            source = "/inventory"
        else:
            return [f"[ERR] {meta['filename']} introuvable. Vérifiez /inventory ou /programs."], False, 0

        lines = [
            f"[RUN] Exécution : {meta['filename']} ({source})",
            f"[RUN] {meta['name']} — {meta.get('description', '')}",
        ]

        effect_lines, game_over = self._execute_effect(program_id, meta, from_inventory)
        lines.extend(effect_lines)

        trace_cost = meta.get("trace_on_run", 0)
        return lines, game_over, trace_cost

    def _execute_effect(
        self,
        program_id: str,
        meta: dict[str, Any],
        from_inventory: bool,
    ) -> tuple[list[str], bool]:
        """Applique l'effet du programme."""
        state = self.manager.state
        lines: list[str] = [""]
        game_over = False

        if from_inventory and meta.get("type") == "consumable":
            self._remove_from_inventory(program_id, 1)
            lines.append(f"[RUN] {meta['filename']} consommé.")

        effect = meta.get("run_effect_type") or meta.get("effect_type")

        if effect == "network_scan":
            from services.network_service import NetworkService
            if state["flags"].get("scan_completed"):
                lines.extend([
                    "[NETSCAN] Scan déjà effectué.",
                    "[NETSCAN] Relais RELAY_GHOST toujours actif.",
                ])
            else:
                state["flags"]["scan_completed"] = True
                NetworkService(self.manager).on_scan_complete()
                from services.mission_service import MissionService
                MissionService(self.manager).on_scan()
                lines.extend([
                    "[NETSCAN] Balayage 10.0.0.0/8...",
                    "[NETSCAN] ANOMALIE : RELAY_GHOST",
                    "[SYS] ghost_relay.log généré.",
                ])
                self.manager.add_event("[NETSCAN] Relais localisé via netscan.exe")

        elif effect == "reduce_trace":
            old = state.get("traceLevel", 0)
            reduce_trace_level(state, meta.get("effect_value", 10))
            lines.append(f"[RUN] TRACE : {old}% → {state['traceLevel']}%")

        elif effect == "trace_halved":
            for fx in state.get("activeEffects", []):
                if fx.get("type") == "trace_halved":
                    lines.append("[ERR] Brouilleur déjà actif.")
                    return lines, False
            state.setdefault("activeEffects", []).append({
                "type": "trace_halved",
                "usesLeft": meta.get("effect_value", 2),
                "label": meta["name"],
            })
            lines.append(f"[RUN] Brouilleur actif — {meta.get('effect_value', 2)} charges.")

        elif effect == "enhanced_probe":
            from services.network_service import NetworkService
            from services.mission_service import MissionService
            probe_lines = NetworkService(self.manager).probe_network()
            lines.extend(probe_lines)
            MissionService(self.manager).on_probe()
            lines.append("[RUN] Deep Probe — analyse approfondie terminée.")

        elif effect == "bypass_helper":
            flags = state.setdefault("flags", {})
            if flags.get("bypass_blackvault"):
                lines.append("[RUN] Bypass BLACKVAULT déjà actif.")
            else:
                flags["bypass_blackvault"] = True
                lines.extend([
                    "[RUN] Vault KeyGen — clé firewall générée.",
                    "[SYS] connect blackvault maintenant possible.",
                ])

        elif effect == "sniff_traffic":
            from services.network_service import NetworkService
            node = NetworkService(self.manager).get_current_node_public()
            lines.extend([
                "[SNIFF] Capture du trafic...",
                f"[SNIFF] Nœud : {node['name']} | Sécurité {node['securityLevel']}",
                f"[SNIFF] Multiplicateur trace : x{node['traceMultiplier']}",
            ])

        elif effect == "trace_report":
            lines.extend([
                "[MONITOR] Rapport UltraTech Trace",
                f"[MONITOR] Niveau actuel : {state.get('traceLevel', 0)}%",
                f"[MONITOR] Passif : -{state.get('traceReductionPassive', 0)}%",
                f"[MONITOR] Effets actifs : {len(state.get('activeEffects', []))}",
            ])

        lines.append("[RUN] Exécution terminée.")
        return lines, game_over

    def grant_node_loot(self, node_id: str) -> list[str]:
        """Accorde les programmes trouvables sur un nœud (première infiltration)."""
        messages: list[str] = []
        looted = self.manager.state.setdefault("lootedProgramNodes", [])

        if node_id in looted:
            return messages

        for program_id, meta in self._definitions.items():
            if node_id in meta.get("found_on_nodes", []):
                if self.add_to_inventory(program_id, 1):
                    messages.append(f"[LOOT] Programme récupéré : {meta['filename']}")

        if messages:
            looted.append(node_id)

        return messages

    def list_directory(self, path: str) -> tuple[list[str], bool]:
        """Liste /programs ou /inventory."""
        path = path.lower().strip().lstrip("/")

        if path == "programs":
            lines = ["Répertoire : /programs", ""]
            installed = self.manager.state.get("installedPrograms", [])
            if not installed:
                lines.append("[VIDE] Aucun programme installé.")
            else:
                for pid in installed:
                    meta = self._definitions.get(pid, {})
                    lines.append(
                        f"  {meta.get('filename', pid):<24} — {meta.get('name', pid)} [PERMANENT]"
                    )
            return lines, False

        if path == "inventory":
            lines = ["Répertoire : /inventory", ""]
            inventory = self.manager.state.get("programInventory", [])
            if not inventory:
                lines.append("[VIDE] Aucun programme en stock.")
            else:
                for entry in inventory:
                    meta = self._definitions.get(entry["programId"], {})
                    qty = entry.get("quantity", 1)
                    ptype = meta.get("type", "consumable").upper()
                    qty_str = f" x{qty}" if qty > 1 else ""
                    lines.append(
                        f"  {meta.get('filename', entry['programId']):<24}"
                        f" — {meta.get('name', '')}{qty_str} [{ptype}]"
                    )
            return lines, False

        return [f"[ERR] Répertoire inconnu : /{path}"], False

    def get_public_toolkit(self) -> dict[str, Any]:
        """État programmes pour le frontend."""
        inventory = []
        for entry in self.manager.state.get("programInventory", []):
            meta = self._definitions.get(entry["programId"], {})
            inventory.append({
                "programId": entry["programId"],
                "filename": meta.get("filename", entry["programId"]),
                "name": meta.get("name", entry["programId"]),
                "quantity": entry.get("quantity", 1),
                "type": meta.get("type", "consumable"),
                "rarity": meta.get("rarity", "common"),
                "description": meta.get("description", ""),
                "effect": meta.get("effect_description", ""),
                "installable": meta.get("installable", False),
            })

        installed = []
        for pid in self.manager.state.get("installedPrograms", []):
            meta = self._definitions.get(pid, {})
            installed.append({
                "programId": pid,
                "filename": meta.get("filename", pid),
                "name": meta.get("name", pid),
                "type": meta.get("type", "permanent"),
                "rarity": meta.get("rarity", "common"),
                "description": meta.get("description", ""),
                "effect": meta.get("effect_description", ""),
            })

        return {
            "inventory": inventory,
            "installed": installed,
            "inventoryCount": sum(e.get("quantity", 1) for e in inventory),
            "installedCount": len(installed),
        }
