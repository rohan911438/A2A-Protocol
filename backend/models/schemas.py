from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class DealCreateRequest(BaseModel):
    title: Optional[str] = None
    budget: float = Field(..., gt=0)
    min_price: float = Field(..., gt=0)
    deadline: str
    description: str
    buyer_wallet: Optional[str] = None


class DealCreateResponse(BaseModel):
    deal_id: str
    status: str
    created_at: datetime


class NegotiationRequest(BaseModel):
    deal_id: str


class NegotiationResponse(BaseModel):
    status: str
    final_price: Optional[float] = None
    conversation: list[dict[str, Any]] = []
    rounds: int = 0


class DealDetailsResponse(BaseModel):
    deal_id: str
    status: str
    data: Optional[dict[str, Any]] = None
    created_at: Optional[datetime] = None
