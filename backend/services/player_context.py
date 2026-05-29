"""Contexte joueur — services liés à une sauvegarde authentifiée."""

from services.command_service import CommandInterpreter
from services.game_state import GameStateManager
from services.market_service import MarketService
from services.mission_service import MissionService
from services.network_service import NetworkService
from services.program_service import ProgramService


class PlayerContext:
    """Agrège tous les services pour un joueur connecté."""

    def __init__(self, username: str) -> None:
        self.username = username
        self.manager = GameStateManager(username)
        self.command = CommandInterpreter(self.manager)
        self.market = MarketService(self.manager)
        self.network = NetworkService(self.manager)
        self.mission = MissionService(self.manager)
        self.program = ProgramService(self.manager)

    @classmethod
    def for_user(cls, username: str) -> "PlayerContext":
        return cls(username)
