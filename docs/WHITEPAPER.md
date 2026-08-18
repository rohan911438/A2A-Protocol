# A2A Protocol — Whitepaper v1.0

**The Infrastructure Layer for Autonomous Agent Commerce**

*June 2026 · Stellar Ecosystem · Built by Team Brotherhood*

---

## Abstract

A2A Protocol is a decentralized infrastructure layer that enables AI agents to negotiate, transact, and settle economic agreements without human intermediation. By combining LLM-driven autonomous negotiation, Soroban-based escrow smart contracts, and x402-style payment gating on the Stellar network, A2A Protocol creates a trustless execution environment for agent-to-agent commerce. This paper describes the protocol design, technical architecture, token utility model, and roadmap for building a self-sustaining agent economy.

---

## 1. Introduction

### 1.1 The Emerging Agent Economy

AI systems are rapidly evolving from passive tools into active participants capable of reasoning, planning, and executing multi-step workflows. However, a fundamental gap remains: while agents can simulate economic decisions, they cannot yet *participate* in real economic transactions with trustless settlement guarantees.

This creates three structural problems:

1. **Payment risk** — buyers cannot safely fund work before delivery.
2. **Negotiation friction** — human back-and-forth slows deal formation even when counterparties have compatible terms.
3. **Settlement opacity** — completion verification relies on trust, not verifiable on-chain state.

### 1.2 The A2A Solution

A2A Protocol resolves these problems by providing a protocol stack where:

- Buyer and seller agents negotiate autonomously using LLM-driven reasoning bounded by rule-based constraints.
- Agreed terms are locked in a Soroban smart contract on Stellar, with funds held in escrow.
- A verifier agent confirms delivery against predefined conditions before releasing payment.
- Every critical action is gated by x402-style payment authorization to ensure participants have committed economic stake.

---

## 2. Problem Statement

### 2.1 Agents Cannot Participate in the Economy

Today's agent frameworks (LangChain, AutoGPT, Claude Agents, etc.) can plan and reason but have no native ability to:
- Enter binding agreements with counterparties
- Lock payment securely until deliverables are confirmed
- Resolve disputes without human intervention
- Operate transparently enough to be trusted by counterparties

### 2.2 Existing Solutions Fall Short

| Gap | Traditional Marketplace | Generic AI Agent | A2A Protocol |
|---|---|---|---|
| Negotiation | Human messaging | Advisory drafts | Autonomous agent convergence |
| Payment security | Platform-mediated escrow | No native payment | Soroban on-chain escrow |
| Completion verification | Human review | Best-effort reasoning | Verifier agent + on-chain state |
| Auditability | Fragmented records | Minimal traceability | Structured reasoning logs + on-chain events |
| Economic agency | Human-only | None | Agents are first-class economic actors |

### 2.3 Market Opportunity

The autonomous AI agent market is projected to exceed $28 billion by 2028 (MarketsandMarkets). A significant portion of this value creation requires programmable economic settlement — a category that does not yet have a dominant protocol layer. A2A Protocol is designed to become that layer for the Stellar ecosystem and beyond.

---

## 3. Protocol Architecture

### 3.1 Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTENT LAYER                     │
│         React UI · Wallet Connect · Deal Builder         │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   COORDINATION LAYER                     │
│        FastAPI Backend · Deal State · x402 Gate          │
└──────┬─────────────────┬────────────────────────────────┘
       │                 │
┌──────▼──────┐   ┌──────▼──────────────────────────────┐
│  AGENT LAYER │   │           INTELLIGENCE LAYER         │
│ Buyer Agent  │   │  Negotiation Engine · LLM (Gemini)   │
│ Seller Agent │   │  Strategy Bounds · Reasoning Logs    │
│ Verifier     │   └─────────────────────────────────────┘
└──────┬──────┘
       │
┌──────▼──────────────────────────────────────────────────┐
│                    TRUST LAYER                           │
│   Soroban Escrow Contract · Milestone Release · Refund   │
│   Stellar Testnet · XLM / Protocol Token                 │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Component Descriptions

**User Intent Layer**
Users submit tasks with budget, deadline, minimum price, and description. The frontend accepts Freighter and Rabet wallet connections and provides real-time visibility into deal state.

**Coordination Layer**
The FastAPI backend manages the full deal lifecycle: creation, negotiation dispatch, approval tracking, on-chain acceptance recording, and x402 payment verification. All deal state is persisted in SQLite with JSON-structured records keyed by deal ID.

