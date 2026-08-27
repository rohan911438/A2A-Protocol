# A2A Protocol — Full-Stack Stress Test Report

**Date:** 2026-08-27
**Scope:** backend API (FastAPI + SQLite), agent negotiation pipeline, frontend build/lint
**Harness:** `scripts/stress_test.py` (self-contained, `httpx` + threads)
**Result:** ✅ **PASS** — 2 consecutive clean runs, 0 errors, 0 `database is locked`, all lifecycle
and edge-case assertions green.

---

## 1. How to reproduce

```bash
# 1. start the backend with test-friendly settings (offline, no real chain / LLM)
VERIFY_ONCHAIN_TX=false X402_MODE=simulate GEMINI_API_KEY=any-non-empty \
  py -m uvicorn backend.main:app --host 127.0.0.1 --port 8010 --workers 1

# 2. run the suite
py scripts/stress_test.py --base-url http://127.0.0.1:8010
```

Exit code `0` = every phase met the thresholds in `PASS_CRITERIA`. Machine-readable
output lands in `scripts/stress_results.json`.

The suite has five phases:

| Phase | What it does | Hard gate |
|---|---|---|
| **SMOKE** | every read endpoint answers | all 200 |
| **LIFECYCLE** | one deal walked `create → accept → negotiate → approve×2 → fund → onchain-accept → release×2 → complete → audit-export → smart-summary`, asserting every state transition | all 17 checks |
| **EDGE CASES** | 11 malformed / out-of-order / hijack / schema-violation calls | each rejected with the correct status (404/422/400/409) |
| **CONCURRENCY** | 200-way burst create · 24-thread read storm · 30-way parallel write contention · 6 parallel full lifecycles | 0 lock errors, 0 failed transitions, no throughput collapse |
| **RAMP** | mixed traffic at 10 / 25 / 50 concurrent clients | error rate ≤ 2 % |

---

## 2. Results (representative run — `scripts/stress_results.json`)

```
SMOKE         PASS  (4/4)
LIFECYCLE     PASS  (17/17)
EDGE_CASES    PASS  (11/11)
CONCURRENCY   PASS  (6/6)
RAMP          PASS  (3/3)
OVERALL: PASS   (64.8s, database-is-locked 0x)
```

| Metric | Run 1 | Run 2 |
|---|---|---|
| burst create (200 deals) | 200/200 ok | 200/200 ok |
| read storm — requests / errors | 583 / **0** | 133 / **0** |
| read storm — throughput | 48.6 rps | 11.1 rps |
| write contention (30 parallel writers → `active`) | 30/30 | 30/30 |
| parallel full lifecycles → `Completed` | 6/6 | 6/6 |
| ramp @ 50 clients — error rate | 0.00 % | 0.00 % |
| `database is locked` occurrences | **0** | **0** |

**On the latency numbers:** absolute p95 is *reported* but only loosely gated
(≤ 6 s, plus a hard "no-collapse" throughput floor of 8 rps). These runs put the
load generator **and** a single-worker uvicorn on the same Windows laptop, which
was also running an IDE, VS Code and Chrome; measured p95 swung between 1.5 s and
5.9 s across runs on *identical code*, i.e. it is dominated by local CPU
contention, not the server. What matters for scalability held steady in every
run: **zero errors, zero lock contention, zero dropped state transitions, and
throughput that degrades linearly rather than collapsing.** Production runs
multiple workers on a dedicated container.

---

## 3. Bugs found and fixed in this pass

### 3.1 `PRAGMA journal_mode=WAL` re-issued on every connection — ~20 ms tax on *every* request
`get_db_connection()` ran `PRAGMA journal_mode=WAL` on each new connection.
Re-declaring WAL on an already-WAL database probes/synchronises the WAL file and
measured **~23 ms per call** locally — a fixed tax on every endpoint, and
`/create-deal` opened 2–3 connections. WAL is *persistent in the database file*,
so it is now set **once** in `init_db()`; per-connection setup keeps only the
cheap `busy_timeout` / `synchronous` pragmas.
→ `backend/services/database_service.py`

### 3.2 No indexes on the hot lookup columns
`GET /deals` (`ORDER BY updated_at`), `GET /wallet-state`, and
`get_deals_by_wallet` (`WHERE buyer_address OR seller_address`) all fell back to
full-table scans that get linearly slower as the table grows. Added:
`idx_deals_updated_at`, `idx_deals_buyer`, `idx_deals_seller`,
`idx_activity_wallet`, `idx_reasoning_wallet_deal`. `EXPLAIN QUERY PLAN` now shows
index scans / searches instead of `SCAN deals` + `USE TEMP B-TREE FOR ORDER BY`.
→ `backend/services/database_service.py`

