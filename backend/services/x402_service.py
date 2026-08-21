from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Optional

from .database_service import get_x402_event, upsert_x402_event
from .stellar_service import stellar_service

DEFAULT_X402_FEE = float(os.getenv("X402_ESCROW_FEE", "0.01"))
X402_MODE = os.getenv("X402_MODE", "simulate").strip().lower()
DEFAULT_X402_PURPOSE_FEES = {
    "escrow_authorization_fee": float(os.getenv("X402_ESCROW_FEE", "0.01")),
    "payment_release_fee": float(os.getenv("X402_RELEASE_FEE", "0.01")),
    "deal_completion_fee": float(os.getenv("X402_COMPLETION_FEE", "0.01")),
    "audit_export_fee": float(os.getenv("X402_AUDIT_FEE", "0.01")),
}


def get_x402_fee(purpose: str) -> float:
    return DEFAULT_X402_PURPOSE_FEES.get(purpose, DEFAULT_X402_FEE)


def _is_simulation_mode() -> bool:
    return X402_MODE != "enforce"


def _verify_stellar_payment(tx_hash: str) -> bool:
    # Delegate to the shared helper, which also checks the `successful` flag.
    # Previously this only checked that Horizon *had a record* of the hash,
    # so a failed/reverted transaction (no funds actually moved) would still
    # count as a verified x402 payment in enforce mode.
    return stellar_service.verify_transaction_success(tx_hash)


def ensure_x402_authorized(
    wallet_address: str,
    deal_id: str,
    purpose: str,
    recipient_wallet: str,
    amount: Optional[float] = None,
) -> tuple[bool, dict[str, Any]]:
    """Checks if a wallet has a verified payment event for a given deal/purpose."""
    fee_amount = float(amount if amount is not None else get_x402_fee(purpose))
    existing = get_x402_event(wallet_address, deal_id, purpose)

    if _is_simulation_mode():
        verified_at = datetime.utcnow()
        simulated = {
            "status": "authorized",
            "purpose": purpose,
            "amount": fee_amount,
            "currency": "XLM",
            "recipient_wallet": recipient_wallet,
            "wallet_address": wallet_address,
            "deal_id": deal_id,
            "tx_hash": existing.get("tx_hash") if existing else "simulated",
            "source": "simulated",
            "verified_at": verified_at.isoformat(),
            "message": "x402 authorization simulated for test/demo mode",
        }
        upsert_x402_event(
            wallet_address=wallet_address,
            deal_id=deal_id,
            purpose=purpose,
            amount=fee_amount,
            recipient_wallet=recipient_wallet,
            status="verified",
            tx_hash=simulated["tx_hash"],
            source="simulated",
            verified_at=verified_at,
        )
        return True, simulated

    if existing and str(existing.get("status")) == "verified":
        return True, existing

    if existing and existing.get("tx_hash") and _verify_stellar_payment(str(existing["tx_hash"])):
        verified_at = datetime.utcnow()
        upsert_x402_event(
            wallet_address=wallet_address,
            deal_id=deal_id,
            purpose=purpose,
            amount=fee_amount,
            recipient_wallet=recipient_wallet,
            status="verified",
            tx_hash=existing.get("tx_hash"),
            source=existing.get("source") or "stellar",
            verified_at=verified_at,
        )
        refreshed = get_x402_event(wallet_address, deal_id, purpose) or existing
        refreshed["status"] = "verified"
        refreshed["verified_at"] = verified_at.isoformat()
        return True, refreshed

    prompt = {
        "status": "payment_required",
        "purpose": purpose,
        "amount": fee_amount,
        "currency": "XLM",
        "recipient_wallet": recipient_wallet,
        "wallet_address": wallet_address,
        "deal_id": deal_id,
        "message": "Protocol authorization required before proceeding",
    }

    upsert_x402_event(
        wallet_address=wallet_address,
        deal_id=deal_id,
        purpose=purpose,
        amount=fee_amount,
        recipient_wallet=recipient_wallet,
        status="payment_required",
        tx_hash=existing.get("tx_hash") if existing else None,
        source=existing.get("source") if existing else "local",
        verified_at=None,
    )
    return False, prompt


def record_x402_payment(
    wallet_address: str,
    deal_id: str,
    purpose: str,
    recipient_wallet: str,
    tx_hash: Optional[str] = None,
    confirm_local: bool = False,
    amount: Optional[float] = None,
) -> dict[str, Any]:
    """Records an x402 event using either a Stellar tx hash or local confirmation."""
    fee_amount = float(amount if amount is not None else get_x402_fee(purpose))
    verified = False
    source = "local"

    if _is_simulation_mode():
        verified = True
        source = "simulated"

    if tx_hash and not _is_simulation_mode():
        verified = _verify_stellar_payment(tx_hash)
        source = "stellar"
    elif confirm_local and not _is_simulation_mode():
        verified = True
        source = "local"

    status = "verified" if verified else "pending"
    verified_at = datetime.utcnow() if verified else None

    upsert_x402_event(
        wallet_address=wallet_address,
        deal_id=deal_id,
        purpose=purpose,
        amount=fee_amount,
        recipient_wallet=recipient_wallet,
        status=status,
        tx_hash=tx_hash,
        source=source,
        verified_at=verified_at,
    )

    event = get_x402_event(wallet_address, deal_id, purpose) or {
        "wallet_address": wallet_address,
        "deal_id": deal_id,
        "purpose": purpose,
        "amount": fee_amount,
        "recipient_wallet": recipient_wallet,
        "status": status,
        "tx_hash": tx_hash,
        "source": source,
        "verified_at": verified_at.isoformat() if verified_at else None,
    }
    event["status"] = status
    event["verified"] = verified
    event["amount"] = fee_amount
    event["source"] = source
    event["tx_hash"] = tx_hash or ("simulated" if _is_simulation_mode() else None)
    if _is_simulation_mode():
        event["message"] = "x402 authorization simulated for test/demo mode"
    return event
