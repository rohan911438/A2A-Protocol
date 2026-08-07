import os
import re
from datetime import datetime
from typing import Any
from fastapi import APIRouter, HTTPException, Query
from ..models import (
    DealCreateRequest, 
    DealCreateResponse, 
    NegotiationRequest, 
    NegotiationResponse, 
    DealDetailsResponse
)
from ..services import (
    create_deal,
    get_deal,
    update_deal,
    list_deals,
    run_negotiation,
    get_wallet_state,
    log_reasoning,
    save_deal_summary,
    get_deal_summary,
    ensure_x402_authorized,
    record_x402_payment,
    get_x402_fee,
)
from ..services.stellar_service import stellar_service

router = APIRouter()

DEFAULT_SELLER_WALLET = os.getenv(
    "DEFAULT_SELLER_WALLET",
    "GC5OZM7AY73DKZMPWU5BMW3EA6BXCYJIIF6UUQQ44XT4DOJQOXQZU2YF",
)
X402_MODE = os.getenv("X402_MODE", "simulate").strip().lower()

# Off-chain lifecycle endpoints (fund/onchain-accept/release) previously trusted
# any client-supplied txid string at face value, letting anyone advance a deal's
# status (or mark a milestone "released") without an actual on-chain payment.
# Verification is on by default; only disable for local/offline development.
VERIFY_ONCHAIN_TX = os.getenv("VERIFY_ONCHAIN_TX", "true").strip().lower() not in ("false", "0", "no")


def is_stellar_account(value: str | None) -> bool:
    return bool(value and re.fullmatch(r"G[A-Z2-7]{55}", value))


def _require_verified_txid(txid: str) -> None:
    if not VERIFY_ONCHAIN_TX:
        return
    if not stellar_service.verify_transaction_success(txid):
        raise HTTPException(
            status_code=400,
            detail="txid could not be verified as a successful on-chain transaction",
        )


def _format_delivery_window(deadline: str | None) -> str:
    if not deadline:
        return "Not specified"
    try:
        dt = datetime.fromisoformat(str(deadline))
        now = datetime.utcnow()
        days = (dt - now).days
        if days < 0:
            return f"Past due ({abs(days)} day(s) ago)"
        return f"{max(days, 0)} day(s) remaining"
    except Exception:
        return str(deadline)


def _compute_negotiation_volatility(conversation: list[dict[str, Any]]) -> float:
    if len(conversation) < 2:
        return 0.0

    midpoints: list[float] = []
    for turn in conversation:
        buyer_price = float(turn.get("buyer_price") or 0)
        seller_price = float(turn.get("seller_price") or 0)
        if buyer_price > 0 and seller_price > 0:
            midpoints.append((buyer_price + seller_price) / 2)

    if len(midpoints) < 2:
        return 0.0

    deltas = [abs(midpoints[i] - midpoints[i - 1]) for i in range(1, len(midpoints))]
    avg_midpoint = sum(midpoints) / len(midpoints)
    if avg_midpoint <= 0:
        return 0.0

    normalized = sum(deltas) / len(deltas) / avg_midpoint
    return min(max(normalized, 0.0), 1.0)


def _normalize_reputation(value: Any) -> float:
    try:
        score = float(value)
    except Exception:
        score = 0.72
    return min(max(score, 0.0), 1.0)


def _build_payment_structure(milestones: list[float], final_price: float) -> dict[str, Any]:
    if not milestones:
        return {
            "type": "single_settlement",
            "milestones": [],
            "note": "Single escrow funding and release path",
        }

    total = max(float(final_price or 0), 1.0)
    structured = []
    for idx, amount in enumerate(milestones, start=1):
        pct = round((float(amount) / total) * 100, 2)
        structured.append(
            {
                "index": idx,
                "amount": round(float(amount), 4),
                "percentage": pct,
            }
        )

    return {
        "type": "milestone",
        "milestones": structured,
        "note": "Milestone-gated release schedule",
    }


