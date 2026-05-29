"""Service centralisé — missions, objectifs, récompenses et synchronisation."""

import json
from pathlib import Path
from typing import Any

from services.game_state import GameStateManager

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
MISSIONS_PATH = DATA_DIR / "missions.json"

INITIAL_FILES = {"readme.txt", "system.log", "notes.enc"}


def _load_missions_data() -> dict[str, Any]:
    with open(MISSIONS_PATH, encoding="utf-8") as f:
        return json.load(f)


def _default_mission_state(status: str = "locked") -> dict[str, Any]:
    return {
        "status": status,
        "currentObjective": None,
        "completedObjectives": [],
        "rewardsClaimed": False,
    }


class MissionService:
    """Gère le cycle de vie des missions et la cohérence de la sauvegarde."""

    def __init__(self, manager: GameStateManager) -> None:
        self.manager = manager
        self._definitions = _load_missions_data()["missions"]

    @property
    def definitions(self) -> dict[str, Any]:
        return self._definitions

    def _ordered_mission_ids(self) -> list[str]:
        return sorted(
            self._definitions.keys(),
            key=lambda mid: self._definitions[mid].get("order", 99),
        )

    def _get_mission_state(self, mission_id: str) -> dict[str, Any]:
        missions = self.manager.state.setdefault("missions", {})
        if mission_id not in missions:
            missions[mission_id] = _default_mission_state("locked")
        return missions[mission_id]

    def _objective_done(self, mission_id: str, objective_id: str) -> bool:
        state = self.manager.state
        flags = state.get("flags", {})
        read_files = set(state.get("read_files", []))
        discovered = set(state.get("discoveredNodes", []))
        hacked = set(state.get("hackedNodes", []))

        checks: dict[str, bool] = {
            "read_files": bool(read_files & INITIAL_FILES),
            "scan_network": bool(flags.get("scan_completed")),
            "connect_relay": bool(flags.get("mission_1_complete") or "relay_ghost" in hacked),
            "connect_satlink": "satlink_03" in hacked,
            "use_probe": bool(flags.get("probe_used_satlink")),
            "discover_nodes": "morgue_server" in discovered and "blackvault" in discovered,
            "open_satellite_file": "satlink_manifest.dat" in read_files,
            "nova_fragment": "nova_orbital_fragment.dat" in read_files,
        }
        return checks.get(objective_id, False)

    def update_objectives(self, mission_id: str | None = None) -> list[dict[str, Any]]:
        newly_completed: list[str] = []
        completion_results: list[dict[str, Any]] = []
        targets = [mission_id] if mission_id else self._ordered_mission_ids()

        for mid in targets:
            mstate = self._get_mission_state(mid)
            if mstate["status"] not in ("active", "completed"):
                continue

            definition = self._definitions.get(mid)
            if not definition:
                continue

            completed = mstate.setdefault("completedObjectives", [])

            for obj in definition["objectives"]:
                oid = obj["id"]
                if oid in completed:
                    continue
                if self._objective_done(mid, oid):
                    completed.append(oid)
                    newly_completed.append(oid)
                    self.manager.add_event(f"[MISSION] Objectif accompli : {obj['label']}")

            self._refresh_current_objective(mid)

            if mstate["status"] == "active" and self._all_objectives_done(mid):
                completion_results.append(self.complete_mission(mid))

        return completion_results

    def _all_objectives_done(self, mission_id: str) -> bool:
        definition = self._definitions[mission_id]
        completed = set(self._get_mission_state(mission_id).get("completedObjectives", []))
        required = {o["id"] for o in definition["objectives"]}
        return required.issubset(completed)

    def _refresh_current_objective(self, mission_id: str) -> None:
        mstate = self._get_mission_state(mission_id)
        if mstate["status"] != "active":
            mstate["currentObjective"] = None
            return

        definition = self._definitions.get(mission_id, {})
        completed = set(mstate.get("completedObjectives", []))

        for obj in definition.get("objectives", []):
            if obj["id"] not in completed:
                mstate["currentObjective"] = obj["label"]
                return

        mstate["currentObjective"] = None

    def get_current_mission(self) -> dict[str, Any] | None:
        for mid in self._ordered_mission_ids():
            mstate = self._get_mission_state(mid)
            if mstate.get("status") == "active":
                return self._build_mission_public(mid)
        return None

    def complete_mission(self, mission_id: str) -> dict[str, Any]:
        mstate = self._get_mission_state(mission_id)
        definition = self._definitions.get(mission_id)
        if not definition:
            return {"success": False, "message": f"Mission inconnue : {mission_id}"}

        if mstate.get("status") == "completed" and mstate.get("rewardsClaimed"):
            return {"success": True, "message": "Mission déjà terminée.", "already": True}

        for obj in definition["objectives"]:
            if self._objective_done(mission_id, obj["id"]):
                if obj["id"] not in mstate.setdefault("completedObjectives", []):
                    mstate["completedObjectives"].append(obj["id"])

        mstate["status"] = "completed"
        mstate["currentObjective"] = None

        messages: list[str] = []
        narrative_lines: list[str] = []
        if not mstate.get("rewardsClaimed"):
            event_id = definition.get("rewards", {}).get("eventId")
            if event_id and event_id not in self.manager.state.get("seenEvents", []):
                narrative_lines = self.get_event_lines(event_id)
            messages = self.grant_rewards(mission_id)
            mstate["rewardsClaimed"] = True

        self.manager.add_event(f"[MISSION] {definition['title']} — TERMINÉE")
        self.unlock_next_mission()
        self.manager.save_state()

        return {
            "success": True,
            "message": f"Mission {definition['title']} terminée.",
            "rewardMessages": messages,
            "narrativeLines": narrative_lines,
            "missionId": mission_id,
        }

    def grant_rewards(self, mission_id: str) -> list[str]:
        definition = self._definitions[mission_id]
        rewards = definition.get("rewards", {})
        messages: list[str] = []
        player = self.manager.state["player"]
        flags = self.manager.state.setdefault("flags", {})

        bittek = rewards.get("bittek", 0)
        rep = rewards.get("reputation", 0)
        if bittek:
            player["bittek"] += bittek
        if rep:
            player["reputation"] += rep
        if bittek or rep:
            messages.append(f"[SYS] +{bittek} BitTek | +{rep} Réputation")

        for cmd in rewards.get("unlockCommands", []):
            if self.manager.unlock_command(cmd):
                messages.append(f"[SYS] Commande débloquée : {cmd}")

        if rewards.get("marketUnlock"):
            from services.market_service import MarketService
            if MarketService(self.manager).unlock_market():
                messages.append("[SYS] BLACK MARKET débloqué sur le bureau.")

        if rewards.get("marketAdvancedUnlock"):
            if not self.manager.state.get("marketAdvancedUnlocked"):
                self.manager.state["marketAdvancedUnlocked"] = True
                messages.append("[SYS] Accès BLACK MARKET avancé débloqué.")

        if rewards.get("unlockFile") and mission_id == "signal_fantome":
            flags["mission_1_complete"] = True

        for node_id in rewards.get("unlockNodes", []):
            from services.network_service import NetworkService
            if NetworkService(self.manager).discover_node(node_id):
                messages.append(f"[NET] Nœud découvert : {node_id}")

        event_id = rewards.get("eventId")
        if event_id:
            self._mark_event_seen(event_id)

        return messages

    def unlock_next_mission(self) -> str | None:
        for mid in self._ordered_mission_ids():
            mstate = self._get_mission_state(mid)
            if mstate.get("status") != "locked":
                continue

            prereq = self._definitions[mid].get("prerequisite")
            if prereq:
                prereq_state = self._get_mission_state(prereq)
                if prereq_state.get("status") != "completed":
                    continue

            mstate["status"] = "active"
            self._refresh_current_objective(mid)
            self.manager.add_event(f"[MISSION] Nouvelle mission : {self._definitions[mid]['title']}")
            return mid

        return None

    def _mark_event_seen(self, event_id: str) -> None:
        seen = self.manager.state.setdefault("seenEvents", [])
        if event_id not in seen:
            seen.append(event_id)

    def get_event_lines(self, event_id: str) -> list[str]:
        events = self.manager.story.get("events", {})
        return list(events.get(event_id, {}).get("lines", []))

    def _build_mission_public(self, mission_id: str) -> dict[str, Any]:
        definition = self._definitions[mission_id]
        mstate = self._get_mission_state(mission_id)
        completed_set = set(mstate.get("completedObjectives", []))
        objectives = [
            {"id": obj["id"], "label": obj["label"], "done": obj["id"] in completed_set}
            for obj in definition["objectives"]
        ]

        total = len(objectives)
        done_count = sum(1 for o in objectives if o["done"])

        return {
            "id": mission_id,
            "title": definition["title"],
            "subtitle": definition.get("subtitle", ""),
            "description": definition.get("description", ""),
            "primaryNode": definition.get("primaryNode"),
            "status": mstate.get("status", "locked"),
            "currentObjective": mstate.get("currentObjective"),
            "objectives": objectives,
            "progress": f"{done_count}/{total}",
            "progressRatio": done_count / total if total else 0,
            "rewardsPreview": definition.get("rewardsPreview", {}),
            "rewardsClaimed": mstate.get("rewardsClaimed", False),
        }

    def get_journal_public(self) -> dict[str, Any]:
        self.update_objectives()

        current = self.get_current_mission()
        all_missions = [self._build_mission_public(mid) for mid in self._ordered_mission_ids()]
        completed = [m for m in all_missions if m["status"] == "completed"]

        return {
            "currentMission": current,
            "currentMissionId": current["id"] if current else None,
            "missions": all_missions,
            "completedMissions": completed,
            "seenEvents": self.manager.state.get("seenEvents", []),
        }

    def migrate_missions_state(self) -> bool:
        changed = False
        missions = self.manager.state.setdefault("missions", {})

        for mid in self._definitions:
            if mid not in missions:
                status = "active" if mid == "signal_fantome" else "locked"
                missions[mid] = _default_mission_state(status)
                changed = True
                continue

            mstate = missions[mid]
            for field, default in [
                ("completedObjectives", []),
                ("rewardsClaimed", False),
                ("currentObjective", None),
            ]:
                if field not in mstate:
                    mstate[field] = default() if callable(default) else default
                    changed = True

            if mstate.pop("completed", None) is True:
                mstate["status"] = "completed"
                changed = True

        flags = self.manager.state.get("flags", {})
        m1 = missions.get("signal_fantome", {})

        if flags.get("mission_1_complete"):
            if m1.get("status") != "completed":
                m1["status"] = "completed"
                changed = True
            if not m1.get("rewardsClaimed"):
                m1["rewardsClaimed"] = True
                changed = True

        if m1.get("status") == "completed":
            m2 = missions.get("satlink_intrusion", {})
            if m2.get("status") == "locked":
                m2["status"] = "active"
                changed = True

        if "seenEvents" not in self.manager.state:
            self.manager.state["seenEvents"] = []
            changed = True
        if "marketAdvancedUnlocked" not in self.manager.state:
            self.manager.state["marketAdvancedUnlocked"] = False
            changed = True

        return changed

    def sync_state(self) -> dict[str, Any]:
        fixes: list[str] = []

        if self.migrate_missions_state():
            fixes.append("Structure missions migrée vers le nouveau format.")

        flags = self.manager.state.setdefault("flags", {})
        m1 = self._get_mission_state("signal_fantome")

        if m1.get("status") == "completed" and not flags.get("mission_1_complete"):
            flags["mission_1_complete"] = True
            fixes.append("Flag mission_1_complete synchronisé.")

        if flags.get("mission_1_complete") and m1.get("status") != "completed":
            m1["status"] = "completed"
            m1["rewardsClaimed"] = True
            fixes.append("Mission Signal Fantôme marquée terminée.")

        for mid in self._ordered_mission_ids():
            before = len(self._get_mission_state(mid).get("completedObjectives", []))
            self.update_objectives(mid)
            after = len(self._get_mission_state(mid).get("completedObjectives", []))
            if after > before:
                fixes.append(f"Objectifs synchronisés : {mid} (+{after - before}).")

        for mid in self._ordered_mission_ids():
            mstate = self._get_mission_state(mid)
            if mstate.get("status") == "active" and self._all_objectives_done(mid):
                if not mstate.get("rewardsClaimed"):
                    self.complete_mission(mid)
                    fixes.append(f"Mission {mid} complétée (récompenses accordées).")
                else:
                    mstate["status"] = "completed"
                    fixes.append(f"Statut {mid} → completed.")

        if self._get_mission_state("signal_fantome").get("status") == "completed":
            unlocked = self.unlock_next_mission()
            if unlocked:
                fixes.append(f"Mission {unlocked} activée.")

        if flags.get("mission_1_complete"):
            from services.network_service import NetworkService
            if NetworkService(self.manager).discover_node("satlink_03"):
                fixes.append("Nœud satlink_03 synchronisé.")

        if flags.get("probe_morgue") and not flags.get("probe_used_satlink"):
            flags["probe_used_satlink"] = True
            fixes.append("Flag probe_used_satlink synchronisé.")

        self.manager.save_state()

        return {
            "success": True,
            "fixes": fixes,
            "message": "Aucune correction nécessaire." if not fixes else f"{len(fixes)} correction(s) appliquée(s).",
            "journal": self.get_journal_public(),
        }

    def format_completion_lines(self, results: list[dict[str, Any]]) -> list[str]:
        """Formate la sortie terminal pour les missions fraîchement terminées."""
        lines: list[str] = []
        for result in results:
            if result.get("already"):
                continue
            if result.get("narrativeLines"):
                lines.extend(result["narrativeLines"])
            if result.get("rewardMessages"):
                if lines:
                    lines.append("")
                lines.extend(result["rewardMessages"])
        return lines

    def on_scan(self) -> list[str]:
        return self.format_completion_lines(self.update_objectives("signal_fantome"))

    def on_file_read(self, _filename: str) -> list[str]:
        return self.format_completion_lines(self.update_objectives())

    def on_connect(self, node_id: str) -> list[str]:
        messages: list[str] = []

        if node_id == "relay_ghost":
            self.manager.state.setdefault("flags", {})["mission_1_complete"] = True
            results = self.update_objectives("signal_fantome")
            m1 = self._get_mission_state("signal_fantome")
            if m1.get("status") == "active" and self._all_objectives_done("signal_fantome"):
                results.append(self.complete_mission("signal_fantome"))
            messages.extend(self.format_completion_lines(results))
        else:
            messages.extend(self.format_completion_lines(self.update_objectives()))

        return messages

    def on_probe(self) -> list[str]:
        self.manager.state.setdefault("flags", {})["probe_used_satlink"] = True
        return self.format_completion_lines(self.update_objectives("satlink_intrusion"))

    def on_mission_1_narrative(self) -> list[str]:
        self._mark_event_seen("nova_contact")
        return self.get_event_lines("nova_contact")
