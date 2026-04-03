from __future__ import annotations

import json
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
    def __init__(self, buyer: BuyerAgent, seller: SellerAgent, threshold: float = 20.0) -> None:
        self.buyer = buyer
        self.seller = seller
        self.threshold = threshold

    def run(self) -> dict:
        max_rounds = min(self.buyer.max_rounds, self.seller.max_rounds)
        conversation: list[dict] = []
        
        # We will keep a textual history to feed into the prompt
        format_history = ""

        # Tracking state
        current_buyer_price = self.buyer.initial_offer
        current_seller_price = self.seller.initial_price

        for round_number in range(1, max_rounds + 1):
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

            log_round(round_number, current_buyer_price, current_seller_price)

            # 🛡️ Agent-Driven Finalization Logic
            # A deal is only closed if the agents actually reach an agreement 
            # where the Buyer meets or exceeds the Seller's ask.
            if current_buyer_price >= current_seller_price:
                # The agreed price is set to the seller's price (as the buyer met it)
                return {
                    "status": "closed",
                    "final_price": current_seller_price,
                    "conversation": conversation
                }

        return {
            "status": "failed",
            "final_price": None,
            "conversation": conversation
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