def _compute_risk_score(
    seller_reputation: float,
    volatility: float,
    rounds: int,
) -> dict[str, Any]:
    reputation_risk = 1.0 - seller_reputation
    round_pressure = min(max(rounds / 6.0, 0.0), 1.0)

    score_0_to_1 = (reputation_risk * 0.5) + (volatility * 0.35) + (round_pressure * 0.15)
    score = round(min(max(score_0_to_1, 0.0), 1.0) * 100, 2)

    if score >= 70:
        label = "high"
    elif score >= 40:
        label = "medium"
    else:
        label = "low"

    return {
        "score": score,
        "label": label,
        "factors": {
            "seller_reputation": round(seller_reputation, 2),
            "negotiation_volatility": round(volatility, 4),
            "round_pressure": round(round_pressure, 4),
        },
    }


def _build_smart_summary(deal_id: str, deal_record: dict[str, Any]) -> dict[str, Any]:
    deal_data = deal_record.get("data") or {}
    request_data = deal_data.get("request") or deal_data
    result = deal_data.get("result") or {}

    final_price = float(result.get("final_price") or 0)
    conversation = result.get("conversation") or []
    rounds = int(result.get("rounds") or len(conversation) or 0)

    milestone_values = result.get("milestones") or []
    if not milestone_values and final_price > 0:
        first = round(final_price * 0.4)
        second = max(final_price - first, 0)
        milestone_values = [first, second] if second > 0 else [first]

    seller_wallet = deal_data.get("seller_wallet") or request_data.get("seller_wallet") or DEFAULT_SELLER_WALLET
    buyer_wallet = request_data.get("buyer_wallet") or deal_data.get("buyer_wallet")

    seller_reputation = _normalize_reputation(request_data.get("seller_reputation"))
    volatility = _compute_negotiation_volatility(conversation)

    payment_structure = _build_payment_structure(milestone_values, final_price)
    risk = _compute_risk_score(seller_reputation, volatility, rounds)

    return {
        "deal_id": deal_id,
        "generated_at": datetime.utcnow().isoformat(),
        "agreement": {
            "final_agreed_price": round(final_price, 4),
            "asset": "XLM",
            "estimated_delivery": _format_delivery_window(request_data.get("deadline")),
            "milestones_count": len(payment_structure.get("milestones") or []),
            "payment_structure": payment_structure,
        },
        "participants": {
            "buyer_agent": {
                "identity": "Buyer Agent",
                "wallet_address": buyer_wallet,
            },
            "seller_agent": {
                "identity": "Seller Agent",
                "wallet_address": seller_wallet,
            },
        },
        "risk_assessment": risk,
        "negotiation_metrics": {
            "rounds": rounds,
            "volatility_index": round(volatility, 4),
            "status": deal_record.get("status") or "unknown",
        },
    }


def _resolve_x402_participants(deal_record: dict[str, Any], wallet_address: str | None) -> tuple[str, str]:
    deal_data = deal_record.get("data") or {}
    request_data = deal_data.get("request") or deal_data
    buyer_wallet = wallet_address or request_data.get("buyer_wallet") or deal_data.get("buyer_wallet")
    seller_wallet = deal_data.get("seller_wallet") or request_data.get("seller_wallet") or DEFAULT_SELLER_WALLET
    return buyer_wallet or "", seller_wallet or ""


