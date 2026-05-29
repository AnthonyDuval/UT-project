"""EventManager — événements mystère et commandes secrètes (backend)."""

import json
import random
import time
from pathlib import Path
from typing import Any

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "mystery_events.json"

HIDDEN_COMMANDS = frozenset({
    "mirror", "ghost", "nova", "trace", "echo", "override",
})


def _load_catalog() -> dict[str, Any]:
    with open(DATA_PATH, encoding="utf-8") as f:
        return json.load(f)


class EventManager:
    """Déclenche événements narratifs selon le contexte joueur."""

    def __init__(self, manager) -> None:
        self.manager = manager
        self.catalog = _load_catalog()

    @property
    def state(self) -> dict[str, Any]:
        return self.manager.state

    def _ensure(self) -> None:
        s = self.state
        s.setdefault("seenEvents", [])
        s.setdefault("hiddenCommandUses", {})
        s.setdefault("mysteryFlags", {})
        if "sessionStartMs" not in s:
            s["sessionStartMs"] = int(time.time() * 1000)
        s.setdefault("commandCount", 0)

    def is_hidden(self, cmd: str) -> bool:
        return cmd in HIDDEN_COMMANDS

    def mark_event(self, event_id: str) -> None:
        self._ensure()
        if event_id not in self.state["seenEvents"]:
            self.state["seenEvents"].append(event_id)

    def get_event_lines(self, event_id: str) -> list[str]:
        ev = self.catalog.get("events", {}).get(event_id, {})
        return list(ev.get("lines", []))

    def bump_hidden(self, cmd: str) -> int:
        self._ensure()
        uses = self.state["hiddenCommandUses"].get(cmd, 0) + 1
        self.state["hiddenCommandUses"][cmd] = uses
        return uses

    def handle_hidden(self, cmd: str, args: list[str]) -> list[str] | None:
        """Handlers simplifiés — parité narrative avec la démo."""
        self._ensure()
        uses = self.bump_hidden(cmd)

        if cmd == "mirror":
            if uses == 1:
                self.manager.add_event("[???] Commande mirror — aucune sortie.")
                return []
            flags = self.state.setdefault("flags", {})
            flags["mystery_memory_unlocked"] = True
            self.mark_event("mirror_second")
            return [
                "[MIRROR] Reflet instable...",
                "[SYS] memory_fragment.log — segment récupéré.",
            ]

        if cmd == "ghost":
            flags = self.state.setdefault("flags", {})
            if self.state.get("traceLevel", 0) >= 25:
                flags["mystery_signal_unlocked"] = True
            if random.random() < 0.35:
                self.mark_event("nova_ghost_channel")
                return self.get_event_lines("nova_ghost_channel") or [
                    "[GHOST] Signal faible — 0x7F.GHOST",
                ]
            return ["[GHOST] ...", "« Quelqu'un d'autre écoute ce canal. »"]

        if cmd == "nova":
            return [
                ">>> N0VA <<<",
                "« Opérateur. Ne fais confiance à personne sur ce réseau. »",
                "« Même pas à moi. »",
            ]

        if cmd == "trace":
            t = self.state.get("traceLevel", 0)
            return [f"[TRACE] Niveau : {t}%", "« Ils construisent ton profil. » — N0VA"]

        if cmd == "echo":
            text = " ".join(args) or self.state.get("lastCommand", "")
            if not text:
                return ["[ECHO] Quelqu'un répète votre silence."]
            return [f"[ECHO] {text}", "[ECHO] Réverbération enregistrée."]

        if cmd == "override":
            if uses == 1:
                return ["[OVERRIDE] Tentative...", "[DENIED] Privilèges insuffisants."]
            flags = self.state.setdefault("flags", {})
            flags["mystery_override_unlocked"] = True
            return [
                "[OVERRIDE] Contournement partiel...",
                "[SYS] do_not_open.sys — accès anormal.",
                "« Ne l'ouvre pas. » — N0VA",
            ]

        return None

    def on_trace_threshold(self, level: int) -> list[str]:
        self._ensure()
        if level >= 45 and "trace_whisper_45" not in self.state["seenEvents"]:
            self.mark_event("trace_whisper_45")
            ev = self.catalog["events"]["trace_whisper_45"]
            if ev.get("log"):
                self.manager.add_event(ev["log"])
            return list(ev.get("lines", []))
        return []
