# Deployed Contract Smoke Test

Use this script to test the deployed Soroban contract on testnet:

```powershell
$env:CONTRACT_ID="CBCG25INND2P3BVBBRT44XJHSGDKAMUNEAVWUMI7J2TCIBMJVBNIZ2NU"
$env:ADMIN_SECRET="S..."
$env:TOKEN_CONTRACT_ID="C..."
$env:SOROBAN_RPC_URL="https://soroban-testnet.stellar.org:443"
python .\smart_contract\a2a_escrow\scripts\test_deployed.py
```

Optional:

```powershell
$env:DEAL_ID="deal1"
```

The script will:

- call `initialize()` on the deployed contract
- verify the `Admin` and `Token` storage entries exist
- optionally simulate `get_deal(DEAL_ID)`

Notes:

- `ADMIN_SECRET` must be the secret key for a funded testnet account.
- `TOKEN_CONTRACT_ID` must be a valid token contract address on testnet.
- If the contract was already initialized, the `initialize()` call will fail with the contract's existing state.