import sqlite3
import json
from typing import Any, Optional, Dict, List
from .database_service import get_db_connection
from .deal_store import get_deals_by_wallet

def get_wallet_state(address: str) -> Dict[str, Any]:
    """
    Returns a structured state for the wallet, 
    including active deals and suggested next steps.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get last activity
    cursor.execute('''
        SELECT * FROM activity_logs 
        WHERE wallet_address = ? 
        ORDER BY timestamp DESC LIMIT 5
    ''', (address,))
    recent_logs = [dict(log) for log in cursor.fetchall()]
    
    # Get associated deals
    deals = get_deals_by_wallet(address)
    
    active_deals = []
    completed_deals = []
    
    for deal in deals:
        status = deal.get("status", "").lower()
        deal_data = json.loads(deal["data"]) if isinstance(deal["data"], str) else deal["data"]
        
        deal_summary = {
            "deal_id": deal["deal_id"],
            "status": deal["status"],
            "title": deal_data.get("request", {}).get("title") or "Untitled Protocol",
            "updated_at": deal["updated_at"]
        }
        
        # "accepted" (seller has accepted, negotiation not yet started) sits
        # between "created" and "running"/"negotiated" in the real deal
        # lifecycle (see routes/deal.py) but was missing from this list, so
        # a deal in that state was wrongly bucketed into completed_deals /
        # history instead of active_deals. ("funded" is never actually set
        # as a status value anywhere - only as a boolean field - so it never
        # matched here; dropped it in favor of the real status string.)
        if status in ["active", "accepted", "negotiated", "created", "running"]:
            active_deals.append(deal_summary)
        else:
            completed_deals.append(deal_summary)
            
    conn.close()
    
    return {
        "address": address,
        "active_deals": active_deals,
        "history": completed_deals[:10],
        "recent_activity": recent_logs,
        "next_step": _calculate_next_step(active_deals)
    }

def _calculate_next_step(active_deals: List[Dict[str, Any]]) -> Optional[str]:
    """Simple heuristic to guide the user."""
    if not active_deals:
        return "CREATE_FIRST_DEAL"
        
    latest = active_deals[0]
    status = latest["status"].lower()
    
    if status == "created":
        return "START_NEGOTIATION"
    if status == "negotiated":
        return "APPROVE_DEAL"
    if status == "active":
        return "MONITOR_SETTLEMENT"
        
    return "CONTINUE_DEAL"
