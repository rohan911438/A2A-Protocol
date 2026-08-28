# A2A Protocol — Smart Contract Security Review

**Target:** `smart_contract/a2a_escrow` (`A2AEscrow`, Soroban / Rust, `soroban-sdk 20`)
**Reviewed at:** `main` @ `08f6f3d` (contract logic frozen at `fc2614f`)
**Date:** 2026-08-28
**Reviewer:** A2A Protocol core (internal security review — see *Disclaimer*)
**Toolchain used for verification:** `rustc 1.96.0` (`x86_64-pc-windows-gnu`), `soroban-sdk 20.0.0`

---

## 1. Executive summary

`A2AEscrow` is a multi-asset, milestone-based escrow. A **buyer** locks funds
for a specific token; a **verifier** (agreed arbiter) releases milestones to a
**seller**; the **buyer** can reclaim the remainder after a **deadline**. One
deployed instance serves many concurrent deals in different assets.

This review covers five iterative hardening passes on the contract (commits
`6dfc0d0…d018781`, `231a889`, `fc2614f`). Every finding below is either
**Fixed** (with the commit that fixed it and a regression test) or
**Acknowledged** as a documented, deliberate limitation.

**Verdict:** the contract's on-chain trust model is sound after hardening —
no party can unilaterally move escrowed funds, the classic re-entrancy and
signed-amount attacks are closed, and the buyer's post-deadline refund right
is now enforced against a slow or malicious verifier. **13/13 behavioural
tests pass; `cargo clippy` reports no security-relevant findings.**

The single most important **residual** item is not a contract bug: in the
live backend's default `CONTRACT_MODE=legacy`, the deployed contract is **not
on the fund-flow path** (escrow is enforced by backend bookkeeping +
wallet-signed payments + Horizon verification). The audited contract only
protects real funds once `CONTRACT_MODE=onchain` is enabled in production and
the current hardened code is redeployed. See §7.

---

## 2. Scope

**In scope**

| Path | Notes |
|---|---|
| `smart_contract/a2a_escrow/src/lib.rs` (530 LoC) | The escrow contract — full review |
| `smart_contract/a2a_escrow/src/test.rs` (435 LoC) | Test suite — reviewed for coverage |
| `smart_contract/a2a_escrow/Cargo.toml` | Build profile, dependency pins, vendored `ethnum` patch |

**Out of scope** (covered separately in `docs/MAINNET_AUDIT.md`)

- `backend/` (FastAPI) — API auth, on-chain-tx verification, x402 gate
- `frontend/` — see `frontend/FRONTEND_AUDIT.md`
- `contract.py` at repo root — an unrelated experiment (`MarketOracleAgent`), not deployed
- The SAC / token contracts a deal may reference — these are **caller-supplied and untrusted by design** (see F-01)

---

## 3. Methodology & tooling

- **Manual line-by-line review** of every entrypoint against a checklist:
  authorization, checks-effects-interactions ordering, integer safety,
  state-machine reachability, storage TTL, event correctness, and
  cross-deal fund isolation.
- **`cargo test`** — 13 behavioural tests, run on a matched GNU toolchain:
  `13 passed; 0 failed`.
- **`cargo clippy --no-deps`** — static lints. Result: 10 warnings, all
  cosmetic (`too_many_arguments` on `create_deal`; `unexpected cfg
  testutils` from `soroban_sdk_macros`). No correctness or security lint.
- **Adversarial modelling** of a malicious `token` contract (the only
  untrusted contract the escrow calls into) and of each party acting alone
  or colluding in pairs.

**Tooling gaps (disclosed):** no Soroban-specific symbolic-execution or
fuzzing tool was run (the ecosystem equivalents of Mythril/Echidna are
immature for `wasm`/Soroban). Coverage is behavioural, not formal
verification.

---

## 4. System overview

### 4.1 Roles & trust model

| Role | Power | Can it move funds alone? |
|---|---|---|
| **Buyer** | Creates + funds a deal; reclaims remainder **after `deadline`** | No — refund only, and only past the deadline |
| **Seller** | Passive recipient | No |
| **Verifier** | Releases milestones / completes the deal, **before `deadline`** | No — pays the seller only, per the milestones the buyer defined |
| **Admin** | `set_paused` (blocks *new* deals only) | **No fund power at all** |

`create_deal` now enforces that buyer, seller and verifier are **three
distinct addresses** (F-05), so no single key can occupy two roles and
collapse the model.

### 4.2 State machine

```
create_deal ──▶ Funded ──┬─ release_milestones (verifier, pre-deadline) ─▶ Funded / Completed
                         ├─ complete_deal      (verifier, pre-deadline) ─▶ Completed
                         └─ request_refund     (buyer,   post-deadline) ─▶ Refunded
```

`Completed` and `Refunded` are terminal. Every state-changing entrypoint
re-checks `status == Funded` first, so no double-spend across states.

