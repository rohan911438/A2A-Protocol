# Project Profile — A2A Protocol

**HACD AI Issuance Skill — Document 2 of 8**  
**Date:** 2026-06-29

---

## Identity

| Field | Value |
| :--- | :--- |
| Project name | A2A Protocol |
| Token ticker | A2AT |
| Tagline | The infrastructure layer for autonomous agent commerce |
| Category | AI Agent / DeFi Infrastructure |
| Team | Brotherhood |
| Founder | Rohan Kumar |
| GitHub | https://github.com/rohan911438/A2A-Protocol |
| Frontend | https://a2aprotocol.netlify.app/ |
| Backend API | https://a2a-protocol-rn62.onrender.com |
| Demo video | https://youtu.be/3KrVJvXWhu8 |
| Network | Stellar Testnet (Mainnet planned Phase 2) |

---

## What the Project Does

A2A Protocol is a decentralized infrastructure layer that enables AI agents to negotiate, authorize payment, and settle work agreements on-chain without human intermediation.

Users define a task. The protocol handles the rest:
- A **buyer agent** and **seller agent** negotiate autonomously using LLM reasoning (Google Gemini) bounded by rule-based price constraints.
- Agreed terms are locked in a **Soroban escrow smart contract** on Stellar.
- A **verifier agent** confirms delivery conditions before any funds are released.
- Every negotiation round generates a structured **reasoning log** — explainable, auditable, and human-readable.

The protocol introduces **x402-style payment gating**: sensitive actions (escrow creation, milestone release, completion, audit export) require micro-payment authorization, creating economic commitment at each step.

---

## What Is Built and Deployed

| Component | Status | Details |
| :--- | :--- | :--- |
| Soroban escrow contract | Live (Testnet) | `CBCG25I...Z2NU` |
| Token contract (A2AT) | Proposed, not yet implemented | No token contract is deployed; `CB5YMK...EFTI` exists on Testnet but has no working token interface and is referenced by no backend/frontend code |
| FastAPI backend | Live | Render deployment |
| React/Vite frontend | Live | Netlify deployment |
| LLM negotiation engine | Live | Google Gemini integration |
| x402 payment gating | Live (simulate mode) | Enforce mode available |
| CI/CD pipeline | Passing | GitHub Actions |
| Testnet users | 8 | Feedback documented and incorporated |

---

## Tech Stack

- **Smart Contract:** Rust, Soroban SDK 20
- **Backend:** Python 3.11, FastAPI, Pydantic v2
- **AI Engine:** Google Gemini (`google-generativeai`)
- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion
- **Wallets:** Freighter, Rabet
- **Database:** SQLite + JSON deal state
- **CI/CD:** GitHub Actions

---

## Why A2AT on HACD

HACD's Proof-of-Work asset formation provides the credibility layer that A2AT needs as a protocol coordination token. The formation cost reference creates a verifiable on-chain record of the resources committed to launching the protocol — a signal of seriousness that pure smart-contract token launches cannot replicate.

The HACD Launchpad provides direct access to the Stellar and Hacash communities: technically sophisticated users who understand on-chain value exchange and are ideal early participants in an agent commerce protocol.

The incubator's structure — documentation requirements, validator checks, community review — aligns with A2A Protocol's own commitment to transparency and auditability.

---

## Token Role in the Protocol

A2AT is proposed as the coordination and governance asset of the A2A Protocol ecosystem - none of this is implemented yet. It is not a payment token (XLM serves that role). Its proposed function is to align incentives across protocol participants:

- Verifiers would stake A2AT to participate, creating skin-in-the-game for honest completion verification.
- Sellers would bond A2AT to signal quality, raising their reputation score in the negotiation engine.
- Fee discounts denominated in A2AT would create adoption pressure and holding incentive.
- Governance via A2AT staking would let the protocol evolve according to community consensus.

---

*Not financial advice. This document is a draft for issuer review under the HACD AI Issuance Skill workflow.*