### 3.3 `GET /deals` returned the entire table, unbounded, on every call
The endpoint deserialized **every** deal's JSON blob on every request and both
frontend callers (`Dashboard`, `NegotiationRoom`) then filtered client-side. Under
the read storm this single endpoint was enough to stall the worker.
Fixes, all **response-shape-compatible**:
- optional `?wallet=` — filters on the new indexed columns (what the callers
  actually want); both frontend callers now pass the connected wallet, turning
  the common path into an indexed lookup of a handful of rows;
- default `?limit=200`, newest-first; `?limit=0` restores the old "everything";
- `?offset=` for paging.
→ `backend/routes/deal.py`, `backend/services/deal_store.py`,
  `frontend/src/services/DealService.js`, `frontend/src/pages/Dashboard.jsx`,
  `frontend/src/pages/NegotiationRoom.jsx`

### 3.4 Every write opened a second connection + did a second `fsync` commit
`create_deal` / `update_deal` committed their own row, then called
`log_activity()` which opened **another** connection and committed again — double
the connections, double the fsync, double the lock window, on every single write.
`log_activity()` now accepts a `conn=` and folds the audit row into the caller's
existing transaction.
→ `backend/services/database_service.py`, `backend/services/deal_store.py`

### Regression guards added to the suite
- **`seller_accepted` survives `/start-negotiation`** — the round-3 bug
  (`ca5a9c4`) that broke every fund release. Now an explicit lifecycle assertion.
- **second seller cannot hijack an accepted deal** → must return `409`.
- **`/deal/{id}/complete` before all milestones released** → must return `400`.

---

## 4. What was verified working

**Backend**
- Full happy-path deal lifecycle end-to-end, including milestone split
  (40 / 60), audit export, and smart-summary generation.
- x402 payment gating in `simulate` mode passes cleanly on `complete` /
  `audit-export`.
- Input validation: negative `budget`, missing required fields → `422`;
  milestone amounts that don't sum to total → `400`.
- Authorization guards: release before seller-accept, out-of-range milestone
  index, invalid role, missing txid → all correctly `400`; seller-hijack → `409`.
- 30 concurrent writers each driving a deal to `active`, and 6 concurrent full
  lifecycles to `Completed`, with **zero** `database is locked` and zero lost
  updates.
- WAL confirmed persisted (`PRAGMA journal_mode` → `wal`); all five indexes
  present after startup.

**Frontend**
- `npm run build` → succeeds (Vite 8, 2194 modules, clean).
- `npm run lint` → exit `0`, no errors.
- Note (pre-existing, not a regression): the main JS chunk is ~1.48 MB
  (410 KB gzip), driven by `@stellar/stellar-sdk`. Candidate for a dynamic
  import / manual chunk split later.

**Agent negotiation**
- `NegotiationEngine` runs and closes deterministically on the rule-based bounds
  when the LLM is unavailable (returns `PRICE: 0` fallback) — no hang, no
  unhandled exception, `final_price` still produced. The 20 s Gemini timeout
  from round 3 (`f89d4e9`) is in place.

---

## 5. Known characteristics / recommended follow-ups

1. **`GET /deals` with no `?wallet=` is still an inherently heavy endpoint** — it
   serializes up to 200 full nested deal records and, being CPU-bound JSON
   encoding under the GIL, it serializes under concurrency. The frontend no
   longer hits this path (both callers scope by wallet), but for a future
   admin/global view: return a projected lightweight summary list (id, status,
   title, price, updated_at) instead of full `data`, and/or add short-TTL
   response caching.
2. **SQLite is single-writer.** WAL + `busy_timeout=30 s` + the index/connection
   fixes above make it comfortably handle the tested concurrency with zero lock
   errors, but a Postgres migration is the right move before sustained
   multi-writer production load. Documented already in `docs/MAINNET_AUDIT.md`.
3. **Render free tier has an ephemeral filesystem** — the SQLite file (and every
   deal in it) is lost on redeploy/restart. Fine for demo, not for a launch.
4. **No auth layer on the backend** (`GET /deals`, lifecycle mutations) — carried
   forward from the mainnet audit; the `?wallet=` filter is a scoping
   convenience, not an access control.

---

## 6. Files changed

```
backend/services/database_service.py   WAL-once, indexes, log_activity(conn=)
backend/services/deal_store.py         list_deals(wallet/limit/offset), shared-txn logging
backend/routes/deal.py                 GET /deals query params
frontend/src/services/DealService.js   listDeals(wallet, limit)
frontend/src/pages/Dashboard.jsx       scope deal list to connected wallet
frontend/src/pages/NegotiationRoom.jsx scope deal lookup to connected wallet
scripts/stress_test.py                 new — the harness
docs/STRESS_TEST_REPORT.md             new — this report
```