**Agent Layer**
Three agent types operate in the protocol:
- *Buyer Agent*: represents demand; starts below budget and increases offers under deadline pressure.
- *Seller Agent*: represents supply; starts above minimum price and decreases counter-offers based on reputation and urgency signals.
- *Verifier Agent*: validates that delivery conditions are met before authorizing escrow release.

**Intelligence Layer**
The Negotiation Engine orchestrates agents using Gemini LLM calls for natural-language reasoning generation, combined with rule-based offer bounds to prevent runaway LLM behavior. Each negotiation round produces a structured reasoning entry capturing price adjustment rationale, deadline constraints, reputation signals, and risk level.

**Trust Layer**
The Soroban escrow contract (`A2AEscrow`) holds funds and enforces the following guarantees:
- Funds can only be released by the designated verifier.
- Milestones are released one at a time, requiring sequential verifier authorization.
- If the deadline passes without completion, the buyer can claim a full refund.
- All state transitions emit on-chain events for external auditability.

### 3.3 Deal Lifecycle

```
CREATE DEAL
     │
     ▼
NEGOTIATE (agents converge on price)
     │
     ▼
APPROVE (buyer + seller off-chain approval)
     │
     ▼
ON-CHAIN ACCEPT (both parties record txid)
     │
     ▼
FUND ESCROW (buyer deposits to Soroban contract)
     │
     ▼
ACTIVE (work in progress)
     │
     ▼
VERIFIER CONFIRMS DELIVERY
     │
     ├──► RELEASE MILESTONE(S) → seller receives payment
     │
     └──► DEADLINE MISSED → buyer requests refund
```

---

## 4. Technology Stack

| Component | Technology | Rationale |
|---|---|---|
| Smart Contract | Rust + Soroban SDK 20 | Native Stellar VM, deterministic execution, no EVM gas races |
| Backend | Python 3.11 + FastAPI | Async-native, Pydantic validation, automatic OpenAPI |
| AI Engine | Google Gemini via `google-generativeai` | Best-in-class reasoning for negotiation prompt chains |
| Frontend | React 18 + Vite + Tailwind CSS | Fast builds, composable UI, wallet-aware state management |
| Wallet Integration | Freighter, Rabet | Leading Stellar browser wallets |
| Database | SQLite + JSON deal state | Zero-dependency persistence; upgrade path to PostgreSQL |
| CI/CD | GitHub Actions | Automated syntax check, frontend build, deploy trigger |
| Hosting | Netlify (frontend) + Render (backend) | Free-tier viable for hackathon/incubator phase |

---

## 5. Smart Contract Specification

### 5.1 Contract: A2AEscrow

**Deployed address (Testnet):** `CDKOZ25IENHQFRRNTJDXAYAOUSDBPUXLE52UGTNIPWACAMGAMNXMYTQU`

**Functions:**

| Function | Caller | Effect |
|---|---|---|
| `initialize(admin, token)` | Admin | Sets admin and accepted token (XLM or USDC) |
| `create_deal(deal_id, buyer, seller, verifier, total_amount, milestones, deadline)` | Buyer | Locks funds in escrow, emits `deal_new` event |
| `release_milestone(deal_id, milestone_idx)` | Verifier | Transfers milestone amount to seller |
| `complete_deal(deal_id)` | Verifier | Releases all remaining funds to seller |
| `request_refund(deal_id)` | Buyer | Refunds buyer after deadline passes |
| `get_deal(deal_id)` | Anyone | Returns current deal state |

**Security properties:**
- Buyer authorization is required to create a deal (`buyer.require_auth()`).
- Verifier authorization is required for all release and completion operations.
- Milestone amounts must sum exactly to `total_amount` (enforced at creation).
- Refunds are only possible after `deadline` timestamp passes.
- Double-release is blocked per milestone (`MilestoneAlreadyReleased` error).

### 5.2 Error Codes

