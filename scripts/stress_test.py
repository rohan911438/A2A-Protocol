#!/usr/bin/env python3
"""
A2A Protocol — full-stack backend stress & correctness harness.

Runs five phases against a live backend:

  1. SMOKE        - every read endpoint responds
  2. LIFECYCLE    - one deal walked create -> ... -> Completed with per-step asserts
  3. EDGE CASES   - malformed / out-of-order / unauthorized calls are rejected correctly
  4. CONCURRENCY  - burst create, read storm, write contention, parallel full lifecycles
  5. RAMP         - mixed traffic at 10 / 25 / 50 concurrent clients

Exit code 0 => every phase passed the thresholds in PASS_CRITERIA.

Usage:
    py scripts/stress_test.py [--base-url http://127.0.0.1:8010] [--out scripts/stress_results.json]

The target server should run with test-friendly env:
    VERIFY_ONCHAIN_TX=false   X402_MODE=simulate   GEMINI_API_KEY=<any-non-empty>
"""
from __future__ import annotations

import argparse
import json
import random
import statistics
import string
import sys
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Any

import httpx

# --------------------------------------------------------------------------- #
# config
# --------------------------------------------------------------------------- #
# Hard gates are about *correctness under concurrency* (no lost updates, no
# lock errors, no dropped transitions) and *no throughput collapse*. Absolute
# latency is reported but only loosely gated: these runs put the load client
# and a single-worker uvicorn on the same consumer machine, so p95 reflects
# local CPU contention as much as the server. Production runs multiple workers
# on a dedicated container.
PASS_CRITERIA = {
    "lifecycle_all_steps_ok": True,
    "edge_cases_all_ok": True,
    "db_locked_occurrences": 0,
    "read_storm_error_rate_max": 0.01,
    "read_storm_min_rps": 8.0,          # below this = serialization collapse
    "read_storm_p95_ms_max": 6000,      # generous ceiling for local single-worker
    "write_contention_success_rate_min": 1.0,
    "parallel_lifecycle_success_rate_min": 1.0,
    "ramp_error_rate_max": 0.02,
}

STELLAR_ADDRS = [
    "GC5OZM7AY73DKZMPWU5BMW3EA6BXCYJIIF6UUQQ44XT4DOJQOXQZU2YF",
    "GBQK6RQ2Q7GJ7GQY6Q3XV5S4CY4LE3AVEXH6MPYS3T2SBK4XGY5UDXBM",
    "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ",
]


def rand_addr() -> str:
    # syntactically valid: G + 55 chars from base32 alphabet [A-Z2-7]
    return "G" + "".join(random.choice(string.ascii_uppercase + "234567") for _ in range(55))


# --------------------------------------------------------------------------- #
# result accounting
# --------------------------------------------------------------------------- #
@dataclass
class Check:
    name: str
    ok: bool
    detail: str = ""


@dataclass
class Phase:
    name: str
    checks: list[Check] = field(default_factory=list)
    metrics: dict[str, Any] = field(default_factory=dict)

    def add(self, name: str, ok: bool, detail: str = "") -> bool:
        self.checks.append(Check(name, ok, detail))
        mark = "PASS" if ok else "FAIL"
        print(f"    [{mark}] {name}" + (f"  -- {detail}" if detail and not ok else ""))
        return ok

    @property
    def passed(self) -> bool:
        return all(c.ok for c in self.checks)


