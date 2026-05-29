"""Chat global clandestin — messages persistés en JSON."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CHAT_PATH = DATA_DIR / "global_chat.json"
MAX_MESSAGES = 200


def _load_chat() -> dict[str, Any]:
    if not CHAT_PATH.exists():
        return {"messages": []}
    with open(CHAT_PATH, encoding="utf-8") as f:
        return json.load(f)


def _save_chat(data: dict[str, Any]) -> None:
    with open(CHAT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class ChatService:
    """Chat global simple (polling, pas de WebSocket)."""

    def get_messages(self, limit: int = 50) -> dict[str, Any]:
        data = _load_chat()
        messages = data.get("messages", [])
        return {"messages": messages[-limit:]}

    def send_message(self, username: str, message: str) -> dict[str, Any]:
        text = message.strip()
        if not text:
            raise ValueError("Message vide.")
        if len(text) > 500:
            raise ValueError("Message trop long (500 caractères max).")

        data = _load_chat()
        entry = {
            "username": username,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": text,
        }
        data.setdefault("messages", []).append(entry)

        if len(data["messages"]) > MAX_MESSAGES:
            data["messages"] = data["messages"][-MAX_MESSAGES:]

        _save_chat(data)
        return {"success": True, "message": entry}
