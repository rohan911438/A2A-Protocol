from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import os

from ..services import get_deal, ensure_x402_authorized, get_x402_fee
from ..services.stellar_service import stellar_service

router = APIRouter()

class SenderRequest(BaseModel):
    sender: str = Field(..., description="Stellar Public Key")

class CreateDealRequest(SenderRequest):
    deal_id: str = Field(..., description="Deal ID")
    total: float = Field(..., gt=0, description="Total amount in XLM")
    milestones: List[float] = Field(..., min_length=1)

class AcceptRequest(SenderRequest):
    deal_id: str = Field(..., description="Deal ID")

class ReleaseRequest(SenderRequest):
    deal_id: str = Field(..., description="Deal ID")
    milestone_index: int = Field(..., ge=0)
    amount: float = Field(..., gt=0)
    destination: str = Field(..., description="Recipient Public Key")

class SubmitRequest(BaseModel):
    xdr: str = Field(..., description="Signed transaction XDR")


DEFAULT_SELLER_WALLET = os.getenv(
    "DEFAULT_SELLER_WALLET",
    "GC5OZM7AY73DKZMPWU5BMW3EA6BXCYJIIF6UUQQ44XT4DOJQOXQZU2YF",
)


def _resolve_recipient_wallet(deal_id: str) -> str:
    deal_record = get_deal(deal_id)
    if not deal_record:
        return DEFAULT_SELLER_WALLET
    deal_data = deal_record.get("data") or {}
    request_data = deal_data.get("request") or deal_data
    return deal_data.get("seller_wallet") or request_data.get("seller_wallet") or DEFAULT_SELLER_WALLET


def _require_registered_seller_wallet(deal_id: str) -> str:
    """
    Returns the seller wallet that explicitly accepted the deal. Unlike
    _resolve_recipient_wallet (used for informational x402 fee quotes), this
    never falls back to DEFAULT_SELLER_WALLET, so a fund-moving release
    transaction can't be built to pay out to the shared demo/placeholder
    address just because the real seller hasn't accepted yet.
    """
    deal_record = get_deal(deal_id)
    if not deal_record:
        raise HTTPException(status_code=404, detail="Deal ID not found")
    deal_data = deal_record.get("data") or {}
    if not deal_data.get("seller_accepted"):
        raise HTTPException(
            status_code=400,
            detail="Seller has not registered a wallet for this deal yet",
        )
    seller_wallet = deal_data.get("seller_wallet")
    if not seller_wallet:
        raise HTTPException(status_code=400, detail="Deal has no registered seller wallet")
    return seller_wallet


def _gate_x402(sender: str, deal_id: str, purpose: str):
    recipient_wallet = _resolve_recipient_wallet(deal_id)
    authorized, payload = ensure_x402_authorized(
        wallet_address=sender,
        deal_id=deal_id,
        purpose=purpose,
        recipient_wallet=recipient_wallet,
        amount=get_x402_fee(purpose),
    )
    if not authorized:
        raise HTTPException(status_code=402, detail=payload)

@router.get("/contract/info")
def contract_info():
    return {
        "network": os.getenv("VITE_STELLAR_NETWORK", "TESTNET"),
        "horizon_url": os.getenv("VITE_HORIZON_URL", "https://horizon-testnet.stellar.org"),
        "protocol": "A2A Protocol v1.0",
        "ecosystem": "Stellar Soroban"
    }

@router.post("/contract/create-txn")
def contract_create_txn(payload: CreateDealRequest):
    try:
        if any(m <= 0 for m in payload.milestones):
            raise HTTPException(status_code=400, detail="Milestone amounts must be positive")
        if round(sum(payload.milestones), 7) != round(payload.total, 7):
            raise HTTPException(status_code=400, detail="Milestone amounts must sum to the total")
        _gate_x402(payload.sender, payload.deal_id, "escrow_authorization_fee")
        xdr = stellar_service.build_create_deal_transaction(
            payload.sender, payload.deal_id, payload.total, payload.milestones
        )
        return {"xdr": xdr}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/contract/release-txn")
def contract_release_txn(payload: ReleaseRequest):
    try:
        # Ignore the client-supplied destination for an actual fund-moving
        # release: always pay out to the wallet the seller explicitly
        # registered via /deal/{id}/accept, never an arbitrary address the
        # caller passed in and never the shared DEFAULT_SELLER_WALLET.
        recipient_wallet = _require_registered_seller_wallet(payload.deal_id)
        _gate_x402(payload.sender, payload.deal_id, "payment_release_fee")
        xdr = stellar_service.build_release_transaction(
            payload.sender, payload.deal_id, recipient_wallet, payload.amount
        )
        return {"xdr": xdr}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/contract/submit")
def contract_submit(payload: SubmitRequest):
    try:
        tx_hash = stellar_service.submit_signed_transaction(payload.xdr)
        return {"tx_hash": tx_hash}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/wallet/balance")
def wallet_balance(address: str = Query(..., description="Stellar Public Key")):
    balance = stellar_service.get_account_balance(address)
    return {"address": address, "balance": balance, "asset": "XLM"}
