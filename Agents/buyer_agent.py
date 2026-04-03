from __future__ import annotations

from strategy import buyer_accepts, calculate_next_offer


class BuyerAgent:
    def __init__(
        self,
        budget: float,
        initial_offer: float,
        max_rounds: int,
        increase_pct: float = 0.10,
        threshold: float = 20.0,
        personality: str = "neutral",
        randomness: float = 0.0,
    ) -> None:
        self.budget = budget
        self.initial_offer = initial_offer
        self.max_rounds = max_rounds
        self.increase_pct = increase_pct
        self.threshold = threshold
        self.personality = personality
        self.randomness = randomness
        self.current_offer = min(initial_offer, budget)

    def make_offer(self, round_number: int) -> float:
        if round_number == 1:
            return round(self.current_offer, 2)

        self.current_offer = calculate_next_offer(
            current_offer=self.current_offer,
            budget=self.budget,
            increase_pct=self.increase_pct,
            personality=self.personality,
            randomness=self.randomness,
        )
        return self.current_offer

    def can_accept(self, seller_price: float) -> bool:
        if seller_price > self.budget:
            return False
        return buyer_accepts(
            seller_price=seller_price,
            buyer_offer=self.current_offer,
            threshold=self.threshold,
        )
