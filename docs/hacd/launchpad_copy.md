# Launchpad Copy — A2AT (A2A Protocol Token)

**HACD AI Issuance Skill — Document 5 of 8**  
**Date:** 2026-06-29

---

## Headline

**A2AT — The coordination token for autonomous agent commerce**

## Subheadline

AI agents that negotiate, transact, and settle on-chain. Built on Stellar. Launched on HACD.

---

## Short Description (Launchpad listing — 280 characters)

A2A Protocol gives AI agents the infrastructure to participate in the economy: autonomous negotiation, Soroban escrow, and x402 payment gating - live on Stellar Testnet today. A2AT is the proposed coordination token for staking, discounts, and governance, submitted for this Launchpad.

---

## Full Launchpad Description

A2A Protocol is a decentralized infrastructure layer that closes the gap between AI capability and economic participation. Today's agents can reason and plan — but they cannot safely negotiate, hold funds, or settle agreements without human intermediation. A2A Protocol changes that.

**How it works:**

A user defines a task. A buyer agent and a seller agent negotiate autonomously using LLM-driven reasoning (Google Gemini) bounded by rule-based price constraints. When terms converge, funds are locked in a Soroban escrow contract on Stellar. A verifier agent confirms delivery. Payment releases automatically — transparent, auditable, and trustless.

**What is already live:**

- Soroban escrow contract deployed on Stellar Testnet
- Full-stack frontend and backend live and accessible
- LLM negotiation engine with real Gemini API integration
- x402 micro-payment gating (simulate mode for demos; enforce mode available)
- Smart Deal Summary with risk scoring and explainable reasoning logs
- 8 real testnet users — feedback documented and incorporated
- CI/CD pipeline passing on GitHub Actions

**What A2AT does:**

A2AT is the protocol's coordination token. It is not a payment asset — XLM handles settlement. A2AT aligns incentives across the protocol:

- **Fee discount** *(planned)* — Deals settled using A2AT would receive a reduced x402 fee rate, subject to governance.
- **Verifier staking** *(planned)* — Verifier agents stake A2AT to participate; dishonest completions result in stake reduction.
- **Governance** *(planned)* — A2AT stakers vote on fee schedules, contract upgrades, and treasury allocations.
- **Reputation bonding** *(planned)* — Sellers bond A2AT to raise their negotiation engine reputation score.
- **Developer grants** *(planned)* — Treasury distributes A2AT to teams building integrations and tools.
- **Premium features** *(planned)* — Advanced analytics and API access tiers.

**Stack details:**

- Total supply: 100,000,000 A2AT
- HACD lots: 100 (1,000,000 A2AT per lot)
- Formation cost reference: 50 HAC per HACD lot
- Public phase: 10 lots (10,000,000 A2AT) via HACD Launchpad
- Per-participant lot limit: 1

---

## Token Distribution Summary (for Launchpad display)

| Allocation | % | A2AT |
| :--- | :--- | :--- |
| Community ecosystem | 35% | 35,000,000 |
| Team & contributors | 20% | 20,000,000 |
| Treasury | 20% | 20,000,000 |
| HACD Launchpad (public) | 10% | 10,000,000 |
| Developer grants | 8% | 8,000,000 |
| Liquidity provision | 5% | 5,000,000 |
| Advisors | 2% | 2,000,000 |
| **Total** | **100%** | **100,000,000** |

---

## Links

| Resource | URL |
| :--- | :--- |
| Live Frontend | https://a2aprotocol.netlify.app/ |
| Backend API | https://a2a-protocol-rn62.onrender.com |
| GitHub | https://github.com/rohan911438/A2A-Protocol |
| Demo Video | https://youtu.be/3KrVJvXWhu8 |
| Whitepaper | https://github.com/rohan911438/A2A-Protocol/blob/main/docs/WHITEPAPER.md |
| Escrow Contract | https://stellar.expert/explorer/testnet/contract/CBCG25INND2P3BVBBRT44XJHSGDKAMUNEAVWUMI7J2TCIBMJVBNIZ2NU |
| Token Contract | Not deployed - A2AT is a proposed design, see Risk Disclosure below |

---

## Risk Disclosure (mandatory — must appear on all public-facing pages)

> A2AT is a proposed utility token design for participation in the A2A Protocol ecosystem; no A2AT contract has been deployed. Acquiring or holding A2AT does not constitute an investment and does not entitle the holder to any financial return. The formation cost reference reflects the on-chain resources committed to this launch and does not imply any price floor or redemption value for A2AT tokens. The escrow contract is currently deployed on Stellar Testnet; mainnet deployment is planned but not yet complete. All six planned A2AT utilities are unimplemented design proposals. Token utility depends on continued protocol development. Stack cost (HAC) is non-refundable upon Stack removal. This is not financial advice. Past on-chain activity does not indicate future results.

---

*Not financial advice. This document is a draft for issuer review under the HACD AI Issuance Skill workflow.*
