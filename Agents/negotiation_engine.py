from __future__ import annotations

import json
from datetime import datetime, timezone
from buyer_agent import BuyerAgent
from seller_agent import SellerAgent
from strategy import is_within_threshold
from utils import log_round, print_final_result

from llm_negotiator import (
    call_gemini,
    parse_llm_response,
    BUYER_PROMPT,
    SELLER_PROMPT
)


class NegotiationEngine:
    def __init__(
        self,
        buyer: BuyerAgent,
        seller: SellerAgent,
        threshold: float = 20.0,
        context: dict | None = None,
    ) -> None:
        self.buyer = buyer
        self.seller = seller
        self.threshold = threshold
        self.context = context or {}

    def _deadline_days_remaining(self) -> int | None:
        deadline = self.context.get("deadline")
        if not deadline:
            return None
        try:
            dt = datetime.fromisoformat(str(deadline)).replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            return (dt - now).days
        except Exception:
            return None

    def _risk_label(self, gap_ratio: float, rounds_left: int) -> str:
        if gap_ratio >= 0.25 and rounds_left <= 1:
            return "high"
        if gap_ratio >= 0.10:
            return "medium"
        return "low"

    def _reputation_label(self, score: float) -> str:
        if score >= 0.85:
            return "excellent"
        if score >= 0.70:
            return "good"
        if score >= 0.50:
            return "moderate"
        return "limited"

    def _build_reasoning(
        self,
        round_number: int,
        max_rounds: int,
        buyer_prev: float,
        seller_prev: float,
        buyer_now: float,
        seller_now: float,
    ) -> dict:
        rounds_left = max(max_rounds - round_number, 0)
        deadline_days = self._deadline_days_remaining()
        seller_reputation = float(self.context.get("seller_reputation", 0.72))

        buyer_delta = round(buyer_now - buyer_prev, 4)
        seller_delta = round(seller_prev - seller_now, 4)
        price_gap = round(max(seller_now - buyer_now, 0), 4)
        gap_ratio = price_gap / max(seller_now, 1)
        risk_level = self._risk_label(gap_ratio, rounds_left)
        reputation_label = self._reputation_label(seller_reputation)

        if deadline_days is None:
            deadline_note = "deadline unavailable"
        elif deadline_days <= 2:
            deadline_note = f"deadline in {deadline_days} day(s), high urgency"
        elif deadline_days <= 7:
            deadline_note = f"deadline in {deadline_days} day(s), moderate urgency"
        else:
            deadline_note = f"deadline in {deadline_days} day(s), low urgency"

        buyer_summary = (
            f"Buyer adjusted by {buyer_delta:+.4f} XLM after comparing previous offers "
            f"({buyer_prev:.4f} vs seller {seller_prev:.4f}); current gap is {price_gap:.4f} XLM."
        )
        seller_summary = (
            f"Seller adjusted by {seller_delta:+.4f} XLM while protecting minimum value; "
            f"reputation considered {reputation_label} ({seller_reputation:.2f})."
        )

        factors = {
            "price_adjustment": {
                "buyer_delta": buyer_delta,
                "seller_delta": seller_delta,
                "price_gap": price_gap,
            },
            "deadline_constraints": {
                "days_remaining": deadline_days,
                "note": deadline_note,
            },
            "seller_reputation": {
                "score": round(seller_reputation, 2),
                "label": reputation_label,
            },
            "risk_evaluation": {
                "gap_ratio": round(gap_ratio, 4),
                "risk_level": risk_level,
                "rounds_left": rounds_left,
            },
            "previous_offers": {
                "buyer_previous": round(buyer_prev, 4),
                "seller_previous": round(seller_prev, 4),
            },
        }

        return {
            "round": round_number,
            "buyer_reasoning": buyer_summary,
            "seller_reasoning": seller_summary,
            "factors": factors,
            "decision_basis": (
                "logic-based negotiation using offer history, deadline pressure, reputation signal, "
                "and round-level risk tolerance"
            ),
        }

    def run(self) -> dict:
        max_rounds = min(self.buyer.max_rounds, self.seller.max_rounds)
        conversation: list[dict] = []
        reasoning: list[dict] = []
        
        # We will keep a textual history to feed into the prompt
        format_history = ""

        # Tracking state
        current_buyer_price = self.buyer.initial_offer
        current_seller_price = self.seller.initial_price

        for round_number in range(1, max_rounds + 1):
            buyer_prev = current_buyer_price
            seller_prev = current_seller_price

            # Formulate prompts
            buyer_prompt = BUYER_PROMPT.format(
                budget=self.buyer.budget,
                initial_offer=current_buyer_price,
                history=format_history or "No conversation yet."
            )
            
            # Call Gemini for Buyer
            buyer_raw = call_gemini(buyer_prompt)
            buyer_message, buyer_price = parse_llm_response(buyer_raw)
            
            if buyer_price > 0:
                # Rule-based bound constraint
                current_buyer_price = min(buyer_price, self.buyer.budget)

            format_history += f"\nBuyer: {buyer_message}\nOffer: {current_buyer_price}"

            # Formulate seller prompt based on updated history
            seller_prompt = SELLER_PROMPT.format(
                min_price=self.seller.min_price,
                initial_price=current_seller_price,
                history=format_history
            )
            
            # Call Gemini for Seller
            seller_raw = call_gemini(seller_prompt)
            seller_message, seller_price = parse_llm_response(seller_raw)

            if seller_price > 0:
                 # Rule-based bound constraint
                 current_seller_price = max(seller_price, self.seller.min_price)

            format_history += f"\nSeller: {seller_message}\nOffer: {current_seller_price}"

            # Store full conversation
            conversation.append({
                "buyer": buyer_message,
                "seller": seller_message,
                "buyer_price": current_buyer_price,
                "seller_price": current_seller_price
            })

            reasoning.append(
                self._build_reasoning(
                    round_number=round_number,
                    max_rounds=max_rounds,
                    buyer_prev=buyer_prev,
                    seller_prev=seller_prev,
                    buyer_now=current_buyer_price,
                    seller_now=current_seller_price,
                )
            )

            log_round(round_number, current_buyer_price, current_seller_price)

            # 🛡️ Agent-Driven Finalization Logic
            # A deal closes if the buyer's offer meets or exceeds the
            # seller's ask, or if the remaining gap is within the
            # configured threshold (self.threshold was previously stored
            # but never consulted here, so negotiations that landed close
            # together but never technically crossed reported "failed").
            if current_buyer_price >= current_seller_price or is_within_threshold(
                current_buyer_price, current_seller_price, self.threshold
            ):
                # The agreed price is set to the seller's price (as the buyer met it)
                return {
                    "status": "closed",
                    "final_price": current_seller_price,
                    "conversation": conversation,
                    "reasoning": reasoning,
                }

        return {
            "status": "failed",
            "final_price": None,
            "conversation": conversation,
            "reasoning": reasoning,
        }


def main() -> None:
    buyer = BuyerAgent(
        budget=500,
        initial_offer=300,
        max_rounds=5, # Reduce rounds for LLM to avoid rate limits
        increase_pct=0.10,
        threshold=20,
        personality="neutral",
        randomness=0.02,
    )

    seller = SellerAgent(
        min_price=350,
        initial_price=500,
        max_rounds=5,
        decrease_pct=0.10,
        threshold=20,
        personality="neutral",
        randomness=0.02,
    )

    engine = NegotiationEngine(buyer=buyer, seller=seller, threshold=20)
    result = engine.run()
    
    # We dump it nicely to verify
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
