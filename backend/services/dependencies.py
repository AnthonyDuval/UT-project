"""Dépendances FastAPI — authentification et contexte joueur."""

from fastapi import Depends, Header, HTTPException

from services.auth_service import AuthService
from services.player_context import PlayerContext

auth_service = AuthService()


def get_bearer_token(authorization: str | None = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentification requise.")
    return authorization[7:].strip()


def get_current_username(token: str = Depends(get_bearer_token)) -> str:
    username = auth_service.validate_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Session invalide ou expirée.")
    return username


def get_player(ctx_username: str = Depends(get_current_username)) -> PlayerContext:
    return PlayerContext.for_user(ctx_username)
