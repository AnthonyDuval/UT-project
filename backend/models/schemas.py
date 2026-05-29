"""Modèles Pydantic pour les requêtes et réponses API."""

from pydantic import BaseModel, Field
from typing import Any


class CommandRequest(BaseModel):
    """Requête d'exécution d'une commande terminal."""

    command: str = Field(..., min_length=1, description="Commande saisie par le joueur")


class CommandResponse(BaseModel):
    """Réponse après exécution d'une commande."""

    output: list[str] = Field(default_factory=list)
    clear_terminal: bool = False
    state: dict[str, Any]


class MarketBuyRequest(BaseModel):
    """Requête d'achat au marché noir."""

    itemId: str = Field(..., min_length=1)


class InventoryUseRequest(BaseModel):
    """Requête d'utilisation d'un objet."""

    itemId: str = Field(..., min_length=1)


class AuthRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=6)


class AuthLoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=1)


class ChatSendRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)


class GameStateResponse(BaseModel):
    """État complet du jeu pour le frontend."""

    player: dict[str, Any]
    unlocked_commands: list[str]
    visible_files: list[str]
    missions: dict[str, Any]
    events_log: list[str]
    traceLevel: int = 0
    gameOver: bool = False
    marketUnlocked: bool = False
    inventory: list[Any] = Field(default_factory=list)
    activeEffects: list[Any] = Field(default_factory=list)
    traceReductionPassive: int = 0
    network: dict[str, Any] = Field(default_factory=dict)
    missionJournal: dict[str, Any] = Field(default_factory=dict)
    marketAdvancedUnlocked: bool = False
    programToolkit: dict[str, Any] = Field(default_factory=dict)
