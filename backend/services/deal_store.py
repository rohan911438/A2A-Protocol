from __future__ import annotations
import json
import uuid
from datetime import datetime
from typing import Any, Optional
from .database_service import get_db_connection, log_activity

def create_deal(data: dict[str, Any], status: str = "created", deal_id: str | None = None) -> str:
    """
    Creates a new deal in the local SQLite database.
    """
    if not deal_id:
        deal_id = str(uuid.uuid4())
    
    # Extract buyer address for activity logging
    buyer_address = data.get("request", {}).get("buyer_wallet") or data.get("buyer_wallet")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO deals (deal_id, buyer_address, status, data)
        VALUES (?, ?, ?, ?)
    ''', (deal_id, buyer_address, status, json.dumps(data)))
    
    conn.commit()
    conn.close()
    
    if buyer_address:
        log_activity(buyer_address, "DEAL_CREATED", deal_id, f"Initial status: {status}")
        
    return deal_id

def update_deal(deal_id: str, data: dict[str, Any] | None = None, status: str | None = None) -> bool:
    """
    Updates an existing deal record in SQLite.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Fetch existing data for merge or logging
    cursor.execute('SELECT buyer_address, seller_address, data FROM deals WHERE deal_id = ?', (deal_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False
        
    old_data = json.loads(row['data'])
    new_data = data if data is not None else old_data
    request_data = new_data.get("request") or {}

    # Keep the indexed buyer/seller columns in sync with the JSON payload so
    # lookups like get_deals_by_wallet() can actually find deals by wallet.
    buyer_address = request_data.get("buyer_wallet") or new_data.get("buyer_wallet") or row['buyer_address']
    seller_address = new_data.get("seller_wallet") or request_data.get("seller_wallet") or row['seller_address']

    query = 'UPDATE deals SET updated_at = ?, buyer_address = ?, seller_address = ?'
    params = [datetime.utcnow(), buyer_address, seller_address]

    if data is not None:
        query += ', data = ?'
        params.append(json.dumps(data))
    if status is not None:
        query += ', status = ?'
        params.append(status)

    query += ' WHERE deal_id = ?'
    params.append(deal_id)

    cursor.execute(query, tuple(params))
    conn.commit()
    conn.close()

    # Activity logging for the last updated participant
    # In negotiation, seller address is often updated later.
    active_wallet = seller_address or buyer_address
    if active_wallet:
        log_activity(active_wallet, "DEAL_UPDATED", deal_id, f"Status updated to: {status or 'N/A'}")
        
    return True

def get_deal(deal_id: str) -> dict[str, Any] | None:
    """
    Retrieves a deal by ID from SQLite.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM deals WHERE deal_id = ?', (deal_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "deal_id": row['deal_id'],
            "status": row['status'],
            "data": json.loads(row['data']),
            "created_at": row['created_at'],
            "updated_at": row['updated_at']
        }
    return None

def list_deals() -> dict[str, dict[str, Any]]:
    """
    Returns all stored deals as a dictionary (indexed by deal_id).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM deals')
    rows = cursor.fetchall()
    conn.close()
    
    output: dict[str, dict[str, Any]] = {}
    for row in rows:
        output[row['deal_id']] = {
            "status": row['status'],
            "data": json.loads(row['data']),
            "created_at": row['created_at']
        }
    return output

def get_deals_by_wallet(wallet_address: str) -> list[dict[str, Any]]:
    """
    Fetches all deals associated with a specific wallet address (buyer or seller).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM deals 
        WHERE buyer_address = ? OR seller_address = ? 
        ORDER BY updated_at DESC
    ''', (wallet_address, wallet_address))
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]
