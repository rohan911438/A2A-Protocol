import sqlite3
import os
import json
from datetime import datetime
from typing import Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "a2a_protocol.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the SQLite database with the required schema."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    # Wallets table to track user state
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS wallets (
            address TEXT PRIMARY KEY,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT
        )
    ''')

    # Deals table – storing the core negotiation and lifecycle state
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS deals (
            deal_id TEXT PRIMARY KEY,
            buyer_address TEXT,
            seller_address TEXT,
            status TEXT,
            data TEXT, -- JSON payload of the deal state
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (buyer_address) REFERENCES wallets (address),
            FOREIGN KEY (seller_address) REFERENCES wallets (address)
        )
    ''')

    # Activity logs for audit trail and state recovery
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT,
            action_type TEXT,
            deal_id TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            details TEXT,
            FOREIGN KEY (wallet_address) REFERENCES wallets (address),
            FOREIGN KEY (deal_id) REFERENCES deals (deal_id)
        )
    ''')

    conn.commit()
    conn.close()

def log_activity(wallet_address: str, action_type: str, deal_id: Optional[str] = None, details: Optional[str] = None):
    """Records a wallet-based action in the activity_logs."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Ensure wallet exists
    cursor.execute('INSERT OR IGNORE INTO wallets (address) VALUES (?)', (wallet_address,))
    cursor.execute('UPDATE wallets SET last_seen = ? WHERE address = ?', (datetime.utcnow(), wallet_address))
    
    # Log activity
    cursor.execute('''
        INSERT INTO activity_logs (wallet_address, action_type, deal_id, details)
        VALUES (?, ?, ?, ?)
    ''', (wallet_address, action_type, deal_id, details))
    
    conn.commit()
    conn.close()

# Initialize on import
if not os.path.exists(DB_PATH):
    init_db()
