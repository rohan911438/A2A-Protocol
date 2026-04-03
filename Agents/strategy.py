from __future__ import annotations

import random


def _personality_multiplier(personality: str) -> float:
    profiles = {
        "aggressive": 1.2,
        "neutral": 1.0,
        "conservative": 0.8,
    }
    return profiles.get(personality.lower(), 1.0)


def _apply_randomness(step: float, randomness: float) -> float:
    if randomness <= 0:
        return step
    variation = random.uniform(-randomness, randomness)
    adjusted_step = step * (1 + variation)
    return max(adjusted_step, 0.0)


def calculate_next_offer(
    current_offer: float,
    budget: float,
    increase_pct: float = 0.10,
    personality: str = "neutral",
    randomness: float = 0.0,
) -> float:
    multiplier = _personality_multiplier(personality)
    step = current_offer * increase_pct * multiplier
    step = _apply_randomness(step, randomness)
    next_offer = current_offer + step
    return round(min(next_offer, budget), 2)


def calculate_next_counter(
    current_price: float,
    min_price: float,
    decrease_pct: float = 0.10,
    personality: str = "neutral",
    randomness: float = 0.0,
) -> float:
    multiplier = _personality_multiplier(personality)
    step = current_price * decrease_pct * multiplier
    step = _apply_randomness(step, randomness)
    next_price = current_price - step
    return round(max(next_price, min_price), 2)


def is_within_threshold(buyer_offer: float, seller_price: float, threshold: float) -> bool:
    return abs(seller_price - buyer_offer) <= threshold


def buyer_accepts(seller_price: float, buyer_offer: float, threshold: float) -> bool:
    return seller_price <= buyer_offer + threshold


def seller_accepts(buyer_offer: float, seller_price: float, threshold: float) -> bool:
    return buyer_offer >= seller_price - threshold
