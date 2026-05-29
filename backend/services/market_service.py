"""Marché Noir — achats, inventaire et effets défensifs."""

from typing import Any

from services.game_state import GameStateManager
from services.trace_service import reduce_trace_level

# Messages d'erreur standardisés
ERR_MARKET_LOCKED = "Marché noir inaccessible"
ERR_INSUFFICIENT_BITTEK = "BitTek insuffisant"
ERR_GAME_OVER = "Impossible pendant un traçage final"
ERR_ITEM_NOT_FOUND = "Objet introuvable"
ERR_ALREADY_OWNED = "Objet déjà actif"
ERR_NOT_IN_INVENTORY = "Objet absent de l'inventaire"
ERR_PASSIVE_OWNED = "Passif déjà installé"


class MarketService:
    """Gère le Black Market, l'inventaire et l'utilisation des objets."""

    def __init__(self, manager: GameStateManager) -> None:
        self.manager = manager
        self._market_data = manager.load_market_data()

    @property
    def items(self) -> dict[str, Any]:
        return self._market_data["items"]

    def _check_market_access(self, state: dict[str, Any]) -> None:
        if state.get("gameOver"):
            raise ValueError(ERR_GAME_OVER)
        if not state.get("marketUnlocked"):
            raise ValueError(ERR_MARKET_LOCKED)

    def unlock_market(self) -> bool:
        """Débloque le marché noir si pas déjà fait."""
        if self.manager.state.get("marketUnlocked"):
            return False
        self.manager.state["marketUnlocked"] = True
        self.manager.add_event("[MARKET] Acces BLACK MARKET debloque.")
        self.manager.save_state()
        return True

    def get_market_catalog(self) -> dict[str, Any]:
        """Retourne le catalogue avec statut d'achat pour chaque objet."""
        state = self.manager.state
        catalog = []
        owned_passive = state.get("traceReductionPassive", 0) >= 5

        for item_id, item in self.items.items():
            tier = item.get("tier", "standard")
            if tier == "advanced" and not state.get("marketAdvancedUnlocked"):
                continue

            entry = {**item, "owned_passive": False, "can_buy": True, "locked": False}
            if item.get("category") == "program":
                entry["isProgram"] = True
            if item["type"] == "passive" and owned_passive:
                entry["can_buy"] = False
                entry["owned_passive"] = True
            catalog.append(entry)

        return {
            "unlocked": state.get("marketUnlocked", False),
            "advancedUnlocked": state.get("marketAdvancedUnlocked", False),
            "bittek": state["player"]["bittek"],
            "items": catalog,
        }

    def get_inventory(self) -> dict[str, Any]:
        """Retourne l'inventaire et les effets actifs."""
        state = self.manager.state
        inventory = []
        for entry in state.get("inventory", []):
            item_meta = self.items.get(entry["itemId"], {})
            inventory.append({
                "itemId": entry["itemId"],
                "quantity": entry.get("quantity", 1),
                "name": item_meta.get("name", entry["itemId"]),
                "description": item_meta.get("description", ""),
                "effect": item_meta.get("effect", ""),
                "rarity": item_meta.get("rarity", "common"),
            })

        return {
            "inventory": inventory,
            "activeEffects": state.get("activeEffects", []),
            "traceReductionPassive": state.get("traceReductionPassive", 0),
        }

    def _find_inventory_item(self, item_id: str) -> dict[str, Any] | None:
        for entry in self.manager.state.get("inventory", []):
            if entry["itemId"] == item_id:
                return entry
        return None

    def _add_to_inventory(self, item_id: str) -> None:
        inventory = self.manager.state.setdefault("inventory", [])
        existing = self._find_inventory_item(item_id)
        if existing:
            existing["quantity"] = existing.get("quantity", 1) + 1
        else:
            inventory.append({"itemId": item_id, "quantity": 1})

    def _remove_from_inventory(self, item_id: str) -> None:
        inventory = self.manager.state.get("inventory", [])
        existing = self._find_inventory_item(item_id)
        if not existing:
            return
        if existing.get("quantity", 1) <= 1:
            self.manager.state["inventory"] = [
                e for e in inventory if e["itemId"] != item_id
            ]
        else:
            existing["quantity"] -= 1

    def buy_item(self, item_id: str) -> dict[str, Any]:
        """Achète un objet du marché noir."""
        state = self.manager.state
        self._check_market_access(state)

        item = self.items.get(item_id)
        if not item:
            raise ValueError(ERR_ITEM_NOT_FOUND)

        if item.get("tier") == "advanced" and not state.get("marketAdvancedUnlocked"):
            raise ValueError("Objet avancé — terminez la Mission 2 (Intrusion Orbitale)")

        if item["type"] == "passive":
            if state.get("traceReductionPassive", 0) >= item["effect_value"]:
                raise ValueError(ERR_PASSIVE_OWNED)

        price = item["price"]
        if state["player"]["bittek"] < price:
            raise ValueError(ERR_INSUFFICIENT_BITTEK)

        # Programme .exe — ajout à l'inventaire numérique
        if item.get("category") == "program":
            program_id = item.get("programId")
            if not program_id:
                raise ValueError(ERR_ITEM_NOT_FOUND)
            from services.program_service import ProgramService
            ProgramService(self.manager).add_to_inventory(program_id, 1)
            prog_meta = ProgramService(self.manager).get_program(program_id)
            state["player"]["bittek"] -= price
            message = f"[MARKET] Téléchargement : {prog_meta['filename']} (-{price} BitTek)"
            self.manager.save_state()
            return {
                "message": message,
                "state": self.manager.get_public_state(),
                "inventory": self.get_inventory(),
            }

        state["player"]["bittek"] -= price
        message = f"[MARKET] Achat confirme : {item['name']} (-{price} BitTek)"

        if item["type"] == "passive":
            state["traceReductionPassive"] = state.get("traceReductionPassive", 0) + item["effect_value"]
            message += f" | Passif actif : -{item['effect_value']}% sur les augmentations de TRACE"
            self.manager.add_event(f"[MARKET] Passif installe : {item['name']}")
        else:
            self._add_to_inventory(item_id)
            message += " | Ajoute a l'inventaire"

        self.manager.save_state()
        return {
            "message": message,
            "state": self.manager.get_public_state(),
            "inventory": self.get_inventory(),
        }

    def use_item(self, item_id: str) -> dict[str, Any]:
        """Utilise un objet consommable de l'inventaire."""
        state = self.manager.state
        self._check_market_access(state)

        if not self._find_inventory_item(item_id):
            raise ValueError(ERR_NOT_IN_INVENTORY)

        item = self.items.get(item_id)
        if not item or item["type"] != "consumable":
            raise ValueError(ERR_ITEM_NOT_FOUND)

        effect_type = item["effect_type"]
        effect_value = item["effect_value"]
        messages: list[str] = [f"[INV] Utilisation : {item['name']}"]

        if effect_type == "reduce_trace":
            old = state.get("traceLevel", 0)
            reduce_trace_level(state, effect_value)
            messages.append(f"[INV] TRACE reduite : {old}% -> {state['traceLevel']}%")

        elif effect_type == "trace_halved":
            for effect in state.get("activeEffects", []):
                if effect.get("type") == "trace_halved":
                    raise ValueError(ERR_ALREADY_OWNED)
            state.setdefault("activeEffects", []).append({
                "type": "trace_halved",
                "usesLeft": effect_value,
                "label": item["name"],
            })
            messages.append(f"[INV] Brouilleur actif — {effect_value} augmentations de TRACE reduites de moitie")

        elif effect_type == "reduce_trace_alert":
            old = state.get("traceLevel", 0)
            reduce_trace_level(state, effect_value)
            messages.append(f"[INV] TRACE reduite : {old}% -> {state['traceLevel']}%")
            messages.extend([
                "",
                "[ULTRATECH] ANOMALIE D'IDENTITE DETECTEE",
                "[ULTRATECH] Contre-mesures en cours...",
                "[ULTRATECH] WE ARE WATCHING",
            ])
            self.manager.add_event("[ULTRATECH] Reponse au Spoof d'identite.")

        self._remove_from_inventory(item_id)
        self.manager.save_state()

        return {
            "message": messages[-1] if len(messages) > 1 else messages[0],
            "output": messages,
            "state": self.manager.get_public_state(),
            "inventory": self.get_inventory(),
        }
