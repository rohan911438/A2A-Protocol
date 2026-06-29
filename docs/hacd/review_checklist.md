# Review Checklist — A2AT Launch Package

**HACD AI Issuance Skill — Document 8 of 8**  
**Date:** 2026-06-29

Complete this checklist before submitting to HACD Labs. Each item must be checked by the issuer.

---

## Category 1 — Math & Supply Logic

- [x] `total_supply = total_hacd_lots × units_per_hacd_lot` verified: `100 × 1,000,000 = 100,000,000` ✓
- [x] All three values (100, 1,000,000, 100,000,000) are identical across all 8 documents
- [x] Lot allocation sums check: `35+20+20+10+8+5+2 = 100 lots` ✓
- [x] Phase allocation sums check: `90 + 10 = 100 lots` ✓
- [x] A2AT per phase sums check: `90,000,000 + 10,000,000 = 100,000,000` ✓
- [x] Formation cost reference calculation shown: `100 × 50 HAC = 5,000 HAC` ✓
- [x] No null or zero values where real numbers belong
- [ ] **ISSUER ACTION:** Confirm supply numbers before signing off

---

## Category 2 — Unsafe Copy

- [x] No instances of "guaranteed" in any document
- [x] No instances of "floor price" in any document
- [x] No instances of "risk-free" in any document
- [x] No instances of "moon" in any document
- [x] No instances of "ROI" in any document
- [x] No instances of "yield" in any document
- [x] No instances of "profit" in any document
- [x] No instances of "Nx returns" or similar in any document
- [x] No instances of "backed value" in any document
- [x] Stack cost described only as "formation cost reference" throughout
- [x] Risk disclosure present in: `launchpad_copy.md`, `stack_design.md`, `issuer_faq.md`, `launch_spec.json`
- [x] "Not financial advice" statement present in all public-facing documents
- [ ] **ISSUER ACTION:** Final read of all 8 documents before posting anything publicly

---

## Category 3 — Utility Honesty

- [x] Only one utility (fee discount) is described as live
- [x] All five planned utilities use conditional language: "planned", "depends on continued development"
- [x] No future utility described as if already implemented
- [x] On-chain verification of token contract is possible: stellar.expert link provided
- [x] Escrow contract is verifiable on-chain: stellar.expert link provided
- [ ] **ISSUER ACTION:** Confirm fee discount pathway is technically wired before claiming it as live utility

---

## Category 4 — Missing Fields

- [x] `launch_spec.json` — all required sections present: `project`, `asset`, `stack`, `launch`, `copy`, `review`
- [x] `project.website` populated with live URL
- [x] `project.github` populated with live URL
- [x] `project.contact` populated (issuer email)
- [x] `asset.type` set to valid enum value: `FT`
- [x] `asset.total_supply` populated: `100000000`
- [x] `stack.total_hacd_lots` populated: `100`
- [x] `stack.units_per_hacd_lot` populated: `1000000`
- [x] `stack.removal_effect` set to valid enum: `burn`
- [x] `launch.status` set: `draft`
- [x] `review.supply_math_verified` set: `true`
- [x] `review.prohibited_language_check` set: `passed`
- [ ] **ISSUER ACTION:** Set `review.issuer_confirmed: true` after final review
- [ ] **ISSUER ACTION:** Update `launch.launchpad_url` with final assigned Launchpad URL when available
- [ ] **ISSUER ACTION:** Update `launch.status` from `draft` to `submitted` when filing

---

## Category 5 — Structural Problems

- [x] Participant flow in `stack_design.md` matches phase model in `launch_spec.json`
- [x] Per-participant lot limit consistent: 1 lot in `stack_design.md` and `launch_spec.json`
- [x] FAQ addresses relevant participant questions (not generic filler)
- [x] X announcements contain no price predictions or listing promises
- [x] X announcements contain "Not financial advice" statement
- [x] All 8 required documents present:
  - [x] `incubator_fit_review.md`
  - [x] `project_profile.md`
  - [x] `stack_design.md`
  - [x] `launch_spec.json`
  - [x] `launchpad_copy.md`
  - [x] `issuer_faq.md`
  - [x] `x_announcement.md`
  - [x] `review_checklist.md`
- [ ] **ISSUER ACTION:** Run `validate_launch_spec.py` from the HACD AI Issuance Skill repo against `launch_spec.json`

---

## Category 6 — HACD Terminology

- [x] HACD is not called "diamond" anywhere
- [x] Stacking is not described as simply "minting"
- [x] Stack cost is not described as establishing a guaranteed price
- [x] HAC and HACD are kept distinct throughout
- [x] Formation cost described as "formation cost reference" or "on-chain formation cost" — not "backing"

---

## Pre-Submission Final Actions (Issuer)

- [ ] Read all 8 documents in full
- [ ] Confirm all supply numbers match your intent
- [ ] Confirm fee discount utility is technically wired in the protocol
- [ ] Set `review.issuer_confirmed: true` in `launch_spec.json`
- [ ] Run validator script from HACD AI Issuance Skill repo
- [ ] Submit to HACD Labs at https://hacd.it/incubator
- [ ] Acquire sufficient HAC: at least ~5,010 HAC (5,000 formation + ~10 fee buffer)
- [ ] Acquire or confirm access to 100 HACD for Stack formation
- [ ] After Launchpad configuration: test public phase flow with one lot before announcing

---

## Roast Summary (Self-Review Findings)

| Finding | Category | Severity | Status |
| :--- | :--- | :--- | :--- |
| Five utilities not yet live | Utility Honesty | Warning | Disclosed correctly as "planned" |
| x402 in simulate mode | Utility Honesty | Warning | Disclosed in risk section |
| No formal smart contract audit | Missing Fields | Warning | Disclosed in risk section |
| SQLite not persistent on Render | Missing Fields | Warning | Disclosed in known limitations |
| Stellar contracts on Testnet only | Missing Fields | Warning | Disclosed throughout |

**Blockers found: 0**  
**Warnings found: 5 — all disclosed and handled**

---

*This checklist must be completed by the issuer before submitting to HACD Labs. Checkboxes marked [x] were verified by the HACD AI Issuance Skill. Checkboxes marked [ ] require issuer action.*
