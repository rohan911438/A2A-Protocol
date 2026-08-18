"""
Real on-chain invocation layer for the A2A escrow Soroban contract.

Historically `/contract/create-txn` and `/contract/release-txn` built plain
`manage_data`/`payment` operations - the deployed `a2a_escrow` contract was
never actually called, so "escrow" was enforced entirely by backend
bookkeeping (see docs/MAINNET_AUDIT.md). That doesn't scale to real fund
volume: it means every deal's safety depends on this API server's state
being correct, instead of on-chain contract logic enforcing it.

This module builds unsigned, *simulated and fee-assembled* InvokeHostFunction
transactions for the actual contract methods (create_deal, release_milestones,
complete_deal, request_refund). The calling route still hands the returned
XDR to the client for wallet signing and posts the signed result back to
`/contract/submit` exactly like the legacy path - so the sign/submit flow on
the frontend does not need to change, only how the unsigned XDR gets built.

Gated behind CONTRACT_MODE=onchain (default stays "legacy") because it needs
a deployed+initialized contract id, which isn't provisioned in every
environment. See docs/CONTRACT_INTEGRATION.md for the env vars and rollout
steps.
"""
import logging
import os
import re
from decimal import Decimal, ROUND_DOWN
from typing import Sequence

from stellar_sdk import Network, Server, TransactionBuilder, scval
from stellar_sdk.soroban_server import SorobanServer
from stellar_sdk.xdr import SCVal

logger = logging.getLogger(__name__)

STROOP = Decimal("0.0000001")


class ContractServiceError(RuntimeError):
    """Raised for any failure building/simulating an on-chain transaction."""


def to_contract_symbol(deal_id: str) -> str:
    """
    Soroban `Symbol` values only allow [A-Za-z0-9_] and are capped at 32
    characters. Deal IDs are UUID4 strings (36 chars, with dashes) generated
    by deal_store.create_deal - stripping the dashes yields a 32-char
    lowercase hex string that fits exactly and stays a 1:1, collision-free
    mapping back to the original UUID.
    """
    compact = (deal_id or "").replace("-", "")
    if not re.fullmatch(r"[A-Za-z0-9_]{1,32}", compact):
        raise ContractServiceError(
            f"deal_id '{deal_id}' cannot be represented as a Soroban Symbol (expected a UUID4)"
        )
    return compact


def to_stroops(amount: float) -> int:
    """Convert a decimal asset amount into the token's smallest unit (7dp), matching Stellar's native precision."""
    try:
        quantized = Decimal(str(amount)).quantize(STROOP, rounding=ROUND_DOWN)
    except Exception as e:
        raise ContractServiceError(f"Invalid amount '{amount}': {e}") from e
    return int(quantized.scaleb(7))


def _milestone_struct(amount_stroops: int) -> SCVal:
    # SCMap keys are matched by field name, not position, so dict order here
    # doesn't need to mirror the Rust struct's declaration order.
    return scval.to_struct({
        "amount": scval.to_int128(amount_stroops),
        "is_released": scval.to_bool(False),
    })


