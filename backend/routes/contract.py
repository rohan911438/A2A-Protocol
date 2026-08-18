from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import os

from ..services import get_deal, ensure_x402_authorized, get_x402_fee
from ..services.stellar_service import stellar_service
from ..services.contract_service import contract_service, ContractServiceError

router = APIRouter()

# "legacy" (default) keeps building plain manage_data/payment ops exactly as
# before, so the live deployment's behavior is unchanged until a contract is
# actually deployed and this is explicitly flipped. "onchain" builds real
# InvokeHostFunction calls against the deployed a2a_escrow contract via
# contract_service.py.
CONTRACT_MODE = os.getenv("CONTRACT_MODE", "legacy").strip().lower()


def _parse_deadline_epoch(deadline_raw: Optional[str]) -> int:
    """
    Deal deadlines are stored as whatever the create-deal form submitted
    (a plain "YYYY-MM-DD" from an <input type="date">, occasionally a full
    ISO datetime from demo/test flows). The on-chain contract needs a unix
    timestamp strictly in the future. Falls back to 30 days out if the
    stored value is missing or unparseable rather than failing escrow
    creation over a cosmetic field.
    """
    if deadline_raw:
        try:
            dt = datetime.fromisoformat(str(deadline_raw))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            epoch = int(dt.timestamp())
            if epoch > int(datetime.now(timezone.utc).timestamp()):
                return epoch
        except (ValueError, TypeError):
            pass
    return int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp())


def _onchain_seller_and_deadline(deal_id: str) -> tuple[str, int]:
    seller_wallet = _require_registered_seller_wallet(deal_id)
    deal_record = get_deal(deal_id) or {}
    deal_data = deal_record.get("data") or {}
    request_data = deal_data.get("request") or deal_data
    deadline_epoch = _parse_deadline_epoch(request_data.get("deadline"))
    return seller_wallet, deadline_epoch

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

class ReleaseMilestonesRequest(SenderRequest):
    deal_id: str = Field(..., description="Deal ID")
    milestone_indices: List[int] = Field(..., min_length=1, description="Milestone indices to release together")

class SenderRequestWithDeal(SenderRequest):
    deal_id: str = Field(..., description="Deal ID")

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
    info = {
        "network": os.getenv("VITE_STELLAR_NETWORK", "TESTNET"),
        "horizon_url": os.getenv("VITE_HORIZON_URL", "https://horizon-testnet.stellar.org"),
        "protocol": "A2A Protocol v1.0",
        "ecosystem": "Stellar Soroban",
        "contract_mode": CONTRACT_MODE,
    }
    if CONTRACT_MODE == "onchain" and contract_service.enabled:
        info["escrow_contract_id"] = contract_service.contract_id
    return info

@router.post("/contract/create-txn")
def contract_create_txn(payload: CreateDealRequest):
    try:
        if any(m <= 0 for m in payload.milestones):
            raise HTTPException(status_code=400, detail="Milestone amounts must be positive")
        if round(sum(payload.milestones), 7) != round(payload.total, 7):
            raise HTTPException(status_code=400, detail="Milestone amounts must sum to the total")
        _gate_x402(payload.sender, payload.deal_id, "escrow_authorization_fee")

        if CONTRACT_MODE == "onchain" and contract_service.enabled:
            # verifier = the buyer's own wallet: the app's release flow has
            # the buyer authorize each milestone release (see
            # ActiveDeal.jsx), so the buyer is also the contract's verifier
            # role for deals created through this app - there's no separate
            # third-party verifier agent identity in the current UX.
            seller_wallet, deadline_epoch = _onchain_seller_and_deadline(payload.deal_id)
            xdr = contract_service.build_create_deal_txn(
                sender=payload.sender,
                deal_id=payload.deal_id,
                seller=seller_wallet,
                verifier=payload.sender,
                total_amount=payload.total,
                milestone_amounts=payload.milestones,
                deadline_unix=deadline_epoch,
            )
            return {"xdr": xdr, "mode": "onchain"}

        xdr = stellar_service.build_create_deal_transaction(
            payload.sender, payload.deal_id, payload.total, payload.milestones
        )
        return {"xdr": xdr, "mode": "legacy"}
    except ContractServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
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

        if CONTRACT_MODE == "onchain" and contract_service.enabled:
            xdr = contract_service.build_release_milestones_txn(
                sender=payload.sender,
                deal_id=payload.deal_id,
                milestone_indices=[payload.milestone_index],
            )
            return {"xdr": xdr, "mode": "onchain"}

        xdr = stellar_service.build_release_transaction(
            payload.sender, payload.deal_id, recipient_wallet, payload.amount
        )
        return {"xdr": xdr, "mode": "legacy"}
    except ContractServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/contract/release-milestones-txn")
def contract_release_milestones_txn(payload: ReleaseMilestonesRequest):
    """
    On-chain only: batch-release several milestones in a single contract
    call / token transfer instead of one call per milestone. Not available
    in legacy mode since plain payment ops have no equivalent batching.
    """
    if not (CONTRACT_MODE == "onchain" and contract_service.enabled):
        raise HTTPException(status_code=400, detail="Batched release requires CONTRACT_MODE=onchain")
    try:
        _require_registered_seller_wallet(payload.deal_id)
        _gate_x402(payload.sender, payload.deal_id, "payment_release_fee")
        xdr = contract_service.build_release_milestones_txn(
            sender=payload.sender,
            deal_id=payload.deal_id,
            milestone_indices=payload.milestone_indices,
        )
        return {"xdr": xdr, "mode": "onchain"}
    except ContractServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/contract/complete-txn")
def contract_complete_txn(payload: SenderRequestWithDeal):
    if not (CONTRACT_MODE == "onchain" and contract_service.enabled):
        raise HTTPException(status_code=400, detail="Requires CONTRACT_MODE=onchain")
    try:
        xdr = contract_service.build_complete_deal_txn(sender=payload.sender, deal_id=payload.deal_id)
        return {"xdr": xdr, "mode": "onchain"}
    except ContractServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/contract/refund-txn")
def contract_refund_txn(payload: SenderRequestWithDeal):
    if not (CONTRACT_MODE == "onchain" and contract_service.enabled):
        raise HTTPException(status_code=400, detail="Requires CONTRACT_MODE=onchain")
    try:
        xdr = contract_service.build_request_refund_txn(sender=payload.sender, deal_id=payload.deal_id)
        return {"xdr": xdr, "mode": "onchain"}
    except ContractServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
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
