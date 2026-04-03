from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from typing import List

from algosdk.error import AlgodHTTPError
from fastapi import HTTPException
from ..services.algorand_service import (
    get_app_address,
    get_app_id,
    build_create_deal_group,
    build_accept_txn,
    build_deposit_group,
    build_release_txn,
    submit_signed_transactions,
    get_account_balance,
)

router = APIRouter()


class SenderRequest(BaseModel):
    sender: str = Field(..., description="Wallet address")


class CreateDealRequest(SenderRequest):
    deal_id: str = Field(..., description="Deal ID")
    total: int = Field(..., gt=0)
    milestones: List[int] = Field(..., min_length=1)


class AcceptRequest(SenderRequest):
    deal_id: str = Field(..., description="Deal ID")


class DepositRequest(SenderRequest):
    deal_id: str = Field(..., description="Deal ID")
    amount: int = Field(..., gt=0, description="Amount in microAlgos")


class ReleaseRequest(SenderRequest):
    deal_id: str = Field(..., description="Deal ID")
    milestone_index: int = Field(..., ge=0)
    seller: str | None = None


class SubmitRequest(BaseModel):
    signed_txns: List[str] = Field(..., description="List of base64-encoded signed transactions")


@router.get("/contract/info")
def contract_info():
    app_id = get_app_id()
    app_address = get_app_address(app_id)
    return {
        "app_id": app_id,
        "app_address": app_address,
        "network": "testnet",
    }


@router.post("/contract/create-txn")
def contract_create_txn(payload: CreateDealRequest):
    txns = build_create_deal_group(payload.sender, payload.deal_id, payload.total, payload.milestones)
    return {"txns": txns}


@router.post("/contract/accept-txn")
def contract_accept_txn(payload: AcceptRequest):
    txn = build_accept_txn(payload.sender, payload.deal_id)
    return {"txn": txn}


@router.post("/contract/deposit-txn")
def contract_deposit_txn(payload: DepositRequest):
    txns = build_deposit_group(payload.sender, payload.deal_id, payload.amount)
    return {"txns": txns}


@router.post("/contract/release-txn")
def contract_release_txn(payload: ReleaseRequest):
    txn = build_release_txn(payload.sender, payload.deal_id, payload.milestone_index, payload.seller)
    return {"txn": txn}


@router.post("/contract/submit")
def contract_submit(payload: SubmitRequest):
    try:
        txids = submit_signed_transactions(payload.signed_txns)
        return {"txids": txids}
    except AlgodHTTPError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/wallet/balance")
def wallet_balance(address: str = Query(..., description="Wallet address")):
    amount = get_account_balance(address)
    return {"address": address, "microalgos": amount}
