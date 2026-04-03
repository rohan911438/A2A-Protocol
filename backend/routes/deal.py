import os
from datetime import datetime
from fastapi import APIRouter, HTTPException
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
    run_negotiation
)

router = APIRouter()

@router.post("/create-deal", response_model=DealCreateResponse)
def post_create_deal(payload: DealCreateRequest) -> DealCreateResponse:
    """
    1. Create Deal: Takes parameters and returns a deal_id.
    """
    request_data = payload.model_dump()
    data = {
        "request": request_data,
        "approvals": {"buyer": False, "seller": False},
        "seller_wallet": None,
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

    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=400,
            detail="GEMINI_API_KEY is not set. Please configure it to enable agents.",
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
    
    return NegotiationResponse(
        status=status,
        final_price=result.get("final_price"),
        conversation=result.get("conversation"),
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
    seller_wallet = payload.get("seller_wallet")
    deal_data = deal_record.get("data") or {}
    if seller_wallet:
        deal_data["seller_wallet"] = seller_wallet
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

    deal_data = deal_record.get("data") or {}
    onchain = deal_data.get("onchain_accepts") or {"buyer": False, "seller": False}
    onchain[role] = True
    txids = deal_data.get("txids") or {}
    txids[role] = txid
    deal_data["onchain_accepts"] = onchain
    deal_data["txids"] = txids

    # On-chain acceptance alone does not make the deal active (funding is required).
    status = deal_record.get("status", "negotiated")
    approvals = deal_data.get("approvals") or {"buyer": False, "seller": False}
    funded = bool(deal_data.get("funded"))
    if approvals.get("buyer") and approvals.get("seller") and onchain.get("buyer") and onchain.get("seller") and funded:
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

    deal_data = deal_record.get("data") or {}
    deal_data["funded"] = True
    deal_data["funding_txid"] = txid

    approvals = deal_data.get("approvals") or {"buyer": False, "seller": False}
    onchain = deal_data.get("onchain_accepts") or {"buyer": False, "seller": False}
    status = deal_record.get("status", "negotiated")
    if approvals.get("buyer") and approvals.get("seller") and onchain.get("buyer") and onchain.get("seller"):
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
    update_deal(id, status="Completed")
    return {"deal_id": id, "status": "Completed"}


@router.get("/deals")
def list_all_deals():
    """
    4. List Deals: Show all records in the store.
    """
    return list_deals()