def _require_x402_payment(
    deal_id: str,
    deal_record: dict[str, Any],
    wallet_address: str | None,
    purpose: str,
) -> tuple[bool, dict[str, Any]]:
    buyer_wallet, seller_wallet = _resolve_x402_participants(deal_record, wallet_address)
    effective_wallet = buyer_wallet if is_stellar_account(wallet_address) else wallet_address or buyer_wallet
    recipient_wallet = seller_wallet
    if purpose == "payment_release_fee":
        recipient_wallet = seller_wallet
    elif purpose == "deal_completion_fee":
        recipient_wallet = seller_wallet
    elif purpose == "audit_export_fee":
        recipient_wallet = seller_wallet

    if X402_MODE != "enforce":
        return True, {
            "status": "authorized",
            "purpose": purpose,
            "amount": get_x402_fee(purpose),
            "currency": "XLM",
            "recipient_wallet": recipient_wallet,
            "wallet_address": effective_wallet,
            "deal_id": deal_id,
            "tx_hash": "simulated",
            "source": "simulated",
            "verified_at": datetime.utcnow().isoformat(),
            "message": "x402 authorization simulated for test/demo mode",
        }

    if not is_stellar_account(effective_wallet):
        return False, {
            "status": "payment_required",
            "purpose": purpose,
            "amount": get_x402_fee(purpose),
            "currency": "XLM",
            "recipient_wallet": recipient_wallet,
            "wallet_address": effective_wallet,
            "deal_id": deal_id,
            "message": "Protocol authorization required before proceeding",
        }

    return ensure_x402_authorized(
        wallet_address=effective_wallet,
        deal_id=deal_id,
        purpose=purpose,
        recipient_wallet=recipient_wallet,
    )

@router.post("/create-deal", response_model=DealCreateResponse)
def post_create_deal(payload: DealCreateRequest) -> DealCreateResponse:
    """
    1. Create Deal: Takes parameters and returns a deal_id.
    """
    request_data = payload.model_dump()
    if is_stellar_account(DEFAULT_SELLER_WALLET):
        request_data["seller_wallet"] = request_data.get("seller_wallet") or DEFAULT_SELLER_WALLET
    data = {
        "request": request_data,
        "approvals": {"buyer": False, "seller": False},
        "seller_wallet": request_data.get("seller_wallet") if is_stellar_account(request_data.get("seller_wallet")) else (DEFAULT_SELLER_WALLET if is_stellar_account(DEFAULT_SELLER_WALLET) else None),
        "onchain_accepts": {"buyer": False, "seller": False},
        "txids": {},
        "releases": {"completed": [], "txids": {}},
    }
    deal_id = create_deal(data=data, status="created")
    return DealCreateResponse(
        deal_id=deal_id,
        status="created",
        created_at=datetime.utcnow()
    )


