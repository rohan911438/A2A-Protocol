from __future__ import annotations

import os
import sys
import time

from stellar_sdk import Keypair, SorobanServer, TransactionBuilder, scval, xdr as stellar_xdr


DEFAULT_RPC_URL = "https://soroban-testnet.stellar.org:443"
DEFAULT_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"


def env(name: str, required: bool = True, default: str | None = None) -> str:
    value = os.environ.get(name, default)
    if required and not value:
        print(f"Missing required environment variable: {name}")
        sys.exit(1)
    return value or ""


def build_invoke_tx(server: SorobanServer, source_public_key: str, contract_id: str, function_name: str, parameters: list):
    source_account = server.load_account(source_public_key)
    tx = (
        TransactionBuilder(
            source_account=source_account,
            network_passphrase=env("NETWORK_PASSPHRASE", required=False, default=DEFAULT_NETWORK_PASSPHRASE),
            base_fee=100,
        )
        .append_invoke_contract_function_op(contract_id, function_name, parameters)
        .set_timeout(300)
        .build()
    )
    return tx


def wait_for_confirmation(server: SorobanServer, tx_hash: str, timeout_seconds: int = 120):
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        result = server.get_transaction(tx_hash)
        status = result.status.value
        if status == "SUCCESS":
            return result
        if status == "FAILED":
            raise RuntimeError(f"Transaction failed: {result}")
        time.sleep(3)
    raise TimeoutError(f"Timed out waiting for transaction {tx_hash}")


def read_contract_data(server: SorobanServer, contract_id: str, key: stellar_xdr.SCVal):
    entry = server.get_contract_data(contract_id, key)
    if entry is None:
        return None
    data = stellar_xdr.LedgerEntryData.from_xdr(entry.xdr)
    if data.contract_data is None:
        return None
    return data.contract_data.val


def main() -> None:
    rpc_url = env("SOROBAN_RPC_URL", required=False, default=DEFAULT_RPC_URL)
    network_passphrase = env("NETWORK_PASSPHRASE", required=False, default=DEFAULT_NETWORK_PASSPHRASE)
    contract_id = env("CONTRACT_ID")
    admin_secret = env("ADMIN_SECRET")
    token_contract_id = env("TOKEN_CONTRACT_ID")

    admin_keypair = Keypair.from_secret(admin_secret)
    server = SorobanServer(rpc_url)

    print(f"Testing contract: {contract_id}")
    print(f"Using RPC: {rpc_url}")
    print(f"Admin: {admin_keypair.public_key}")

    stored_admin = read_contract_data(server, contract_id, scval.to_enum("Admin", None))
    stored_token = read_contract_data(server, contract_id, scval.to_enum("Token", None))

    if stored_admin is None or stored_token is None:
        initialize_tx = build_invoke_tx(
            server,
            admin_keypair.public_key,
            contract_id,
            "initialize",
            [scval.to_address(admin_keypair.public_key), scval.to_address(token_contract_id)],
        )
        prepared_initialize = server.prepare_transaction(initialize_tx)
        prepared_initialize.sign(admin_keypair)

        print("Submitting initialize()...")
        init_response = server.send_transaction(prepared_initialize)
        print(f"Submission status: {init_response.status.value}")
        confirmed = wait_for_confirmation(server, init_response.hash)
        print(f"Confirmed at ledger: {confirmed.ledger}")

        stored_admin = read_contract_data(server, contract_id, scval.to_enum("Admin", None))
        stored_token = read_contract_data(server, contract_id, scval.to_enum("Token", None))

        if stored_admin is None or stored_token is None:
            raise RuntimeError("Contract storage check failed after initialize()")
    else:
        print("Contract is already initialized; skipping initialize().")

    print(f"Stored admin key: {scval.from_address(stored_admin)}")
    print(f"Stored token key: {scval.from_address(stored_token)}")

    deal_id = os.environ.get("DEAL_ID")
    if deal_id:
        print(f"Simulating get_deal({deal_id})...")
        get_deal_tx = build_invoke_tx(
            server,
            admin_keypair.public_key,
            contract_id,
            "get_deal",
            [scval.to_symbol(deal_id)],
        )
        simulation = server.simulate_transaction(get_deal_tx)
        if simulation.error:
            raise RuntimeError(f"get_deal() simulation failed: {simulation.error}")
        if not simulation.results:
            raise RuntimeError("get_deal() simulation returned no results")
        print(f"get_deal() returned XDR: {simulation.results[0].xdr}")

    print("Smoke test completed successfully.")


if __name__ == "__main__":
    main()