from __future__ import annotations

from strategy import calculate_next_counter, seller_accepts


class SellerAgent:
    def __init__(
        self,
        min_price: float,
        initial_price: float,
        max_rounds: int,
        decrease_pct: float = 0.10,
        threshold: float = 20.0,
        personality: str = "neutral",
        randomness: float = 0.0,
    ) -> None:
        self.min_price = min_price
        self.initial_price = initial_price
        self.max_rounds = max_rounds
        self.decrease_pct = decrease_pct
        self.threshold = threshold
        self.personality = personality
        self.randomness = randomness
        self.current_price = max(initial_price, min_price)

    def make_counter(self, round_number: int) -> float:
        if round_number == 1:
            return round(self.current_price, 2)

        self.current_price = calculate_next_counter(
            current_price=self.current_price,
            min_price=self.min_price,
            decrease_pct=self.decrease_pct,
            personality=self.personality,
            randomness=self.randomness,
        )
        return self.current_price

    def can_accept(self, buyer_offer: float) -> bool:
        if buyer_offer < self.min_price:
            return False
        return seller_accepts(
            buyer_offer=buyer_offer,
            seller_price=self.current_price,
            threshold=self.threshold,
        )
