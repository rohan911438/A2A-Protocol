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

    # Explainability logs for each negotiation decision step
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reasoning_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT,
            deal_id TEXT,
            round_number INTEGER,
            role TEXT,
            summary TEXT,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (wallet_address) REFERENCES wallets (address),
            FOREIGN KEY (deal_id) REFERENCES deals (deal_id)
        )
    ''')

    # x402-style payment authorization events for gated actions.
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS x402_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT NOT NULL,
            deal_id TEXT NOT NULL,
            purpose TEXT NOT NULL,
            amount REAL NOT NULL,
            recipient_wallet TEXT NOT NULL,
            status TEXT NOT NULL,
            tx_hash TEXT,
            source TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            verified_at TIMESTAMP,
            UNIQUE(wallet_address, deal_id, purpose),
            FOREIGN KEY (wallet_address) REFERENCES wallets (address),
            FOREIGN KEY (deal_id) REFERENCES deals (deal_id)
        )
    ''')

    # Structured smart summary snapshots used before escrow authorization.
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS smart_deal_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT NOT NULL,
            deal_id TEXT NOT NULL,
            summary_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(wallet_address, deal_id),
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


def log_reasoning(
    wallet_address: str,
    deal_id: str,
    round_number: int,
    role: str,
    summary: str,
    details: Optional[dict[str, Any]] = None,
):
    """Stores explainability details for a negotiation step."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('INSERT OR IGNORE INTO wallets (address) VALUES (?)', (wallet_address,))
    cursor.execute('UPDATE wallets SET last_seen = ? WHERE address = ?', (datetime.utcnow(), wallet_address))

    cursor.execute(
        '''
        INSERT INTO reasoning_logs (wallet_address, deal_id, round_number, role, summary, details)
        VALUES (?, ?, ?, ?, ?, ?)
        ''',
        (
            wallet_address,
            deal_id,
            round_number,
            role,
            summary,
            json.dumps(details or {}),
        ),
    )

    conn.commit()
    conn.close()


def get_reasoning_logs(wallet_address: str, deal_id: str) -> list[dict[str, Any]]:
    """Fetch explainability logs for a wallet and deal pair."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        SELECT round_number, role, summary, details, created_at
        FROM reasoning_logs
        WHERE wallet_address = ? AND deal_id = ?
        ORDER BY round_number ASC, id ASC
        ''',
        (wallet_address, deal_id),
    )
    rows = cursor.fetchall()
    conn.close()

    output: list[dict[str, Any]] = []
    for row in rows:
        details = row['details']
        try:
            parsed = json.loads(details) if details else {}
        except Exception:
            parsed = {}
        output.append(
            {
                'round_number': row['round_number'],
                'role': row['role'],
                'summary': row['summary'],
                'details': parsed,
                'created_at': row['created_at'],
            }
        )
    return output


def upsert_x402_event(
    wallet_address: str,
    deal_id: str,
    purpose: str,
    amount: float,
    recipient_wallet: str,
    status: str,
    tx_hash: Optional[str] = None,
    source: Optional[str] = None,
    verified_at: Optional[datetime] = None,
) -> None:
    """Creates or updates an x402 payment authorization event."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('INSERT OR IGNORE INTO wallets (address) VALUES (?)', (wallet_address,))
    cursor.execute('UPDATE wallets SET last_seen = ? WHERE address = ?', (datetime.utcnow(), wallet_address))

    cursor.execute(
        '''
        INSERT INTO x402_events (
            wallet_address, deal_id, purpose, amount, recipient_wallet, status, tx_hash, source, updated_at, verified_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(wallet_address, deal_id, purpose)
        DO UPDATE SET
            amount = excluded.amount,
            recipient_wallet = excluded.recipient_wallet,
            status = excluded.status,
            tx_hash = excluded.tx_hash,
            source = excluded.source,
            updated_at = excluded.updated_at,
            verified_at = excluded.verified_at
        ''',
        (
            wallet_address,
            deal_id,
            purpose,
            amount,
            recipient_wallet,
            status,
            tx_hash,
            source,
            datetime.utcnow(),
            verified_at,
        ),
    )

    conn.commit()
    conn.close()


def get_x402_event(wallet_address: str, deal_id: str, purpose: str) -> Optional[dict[str, Any]]:
    """Fetches the latest x402 authorization event for a wallet, deal, and purpose."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        SELECT wallet_address, deal_id, purpose, amount, recipient_wallet, status, tx_hash, source, created_at, updated_at, verified_at
        FROM x402_events
        WHERE wallet_address = ? AND deal_id = ? AND purpose = ?
        ORDER BY id DESC
        LIMIT 1
        ''',
        (wallet_address, deal_id, purpose),
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return {
        'wallet_address': row['wallet_address'],
        'deal_id': row['deal_id'],
        'purpose': row['purpose'],
        'amount': row['amount'],
        'recipient_wallet': row['recipient_wallet'],
        'status': row['status'],
        'tx_hash': row['tx_hash'],
        'source': row['source'],
        'created_at': row['created_at'],
        'updated_at': row['updated_at'],
        'verified_at': row['verified_at'],
    }


def save_deal_summary(wallet_address: str, deal_id: str, summary: dict[str, Any]) -> None:
    """Creates or updates the smart summary snapshot for a wallet and deal."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('INSERT OR IGNORE INTO wallets (address) VALUES (?)', (wallet_address,))
    cursor.execute('UPDATE wallets SET last_seen = ? WHERE address = ?', (datetime.utcnow(), wallet_address))

    cursor.execute(
        '''
        INSERT INTO smart_deal_summaries (wallet_address, deal_id, summary_json, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(wallet_address, deal_id)
        DO UPDATE SET summary_json = excluded.summary_json, updated_at = excluded.updated_at
        ''',
        (wallet_address, deal_id, json.dumps(summary or {}), datetime.utcnow()),
    )

    conn.commit()
    conn.close()


def get_deal_summary(wallet_address: str, deal_id: str) -> Optional[dict[str, Any]]:
    """Fetches a previously stored smart summary snapshot."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        SELECT summary_json, created_at, updated_at
        FROM smart_deal_summaries
        WHERE wallet_address = ? AND deal_id = ?
        ORDER BY id DESC
        LIMIT 1
        ''',
        (wallet_address, deal_id),
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    try:
        summary = json.loads(row['summary_json']) if row['summary_json'] else {}
    except Exception:
        summary = {}

    return {
        'summary': summary,
        'created_at': row['created_at'],
        'updated_at': row['updated_at'],
    }

# Initialize/migrate on import
init_db()
