from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import Any

try:
    from pymongo import MongoClient
except Exception:
    MongoClient = None  # type: ignore


def _get_collection():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DB", "agentic_exchange")
    if not uri or not MongoClient:
        return None
    client = MongoClient(uri)
    return client[db_name]["deals"]


# In-memory fallback
deals: dict[str, dict[str, Any]] = {}


def create_deal(data: dict[str, Any], status: str = "created", deal_id: str | None = None) -> str:
    """
    Creates a new deal in the store.
    If deal_id is not provided, a unique one is generated.
    """
    if not deal_id:
        deal_id = str(uuid.uuid4())
    
    record = {
        "deal_id": deal_id,
        "data": data,
        "status": status,
        "created_at": datetime.utcnow(),
    }
    collection = _get_collection()
    if collection is not None:
        collection.insert_one(record)
        return deal_id

    deals[deal_id] = {
        "data": data,
        "status": status,
        "created_at": record["created_at"],
    }
    return deal_id


def update_deal(deal_id: str, data: dict[str, Any] | None = None, status: str | None = None) -> bool:
    """
    Updates an existing deal record.
    """
    collection = _get_collection()
    if collection is not None:
        update_doc: dict[str, Any] = {}
        if data is not None:
            update_doc["data"] = data
        if status is not None:
            update_doc["status"] = status
        if not update_doc:
            return False
        result = collection.update_one({"deal_id": deal_id}, {"$set": update_doc})
        return result.matched_count > 0

    if deal_id not in deals:
        return False
    if data is not None:
        deals[deal_id]["data"] = data
    if status is not None:
        deals[deal_id]["status"] = status
    return True


def get_deal(deal_id: str) -> dict[str, Any] | None:
    """
    Retrieves a deal by ID.
    Returns the full record: {"data": ..., "status": ...}
    """
    collection = _get_collection()
    if collection is not None:
        doc = collection.find_one({"deal_id": deal_id}, {"_id": 0})
        return doc
    return deals.get(deal_id)


def list_deals() -> dict[str, dict[str, Any]]:
    """
    Returns all stored deals.
    """
    collection = _get_collection()
    if collection is not None:
        output: dict[str, dict[str, Any]] = {}
        for doc in collection.find({}, {"_id": 0}):
            output[doc["deal_id"]] = {
                "data": doc.get("data"),
                "status": doc.get("status"),
                "created_at": doc.get("created_at"),
            }
        return output
    return deals
