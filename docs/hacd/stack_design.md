# Stack Design — A2AT (A2A Protocol Token)

**HACD AI Issuance Skill — Document 3 of 8**  
**Date:** 2026-06-29

---

## Asset Overview

| Field | Value |
| :--- | :--- |
| Token name | A2A Protocol Token |
| Ticker | A2AT |
| Asset type | FT (Fungible Token) |
| Total supply | 100,000,000 A2AT |
| Decimals | 7 |
| Unit name | A2AT |

---

## Supply Mathematics

```
total_supply       = total_hacd_lots × units_per_hacd_lot
100,000,000 A2AT   =       100       ×      1,000,000

Verification:
100 × 1,000,000 = 100,000,000 ✓
```

All three numbers are locked. No document in this package uses different values.

---

## Formation Parameters

| Parameter | Value |
| :--- | :--- |
| Total HACD lots | 100 |
| Units per HACD lot | 1,000,000 A2AT |
| Stack cost (HAC per HACD) | 50 HAC |
| Total formation cost reference | 5,000 HAC (100 × 50) |
| Network fee buffer (estimated) | ~10 HAC |
| Total HAC required (reference) | ~5,010 HAC |

**Formation cost reference note:** The 50 HAC per HACD reflects the mid-tier formation band and signals genuine economic commitment to the launch. This is a formation cost reference only — it does not establish, imply, or guarantee any price for A2AT tokens. Stack cost is non-refundable upon removal.

---

## Lot Allocation

The 100 HACD lots map to the A2AT tokenomics distribution. Each lot produces exactly 1,000,000 A2AT:

| Allocation | HACD Lots | A2AT Produced | % | Vesting |
| :--- | :--- | :--- | :--- | :--- |
| Community ecosystem | 35 | 35,000,000 | 35% | 4-year linear, no cliff |
| Team & contributors | 20 | 20,000,000 | 20% | 1-year cliff, 3-year linear |
| Treasury | 20 | 20,000,000 | 20% | DAO-controlled release |
| HACD Launchpad (public) | 10 | 10,000,000 | 10% | Per HACD Launchpad schedule |
| Developer grants | 8 | 8,000,000 | 8% | Milestone-gated, 2-year |
| Liquidity provision | 5 | 5,000,000 | 5% | 1-year lock, then LP |
| Advisors | 2 | 2,000,000 | 2% | 6-month cliff, 2-year linear |
| **Total** | **100** | **100,000,000** | **100%** | — |

```
Lot allocation check: 35 + 20 + 20 + 10 + 8 + 5 + 2 = 100 ✓
Supply check:  100 × 1,000,000 = 100,000,000 ✓
```

---

## Phase Structure

### Phase 1 — Designated First (Issuer Formation)
- **HACD lots:** 90 (all non-public allocations)
- **A2AT produced:** 90,000,000
- **Purpose:** Protocol treasury, team, community pool, developer grants, liquidity, advisors
- **Participant:** Issuer (Rohan Kumar / Team Brotherhood)

### Phase 2 — Public Phase (HACD Launchpad)
- **HACD lots:** 10
- **A2AT produced:** 10,000,000
- **Participation:** Open to any HACD holder via the HACD Launchpad
- **Per-participant lot limit:** 1 (one lot per participant in public phase, subject to Launchpad configuration)
- **A2AT per lot:** 1,000,000

---

## Formation Rules

1. Each HACD lot produces exactly 1,000,000 A2AT — identical across all lots, no tiers.
2. Stack cost is 50 HAC per HACD — non-refundable upon Stack removal.
3. Removing a Stack releases the underlying HACD but destroys the A2AT tied to that lot.
4. No reserved addresses. No back-door allocations. Supply finality occurs when all 100 lots are formed.
5. Up to 200 HACD can be stacked per transaction on the Launchpad — the public phase (10 lots) fits within a single transaction.

---

## Participant Flow (Public Phase)

1. **Prepare** — Acquire at least 1 HACD and 50 HAC (formation cost reference) plus network fee buffer (~10 HAC).
2. **Connect** — Connect Hacash wallet at the HACD Launchpad.
3. **Select** — Choose 1 available A2AT lot from the public phase allocation.
4. **Form** — Confirm the formation transaction. Stack confirmation typically within ~5 minutes on mainnet.
5. **Verify** — Confirm receipt of 1,000,000 A2AT and verify on explorer.hacash.org.

---

## Removal / Burn Logic

If a participant removes their Stack:
- The underlying HACD is released back to the participant.
- The 1,000,000 A2AT from that lot are destroyed (burned).
- The 50 HAC stack cost is not returned.
- The lot becomes available for re-stacking if the issuer enables it.

---

## What A2AT Is Not

- A2AT is not a promise of financial return.
- The formation cost reference is not a price floor or guaranteed redemption value.
- A2AT stacking on HACD Launchpad is not an investment contract.
- Future utility (staking, governance, reputation bonding) is planned and depends on protocol development.

---

*Not financial advice. Stack cost is a formation cost reference only. This document is a draft for issuer review under the HACD AI Issuance Skill workflow.*
