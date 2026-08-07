import os
from typing import List, Optional
from decimal import Decimal, ROUND_DOWN, InvalidOperation
from stellar_sdk import Server, Keypair, TransactionBuilder, Network, Asset, Operation
from stellar_sdk.exceptions import NotFoundError

class StellarService:
    def __init__(self):
        self.horizon_url = os.getenv("VITE_HORIZON_URL", "https://horizon-testnet.stellar.org")
        self.network_passphrase = os.getenv("VITE_NETWORK_PASSPHRASE", Network.TESTNET_NETWORK_PASSPHRASE)
        self.server = Server(self.horizon_url)
        self.base_fee = 100

    def get_account_balance(self, public_key: str) -> float:
        """Fetch XLM balance for a given public key."""
        try:
            account = self.server.accounts().account_id(public_key).call()
            for balance in account['balances']:
                if balance['asset_type'] == 'native':
                    return float(balance['balance'])
            return 0.0
        except NotFoundError:
            return 0.0
        except Exception as e:
            print(f"Error fetching balance: {e}")
            return 0.0

    def submit_signed_transaction(self, xdr: str) -> str:
        """Submit a signed transaction XDR to the network."""
        try:
            response = self.server.submit_transaction(xdr)
            return response['hash']
        except Exception as e:
            print(f"Transaction submission failed: {e}")
            raise RuntimeError(f"Stellar submission error: {str(e)}")

    def verify_transaction_success(self, tx_hash: str) -> bool:
        """
        Confirms a transaction hash actually exists on-chain and succeeded.
        Used to gate off-chain state transitions (funded/accepted/released)
        so a client can't move a deal forward by submitting an arbitrary or
        unrelated txid string.
        """
        if not tx_hash or not isinstance(tx_hash, str):
            return False
        try:
            record = self.server.transactions().transaction(tx_hash).call()
            return bool(record.get("successful"))
        except NotFoundError:
            return False
        except Exception as e:
            print(f"Error verifying transaction {tx_hash}: {e}")
            return False

    def _format_stellar_amount(self, amount: float) -> str:
        """Format amount for Stellar payment ops (max 7 decimal places)."""
        try:
            value = Decimal(str(amount)).quantize(Decimal("0.0000001"), rounding=ROUND_DOWN)
        except (InvalidOperation, ValueError, TypeError):
            raise RuntimeError("Invalid amount value")

        # Remove trailing zeros while keeping plain decimal notation.
        text = format(value, "f").rstrip("0").rstrip(".")
        return text if text else "0"

    def build_create_deal_transaction(self, sender: str, deal_id: str, total_amount: float, milestones: List[float]) -> str:
        """
        Builds a transaction to initialize a deal on Stellar.
        In A2A Protocol, this might involve an escrow account or a Soroban contract call.
        For now, we'll build a base transaction that the frontend can sign.
        """
        source_account = self.server.load_account(sender)
        
        builder = (
            TransactionBuilder(
                source_account=source_account,
                network_passphrase=self.network_passphrase,
                base_fee=self.base_fee,
            )
            .append_manage_data_op(f"deal_{deal_id[:10]}", deal_id)
            .set_timeout(300)
        )
        
        return builder.build().to_xdr()

    def build_release_transaction(self, sender: str, deal_id: str, destination: str, amount: float) -> str:
        """Builds a payment transaction to release funds from escrow."""
        source_account = self.server.load_account(sender)
        payment_amount = self._format_stellar_amount(amount)
        builder = (
            TransactionBuilder(
                source_account=source_account,
                network_passphrase=self.network_passphrase,
                base_fee=self.base_fee,
            )
            .append_payment_op(destination, Asset.native(), payment_amount)
            .append_manage_data_op(f"rel_{deal_id[:10]}", "released")
            .set_timeout(300)
        )
        return builder.build().to_xdr()

stellar_service = StellarService()
