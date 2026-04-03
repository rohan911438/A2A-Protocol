from __future__ import annotations

import os
import sys
from typing import Any

# Allow importing the agent modules that live in the Agents/ folder
AGENTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Agents"))
if AGENTS_DIR not in sys.path:
    sys.path.insert(0, AGENTS_DIR)

from buyer_agent import BuyerAgent  # type: ignore
from seller_agent import SellerAgent  # type: ignore
from negotiation_engine import NegotiationEngine  # type: ignore


def run_negotiation(task_data: dict[str, Any]) -> dict[str, Any]:
    """
    Call the negotiation engine with the provided task data.
    Input format: {budget, min_price, deadline, description}
    Output format: {status, final_price, conversation, rounds}
    """
    # Extract values from task_data
    budget = float(task_data.get("budget", 0))
    min_price = float(task_data.get("min_price", 0))
    # Note: deadline and description can be used for logging or future prompt customization
    
    # Sensible defaults for parameters not provided in the simplified input
    # Starting buyer at 80% of budget, seller at 120% of min_price (to create a gap)
    initial_offer = budget * 0.8
    initial_price = min_price * 1.2
    
    # If there's no gap or inverted gap, adjust
    if initial_offer > initial_price:
        # In this case, agents would close immediately, which is fine
        pass 

    buyer = BuyerAgent(
        budget=budget,
        initial_offer=initial_offer,
        max_rounds=3, # Reduced rounds for faster performance
        increase_pct=0.15, # More aggressive increases
        threshold=30.0, # Higher threshold for faster closing
        personality="neutral",
        randomness=0.02,
    )

    seller = SellerAgent(
        min_price=min_price,
        initial_price=initial_price,
        max_rounds=3,
        decrease_pct=0.15,
        threshold=30.0,
        personality="neutral",
        randomness=0.01,
    )

    engine = NegotiationEngine(buyer=buyer, seller=seller, threshold=20.0)
    result = engine.run()
    
    # Format the result as requested, including the 'rounds' field
    conversation = result.get("conversation", [])
    output = {
        "status": result.get("status", "failed"),
        "final_price": result.get("final_price"),
        "conversation": conversation,
        "rounds": len(conversation)
    }
    
    return output
