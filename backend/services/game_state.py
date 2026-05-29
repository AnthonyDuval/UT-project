"""Gestion de la persistance et de l'état du jeu."""

import json
from copy import deepcopy
from pathlib import Path
from typing import Any

# Chemins vers les fichiers de données
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SAVES_DIR = DATA_DIR / "saves"
LEGACY_GAME_STATE_PATH = DATA_DIR / "game_state.json"
FILES_PATH = DATA_DIR / "files.json"
COMMANDS_PATH = DATA_DIR / "commands.json"
STORY_PATH = DATA_DIR / "story.json"
MARKET_PATH = DATA_DIR / "market.json"
NODES_PATH = DATA_DIR / "nodes.json"

# État initial par défaut (utilisé lors d'un reset)
DEFAULT_STATE: dict[str, Any] = {
    "player": {
        "username": "ghost_operative",
        "bittek": 0,
        "reputation": 0,
    },
    "unlocked_commands": ["help", "clear", "ls", "open", "status", "sync"],
    "read_files": [],
    "flags": {
        "scan_completed": False,
        "mission_1_complete": False,
        "trace_located_event": False,
    },
    "missions": {
        "signal_fantome": {
            "status": "active",
            "currentObjective": "Explorer les fichiers du terminal",
            "completedObjectives": [],
            "rewardsClaimed": False,
        },
        "satlink_intrusion": {
            "status": "locked",
            "currentObjective": None,
            "completedObjectives": [],
            "rewardsClaimed": False,
        },
    },
    "seenEvents": [],
    "marketAdvancedUnlocked": False,
    "events_log": [],
    "traceLevel": 0,
    "trace_alerts_triggered": [],
    "gameOver": False,
    "inventory": [],
    "activeEffects": [],
    "marketUnlocked": False,
    "traceReductionPassive": 0,
    "currentNode": "local",
    "discoveredNodes": ["local"],
    "hackedNodes": [],
    "programInventory": [
        {"programId": "trace_wiper", "quantity": 1}
    ],
    "installedPrograms": [],
    "lootedProgramNodes": [],
    "hiddenCommandUses": {},
    "mysteryFlags": {},
    "sessionStartMs": 0,
    "commandCount": 0,
    "lastCommand": "",
}


def _load_json(path: Path) -> dict[str, Any]:
    """Charge un fichier JSON avec gestion d'erreur basique."""
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: Path, data: dict[str, Any]) -> None:
    """Sauvegarde un dictionnaire en JSON formaté."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class GameStateManager:
    """Centralise lecture/écriture de l'état et des données statiques."""

    def __init__(self, username: str) -> None:
        self.username = username.lower().strip()
        self._save_path = SAVES_DIR / f"{self.username}_state.json"
        self._files_data = _load_json(FILES_PATH)
        self._commands_data = _load_json(COMMANDS_PATH)
        self._story_data = _load_json(STORY_PATH)
        self._market_data = _load_json(MARKET_PATH)
        self._nodes_data = _load_json(NODES_PATH)
        SAVES_DIR.mkdir(parents=True, exist_ok=True)
        self._state = self.load_state()
        self._migrate_state()

    def _new_player_state(self) -> dict[str, Any]:
        """Crée un état initial pour un nouvel opérateur."""
        state = deepcopy(DEFAULT_STATE)
        state["player"]["username"] = self.username
        return state

    @property
    def state(self) -> dict[str, Any]:
        return self._state

    @property
    def files(self) -> dict[str, Any]:
        return self._files_data["files"]

    @property
    def commands(self) -> dict[str, Any]:
        return self._commands_data["commands"]

    @property
    def story(self) -> dict[str, Any]:
        return self._story_data

    @property
    def market(self) -> dict[str, Any]:
        return self._market_data

    @property
    def nodes_data(self) -> dict[str, Any]:
        return self._nodes_data

    def _migrate_state(self) -> None:
        """Applique les champs manquants aux sauvegardes existantes."""
        changed = False
        for key, value in DEFAULT_STATE.items():
            if key not in self._state:
                self._state[key] = deepcopy(value)
                changed = True
        if changed:
            self.save_state()

        if "sync" not in self._state.get("unlocked_commands", []):
            self._state.setdefault("unlocked_commands", []).append("sync")
            changed = True
            self.save_state()

        from services.mission_service import MissionService
        mission_service = MissionService(self)
        if mission_service.migrate_missions_state():
            self.save_state()

    def load_market_data(self) -> dict[str, Any]:
        """Retourne les données du marché noir."""
        return self._market_data

    def load_state(self) -> dict[str, Any]:
        """Charge la sauvegarde du joueur ou crée une nouvelle."""
        if self._save_path.exists():
            return _load_json(self._save_path)
        state = self._new_player_state()
        _save_json(self._save_path, state)
        return state

    def save_state(self) -> None:
        """Persiste l'état courant dans saves/{username}_state.json."""
        _save_json(self._save_path, self._state)

    def reset_state(self) -> dict[str, Any]:
        """Remet la sauvegarde du joueur à zéro."""
        self._state = self._new_player_state()
        self.save_state()
        return self._state

    def get_visible_files(self) -> list[str]:
        """Retourne la liste des fichiers visibles selon le nœud et l'état actuel."""
        visible: list[str] = []
        flags = self._state.get("flags", {})
        current_node = self._state.get("currentNode", "local")

        for name, meta in self.files.items():
            file_node = meta.get("node", "local")
            if file_node != current_node:
                continue

            if meta.get("visible_from_start"):
                visible.append(name)
                continue

            if meta.get("visible_on_node"):
                visible.append(name)
                continue

            unlock_key = meta.get("unlock_key")
            if unlock_key and flags.get(unlock_key):
                visible.append(name)

        return sorted(visible)

    def unlock_command(self, command_name: str) -> bool:
        """Ajoute une commande aux commandes débloquées si absente."""
        unlocked = self._state.setdefault("unlocked_commands", [])
        if command_name not in unlocked:
            unlocked.append(command_name)
            return True
        return False

    def mark_file_read(self, filename: str) -> None:
        """Enregistre qu'un fichier a été lu."""
        read_files = self._state.setdefault("read_files", [])
        if filename not in read_files:
            read_files.append(filename)

    def add_event(self, message: str) -> None:
        """Ajoute une entrée au journal d'événements."""
        self._state.setdefault("events_log", []).append(message)

    def get_public_state(self) -> dict[str, Any]:
        """État exposé au frontend (sans données internes sensibles)."""
        from services.network_service import NetworkService
        from services.mission_service import MissionService
        from services.program_service import ProgramService

        network = NetworkService(self).get_network_public()
        journal = MissionService(self).get_journal_public()
        return {
            "player": self._state["player"],
            "unlocked_commands": self._state["unlocked_commands"],
            "visible_files": self.get_visible_files(),
            "missions": self._state["missions"],
            "missionJournal": journal,
            "events_log": self._state["events_log"],
            "traceLevel": self._state.get("traceLevel", 0),
            "gameOver": self._state.get("gameOver", False),
            "marketUnlocked": self._state.get("marketUnlocked", False),
            "marketAdvancedUnlocked": self._state.get("marketAdvancedUnlocked", False),
            "inventory": self._state.get("inventory", []),
            "activeEffects": self._state.get("activeEffects", []),
            "traceReductionPassive": self._state.get("traceReductionPassive", 0),
            "network": network,
            "programToolkit": ProgramService(self).get_public_toolkit(),
        }