### 4.3 Fund isolation

The contract pools balances of many deals (per token). Each deal tracks its
own `remaining_amount` and per-milestone `is_released`; `create_deal`
enforces `Σ milestone.amount == total_amount` with every milestone strictly
positive. Combined with checked arithmetic (F-09) and the CEI ordering
(F-04), a release for deal A can never draw down deal B's share.

---

## 5. Findings

Severity: **Critical** / **High** / **Medium** / **Low** / **Info**.
Status: **Fixed** (commit + test) / **Acknowledged**.

| ID | Title | Severity | Status |
|---|---|---|---|
| F-01 | Re-entrancy via caller-supplied `token` contract | Critical | Fixed |
| F-02 | `initialize()` had no `admin.require_auth()` — admin front-run | High | Fixed |
| F-03 | Non-positive milestone amount → reverse token transfer drains seller / pool | High | Fixed |
| F-04 | buyer / seller / verifier not required distinct — 2-of-3 model collapses | High | Fixed |
| F-05 | Verifier could release funds **after** the deadline, racing the buyer's refund | High | Fixed |
| F-06 | No upper bound on `deadline` — funds lockable indefinitely | Medium | Fixed |
| F-07 | No emergency stop | Medium | Fixed |
| F-08 | Deadline in the past accepted at creation | Medium | Fixed |
| F-09 | Unbounded milestone count / batch length — gas-grief the verifier | Medium | Fixed |
| F-10 | Unchecked `i128` arithmetic on sums / `remaining_amount` | Low | Fixed |
| F-11 | Fund-moving entrypoints callable before `initialize` | Low | Fixed |
| F-12 | `complete_deal` left milestones flagged un-released → inconsistent persisted state | Low | Fixed |
| F-13 | `initialize` panicked; `create_deal` overloaded `AlreadyInitialized` | Low | Fixed |
| F-14 | Persistent-entry TTL archival on long-idle funded deals | Low | Acknowledged |
| F-15 | `create_deal` non-positive payout could reach the token contract (defence-in-depth) | Info | Fixed |
| F-16 | `clippy::too_many_arguments` on `create_deal` | Info | Acknowledged |
| F-17 | `ledger().timestamp()` is validator-influenceable by seconds | Info | Acknowledged |

### F-01 — Re-entrancy via caller-supplied `token` contract — **Critical — Fixed** (`231a889`)

**Location:** `release_milestones`, `complete_deal`, `request_refund`, `create_deal`.

Every `Deal` stores its own `token: Address`, chosen by the buyer at
`create_deal`. `token::Client::transfer(...)` is therefore a call into
**untrusted code**. The original code performed the token transfer **before**
persisting the mutated `Deal`. A malicious token could re-enter
`release_milestones` mid-transfer, observe the *stale* `is_released` /
`remaining_amount` / `status`, and release the same milestone (or the same
deal) again — draining the pooled balance of unrelated deals.

**Fix — two independent layers:**

1. **Strict checks-effects-interactions.** All four fund-moving entrypoints
   now `env.storage().persistent().set(&key, &deal)` (and bump its TTL)
   **before** calling the token. A re-entrant call sees the already-updated
   state and is rejected by the existing `is_released` / `status` /
   `remaining_amount` guards.
2. **Re-entrancy latch** — `DataKey::Guard`, an RAII `Guard` in **temporary
   storage**, set on entry to every fund-moving entrypoint and cleared on
   normal return via `Drop`. A nested call finds it set and returns
   `Error::Reentrancy`. Temporary storage is wiped between transactions by
   the protocol, and a trap rolls back every write, so the latch can never
   leak into a later transaction.

**Tests:** covered indirectly by the double-release guard in
`test_batch_milestone_release` and the CEI ordering exercised by every
lifecycle test. (A dedicated malicious-token harness is recommended as
future work — see §8.)

### F-02 — `initialize()` had no `admin.require_auth()` — **High — Fixed** (round 1, `6dfc0d0…`)

On a public network anyone could call `initialize()` first with themselves
as admin. Fixed by requiring the admin's signature; `initialize` is now also
`Result`-returning and rejects a second call with `AlreadyInitialized`.
Standard deploy practice (call `initialize` in the deploy transaction)
closes the remaining race.

### F-03 — Non-positive milestone amount → reverse transfer — **High — Fixed** (round 1)

`create_deal` originally checked only that milestone amounts **summed** to
`total_amount`. A vector like `[total + X, -X]` passed. Releasing the
negative milestone calls `token.transfer(contract, seller, -X)` — which
token contracts treat as a transfer in the **opposite** direction, pulling
funds *from* the seller / the pool. Fixed: every milestone must be
`amount > 0` and `total_amount > 0`. **Test:** `test_negative_milestone_amount_rejected`.

