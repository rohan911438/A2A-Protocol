from __future__ import annotations

import json
from typing import Any


def log_round(round_number: int, buyer_offer: float, seller_price: float) -> None:
    print(f"Round {round_number}: Buyer -> {buyer_offer:.2f}, Seller -> {seller_price:.2f}")


def print_final_result(result: dict[str, Any]) -> None:
    print("\nFinal Result JSON:")
    print(json.dumps(result, indent=2))