class ContractService:
    def __init__(self):
        self.rpc_url = os.getenv("SOROBAN_RPC_URL", "https://soroban-testnet.stellar.org")
        self.horizon_url = os.getenv("VITE_HORIZON_URL", "https://horizon-testnet.stellar.org")
        self.network_passphrase = os.getenv("VITE_NETWORK_PASSPHRASE", Network.TESTNET_NETWORK_PASSPHRASE)
        self.contract_id = (os.getenv("ESCROW_CONTRACT_ID") or "").strip()
        self.default_token_id = (os.getenv("ESCROW_TOKEN_ID") or "").strip()
        self.base_fee = int(os.getenv("SOROBAN_BASE_FEE", "100"))
        self._rpc_client: SorobanServer | None = None
        self._horizon_client: Server | None = None

    @property
    def enabled(self) -> bool:
        return bool(self.contract_id)

    def _require_contract_id(self) -> str:
        if not self.contract_id:
            raise ContractServiceError(
                "ESCROW_CONTRACT_ID is not configured; deploy/initialize the escrow "
                "contract and set the env var before enabling CONTRACT_MODE=onchain"
            )
        return self.contract_id

    def _rpc(self) -> SorobanServer:
        if self._rpc_client is None:
            self._rpc_client = SorobanServer(self.rpc_url)
        return self._rpc_client

    def _horizon(self) -> Server:
        if self._horizon_client is None:
            self._horizon_client = Server(self.horizon_url)
        return self._horizon_client

    def resolve_token_id(self, requested: str | None) -> str:
        token_id = (requested or self.default_token_id or "").strip()
        if not token_id:
            raise ContractServiceError(
                "No escrow token id given and ESCROW_TOKEN_ID is not configured"
            )
        return token_id

    def _build_prepared_xdr(self, source: str, function_name: str, parameters: Sequence[SCVal]) -> str:
        contract_id = self._require_contract_id()
        source_account = self._horizon().load_account(source)
        tx = (
            TransactionBuilder(
                source_account=source_account,
                network_passphrase=self.network_passphrase,
                base_fee=self.base_fee,
            )
            .append_invoke_contract_function_op(
                contract_id=contract_id,
                function_name=function_name,
                parameters=list(parameters),
                source=source,
            )
            .set_timeout(300)
            .build()
        )
        try:
            prepared = self._rpc().prepare_transaction(tx)
        except Exception as e:
            logger.error("Soroban prepare_transaction failed for %s: %s", function_name, e)
            raise ContractServiceError(
                f"Failed to simulate/prepare on-chain '{function_name}' call: {e}"
            ) from e
        return prepared.to_xdr()

    def build_create_deal_txn(
        self,
        sender: str,
        deal_id: str,
        seller: str,
        verifier: str,
        total_amount: float,
        milestone_amounts: list[float],
        deadline_unix: int,
        token_id: str | None = None,
    ) -> str:
        symbol = to_contract_symbol(deal_id)
        token = self.resolve_token_id(token_id)
        milestones = scval.to_vec([_milestone_struct(to_stroops(a)) for a in milestone_amounts])
        params = [
            scval.to_symbol(symbol),
            scval.to_address(sender),
            scval.to_address(seller),
            scval.to_address(verifier),
            scval.to_address(token),
            scval.to_int128(to_stroops(total_amount)),
            milestones,
            scval.to_uint64(int(deadline_unix)),
        ]
        return self._build_prepared_xdr(sender, "create_deal", params)

    def build_release_milestones_txn(self, sender: str, deal_id: str, milestone_indices: list[int]) -> str:
        if not milestone_indices:
            raise ContractServiceError("milestone_indices must not be empty")
        symbol = to_contract_symbol(deal_id)
        params = [
            scval.to_symbol(symbol),
            scval.to_vec([scval.to_uint32(int(i)) for i in milestone_indices]),
        ]
        return self._build_prepared_xdr(sender, "release_milestones", params)

    def build_complete_deal_txn(self, sender: str, deal_id: str) -> str:
        symbol = to_contract_symbol(deal_id)
        return self._build_prepared_xdr(sender, "complete_deal", [scval.to_symbol(symbol)])

    def build_request_refund_txn(self, sender: str, deal_id: str) -> str:
        symbol = to_contract_symbol(deal_id)
        return self._build_prepared_xdr(sender, "request_refund", [scval.to_symbol(symbol)])

    def get_deal_onchain(self, deal_id: str) -> dict | None:
        """Read-only lookup of a deal's on-chain state via simulation (no signature/fee needed)."""
        contract_id = self._require_contract_id()
        symbol = to_contract_symbol(deal_id)
        dummy_source = self.default_token_id or contract_id
        source_account = self._horizon().load_account(dummy_source) if dummy_source else None
        tx = (
            TransactionBuilder(
                source_account=source_account,
                network_passphrase=self.network_passphrase,
                base_fee=self.base_fee,
            )
            .append_invoke_contract_function_op(
                contract_id=contract_id,
                function_name="get_deal",
                parameters=[scval.to_symbol(symbol)],
            )
            .set_timeout(30)
            .build()
        )
        result = self._rpc().simulate_transaction(tx)
        if result.error:
            raise ContractServiceError(f"get_deal simulation failed: {result.error}")
        if not result.results:
            return None
        return scval.to_native(result.results[0].xdr)


contract_service = ContractService()