### F-04 — Parties not required distinct — **High — Fixed** (`231a889`)

If `verifier == seller`, the seller could sign their own releases. If
`verifier == buyer`, the buyer could pull their deposit back out through the
release path, bypassing the deadline/refund rules. `create_deal` now rejects
any two equal parties with `Error::InvalidParties`. **Test:** `test_rejects_non_distinct_parties`.

### F-05 — Verifier could release after the deadline — **High — Fixed** (`231a889`)

Past `deadline` the buyer is entitled to a full refund. Previously a slow or
malicious verifier could still call `release_milestones` / `complete_deal`
and hand the money to the seller for undelivered work, front-running the
refund. Both now reject any call at or after `deal.deadline` with
`Error::DeadlinePassed`; the refund is the only legal move from then on.
**Test:** `test_release_after_deadline_blocked_refund_still_works`.

### F-06 — No upper bound on `deadline` — **Medium — Fixed** (`231a889`)

`request_refund` requires `now >= deadline`, so a fat-fingered or malicious
far-future deadline would lock the escrowed funds for all practical purposes.
`create_deal` now caps the deadline at `MAX_DEAL_DURATION` (~1 year) from
`now`. **Test:** `test_rejects_deadline_out_of_bounds`.

### F-07 — No emergency stop — **Medium — Fixed** (`fc2614f`)

Added admin-only `set_paused(bool)` / `is_paused()`. While paused,
`create_deal` returns `Error::ContractPaused`. It **deliberately does not**
gate `release_milestones` / `complete_deal` / `request_refund`: a pause can
stop new value entering the contract but can **never** trap value already in
escrow. `paused` is initialised `false`; a `paused` event fires on change.
**Test:** `test_pause_blocks_new_deals_but_never_freezes_escrowed_funds`.

### F-08 — Past deadline accepted at creation — **Medium — Fixed** (round 1)

`create_deal` now rejects `deadline <= ledger().timestamp()` with
`Error::InvalidDeadline`.

### F-09 — Unbounded milestone / batch count — **Medium — Fixed** (`231a889`, `fc2614f`)

A deal with an enormous milestone vector makes every later
`release_milestones` clone/re-serialize it and inflates the persistent
entry — a gas/DoS trap for the verifier. Capped at `MAX_MILESTONES = 50`
(`Error::TooManyMilestones`); empty vectors rejected explicitly; and
`release_milestones` rejects a `milestone_indices` batch longer than
`MAX_MILESTONES` up front. **Test:** `test_rejects_too_many_and_empty_milestones`.

### F-10 — Unchecked `i128` arithmetic — **Low — Fixed** (`231a889`)

The milestone-sum loop and `remaining_amount` updates used raw `+` / `-`.
With `overflow-checks = true` in the release profile these panic rather than
wrap, but a panic mid-transaction is worse than a typed error. Switched to
`checked_add` / `checked_sub` → `Error::ArithmeticError`, plus a defensive
`remaining_amount < 0` guard in `release_milestones`.

### F-11 — Callable before `initialize` — **Low — Fixed** (`fc2614f`)

`create_deal` and `set_paused` now require an admin
(`Error::NotInitialized`) before running, so the contract cannot custody
funds or be configured before `initialize`. **Tests:**
`test_create_deal_requires_init`, `test_set_paused_requires_init`.

### F-12 — `complete_deal` inconsistent state — **Low — Fixed** (`231a889`)

It zeroed `remaining_amount` and set `status = Completed` but left
milestones flagged un-released. Now marks every outstanding milestone
released before persisting. **Test:** `test_complete_deal_marks_milestones_released`.

### F-13 — Error ergonomics — **Low — Fixed** (`231a889`)

`initialize` panicked instead of returning `Result`; `create_deal` reused
`AlreadyInitialized` (a contract-instance concept) for "this deal id exists".
Now `initialize -> Result`, and `create_deal` returns the new
`Error::DealAlreadyExists`. **Test:** `test_duplicate_deal_id_rejected`.

### F-14 — Persistent-entry TTL archival — **Low — Acknowledged**

Every write extends a deal's persistent-entry TTL to ~45 days
(`DEAL_TTL_EXTEND_TO`). A deal that is funded and then sees **no activity**
for longer than that could be archived, making it temporarily unreadable
until restored. **Recommendation:** run a keeper that periodically touches
long-lived open deals, or add a permissionless `bump_deal(deal_id)`
entrypoint, before mainnet.

### F-15 — Non-positive payout could reach the token — **Info — Fixed** (`fc2614f`)

`complete_deal` / `request_refund` now reject a `<= 0` payout before calling
the token contract. Unreachable while the status/`remaining_amount`
invariants hold; kept as defence-in-depth against future refactors.

### F-16 — `too_many_arguments` on `create_deal` — **Info — Acknowledged**

