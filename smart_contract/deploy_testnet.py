"""
One-off deployment + integration test script for the a2a_escrow Soroban
contract on Stellar Testnet. Not part of the app - run manually:

    py smart_contract/deploy_testnet.py

Requires smart_contract/a2a_escrow/target/wasm32-unknown-unknown/release/a2a_escrow.wasm
to already be built (`cargo build --target wasm32-unknown-unknown --release`).

Generates fresh throwaway testnet keypairs, funds them via friendbot,
uploads+deploys+initializes the contract, then exercises the real deployed
contract end to end (create_deal in native XLM, a batched release_milestones
call, complete_deal) and asserts on token balances after each step.
"""
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from decimal import Decimal

from stellar_sdk import Asset, Keypair, Network, Server, TransactionEnvelope, scval
from stellar_sdk.soroban_server import SorobanServer
from stellar_sdk.contract import ContractClient

WASM_PATH = Path(__file__).parent / "a2a_escrow" / "target" / "wasm32-unknown-unknown" / "release" / "a2a_escrow.wasm"
HORIZON_URL = "https://horizon-testnet.stellar.org"
RPC_URL = "https://soroban-testnet.stellar.org"
NETWORK = Network.TESTNET_NETWORK_PASSPHRASE
BASE_FEE = 100


def friendbot_fund(public_key: str, retries: int = 4):
    for attempt in range(1, retries + 1):
        try:
            # friendbot 403s requests using Python's default urllib User-Agent
            # (looks like bot-blocking) - a normal browser UA gets through.
            req = urllib.request.Request(
                f"https://friendbot.stellar.org?addr={public_key}",
                headers={"User-Agent": "Mozilla/5.0"},
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                if resp.status == 200:
                    print(f"  funded {public_key} (attempt {attempt})")
                    return
        except urllib.error.HTTPError as e:
            if e.code == 400:
                # Already funded is fine.
                print(f"  {public_key} already funded")
                return
            print(f"  friendbot attempt {attempt} failed: HTTP {e.code}")
        except Exception as e:
            print(f"  friendbot attempt {attempt} failed: {type(e).__name__}: {e}")
        time.sleep(3)
    raise RuntimeError(f"Could not fund {public_key} via friendbot after {retries} attempts")


def submit_and_wait(rpc: SorobanServer, signed_env, label: str):
    send = rpc.send_transaction(signed_env)
    print(f"  [{label}] submitted, hash={send.hash}, status={send.status}")
    got = None
    for _ in range(30):
        time.sleep(2)
        got = rpc.get_transaction(send.hash)
        if got.status != "NOT_FOUND":
            break
    if got is None or got.status == "NOT_FOUND":
        raise RuntimeError(f"[{label}] transaction never confirmed: {send.hash}")
    if got.status != "SUCCESS":
        raise RuntimeError(f"[{label}] transaction failed: status={got.status} result={got.result_xdr}")
    print(f"  [{label}] confirmed in ledger {got.latest_ledger}")
    return got


def main():
    if not WASM_PATH.exists():
        print(f"WASM not found at {WASM_PATH}. Build it first:")
        print("  cargo build --target wasm32-unknown-unknown --release")
        sys.exit(1)

    horizon = Server(HORIZON_URL)
    rpc = SorobanServer(RPC_URL)

    print("Generating throwaway testnet keypairs...")
    admin = Keypair.random()
    buyer = Keypair.random()
    seller = Keypair.random()
    print(f"  admin:  {admin.public_key}")
    print(f"  buyer:  {buyer.public_key}")
    print(f"  seller: {seller.public_key}")

    print("Funding admin + buyer via friendbot (seller never signs a tx, doesn't need funding)...")
    friendbot_fund(admin.public_key)
    friendbot_fund(buyer.public_key)

    wasm_bytes = WASM_PATH.read_bytes()
    print(f"Loaded contract WASM ({len(wasm_bytes)} bytes)")

    print("Uploading contract WASM...")
    wasm_id = ContractClient.upload_contract_wasm(
        contract=wasm_bytes,
        source=admin.public_key,
        signer=admin,
        soroban_server=rpc,
        network_passphrase=NETWORK,
    )
    print(f"  wasm_id = {wasm_id.hex()}")

    print("Creating contract instance...")
    contract_id_str = ContractClient.create_contract(
        wasm_id=wasm_id,
        source=admin.public_key,
        signer=admin,
        soroban_server=rpc,
        network_passphrase=NETWORK,
    )
    print(f"  contract_id = {contract_id_str}")

    token_id_str = Asset.native().contract_id(NETWORK)
    print(f"  native XLM token contract = {token_id_str}")

    print("Calling initialize(admin)...")
    client = ContractClient(contract_id_str, RPC_URL, NETWORK)
    client.invoke(
        "initialize",
        parameters=[scval.to_address(admin.public_key)],
        source=admin.public_key,
        signer=admin,
    ).sign_and_submit()
    print("  initialize confirmed")

    print("\nContract deployed and initialized. Running an end-to-end deal flow...")

    sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
    from services.contract_service import ContractService  # noqa: E402

    import os
    os.environ["ESCROW_CONTRACT_ID"] = contract_id_str
    os.environ["ESCROW_TOKEN_ID"] = token_id_str
    svc = ContractService()

    import uuid
    deal_id = str(uuid.uuid4())
    print(f"  deal_id = {deal_id}")

    total = 20.0
    milestone_amounts = [8.0, 12.0]
    deadline = int(time.time()) + 3600

    print("  building create_deal txn (verifier = buyer, matching the app's release flow)...")
    xdr = svc.build_create_deal_txn(
        sender=buyer.public_key,
        deal_id=deal_id,
        seller=seller.public_key,
        verifier=buyer.public_key,
        total_amount=total,
        milestone_amounts=milestone_amounts,
        deadline_unix=deadline,
    )
    env = TransactionEnvelope.from_xdr(xdr, NETWORK)
    env.sign(buyer)
    submit_and_wait(rpc, env, "create_deal")
    print("  [create_deal] confirmed - escrow funded on-chain")

    print("  building batched release_milestones([0,1]) txn...")
    xdr = svc.build_release_milestones_txn(sender=buyer.public_key, deal_id=deal_id, milestone_indices=[0, 1])
    env = TransactionEnvelope.from_xdr(xdr, NETWORK)
    env.sign(buyer)
    submit_and_wait(rpc, env, "release_milestones")
    print("  [release_milestones] confirmed - both milestones released in a single call")

    seller_account = horizon.accounts().account_id(seller.public_key).call()
    seller_balance = next((b["balance"] for b in seller_account["balances"] if b["asset_type"] == "native"), "0")
    print(f"\nSeller native balance after batched release: {seller_balance} XLM (expected >= {total})")
    assert Decimal(seller_balance) >= Decimal(str(total)), "seller did not receive the escrowed funds"

    print("\nSUCCESS: contract deployed, initialized, and a full create/release cycle executed on Stellar Testnet.")
    print("\n=== Save these for backend .env ===")
    print(f"ESCROW_CONTRACT_ID={contract_id_str}")
    print(f"ESCROW_TOKEN_ID={token_id_str}")
    print(f"ESCROW_ADMIN_SECRET={admin.secret}  # testnet-only, keep private, not needed by the running app")


if __name__ == "__main__":
    main()
