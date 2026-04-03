from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import os

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
        xdr = stellar_service.build_create_deal_transaction(
            payload.sender, payload.deal_id, payload.total, payload.milestones
        )
        return {"xdr": xdr}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/contract/release-txn")
def contract_release_txn(payload: ReleaseRequest):
    try:
        xdr = stellar_service.build_release_transaction(
            payload.sender, payload.deal_id, payload.destination, payload.amount
        )
        return {"xdr": xdr}
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
