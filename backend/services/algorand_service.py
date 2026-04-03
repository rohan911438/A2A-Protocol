from __future__ import annotations

import base64
import os
from typing import List

from algosdk import encoding, logic
from algosdk.error import AlgodHTTPError
from algosdk.v2client import algod
from algosdk.transaction import (
    ApplicationNoOpTxn,
    PaymentTxn,
    calculate_group_id,
)


def get_algod_client() -> algod.AlgodClient:
    algod_address = os.getenv("ALGOD_ADDRESS", "https://testnet-api.algonode.cloud")
    algod_token = os.getenv("ALGOD_TOKEN", "")
    return algod.AlgodClient(algod_token, algod_address)


def get_app_id() -> int:
    return int(os.getenv("CONTRACT_APP_ID", "757913424"))


def get_app_address(app_id: int) -> str:
    return logic.get_application_address(app_id)


def _deal_id_bytes(deal_id: str) -> bytes:
    return deal_id.encode("utf-8")


def _meta_box_key(deal_id: str) -> bytes:
    return b"meta:" + _deal_id_bytes(deal_id)


def _milestone_box_key(deal_id: str, index: int) -> bytes:
    return b"m:" + _deal_id_bytes(deal_id) + index.to_bytes(8, "big")


def _encode_txn(txn) -> str:
    packed = encoding.msgpack_encode(txn)
    if isinstance(packed, str):
        return packed
    return base64.b64encode(packed).decode("utf-8")


def _b64_to_bytes(blob) -> bytes:
    """Safely decode a base64 string (standard or urlsafe) to bytes."""
    if isinstance(blob, (bytes, bytearray)):
        return bytes(blob)
    if isinstance(blob, dict):
        blob = blob.get("blob") or blob.get("signedTxn")
    # Normalize urlsafe base64 → standard base64
    s = blob.strip().replace("-", "+").replace("_", "/")
    # Fix padding using the correct formula
    s += "=" * (-len(s) % 4)
    return base64.b64decode(s)


def build_create_deal_group(sender: str, deal_id: str, total: int, milestones: List[int]) -> List[str]:
    client = get_algod_client()
    params = client.suggested_params()
    app_id = get_app_id()
    app_address = get_app_address(app_id)
    count = len(milestones)

    app_args = [b"create", _deal_id_bytes(deal_id), total.to_bytes(8, "big"), count.to_bytes(8, "big")]
    for m in milestones:
        app_args.append(int(m).to_bytes(8, "big"))

    boxes = [(app_id, _meta_box_key(deal_id))]
    for idx in range(count):
        boxes.append((app_id, _milestone_box_key(deal_id, idx)))

    # Minimum balance needed for app account to create boxes.
    # Base min balance for an account is 100000 microAlgos.
    # Each box adds 2500 + 400 * size bytes.
    meta_size = 75  # buyer(32)+seller(32)+total(8)+status(1)+count(1)+released(1)
    milestone_size = 9  # amount(8)+released(1)
    box_min = lambda size: 2500 + (400 * size)
    required = 100000 + box_min(meta_size) + (count * box_min(milestone_size))
    funding_floor = int(os.getenv("CONTRACT_BOX_FUNDING", "160000"))
    funding = max(required, funding_floor)
    pay_txn = PaymentTxn(sender=sender, sp=params, receiver=app_address, amt=funding)
    app_call = ApplicationNoOpTxn(sender=sender, sp=params, index=app_id, app_args=app_args, boxes=boxes)

    gid = calculate_group_id([pay_txn, app_call])
    pay_txn.group = gid
    app_call.group = gid

    return [_encode_txn(pay_txn), _encode_txn(app_call)]


def build_accept_txn(sender: str, deal_id: str) -> List[str]:
    client = get_algod_client()
    params = client.suggested_params()
    app_id = get_app_id()

    txn = ApplicationNoOpTxn(
        sender=sender,
        sp=params,
        index=app_id,
        app_args=[b"accept", _deal_id_bytes(deal_id)],
        boxes=[(app_id, _meta_box_key(deal_id))],
    )
    return [_encode_txn(txn)]


def build_deposit_group(sender: str, deal_id: str, amount: int) -> List[str]:
    client = get_algod_client()
    params = client.suggested_params()
    app_id = get_app_id()
    app_address = get_app_address(app_id)

    pay_txn = PaymentTxn(sender=sender, sp=params, receiver=app_address, amt=amount)
    app_call = ApplicationNoOpTxn(
        sender=sender,
        sp=params,
        index=app_id,
        app_args=[b"deposit", _deal_id_bytes(deal_id)],
        boxes=[(app_id, _meta_box_key(deal_id))],
    )

    gid = calculate_group_id([pay_txn, app_call])
    pay_txn.group = gid
    app_call.group = gid

    return [_encode_txn(pay_txn), _encode_txn(app_call)]


def build_release_txn(sender: str, deal_id: str, milestone_index: int, seller: str | None = None) -> List[str]:
    client = get_algod_client()
    params = client.suggested_params()
    app_id = get_app_id()
    index_bytes = milestone_index.to_bytes(8, "big")

    accounts = None
    if seller and encoding.is_valid_address(seller):
        accounts = [seller]

    txn = ApplicationNoOpTxn(
        sender=sender,
        sp=params,
        index=app_id,
        app_args=[b"release", _deal_id_bytes(deal_id), index_bytes],
        accounts=accounts,
        boxes=[
            (app_id, _meta_box_key(deal_id)),
            (app_id, _milestone_box_key(deal_id, milestone_index)),
        ],
    )
    return [_encode_txn(txn)]


def submit_signed_transactions(signed_blobs) -> List[str]:
    client = get_algod_client()

    flat_blobs: List = []

    def _flatten(item):
        if item is None:
            return
        if isinstance(item, (list, tuple)):
            for sub in item:
                _flatten(sub)
        else:
            flat_blobs.append(item)

    _flatten(signed_blobs)

    if not flat_blobs:
        raise ValueError("No signed transactions provided")

    raw_bytes: List[bytes] = [_b64_to_bytes(blob) for blob in flat_blobs]

    try:
        # Concatenate all signed txn bytes
        combined = b"".join(raw_bytes)
        # algosdk internally calls base64.b64decode() on whatever you pass,
        # so pass a base64 string — NOT raw bytes
        txid = client.send_raw_transaction(base64.b64encode(combined))
        return [txid]

    except AlgodHTTPError as exc:
        detail = str(exc)
        try:
            decoded = encoding.msgpack_decode(base64.b64encode(raw_bytes[0]).decode())
            sender = getattr(getattr(decoded, "transaction", None), "sender", None)
            if sender:
                balance = get_account_balance(sender)
                detail = f"{detail} | sender={sender} balance={balance}"
        except Exception:
            pass
        raise RuntimeError(detail) from exc

def get_account_balance(address: str) -> int:
    client = get_algod_client()
    info = client.account_info(address)
    return int(info.get("amount", 0))