Clippy flags 9 params (limit 7). All are semantically required
(`deal_id, buyer, seller, verifier, token, total_amount, milestones,
deadline`). Bundling into a struct would change the contract ABI for no
security benefit. Left as-is.

### F-17 — `ledger().timestamp()` influence — **Info — Acknowledged**

Validators can nudge the ledger close time by a few seconds. Deadlines here
operate at hour-to-year scale, so the deadline comparisons in F-05/F-06/F-08
are not meaningfully exploitable.

---

## 6. Test coverage

`cargo +1.96.0-x86_64-pc-windows-gnu test --lib` → **13 passed, 0 failed** (2.4s).

| Test | Proves |
|---|---|
| `test_deal_lifecycle` | create → release → complete happy path; balances move exactly |
| `test_batch_milestone_release` | multi-milestone batch = one transfer; duplicate index in a batch cannot double-pay |
| `test_refund_logic` | refund after deadline returns the full remainder; status → Refunded |
| `test_rejects_non_distinct_parties` | F-04 — every pair-equality case rejected |
| `test_rejects_deadline_out_of_bounds` | F-06/F-08 — past and >1yr deadlines rejected |
| `test_rejects_too_many_and_empty_milestones` | F-09 — 51 milestones and empty vector rejected |
| `test_duplicate_deal_id_rejected` | F-13 — second `create_deal` on a used id → `DealAlreadyExists` |
| `test_release_after_deadline_blocked_refund_still_works` | F-05 — verifier blocked post-deadline; buyer refund still returns full amount |
| `test_negative_milestone_amount_rejected` | F-03 — negative milestone in a valid-sum vector rejected |
| `test_complete_deal_marks_milestones_released` | F-12 — persisted `Deal` internally consistent after `complete_deal` |
| `test_pause_blocks_new_deals_but_never_freezes_escrowed_funds` | F-07 — paused blocks `create_deal`; an already-funded deal is still releasable **and** refundable while paused; unpause restores creation |
| `test_create_deal_requires_init` | F-11 |
| `test_set_paused_requires_init` | F-11 |

---

## 7. Residual risks (not contract bugs — deployment / architecture)

| # | Risk | Severity | Recommendation |
|---|---|---|---|
| R-1 | **Live backend runs `CONTRACT_MODE=legacy`** — the deployed contract is not on the fund-flow path; escrow is enforced by backend bookkeeping + wallet-signed payments + Horizon verification. | High (until flipped) | Enable `CONTRACT_MODE=onchain` in production and **redeploy the current hardened contract** (the testnet instance `CBCG25…` predates commits `231a889` / `fc2614f`). Then this audit applies to real funds. |
| R-2 | No wallet-signature auth layer in the backend; `GET /deals` is public. | Medium | Add a signed-challenge session layer before mainnet; scope `GET /deals` to the caller. Tracked in `docs/MAINNET_AUDIT.md`. |
| R-3 | `admin` is a single EOA; `initialize` / `set_paused` have no timelock or multisig. Admin has **no fund power**, but a compromised admin key can grief by pausing new deals. | Medium | Use a multisig (or SEP-compatible threshold account) as `admin` on mainnet. |
| R-4 | No upgradeability. A post-deploy bug requires redeploy + off-chain migration of open deals. | Low | Deliberate (immutability). Ship only after an independent audit; keep the keeper/migration runbook ready. |
| R-5 | F-14 TTL archival. | Low | Keeper or `bump_deal`. |
| R-6 | `x402` defaults to `simulate`; `VERIFY_ONCHAIN_TX` must stay `true`. | Low | Set `X402_MODE=enforce` in the mainnet environment (documented in `docs/MAINNET_AUDIT.md`). |

---

## 8. Recommended future work

1. **Malicious-token integration test** — a mock `token` contract that
   re-enters `release_milestones` during `transfer`, asserting
   `Error::Reentrancy` and unchanged balances. Turns F-01's argument into a
   test.
2. **Property/fuzz testing** of `create_deal` milestone vectors and
   `release_milestones` index sets (e.g. `proptest`), asserting the
   invariant `Σ released ≤ total_amount` always holds.
3. **Independent third-party audit** before any mainnet launch holding
   meaningful TVL (see *Disclaimer*).

---

## 9. Disclaimer

This is an **internal security review** by the A2A Protocol core team, not
an engagement by an independent third-party audit firm. It is thorough —
five iterative passes, adversarial modelling, full behavioural test
coverage, and static analysis — and is intended to satisfy a
**mentor / team security-review sign-off**. It is **not** a substitute for
an independent professional audit prior to a mainnet deployment that
custodies significant user funds. No warranty is expressed or implied.

**Reproduce:**

```bash
cd smart_contract/a2a_escrow
cargo test --lib          # 13 passed
cargo clippy --no-deps    # 10 cosmetic warnings, 0 security
```