@router.post("/start-negotiation", response_model=NegotiationResponse)
def post_start_negotiation(payload: NegotiationRequest) -> NegotiationResponse:
    """
    2. Start Negotiation: Takes deal_id and executes agents.
    """
    deal_record = get_deal(payload.deal_id)
    if not deal_record:
        raise HTTPException(status_code=404, detail="Deal ID not found")

    if not (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")):
        raise HTTPException(
            status_code=400,
            detail="GEMINI_API_KEY or GOOGLE_API_KEY is not set. Please configure one to enable agents.",
        )

    # Update status to running
    update_deal(payload.deal_id, status="running")
    
    deal_data = deal_record.get("data") or {}
    request_data = deal_data.get("request") or deal_data

    # Actually run the negotiation using the parameters from the record
    # request_data contains {budget, min_price, deadline, description}
    result = run_negotiation(request_data)
    
    # Map engine results to status
    success = result.get("status") == "closed"
    status = "negotiated" if success else "failed"

    # Fallback: if no final_price but conversation exists, use last seller/buyer price
    final_price = result.get("final_price")
    if not final_price:
        convo = result.get("conversation") or []
        if convo:
            last = convo[-1]
            final_price = last.get("seller_price") or last.get("buyer_price")
            if final_price:
                result["final_price"] = final_price
                status = "negotiated"

    # Attach simple milestone split to result for UI
    if final_price:
        first = round(final_price * 0.4)
        second = max(final_price - first, 0)
        result["milestones"] = [first, second] if second > 0 else [first]

    approvals = deal_data.get("approvals") or request_data.get("approvals") or {"buyer": False, "seller": False}
    seller_wallet = deal_data.get("seller_wallet") or request_data.get("seller_wallet")
    if not is_stellar_account(seller_wallet) and is_stellar_account(DEFAULT_SELLER_WALLET):
        seller_wallet = DEFAULT_SELLER_WALLET
    buyer_wallet = request_data.get("buyer_wallet")

    # Persist the final result while keeping original request and approvals
    update_deal(
        payload.deal_id,
        data={
            "request": request_data,
            "result": result,
            "approvals": approvals,
            "seller_wallet": seller_wallet,
            "onchain_accepts": deal_data.get("onchain_accepts", {"buyer": False, "seller": False}),
            "txids": deal_data.get("txids", {}),
            "funded": deal_data.get("funded", False),
            "funding_txid": deal_data.get("funding_txid"),
            "releases": deal_data.get("releases", {"completed": [], "txids": {}}),
        },
        status=status,
    )

    # Store explainability trail by wallet + deal for auditability.
    reasoning_entries = result.get("reasoning") or []
    for step in reasoning_entries:
        round_number = int(step.get("round", 0) or 0)
        if round_number <= 0:
            continue
        factors = step.get("factors") or {}

        if is_stellar_account(buyer_wallet):
            log_reasoning(
                wallet_address=buyer_wallet,
                deal_id=payload.deal_id,
                round_number=round_number,
                role="buyer",
                summary=step.get("buyer_reasoning") or "Buyer decision rationale",
                details={"decision_basis": step.get("decision_basis"), "factors": factors},
            )
        if is_stellar_account(seller_wallet):
            log_reasoning(
                wallet_address=seller_wallet,
                deal_id=payload.deal_id,
                round_number=round_number,
                role="seller",
                summary=step.get("seller_reasoning") or "Seller decision rationale",
                details={"decision_basis": step.get("decision_basis"), "factors": factors},
            )
    
    return NegotiationResponse(
        status=status,
        final_price=result.get("final_price"),
        conversation=result.get("conversation"),
        reasoning=result.get("reasoning") or [],
        rounds=result.get("rounds")
    )


@router.get("/deal/{id}", response_model=DealDetailsResponse)
def get_deal_by_id(id: str) -> DealDetailsResponse:
    """
    3. Get Deal: Fetch specific deal by ID.
    """
    deal_record = get_deal(id)
    if not deal_record:
        raise HTTPException(status_code=404, detail="Deal ID not found")
        
    return DealDetailsResponse(
        deal_id=id,
        status=deal_record["status"],
        data=deal_record["data"],
        created_at=datetime.utcnow() # Using current time for placeholder
    )


@router.post("/deal/{id}/accept")
def accept_deal(id: str, payload: dict):
    """
    Seller accepts a task before negotiation (off-chain).
    """
    deal_record = get_deal(id)
    if not deal_record:
        raise HTTPException(status_code=404, detail="Deal ID not found")

    deal_data = deal_record.get("data") or {}
    requested_wallet = payload.get("seller_wallet")

    # Once a real seller wallet has explicitly accepted, lock it in. Without
    # this, any caller who discovers the deal_id (e.g. via GET /deals, which
    # is unauthenticated and lists every deal) could re-POST /accept with a
    # different seller_wallet and hijack future milestone payouts.
    if deal_data.get("seller_accepted"):
        current_wallet = deal_data.get("seller_wallet")
        if requested_wallet and is_stellar_account(requested_wallet) and requested_wallet != current_wallet:
            raise HTTPException(status_code=409, detail="Deal already accepted by a seller wallet")
        update_deal(id, data=deal_data, status="accepted")
        return {"deal_id": id, "status": "accepted"}

    seller_wallet = requested_wallet or deal_data.get("seller_wallet") or DEFAULT_SELLER_WALLET
    if is_stellar_account(seller_wallet):
        deal_data["seller_wallet"] = seller_wallet
    if requested_wallet and is_stellar_account(requested_wallet):
        deal_data["seller_accepted"] = True
    update_deal(id, data=deal_data, status="accepted")
    return {"deal_id": id, "status": "accepted"}


@router.post("/deal/{id}/approve")
def approve_deal(id: str, payload: dict):
    """
    Final approval after negotiation (off-chain). role: buyer|seller
    """
    deal_record = get_deal(id)
    if not deal_record:
        raise HTTPException(status_code=404, detail="Deal ID not found")
    role = payload.get("role")
    if role not in ("buyer", "seller"):
        raise HTTPException(status_code=400, detail="Invalid role")
    approvals = deal_record["data"].get("approvals", {"buyer": False, "seller": False})
    approvals[role] = True
    deal_record["data"]["approvals"] = approvals
    update_deal(id, data=deal_record["data"], status=deal_record["status"])
    return {"deal_id": id, "approvals": approvals}


@router.post("/deal/{id}/onchain-accept")
def onchain_accept(id: str, payload: dict):
    """
    Record on-chain acceptance or deposit. role: buyer|seller, txid required.
    """
    deal_record = get_deal(id)
    if not deal_record:
        raise HTTPException(status_code=404, detail="Deal ID not found")
    role = payload.get("role")
    txid = payload.get("txid")
    if role not in ("buyer", "seller"):
        raise HTTPException(status_code=400, detail="Invalid role")
    if not txid:
        raise HTTPException(status_code=400, detail="txid is required")
    _require_verified_txid(txid)

    deal_data = deal_record.get("data") or {}
    onchain = deal_data.get("onchain_accepts") or {"buyer": False, "seller": False}
    onchain[role] = True
    txids = deal_data.get("txids") or {}
    txids[role] = txid
    deal_data["onchain_accepts"] = onchain
    deal_data["txids"] = txids

    # On-chain acceptance alone does not make the deal active (funding is required).
    # Note: only the buyer submits an on-chain transaction to fund escrow in this
    # flow, so activation must not require a seller-side on-chain acceptance.
    status = deal_record.get("status", "negotiated")
    approvals = deal_data.get("approvals") or {"buyer": False, "seller": False}
    funded = bool(deal_data.get("funded"))
    if approvals.get("buyer") and approvals.get("seller") and onchain.get("buyer") and funded:
        status = "active"
    update_deal(id, data=deal_data, status=status)
    return {"deal_id": id, "status": status, "onchain_accepts": onchain, "txids": txids}


@router.post("/deal/{id}/fund")
def fund_deal(id: str, payload: dict):
    """
    Record that escrow funding (deposit) completed on-chain.
    """
    deal_record = get_deal(id)
    if not deal_record:
        raise HTTPException(status_code=404, detail="Deal ID not found")
    txid = payload.get("txid")
    if not txid:
        raise HTTPException(status_code=400, detail="txid is required")
    _require_verified_txid(txid)

    deal_data = deal_record.get("data") or {}
    deal_data["funded"] = True
    deal_data["funding_txid"] = txid

    approvals = deal_data.get("approvals") or {"buyer": False, "seller": False}
    onchain = deal_data.get("onchain_accepts") or {"buyer": False, "seller": False}
    status = deal_record.get("status", "negotiated")
    # Only the buyer's on-chain acceptance is required to activate; the seller
    # never submits an on-chain transaction in this flow (see onchain-accept route).
    if approvals.get("buyer") and approvals.get("seller") and onchain.get("buyer"):
        status = "active"

    update_deal(id, data=deal_data, status=status)
    return {"deal_id": id, "status": status, "funded": True, "funding_txid": txid}


@router.post("/deal/{id}/release")
def record_release(id: str, payload: dict):
    """
    Record milestone release after on-chain success.
    """
    deal_record = get_deal(id)
    if not deal_record:
        raise HTTPException(status_code=404, detail="Deal ID not found")
    milestone_index = payload.get("milestone_index")
    txid = payload.get("txid")
    if milestone_index is None or not isinstance(milestone_index, int):
        raise HTTPException(status_code=400, detail="milestone_index is required")
    if not txid:
        raise HTTPException(status_code=400, detail="txid is required")
    _require_verified_txid(txid)

    deal_data = deal_record.get("data") or {}
    releases = deal_data.get("releases") or {"completed": [], "txids": {}}
    completed = releases.get("completed") or []
    if milestone_index not in completed:
        completed.append(milestone_index)
    txids = releases.get("txids") or {}
    txids[str(milestone_index)] = txid
    releases["completed"] = completed
    releases["txids"] = txids
    deal_data["releases"] = releases
    update_deal(id, data=deal_data, status=deal_record.get("status", "active"))
    return {"deal_id": id, "releases": releases}


@router.post("/deal/{id}/reject")
def reject_deal(id: str, payload: dict):
    """
    Reject after negotiation (off-chain). role: buyer|seller
    """
    deal_record = get_deal(id)
    if not deal_record:
        raise HTTPException(status_code=404, detail="Deal ID not found")
    role = payload.get("role")
    if role not in ("buyer", "seller"):
        raise HTTPException(status_code=400, detail="Invalid role")
    update_deal(id, status="rejected")
    return {"deal_id": id, "status": "rejected", "rejected_by": role}


@router.post("/deal/{id}/complete")
def complete_deal(id: str):
    """
    Mark a deal as completed after all milestones are released.
    """
    deal_record = get_deal(id)
    if not deal_record:
        raise HTTPException(status_code=404, detail="Deal ID not found")

    deal_data = deal_record.get("data") or {}
    buyer_wallet, _ = _resolve_x402_participants(deal_record, None)
    authorized, payload = _require_x402_payment(id, deal_record, buyer_wallet, "deal_completion_fee")
    if not authorized:
        raise HTTPException(status_code=402, detail=payload)

    update_deal(id, status="Completed")
    return {"deal_id": id, "status": "Completed"}


@router.get("/deal/{id}/audit-export")
def export_audit_bundle(id: str, wallet_address: str | None = Query(default=None)):
    """
    Premium audit export gated by x402 payment authorization.
    """
    deal_record = get_deal(id)
    if not deal_record:
        raise HTTPException(status_code=404, detail="Deal ID not found")

    authorized, payload = _require_x402_payment(id, deal_record, wallet_address, "audit_export_fee")
    if not authorized:
        raise HTTPException(status_code=402, detail=payload)

    summary = _build_smart_summary(id, deal_record)
    return {
        "deal_id": id,
        "audit_summary": summary,
        "status": deal_record.get("status"),
        "data": deal_record.get("data"),
    }


@router.get("/deal/{id}/x402-status")
def get_x402_status(id: str, wallet_address: str = Query(...), purpose: str = Query("escrow_authorization_fee")):
    """
    Returns the latest x402 authorization state for a deal + wallet + purpose.
    """
    deal_record = get_deal(id)
    if not deal_record:
        raise HTTPException(status_code=404, detail="Deal ID not found")

    buyer_wallet, seller_wallet = _resolve_x402_participants(deal_record, wallet_address)
    recipient_wallet = seller_wallet
    if purpose in {"deal_completion_fee", "payment_release_fee", "audit_export_fee"}:
        recipient_wallet = seller_wallet

    if X402_MODE != "enforce":
        return {
            "status": "authorized",
            "purpose": purpose,
            "amount": get_x402_fee(purpose),
            "currency": "XLM",
            "recipient_wallet": recipient_wallet,
            "wallet_address": wallet_address,
            "deal_id": id,
            "tx_hash": "simulated",
            "source": "simulated",
            "verified_at": datetime.utcnow().isoformat(),
            "message": "x402 authorization simulated for test/demo mode",
        }

    from ..services.database_service import get_x402_event

    event = get_x402_event(wallet_address, id, purpose)
    if event and event.get("status") == "verified":
        return {
            "status": "authorized",
            "purpose": purpose,
            "amount": event.get("amount") or get_x402_fee(purpose),
            "currency": "XLM",
            "recipient_wallet": event.get("recipient_wallet") or recipient_wallet,
            "wallet_address": wallet_address,
            "deal_id": id,
            "tx_hash": event.get("tx_hash"),
            "source": event.get("source"),
            "verified_at": event.get("verified_at"),
        }

    return {
        "status": event.get("status") if event else "payment_required",
        "purpose": purpose,
        "amount": event.get("amount") if event else get_x402_fee(purpose),
        "currency": "XLM",
        "recipient_wallet": event.get("recipient_wallet") if event else recipient_wallet,
        "wallet_address": wallet_address,
        "deal_id": id,
        "tx_hash": event.get("tx_hash") if event else None,
        "source": event.get("source") if event else None,
        "verified_at": event.get("verified_at") if event else None,
        "message": "Protocol authorization required before proceeding",
    }


@router.post("/deal/{id}/x402-payment")
def record_x402_payment_event(id: str, payload: dict[str, Any]):
    """
    Records a Stellar tx hash or local confirmation for a deal-scoped x402 payment.
    """
    deal_record = get_deal(id)
    if not deal_record:
        raise HTTPException(status_code=404, detail="Deal ID not found")

    wallet_address = payload.get("wallet_address")
    purpose = payload.get("purpose") or "escrow_authorization_fee"
    tx_hash = payload.get("tx_hash")
    confirm_local = bool(payload.get("confirm_local"))
    if not wallet_address:
        raise HTTPException(status_code=400, detail="wallet_address is required")

    _, recipient_wallet = _resolve_x402_participants(deal_record, wallet_address)
    event = record_x402_payment(
        wallet_address=wallet_address,
        deal_id=id,
        purpose=purpose,
        recipient_wallet=recipient_wallet,
        tx_hash=tx_hash,
        confirm_local=confirm_local,
    )
    return event


@router.get("/deal/{id}/smart-summary")
def get_smart_deal_summary(id: str, wallet_address: str | None = Query(default=None)):
    """
    Generate and persist a structured smart summary from live negotiation data.
    Returns stored snapshot fallback if generation inputs are unavailable.
    """
    deal_record = get_deal(id)
    if not deal_record:
        raise HTTPException(status_code=404, detail="Deal ID not found")

    deal_data = deal_record.get("data") or {}
    request_data = deal_data.get("request") or deal_data
    effective_wallet = wallet_address or request_data.get("buyer_wallet") or deal_data.get("seller_wallet")

    if not effective_wallet:
        raise HTTPException(status_code=400, detail="wallet_address is required for summary storage")

    can_generate = bool((deal_data.get("result") or {}).get("final_price") or (deal_data.get("result") or {}).get("conversation"))
    if can_generate:
        summary = _build_smart_summary(id, deal_record)
        save_deal_summary(effective_wallet, id, summary)
        return {
            "deal_id": id,
            "wallet_address": effective_wallet,
            "source": "live",
            "summary": summary,
        }

    existing = get_deal_summary(effective_wallet, id)
    if existing:
        return {
            "deal_id": id,
            "wallet_address": effective_wallet,
            "source": "stored",
            "summary": existing.get("summary") or {},
            "created_at": existing.get("created_at"),
            "updated_at": existing.get("updated_at"),
        }

    raise HTTPException(status_code=404, detail="Smart summary not available yet. Complete negotiation first.")


@router.get("/deals")
def list_all_deals():
    """
    4. List Deals: Show all records in the store.
    """
    return list_deals()


@router.get("/wallet-state/{address}")
def get_user_state(address: str):
    """
    5. Wallet State: Restore user session and track activity.
    """
    try:
        return get_wallet_state(address)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
