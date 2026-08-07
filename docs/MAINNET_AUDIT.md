# Mainnet Readiness — Security Audit Summary

Date: 2026-08-07
Scope: `smart_contract/a2a_escrow`, `backend/`, `frontend/`

This document tracks the pre-mainnet audit pass: what was found, what was
fixed, and what is intentionally left as a documented limitation because it
needs a larger design change than a targeted patch.

## Fixed in this pass

### Smart contract (`smart_contract/a2a_escrow/src/lib.rs`)

- **Initialization front-running.** `initialize()` never called
  `admin.require_auth()`, so on a public network anyone could call it first
  with themselves as admin and an attacker-controlled token address before
  the real deployer did. Fixed by requiring the admin's signature.
- **Fund-drain via non-positive milestone amounts.** `create_deal()` only
  checked that milestone amounts *summed* to `total_amount`, not that each
  one was positive. A deal with milestones like `[total + X, -X]` would pass
  that check. Releasing the inflated milestone fails at the token layer (not
  enough balance), but releasing the *negative* one calls
  `token.transfer(contract, seller, negative_amount)` — which token
  contracts interpret as a transfer in the reverse direction, silently
  pulling funds from the seller (or from the contract's pooled balance
  shared with other deals) instead of paying them. Fixed by rejecting any
  milestone `amount <= 0` and `total_amount <= 0`.
- **Deadlines in the past.** `create_deal()` didn't check `deadline` against
  the current ledger time, so a deal could be created already eligible for
  `request_refund()`. Fixed by rejecting `deadline <= ledger().timestamp()`.

Verified with `cargo test` in `smart_contract/a2a_escrow` (existing
lifecycle + refund tests, which use `mock_all_auths()`, still pass).

### Backend (`backend/`)

- **Off-chain state trusted client-supplied txids.** `/deal/{id}/fund`,
  `/deal/{id}/onchain-accept`, and `/deal/{id}/release` all accepted any
  string as `txid` and persisted the resulting state (funded / accepted /
  milestone released) without checking it against Horizon. Anyone who knew
  a `deal_id` could advance a deal's lifecycle, or mark a milestone
  "released", without any real payment happening. Added
  `stellar_service.verify_transaction_success()` and gated all three
  endpoints on it (toggle: `VERIFY_ONCHAIN_TX`, default on — only disable
  for local/offline dev).
- **x402 payment gate accepted failed transactions.** `_verify_stellar_payment`
  only checked that Horizon *had a record* of the tx hash, not that
  `successful` was true. A failed/reverted transaction hash would still
  satisfy the x402 gate in `enforce` mode. Now delegates to the same
  success-checking helper.
- **Seller-wallet hijack via `/deal/{id}/accept`.** The endpoint has no
  authentication tying the caller to a specific seller identity, and
  `GET /deals` is public and lists every deal. Previously, anyone could
  re-POST `/accept` at any time with a different `seller_wallet` and
  redirect future milestone payouts to themselves — even after the real
  seller had already accepted. Added a `seller_accepted` lock: once a real
  wallet has explicitly accepted, later calls with a different wallet are
  rejected (409). This does not fully solve the pre-acceptance race (see
  Known limitations below), but it closes the take-over-after-acceptance
  window.
- **`/contract/release-txn` trusted a client-supplied destination.** The
  endpoint built a signable payment XDR to whatever `destination` address
  the caller passed in. The production frontend already sourced this
  correctly from the deal record, but the API itself had no server-side
  check — a compromised frontend build or a direct API call could have
  requested a payout to an arbitrary address. Now the endpoint ignores the
  client-supplied destination and always resolves the payout target from
  the deal's own explicitly-accepted `seller_wallet` (never the
  `DEFAULT_SELLER_WALLET` placeholder).
- **`/contract/create-txn` didn't validate milestone amounts.** Added
  server-side validation (positive amounts, sum equals total) mirroring the
  contract-level fix, so malformed requests are rejected before a
  transaction is even built.
- **`/debug/env` leaked secret configuration state.** A public,
  unauthenticated endpoint returned whether `GEMINI_API_KEY` /
  `GOOGLE_API_KEY` were set and their length. Removed — this kind of
  fingerprinting endpoint has no place on a production backend.

### Frontend (`frontend/src`)

- **`ActiveDeal.jsx` treated the demo wallet as a valid seller.** The page
  fell back to a hardcoded `DEFAULT_SELLER_WALLET` constant whenever the
  deal record had no seller wallet yet, which made the "seller wallet
  valid" check always pass. A buyer could release real funds to that shared
  placeholder address before the actual seller ever connected their own
  wallet. Fixed to only treat a wallet as valid once the deal record shows
  `seller_accepted: true`.

## Known limitations (documented, not patched in this pass)

These need a real design change, not a line-level fix, and are called out
here so they're a conscious decision before mainnet rather than a silent
gap:

- **`GET /deals` is public and unauthenticated.** It returns every deal on
  the platform — buyer/seller wallet addresses, negotiated prices,
  reasoning logs — to any caller. There is no wallet-signature-based
  session/auth layer anywhere in this backend; every "who can do this
  action" check is currently payload-shape based, not identity based.
  Before mainnet this should either require a signed-challenge auth layer,
  or the response should be scoped to the requesting wallet.
- **The deployed Soroban escrow contract (`a2a_escrow`) is not actually
  invoked by the app.** `/contract/create-txn` and `/contract/release-txn`
  build a plain Stellar `manage_data` op and a plain `payment` op,
  respectively — not `InvokeHostFunction` calls into `A2AEscrow::create_deal`
  / `release_milestone`. In practice, "escrow" today is enforced by
  application trust (backend bookkeeping + wallet-signed payments), not by
  the on-chain contract holding funds. The contract audit fixes above are
  still correct and worth having, but they don't protect real fund flows
  until the backend is wired to actually call the contract. This is the
  single biggest gap between "audited" and "trust-minimized" for a mainnet
  launch handling real value, and should be prioritized before any
  meaningful transaction volume.
- **x402 defaults to `simulate` mode** (`X402_MODE=simulate`). This is
  intentional for demos but must be set to `X402_MODE=enforce` in the
  mainnet deployment's environment, alongside `VERIFY_ONCHAIN_TX=true`
  (already the default).
- **`CORS_ORIGINS` defaults to `*`.** `backend/main.py` already avoids the
  wildcard+credentials footgun (credentials are disabled when the origin
  list is `*`), but for mainnet this should still be pinned to the
  production frontend origin explicitly via the `CORS_ORIGINS` env var.

## Required production environment for mainnet

| Variable | Required value | Why |
|---|---|---|
| `X402_MODE` | `enforce` | Simulate mode skips real payment verification. |
| `VERIFY_ONCHAIN_TX` | `true` (default) | Do not disable in production. |
| `CORS_ORIGINS` | Explicit frontend origin(s), not `*` | Restrict which sites can call the API with credentials. |
| `DEFAULT_SELLER_WALLET` | Unset, or a real reviewed address | This is a fallback only — mainnet flows should not rely on it. |