class Harness:
    def __init__(self, base_url: str):
        self.base = base_url.rstrip("/")
        limits = httpx.Limits(max_connections=200, max_keepalive_connections=100)
        self.client = httpx.Client(base_url=self.base, timeout=30.0, limits=limits)
        self.db_locked_hits = 0
        self.phases: list[Phase] = []

    # -- low level ------------------------------------------------------------
    def call(self, method: str, path: str, **kw) -> tuple[int, Any, float]:
        t0 = time.perf_counter()
        try:
            r = self.client.request(method, path, **kw)
            dt = (time.perf_counter() - t0) * 1000
            body: Any
            try:
                body = r.json()
            except Exception:
                body = r.text
            if isinstance(body, str) and "database is locked" in body.lower():
                self.db_locked_hits += 1
            elif isinstance(body, dict) and "database is locked" in json.dumps(body).lower():
                self.db_locked_hits += 1
            return r.status_code, body, dt
        except Exception as exc:  # noqa: BLE001
            dt = (time.perf_counter() - t0) * 1000
            return 0, f"EXC:{type(exc).__name__}:{exc}", dt

    # -- phase 1: smoke -----------------------------------------------------
    def phase_smoke(self) -> Phase:
        p = Phase("SMOKE")
        print("\n== PHASE 1: SMOKE ==")
        s, b, _ = self.call("GET", "/")
        p.add("GET /", s == 200 and isinstance(b, dict))
        s, b, _ = self.call("GET", "/contract/info")
        p.add("GET /contract/info", s == 200 and b.get("protocol"), str(b))
        s, b, _ = self.call("GET", "/deals")
        p.add("GET /deals", s == 200 and isinstance(b, dict))
        s, b, _ = self.call("GET", f"/wallet-state/{rand_addr()}")
        p.add("GET /wallet-state/{addr}", s == 200 and "active_deals" in b, str(b)[:200])
        self.phases.append(p)
        return p

    # -- phase 2: lifecycle ----------------------------------------------------
    def _create_deal(self, buyer: str, budget=1200.0, min_price=600.0) -> str:
        s, b, _ = self.call("POST", "/create-deal", json={
            "title": "Stress Deal",
            "budget": budget,
            "min_price": min_price,
            "deadline": "2026-12-31",
            "description": "automated stress-test deal",
            "buyer_wallet": buyer,
        })
        if s != 200:
            raise RuntimeError(f"create-deal failed: {s} {b}")
        return b["deal_id"]

    def phase_lifecycle(self) -> Phase:
        p = Phase("LIFECYCLE")
        print("\n== PHASE 2: FULL LIFECYCLE ==")
        buyer = STELLAR_ADDRS[1]
        seller = STELLAR_ADDRS[2]
        try:
            did = self._create_deal(buyer)
            p.add("create-deal -> deal_id", bool(did), did)

            s, b, _ = self.call("GET", f"/deal/{did}")
            p.add("GET /deal/{id} status=created", s == 200 and b["status"] == "created", str(b.get("status")))

            s, b, _ = self.call("POST", f"/deal/{did}/accept", json={"seller_wallet": seller})
            p.add("accept -> accepted", s == 200 and b["status"] == "accepted", str(b))

            s, b, _ = self.call("POST", "/start-negotiation", json={"deal_id": did})
            neg_ok = s == 200 and b.get("status") in ("negotiated", "failed")
            p.add("start-negotiation responds", neg_ok, f"{s} {str(b)[:160]}")
            s, b, _ = self.call("GET", f"/deal/{did}")
            # seller_accepted must survive start-negotiation (regression guard)
            p.add("seller_accepted survives negotiation",
                  b["data"].get("seller_accepted") is True, str(b["data"].get("seller_accepted")))
            has_price = bool((b["data"].get("result") or {}).get("final_price"))
            p.add("negotiation produced final_price", has_price,
                  str((b["data"].get("result") or {}).get("final_price")))

            for role in ("buyer", "seller"):
                s, b, _ = self.call("POST", f"/deal/{did}/approve", json={"role": role})
                p.add(f"approve {role}", s == 200 and b["approvals"][role] is True, str(b))

            s, b, _ = self.call("POST", f"/deal/{did}/fund", json={"txid": "stress-fund-" + did[:8]})
            p.add("fund -> funded", s == 200 and b.get("funded") is True, str(b))

            s, b, _ = self.call("POST", f"/deal/{did}/onchain-accept",
                                json={"role": "buyer", "txid": "stress-oca-" + did[:8]})
            p.add("onchain-accept buyer -> active", s == 200 and b["status"] == "active", str(b))

            s, b, _ = self.call("GET", f"/deal/{did}")
            n_ms = len((b["data"].get("result") or {}).get("milestones") or [])
            p.add("milestones present", n_ms >= 1, str(n_ms))

            for i in range(n_ms):
                s, b, _ = self.call("POST", f"/deal/{did}/release",
                                    json={"milestone_index": i, "txid": f"stress-rel-{i}-{did[:8]}"})
                p.add(f"release milestone {i}", s == 200 and i in b["releases"]["completed"], str(b)[:160])

            s, b, _ = self.call("POST", f"/deal/{did}/complete")
            p.add("complete -> Completed", s == 200 and b["status"] == "Completed", str(b))

            s, b, _ = self.call("GET", f"/deal/{did}/audit-export")
            p.add("audit-export", s == 200 and b.get("audit_summary"), str(b)[:160])

            s, b, _ = self.call("GET", f"/deal/{did}/smart-summary", params={"wallet_address": buyer})
            p.add("smart-summary", s == 200 and b.get("summary"), str(b)[:160])

            s, b, _ = self.call("GET", f"/wallet-state/{buyer}")
            ids = [d["deal_id"] for d in b.get("history", []) + b.get("active_deals", [])]
            p.add("wallet-state lists deal", did in ids, str(ids)[:200])
        except Exception as exc:  # noqa: BLE001
            p.add("lifecycle completed without exception", False, repr(exc))
        self.phases.append(p)
        return p

    # -- phase 3: edge cases -------------------------------------------------
    def phase_edge(self) -> Phase:
        p = Phase("EDGE_CASES")
        print("\n== PHASE 3: EDGE / NEGATIVE CASES ==")
        # unknown deal
        s, _, _ = self.call("GET", f"/deal/{uuid.uuid4()}")
        p.add("unknown deal -> 404", s == 404)
        s, _, _ = self.call("POST", "/start-negotiation", json={"deal_id": str(uuid.uuid4())})
        p.add("negotiate unknown deal -> 404", s == 404)
        # schema validation
        s, _, _ = self.call("POST", "/create-deal", json={"budget": -5, "min_price": 1,
                                                          "deadline": "2026-12-31", "description": "x"})
        p.add("negative budget -> 422", s == 422)
        s, _, _ = self.call("POST", "/create-deal", json={"budget": 10, "description": "missing fields"})
        p.add("missing required fields -> 422", s == 422)
        # out-of-order + bad params on a real deal
        try:
            did = self._create_deal(STELLAR_ADDRS[0])
            s, _, _ = self.call("POST", f"/deal/{did}/release", json={"milestone_index": 0, "txid": "t"})
            p.add("release before seller-accept -> 400", s == 400)
            s, _, _ = self.call("POST", f"/deal/{did}/approve", json={"role": "auditor"})
            p.add("approve invalid role -> 400", s == 400)
            s, _, _ = self.call("POST", f"/deal/{did}/onchain-accept", json={"role": "buyer"})
            p.add("onchain-accept without txid -> 400", s == 400)
            self.call("POST", f"/deal/{did}/accept", json={"seller_wallet": STELLAR_ADDRS[2]})
            self.call("POST", "/start-negotiation", json={"deal_id": did})
            s, _, _ = self.call("POST", f"/deal/{did}/release", json={"milestone_index": 99, "txid": "t"})
            p.add("release out-of-range milestone -> 400", s == 400)
            s, _, _ = self.call("POST", f"/deal/{did}/complete")
            p.add("complete before releases -> 400", s == 400)
            # seller-hijack guard: a different wallet cannot re-accept
            s, _, _ = self.call("POST", f"/deal/{did}/accept", json={"seller_wallet": rand_addr()})
            p.add("second seller cannot hijack -> 409", s == 409)
        except Exception as exc:  # noqa: BLE001
            p.add("edge-case deal setup ok", False, repr(exc))
        # contract txn validation
        s, _, _ = self.call("POST", "/contract/create-txn", json={
            "sender": STELLAR_ADDRS[0], "deal_id": "x", "total": 100, "milestones": [40, 40]})
        p.add("contract create-txn milestone-sum mismatch -> 400", s == 400)
        self.phases.append(p)
        return p

    # -- phase 4: concurrency --------------------------------------------------
    def phase_concurrency(self) -> Phase:
        p = Phase("CONCURRENCY")
        print("\n== PHASE 4: CONCURRENCY ==")

        # 4a burst create
        N = 200
        t0 = time.perf_counter()
        with ThreadPoolExecutor(max_workers=50) as ex:
            res = list(ex.map(lambda _: self.call("POST", "/create-deal", json={
                "budget": 900, "min_price": 400, "deadline": "2026-12-31",
                "description": "burst", "buyer_wallet": rand_addr()}), range(N)))
        dt = time.perf_counter() - t0
        ok = sum(1 for s, _, _ in res if s == 200)
        lat = sorted(x[2] for x in res)
        p.metrics["burst_create"] = {"n": N, "ok": ok, "secs": round(dt, 2),
                                     "rps": round(N / dt, 1), "p95_ms": round(lat[int(N * 0.95)], 1)}
        p.add(f"burst create {ok}/{N} @ {round(N/dt,1)} rps", ok == N, str(p.metrics["burst_create"]))
        burst_ids = [b["deal_id"] for s, b, _ in res if s == 200 and isinstance(b, dict)]

        # 4b read storm
        DURATION = 12
        WORKERS = 24
        stop_at = time.perf_counter() + DURATION
        lat_ms: list[float] = []
        errors = 0
        counter = 0

        def reader() -> None:
            nonlocal errors, counter
            while time.perf_counter() < stop_at:
                pick = random.random()
                if pick < 0.45 and burst_ids:
                    s, _, d = self.call("GET", f"/deal/{random.choice(burst_ids)}")
                elif pick < 0.75:
                    s, _, d = self.call("GET", "/deals")
                else:
                    s, _, d = self.call("GET", f"/wallet-state/{random.choice(STELLAR_ADDRS)}")
                lat_ms.append(d)
                counter += 1
                if s != 200:
                    errors += 1

        with ThreadPoolExecutor(max_workers=WORKERS) as ex:
            for f in [ex.submit(reader) for _ in range(WORKERS)]:
                f.result()
        lat_ms.sort()
        err_rate = errors / max(counter, 1)
        storm = {
            "requests": counter, "errors": errors, "error_rate": round(err_rate, 4),
            "rps": round(counter / DURATION, 1),
            "p50_ms": round(lat_ms[len(lat_ms) // 2], 1),
            "p95_ms": round(lat_ms[int(len(lat_ms) * 0.95)], 1),
            "p99_ms": round(lat_ms[int(len(lat_ms) * 0.99)], 1),
        }
        p.metrics["read_storm"] = storm
        p.add(f"read storm err_rate {storm['error_rate']:.3%} <= {PASS_CRITERIA['read_storm_error_rate_max']:.0%}",
              err_rate <= PASS_CRITERIA["read_storm_error_rate_max"], str(storm))
        p.add(f"read storm throughput {storm['rps']} rps >= {PASS_CRITERIA['read_storm_min_rps']} (no collapse)",
              storm["rps"] >= PASS_CRITERIA["read_storm_min_rps"], str(storm))
        p.add(f"read storm p95 {storm['p95_ms']}ms <= {PASS_CRITERIA['read_storm_p95_ms_max']}ms (soft/local)",
              storm["p95_ms"] <= PASS_CRITERIA["read_storm_p95_ms_max"], str(storm))

        # 4c write contention: many parallel writers each mutating their own deal
        W = 30

        def writer(_i: int) -> bool:
            try:
                did = self._create_deal(rand_addr())
                steps = [
                    ("POST", f"/deal/{did}/accept", {"seller_wallet": STELLAR_ADDRS[2]}),
                    ("POST", f"/deal/{did}/approve", {"role": "buyer"}),
                    ("POST", f"/deal/{did}/approve", {"role": "seller"}),
                    ("POST", f"/deal/{did}/fund", {"txid": "w-" + did[:8]}),
                    ("POST", f"/deal/{did}/onchain-accept", {"role": "buyer", "txid": "w2-" + did[:8]}),
                ]
                for m, path, body in steps:
                    s, _, _ = self.call(m, path, json=body)
                    if s != 200:
                        return False
                s, b, _ = self.call("GET", f"/deal/{did}")
                return b["status"] == "active"
            except Exception:  # noqa: BLE001
                return False

        with ThreadPoolExecutor(max_workers=W) as ex:
            wres = list(ex.map(writer, range(W)))
        wrate = sum(wres) / W
        p.metrics["write_contention"] = {"workers": W, "success": sum(wres), "rate": round(wrate, 3)}
        p.add(f"write contention {sum(wres)}/{W} reached active",
              wrate >= PASS_CRITERIA["write_contention_success_rate_min"],
              str(p.metrics["write_contention"]))

        # 4d parallel full lifecycles (incl. negotiation)
        L = 6

        def full_lifecycle(_i: int) -> bool:
            try:
                buyer, seller = rand_addr(), rand_addr()
                did = self._create_deal(buyer)
                self.call("POST", f"/deal/{did}/accept", json={"seller_wallet": seller})
                s, b, _ = self.call("POST", "/start-negotiation", json={"deal_id": did})
                if s != 200:
                    return False
                self.call("POST", f"/deal/{did}/approve", json={"role": "buyer"})
                self.call("POST", f"/deal/{did}/approve", json={"role": "seller"})
                self.call("POST", f"/deal/{did}/fund", json={"txid": "l-" + did[:8]})
                self.call("POST", f"/deal/{did}/onchain-accept", json={"role": "buyer", "txid": "l2-" + did[:8]})
                s, b, _ = self.call("GET", f"/deal/{did}")
                ms = (b["data"].get("result") or {}).get("milestones") or []
                for i in range(len(ms)):
                    s, _, _ = self.call("POST", f"/deal/{did}/release",
                                        json={"milestone_index": i, "txid": f"lr-{i}-{did[:8]}"})
                    if s != 200:
                        return False
                s, b, _ = self.call("POST", f"/deal/{did}/complete")
                return s == 200 and b.get("status") == "Completed"
            except Exception:  # noqa: BLE001
                return False

        with ThreadPoolExecutor(max_workers=L) as ex:
            lres = list(ex.map(full_lifecycle, range(L)))
        lrate = sum(lres) / L
        p.metrics["parallel_lifecycle"] = {"workers": L, "completed": sum(lres), "rate": round(lrate, 3)}
        p.add(f"parallel lifecycles {sum(lres)}/{L} -> Completed",
              lrate >= PASS_CRITERIA["parallel_lifecycle_success_rate_min"],
              str(p.metrics["parallel_lifecycle"]))

        self.phases.append(p)
        return p

    # -- phase 5: ramp ------------------------------------------------------
    def phase_ramp(self) -> Phase:
        p = Phase("RAMP")
        print("\n== PHASE 5: SUSTAINED RAMP ==")
        seed_ids = [self._create_deal(rand_addr()) for _ in range(5)]
        waves = []
        for conc in (10, 25, 50):
            DURATION = 10
            stop_at = time.perf_counter() + DURATION
            lat_ms: list[float] = []
            errors = 0
            count = 0

            def mixed() -> None:
                nonlocal errors, count
                while time.perf_counter() < stop_at:
                    r = random.random()
                    if r < 0.30:
                        s, _, d = self.call("POST", "/create-deal", json={
                            "budget": 800, "min_price": 300, "deadline": "2026-12-31",
                            "description": "ramp", "buyer_wallet": rand_addr()})
                    elif r < 0.55:
                        s, _, d = self.call("GET", "/deals")
                    elif r < 0.80:
                        s, _, d = self.call("GET", f"/deal/{random.choice(seed_ids)}")
                    elif r < 0.92:
                        s, _, d = self.call("GET", f"/wallet-state/{random.choice(STELLAR_ADDRS)}")
                    else:
                        s, _, d = self.call("POST", f"/deal/{random.choice(seed_ids)}/approve",
                                            json={"role": "buyer"})
                    lat_ms.append(d)
                    count += 1
                    if s != 200:
                        errors += 1

            with ThreadPoolExecutor(max_workers=conc) as ex:
                for f in [ex.submit(mixed) for _ in range(conc)]:
                    f.result()
            lat_ms.sort()
            wave = {
                "concurrency": conc, "requests": count, "errors": errors,
                "error_rate": round(errors / max(count, 1), 4),
                "rps": round(count / DURATION, 1),
                "p95_ms": round(lat_ms[int(len(lat_ms) * 0.95)], 1) if lat_ms else 0,
            }
            waves.append(wave)
            p.add(f"ramp @ {conc} clients: {wave['rps']} rps, err {wave['error_rate']:.2%}, p95 {wave['p95_ms']}ms",
                  wave["error_rate"] <= PASS_CRITERIA["ramp_error_rate_max"], str(wave))
        p.metrics["waves"] = waves
        self.phases.append(p)
        return p

    # -- run all ------------------------------------------------------------
    def run(self) -> dict[str, Any]:
        start = time.time()
        self.phase_smoke()
        self.phase_lifecycle()
        self.phase_edge()
        self.phase_concurrency()
        self.phase_ramp()

        db_ok = self.db_locked_hits == PASS_CRITERIA["db_locked_occurrences"]
        print("\n== DB LOCK CHECK ==")
        print(f"    [{'PASS' if db_ok else 'FAIL'}] 'database is locked' seen {self.db_locked_hits}x")

        phases_pass = all(p.passed for p in self.phases)
        overall = phases_pass and db_ok

        report = {
            "base_url": self.base,
            "duration_secs": round(time.time() - start, 1),
            "overall": "PASS" if overall else "FAIL",
            "db_locked_occurrences": self.db_locked_hits,
            "pass_criteria": PASS_CRITERIA,
            "phases": [
                {
                    "name": p.name,
                    "passed": p.passed,
                    "checks": [{"name": c.name, "ok": c.ok, "detail": c.detail} for c in p.checks],
                    "metrics": p.metrics,
                }
                for p in self.phases
            ],
        }
        return report


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="http://127.0.0.1:8010")
    ap.add_argument("--out", default="scripts/stress_results.json")
    args = ap.parse_args()

    print(f"A2A Protocol stress test -> {args.base_url}")
    h = Harness(args.base_url)
    # wait for server
    for _ in range(30):
        s, _, _ = h.call("GET", "/")
        if s == 200:
            break
        time.sleep(0.5)
    else:
        print("ERROR: server not reachable", file=sys.stderr)
        return 2

    report = h.run()
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2)

    print("\n" + "=" * 60)
    for p in report["phases"]:
        n_ok = sum(1 for c in p["checks"] if c["ok"])
        print(f"  {p['name']:<13} {'PASS' if p['passed'] else 'FAIL'}  ({n_ok}/{len(p['checks'])} checks)")
    print(f"\n  OVERALL: {report['overall']}   ({report['duration_secs']}s, "
          f"db-locked {report['db_locked_occurrences']}x)")
    print(f"  results -> {args.out}")
    print("=" * 60)
    return 0 if report["overall"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