| Code | Meaning |
|---|---|
| 1 | Contract not initialized |
| 2 | Deal ID already exists |
| 3 | Deal not found |
| 4 | Caller not authorized |
| 5 | Invalid amount (milestones don't sum to total) |
| 6 | Deadline not reached (for refund) |
| 7 | Deadline already passed |
| 8 | Invalid milestone index |
| 9 | Milestone already released |
| 10 | Deal already completed or refunded |

---

## 6. x402 Payment Authorization

x402 is an emerging HTTP payment standard inspired by the HTTP 402 status code. In A2A Protocol, x402-style authorization gates sensitive protocol actions behind a micro-payment confirmation, creating an economic commitment layer that discourages spam and generates protocol revenue.

### 6.1 Gated Actions

| Action | Purpose Key | Fee (XLM) |
|---|---|---|
| Escrow creation | `escrow_authorization_fee` | 0.01 |
| Payment release | `payment_release_fee` | 0.01 |
| Deal completion | `deal_completion_fee` | 0.01 |
| Audit export | `audit_export_fee` | 0.01 |

### 6.2 Authorization Flow

1. Client calls a gated endpoint.
2. Backend checks for a verified x402 event for the wallet + deal + purpose triple.
3. If not found, returns HTTP 402 with payment instructions.
4. Client submits a Stellar payment transaction.
5. Client submits the tx hash to `/deal/{id}/x402-payment`.
6. Backend verifies the tx exists on-chain via Horizon.
7. On verification, the event is stored and the original action proceeds.

*In `simulate` mode (default for demos), all gates pass automatically. Set `X402_MODE=enforce` for production behavior.*

---

## 7. Token Model — A2AT (A2A Protocol Token) — Proposed, Not Yet Implemented

### 7.1 Token Overview

The A2A Protocol Token (A2AT) is a **proposed** design for a Soroban-native token that would serve as the coordination and governance asset of the A2A Protocol ecosystem. It has not been built or deployed: there is no functioning A2AT contract, and the rest of this document's protocol description (negotiation, escrow, x402 gating) does not depend on or reference it anywhere. Section 7 is roadmap/design material, not a description of a shipped component - see the Roadmap section for its actual status (planned, alongside HACD Launchpad launch).

### 7.2 Proposed Utility

| Utility | Description |
|---|---|
| **Protocol fee discount** | Deals settled using A2AT would receive a discount on x402 fees vs. XLM-only deals |
| **Verifier staking** | Verifier agents would stake A2AT to participate; stake slashed on fraudulent completions |
| **Governance voting** | A2AT holders would vote on protocol parameter changes (fee schedule, new agent types, contract upgrades) |
| **Agent reputation bonding** | Sellers would bond A2AT to signal quality; higher bond = higher reputation score in the negotiation engine |
| **Developer grants** | A community treasury would distribute A2AT grants to developers building integrations |
| **Premium features** | Advanced analytics, multi-agent deal rooms, and API access beyond the free tier |

### 7.3 Proposed Supply and Distribution

**Proposed total supply: 100,000,000 A2AT**

| Allocation | % | Tokens | Vesting |
|---|---|---|---|
| Community ecosystem | 35% | 35,000,000 | 4-year linear, no cliff |
| Team & contributors | 20% | 20,000,000 | 1-year cliff, 3-year linear |
| Treasury | 20% | 20,000,000 | DAO-controlled release |
| Launchpad (HACD Treasale) | 10% | 10,000,000 | Per HACD schedule |
| Developer grants | 8% | 8,000,000 | Milestone-gated, 2-year |
| Liquidity provision | 5% | 5,000,000 | Locked 1 year, then LP |
| Advisors | 2% | 2,000,000 | 6-month cliff, 2-year linear |

### 7.4 Demand Drivers

1. **Deal volume** — every deal created on the protocol would generate fee revenue denominated in A2AT.
2. **Verifier staking** — as more verifiers participate, staking demand would increase.
3. **Governance participation** — protocol decisions would require A2AT to vote, creating a holding incentive.
4. **Reputation bonding** — sellers competing for high-value deals would bond more A2AT, reducing circulating supply.
5. **Fee buyback** — a share of protocol fee revenue would buy A2AT from the open market and add it to treasury.

### 7.5 Proposed Value Accrual

Protocol fees (x402 micro-payments) would accrue to the treasury, with the DAO voting on:
- Buy-and-burn schedule
- Staking reward rate
- Grant disbursement

As deal volume grows, fee revenue would grow proportionally, creating a direct link between protocol usage and A2AT demand.

---

## 8. Governance (Proposed)

### 8.1 Proposed Governance Model

A2A Protocol's proposed governance model would run on-chain, powered by A2AT staking.

**Proposal types:**
- Parameter changes (fee rates, staking minimums, verifier requirements)
- Contract upgrades (new escrow logic, new agent types)
- Treasury disbursements (grants, liquidity programs)
- Protocol integrations (new chain support, new wallet support)

**Voting mechanics:**
- 1 staked A2AT = 1 vote
- Quorum: 5% of circulating supply
- Approval threshold: 60% supermajority for contract upgrades; 51% for parameter changes
- Voting period: 7 days
- Execution delay: 48 hours after passage

### 8.2 Multisig Bootstrap Phase

Until the DAO reaches sufficient token distribution, a 3-of-5 multisig controlled by the founding team and 4 community representatives holds admin keys. This transitions to full DAO control at 1 year post-launch or when 20% of supply is distributed to community, whichever comes first.

---

## 9. Roadmap

### Phase 1 — Protocol Foundation (Current)
- ✅ Soroban escrow contract deployed on testnet
- ✅ LLM-driven autonomous negotiation engine
- ✅ x402 payment gating implementation
- ✅ Milestone-based escrow release
- ✅ Verifier agent pattern
- ✅ Smart Deal Summary with risk scoring
- ✅ Live deployment (Netlify + Render)
- ✅ Real testnet user feedback incorporated

### Phase 2 — Agent Economy Expansion (Q3 2026)
- Multi-seller competitive bidding (auction mode)
- Reputation system anchored to A2AT staking
- Agent SDK for external developers to plug in custom agents
- Mainnet contract deployment
- A2AT token launch on HACD Launchpad

### Phase 3 — Protocol Interoperability (Q4 2026)
- Cross-chain escrow via Stellar bridge assets (USDC, wBTC)
- REST API for external marketplace integrations
- Agent identity using Stellar Passkeys or Decentralized IDs
- Multi-milestone streaming payments

### Phase 4 — Autonomous Economy Infrastructure (2027)
- Machine-to-machine deal initiation (no human UI required)
- Recurring deal subscriptions
- Agent-operated DAOs using A2A Protocol as settlement layer
- Governance-controlled agent policy updates

---

## 10. Security

### 10.1 Smart Contract Security

- No admin key can extract user funds from escrow — only verifier can release to seller, only buyer can refund to themselves.
- Milestone validation prevents over-release: amounts must sum to total at creation.
- Deadline enforcement is based on `env.ledger().timestamp()` — not manipulable by off-chain parties.
- Re-entrancy: Soroban's execution model does not support re-entrant calls.

### 10.2 Off-Chain Security

- Private keys never leave the user's wallet extension (Freighter/Rabet).
- Backend never holds user funds or signing authority.
- All wallet addresses are validated against Stellar account format before being processed.
- x402 tx hashes are verified via Horizon API before being treated as authorized.

### 10.3 Known Limitations (Testnet)

- SQLite database is not persistent on Render free tier between deploys.
- x402 is in `simulate` mode by default — production deployment requires `X402_MODE=enforce`.
- Soroban contract is deployed on Stellar Testnet, not Mainnet.
- LLM negotiation depends on Gemini API availability and rate limits.

### 10.4 Responsible Disclosure

Security vulnerabilities should be reported to the team via GitHub Issues with the label `security`. Do not post exploit details publicly until a patch is available.

---

## 11. Risk Disclosures

| Risk | Likelihood | Mitigation |
|---|---|---|
| Gemini API rate limit during negotiation | Medium | Retry logic; fallback to rule-based negotiation |
| Stellar testnet instability | Low | Horizon error handling; testnet faucet dependency |
| LLM output malformed (no valid price) | Medium | Rule-based price bounds enforce valid range regardless of LLM output |
| SQLite data loss on Render restart | Medium | Export deal state; upgrade path to persistent PostgreSQL |
| Verifier collusion (off-chain) | Low | Future: multi-verifier quorum requirement |
| Smart contract exploit | Very Low | Soroban auth model prevents unauthorized fund access |
| Regulatory risk on token | Medium | Token is utility-only; not marketed as investment |

---

## 12. Team

**Team Brotherhood**

- **Rohan Kumar** — Founder, full-stack engineer. Built backend, frontend, smart contract integration, negotiation engine, and deployment infrastructure. GitHub: [@rohan911438](https://github.com/rohan911438)

---

## 13. Conclusion

A2A Protocol demonstrates that the infrastructure for agent-to-agent commerce is buildable today on Stellar. The combination of LLM-driven negotiation, Soroban escrow, and x402 payment authorization creates a complete economic execution environment for autonomous agents.

The next phase — protocol token launch, reputation staking, and open agent SDK — will transform A2A Protocol from a working demonstration into a production-grade infrastructure layer for the emerging autonomous agent economy.

---

*This document is provided for informational purposes. Nothing in this document constitutes an offer to sell or a solicitation to buy any financial instrument. A2AT tokens are utility tokens that enable participation in the A2A Protocol ecosystem.*
