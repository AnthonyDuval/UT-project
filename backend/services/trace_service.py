"""Mécanique UltraTech Trace — niveau de traque du joueur."""

from typing import Any

# Coût en points de trace par action (0–100)
TRACE_COSTS: dict[str, int] = {
    "scan": 15,
    "connect_relay_ghost": 25,
    "connect_node": 20,
    "probe": 8,
    "bypass": 12,
    "inject": 10,
    "spoof": 10,
    "disconnect": 3,
    "run_program": 0,
    "decrypt": 10,
    "unknown_command": 2,
}

# Seuils narratifs : (niveau minimum, message)
TRACE_THRESHOLDS: list[tuple[int, str]] = [
    (30, "[TRACE] Activite reseau inhabituelle detectee."),
    (60, "[TRACE] UltraTech analyse votre signature."),
    (85, "[TRACE] Tracage actif. Fenetre de securite compromise."),
]

GAME_OVER_TRIGGER_LINE = "[TRACE] NIVEAU CRITIQUE — 100% — GAME OVER IMMINENT"


def trigger_game_over(state: dict[str, Any]) -> bool:
    """Active le Game Over si la trace atteint 100 %."""
    if state.get("traceLevel", 0) < 100:
        return False
    if state.get("gameOver"):
        return False
    state["gameOver"] = True
    state.setdefault("flags", {})["trace_located_event"] = True
    state.setdefault("events_log", []).append("[GAME OVER] UltraTech vous a localise.")
    return True


def compute_trace_increase(state: dict[str, Any], base_amount: int) -> int:
    """
    Calcule l'augmentation réelle de trace après passifs et effets actifs.
    - Passif permanent : réduit le montant de X%
    - Brouilleur N0VA : divise par 2 (consomme 1 charge)
    """
    if base_amount <= 0:
        return 0

    amount = float(base_amount)

    # Passif permanent (ex: Pack Firewall -5%)
    passive = state.get("traceReductionPassive", 0)
    if passive > 0:
        amount *= 1 - passive / 100

    # Brouilleur N0VA — 2 prochaines augmentations /2
    for effect in state.get("activeEffects", []):
        if effect.get("type") == "trace_halved" and effect.get("usesLeft", 0) > 0:
            amount *= 0.5
            effect["usesLeft"] -= 1
            if effect["usesLeft"] <= 0:
                state["activeEffects"] = [
                    e for e in state.get("activeEffects", [])
                    if not (e.get("type") == "trace_halved" and e.get("usesLeft", 0) <= 0)
                ]
            break

    return max(1, round(amount))


def reduce_trace_level(state: dict[str, Any], amount: int) -> int:
    """Réduit le niveau de trace (minimum 0). Retourne le nouveau niveau."""
    current = state.get("traceLevel", 0)
    new_level = max(0, current - amount)
    state["traceLevel"] = new_level
    return new_level


def add_trace(
    state: dict[str, Any],
    amount: int,
    node_multiplier: float = 1.0,
) -> tuple[int, list[str], bool]:
    """
    Augmente le niveau de trace (modificateurs + multiplicateur nœud).
    """
    if amount <= 0:
        return state.get("traceLevel", 0), [], False

    scaled_base = max(1, round(amount * node_multiplier))
    actual_increase = compute_trace_increase(state, scaled_base)
    previous = state.get("traceLevel", 0)
    new_level = min(100, previous + actual_increase)
    state["traceLevel"] = new_level

    messages: list[str] = []
    triggered: set[int] = set(state.setdefault("trace_alerts_triggered", []))

    for threshold, message in TRACE_THRESHOLDS:
        if new_level >= threshold and threshold not in triggered:
            triggered.add(threshold)
            messages.append(message)
            state.setdefault("events_log", []).append(message)

    state["trace_alerts_triggered"] = sorted(triggered)

    game_over_new = trigger_game_over(state)
    if game_over_new:
        messages.append(GAME_OVER_TRIGGER_LINE)

    return new_level, messages, game_over_new


def apply_trace_reduction(state: dict[str, Any], amount: int) -> int:
    """Alias pour réduction directe de trace (objets du marché)."""
    return reduce_trace_level(state, amount)
