"""Authentification — comptes joueurs et sessions."""

import hashlib
import json
import re
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
USERS_PATH = DATA_DIR / "users.json"
SESSIONS_PATH = DATA_DIR / "sessions.json"

USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]{3,20}$")
PBKDF2_ITERATIONS = 100_000


def _load_json(path: Path, default: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), PBKDF2_ITERATIONS
    )
    return f"{salt}${digest.hex()}"


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, expected = stored_hash.split("$", 1)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), PBKDF2_ITERATIONS
    )
    return secrets.compare_digest(digest.hex(), expected)


class AuthService:
    """Gestion des comptes et tokens de session."""

    def __init__(self) -> None:
        self._users_data = _load_json(USERS_PATH, {"users": {}})
        self._sessions_data = _load_json(SESSIONS_PATH, {"sessions": {}})

    def _save_users(self) -> None:
        _save_json(USERS_PATH, self._users_data)

    def _save_sessions(self) -> None:
        _save_json(SESSIONS_PATH, self._sessions_data)

    def _normalize_username(self, username: str) -> str:
        return username.strip().lower()

    def validate_username(self, username: str) -> str | None:
        """Retourne un message d'erreur ou None si valide."""
        if not USERNAME_PATTERN.match(username):
            return "Pseudo invalide (3-20 caractères : lettres, chiffres, _)."
        return None

    def register(self, username: str, password: str) -> dict[str, Any]:
        username = self._normalize_username(username)
        err = self.validate_username(username)
        if err:
            return {"success": False, "message": err}

        if len(password) < 6:
            return {"success": False, "message": "Mot de passe minimum 6 caractères."}

        users = self._users_data.setdefault("users", {})
        if username in users:
            return {"success": False, "message": "Ce pseudo est déjà pris."}

        users[username] = {
            "username": username,
            "password_hash": _hash_password(password),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._save_users()

        token = self._create_session(username)
        return {
            "success": True,
            "token": token,
            "username": username,
            "message": "Opérateur créé. Bienvenue dans le réseau clandestin.",
        }

    def login(self, username: str, password: str) -> dict[str, Any]:
        username = self._normalize_username(username)
        user = self._users_data.get("users", {}).get(username)

        if not user or not _verify_password(password, user["password_hash"]):
            return {"success": False, "message": "Pseudo ou mot de passe incorrect."}

        token = self._create_session(username)
        return {
            "success": True,
            "token": token,
            "username": username,
            "message": "Connexion établie.",
        }

    def _create_session(self, username: str) -> str:
        token = secrets.token_urlsafe(32)
        self._sessions_data.setdefault("sessions", {})[token] = {
            "username": username,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._save_sessions()
        return token

    def logout(self, token: str) -> bool:
        sessions = self._sessions_data.get("sessions", {})
        if token in sessions:
            del sessions[token]
            self._save_sessions()
            return True
        return False

    def validate_token(self, token: str) -> str | None:
        """Retourne le username si le token est valide."""
        if not token:
            return None
        session = self._sessions_data.get("sessions", {}).get(token)
        if not session:
            return None
        return session.get("username")

    def get_user_public(self, username: str) -> dict[str, Any] | None:
        user = self._users_data.get("users", {}).get(username)
        if not user:
            return None
        return {
            "username": user["username"],
            "created_at": user.get("created_at"),
        }
