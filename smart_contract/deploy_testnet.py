from __future__ import annotations

import argparse
import os
import sys
from base64 import b64decode

from dotenv import load_dotenv
from algosdk import mnemonic, logic, account
from algosdk.v2client import algod
from algosdk.transaction import (
    ApplicationCreateTxn,
    OnComplete,
    StateSchema,
    wait_for_confirmation,
)

CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from escrow_contract import compile_teal


def compile_program(client: algod.AlgodClient, teal_source: str) -> bytes:
    response = client.compile(teal_source)
    return b64decode(response["result"])


def main() -> None:
    load_dotenv()

    parser = argparse.ArgumentParser(description="Deploy escrow contract to Algorand TestNet")
    # No deal-specific args needed; deals are created on-chain via boxes.
    parser.add_argument(
        "--creator-mnemonic",
        default=os.getenv("CREATOR_MNEMONIC"),
        help="Creator account mnemonic (or set CREATOR_MNEMONIC env var)",
    )
    parser.add_argument(
        "--algod-address",
        default=os.getenv("ALGOD_ADDRESS", "https://testnet-api.algonode.cloud"),
        help="Algod address (default: Algonode TestNet)",
    )
    parser.add_argument(
        "--algod-token",
        default=os.getenv("ALGOD_TOKEN", ""),
        help="Algod token (blank for Algonode)",
    )

    args = parser.parse_args()

    if not args.creator_mnemonic:
        raise SystemExit("Missing creator mnemonic. Provide --creator-mnemonic or CREATOR_MNEMONIC.")

    creator_sk = mnemonic.to_private_key(args.creator_mnemonic)
    creator_addr = account.address_from_private_key(creator_sk)

    try:
        client = algod.AlgodClient(args.algod_token, args.algod_address, timeout=30)
    except TypeError:
        client = algod.AlgodClient(args.algod_token, args.algod_address)

    approval_teal, clear_teal = compile_teal()
    approval_program = compile_program(client, approval_teal)
    clear_program = compile_program(client, clear_teal)

    # No global state needed; everything is stored in boxes per deal.
    global_schema = StateSchema(num_uints=0, num_byte_slices=0)
    local_schema = StateSchema(num_uints=0, num_byte_slices=0)

    params = client.suggested_params()

    txn = ApplicationCreateTxn(
        sender=creator_addr,
        sp=params,
        on_complete=OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
    )

    signed = txn.sign(creator_sk)
    txid = client.send_transaction(signed)
    print(f"Submitted txid: {txid}")
    result = wait_for_confirmation(client, txid, 8)

    app_id = result["application-index"]
    print(f"Deployed app ID: {app_id}")
    print(f"App address: {logic.get_application_address(app_id)}")


if __name__ == "__main__":
    main()
