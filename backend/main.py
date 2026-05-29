"""
UltraTech Online — Backend FastAPI
Point d'entrée de l'API REST pour le jeu navigateur multijoueur.
"""

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import (
    AuthLoginRequest,
    AuthRegisterRequest,
    ChatSendRequest,
    CommandRequest,
    CommandResponse,
    GameStateResponse,
    InventoryUseRequest,
    MarketBuyRequest,
)
from services.auth_service import AuthService
from services.chat_service import ChatService
from services.dependencies import get_bearer_token, get_current_username, get_player
from services.player_context import PlayerContext

auth_service = AuthService()
chat_service = ChatService()

app = FastAPI(
    title="UltraTech Online API",
    description="Backend du jeu narratif UltraTech Online — multijoueur",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "game": "UltraTech Online"}


# ─── Authentification ─────────────────────────────────────────────────────────

@app.post("/api/auth/register")
def register(request: AuthRegisterRequest) -> dict:
    result = auth_service.register(request.username, request.password)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.post("/api/auth/login")
def login(request: AuthLoginRequest) -> dict:
    result = auth_service.login(request.username, request.password)
    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["message"])
    return result


@app.post("/api/auth/logout")
def logout(token: str = Depends(get_bearer_token)) -> dict:
    auth_service.logout(token)
    return {"success": True, "message": "Déconnexion effectuée."}


@app.get("/api/auth/me")
def auth_me(username: str = Depends(get_current_username)) -> dict:
    user = auth_service.get_user_public(username)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    return user


# ─── Chat global ──────────────────────────────────────────────────────────────

@app.get("/api/chat")
def get_chat(_username: str = Depends(get_current_username)) -> dict:
    return chat_service.get_messages()


@app.post("/api/chat/send")
def send_chat(
    request: ChatSendRequest,
    username: str = Depends(get_current_username),
) -> dict:
    try:
        return chat_service.send_message(username, request.message)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# ─── Jeu (authentification requise) ───────────────────────────────────────────

@app.get("/api/state", response_model=GameStateResponse)
def get_state(player: PlayerContext = Depends(get_player)) -> dict:
    return player.manager.get_public_state()


@app.post("/api/command", response_model=CommandResponse)
def execute_command(
    request: CommandRequest,
    player: PlayerContext = Depends(get_player),
) -> dict:
    try:
        output, clear_terminal = player.command.execute(request.command)
        return {
            "output": output,
            "clear_terminal": clear_terminal,
            "state": player.manager.get_public_state(),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/market")
def get_market(player: PlayerContext = Depends(get_player)) -> dict:
    return player.market.get_market_catalog()


@app.post("/api/market/buy")
def buy_market_item(
    request: MarketBuyRequest,
    player: PlayerContext = Depends(get_player),
) -> dict:
    try:
        return player.market.buy_item(request.itemId)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/inventory")
def get_inventory(player: PlayerContext = Depends(get_player)) -> dict:
    return player.market.get_inventory()


@app.get("/api/network")
def get_network(player: PlayerContext = Depends(get_player)) -> dict:
    return player.network.get_network_public()


@app.get("/api/missions")
def get_missions(player: PlayerContext = Depends(get_player)) -> dict:
    return player.mission.get_journal_public()


@app.get("/api/programs")
def get_programs(player: PlayerContext = Depends(get_player)) -> dict:
    return player.program.get_public_toolkit()


@app.post("/api/inventory/use")
def use_inventory_item(
    request: InventoryUseRequest,
    player: PlayerContext = Depends(get_player),
) -> dict:
    try:
        return player.market.use_item(request.itemId)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/reset")
def reset_game(player: PlayerContext = Depends(get_player)) -> dict:
    player.manager.reset_state()
    return {
        "message": "Sauvegarde réinitialisée.",
        "state": player.manager.get_public_state(),
    }
