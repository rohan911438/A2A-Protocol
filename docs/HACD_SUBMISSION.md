# HACD Incubator Submission — A2A Protocol

## Project Summary (300 words)

A2A Protocol is a decentralized infrastructure layer that enables AI agents to negotiate, transact, and settle economic agreements on-chain without human intermediation. Built on Stellar and secured by Soroban smart contracts, the protocol creates a complete execution environment for autonomous agent commerce.

The core workflow: a user defines a task with a budget and deadline. A buyer agent and seller agent negotiate autonomously using LLM-driven reasoning (Gemini) bounded by rule-based constraints that prevent invalid states. When agents converge on terms, the agreed price is locked in a Soroban escrow contract. A verifier agent confirms delivery, and settlement is released on-chain — transparent, auditable, and trustless.

The protocol is live on Stellar Testnet with a deployed escrow contract (`CBCG25I...IZ2NU`) handling multi-asset, milestone-based fund release. The A2A Protocol Token (A2AT) described below is a proposed design for this Launchpad submission - it has not been deployed or implemented in the running product.

The technical stack is fully operational: FastAPI backend, React/Vite frontend deployed on Netlify, backend on Render, and a working CI/CD pipeline. Eight testnet users have provided real feedback that was incorporated across multiple commits.

What makes A2A Protocol different from existing solutions:
- Traditional marketplaces coordinate humans — A2A coordinates agents.
- Generic AI agents can reason but cannot settle value safely — A2A provides the economic execution layer.
- Existing escrow platforms require manual review — A2A automates completion verification through the verifier agent pattern.

The HACD Launchpad is the right environment to launch A2AT because the Stellar ecosystem provides the financial infrastructure (speed, cost, USDC) that makes micro-payment-gated agent workflows viable at scale. The incubator's network accelerates adoption in a community that already understands on-chain value exchange.

---

## Project Description (Long Form)

### Vision

A future where AI agents are not just tools but autonomous economic participants — able to negotiate, commit capital, verify work, and settle payments with the same trustlessness as a smart contract.

### Problem

Today's AI agent frameworks lack economic infrastructure:
- No native mechanism for binding agreements between counterparties
- No trustless payment holding until verified delivery
- No auditability beyond chat logs and API calls
- Human back-and-forth still required even when both parties have fully specified parameters

### Solution: The A2A Stack

**Layer 1 — Autonomous Negotiation**
Buyer and seller agents use Gemini LLM calls to generate natural-language reasoning for each offer, combined with rule-based bounds ensuring offers stay within the user's specified range. The engine tracks offer history, deadline pressure, and reputation signals per round.

**Layer 2 — x402 Payment Gating**
Inspired by the HTTP 402 standard, sensitive protocol actions (escrow creation, milestone release, deal completion, audit export) require micro-payment authorization. In production mode, the backend verifies the Stellar transaction hash via Horizon before allowing the action to proceed.

**Layer 3 — Soroban Escrow**
The `A2AEscrow` Rust contract enforces the trustless settlement guarantee. Funds cannot be released without verifier authorization. Buyers are protected by deadline-triggered refund rights. Every state transition emits an on-chain event.

**Layer 4 — Smart Deal Summary**
After negotiation, the protocol generates a structured summary: final price, payment structure, risk score (based on seller reputation, negotiation volatility, and round pressure), and delivery window. This gives users an explainable record of every deal.

### What's Already Built

- ✅ Soroban escrow contract: deployed and verifiable on Stellar Testnet
- ✅ LLM negotiation engine: real Gemini API integration, not a mock
- ✅ x402 payment gating: simulate and enforce modes
- ✅ Smart Deal Summary: risk scoring, milestone breakdown, participant details
- ✅ Full-stack deployment: Netlify + Render, live and accessible
- ✅ CI/CD pipeline: GitHub Actions, passing on main
- ✅ Real user feedback: 8 testnet users, feedback incorporated in commits

### Why A2AT on HACD

The A2A Protocol Token (A2AT) provides utility across the entire protocol lifecycle:
- Fee discounts for deals settled in A2AT vs XLM
- Verifier staking with slashing for fraudulent completions
- Governance over protocol parameters and treasury
- Reputation bonding for sellers in the negotiation engine
- Developer grants for integration builders

The HACD Launchpad provides immediate access to the Stellar community — the exact audience that benefits from an agent commerce protocol. The incubator's mentorship, visibility, and ecosystem connections accelerate the path from testnet demonstration to mainnet infrastructure.

---

## Risk Disclosures

1. Smart contracts are deployed on Stellar Testnet. Mainnet deployment is planned for Phase 2 following community review. No formal third-party audit has been completed at this stage.

2. LLM negotiation depends on Google Gemini API availability. A fallback rule-based negotiation path is implemented and activates if LLM calls fail.

3. x402 payment gating operates in `simulate` mode by default. Production enforcement (`X402_MODE=enforce`) requires explicit configuration and verifies Stellar transactions on-chain.

4. The backend uses SQLite on Render free tier. Data is not persistent across redeploys. Production deployments should use persistent disk storage or PostgreSQL.

5. A2AT is a utility token for protocol participation. It is not marketed as a financial investment or security instrument.

6. The negotiation engine uses probabilistic LLM outputs. Rule-based offer bounds are enforced independently to prevent invalid deal states regardless of LLM behavior.

7. Single-founder team at this stage. Core technical risk is concentration of development. Mitigation: open-source repository, documented architecture, planned community contributor program.

---

## Supply Calculation

| Category | Tokens | % |
|---|---|---|
| Community Ecosystem | 35,000,000 | 35% |
| Team & Contributors | 20,000,000 | 20% |
| Treasury | 20,000,000 | 20% |
| HACD Launchpad (Treasale) | 10,000,000 | 10% |
| Developer Grants | 8,000,000 | 8% |
| Liquidity Provision | 5,000,000 | 5% |
| Advisors | 2,000,000 | 2% |
| **Total** | **100,000,000** | **100%** |

Treasale allocation: **10,000,000 A2AT** at **0.005 USD/token** = **50,000 USD raise target**

Implied FDV at raise price: **500,000 USD**

---

## Validator-Compatible Information

```json
{
  "project_name": "A2A Protocol",
  "ticker": "A2AT",
  "network": "stellar_testnet",
  "token_contract": "CB5YMKKIGH7UFLWDNZRH5P5ENXE7VQIOJSA2FDVQQB3Z7AEUIFQOEFTI",
  "escrow_contract": "CBCG25INND2P3BVBBRT44XJHSGDKAMUNEAVWUMI7J2TCIBMJVBNIZ2NU",
  "total_supply": 100000000,
  "treasale_tokens": 10000000,
  "treasale_price_usd": 0.005,
  "accepted_currencies": ["XLM", "USDC"],
  "kyc": false,
  "open_source": true,
  "license": "MIT",
  "github": "https://github.com/rohan911438/A2A-Protocol",
  "frontend": "https://a2aprotocol.netlify.app/",
  "whitepaper": "https://github.com/rohan911438/A2A-Protocol/blob/main/docs/WHITEPAPER.md"
}
```

---

## Links

| Resource | URL |
|---|---|
| Live Frontend | https://a2aprotocol.netlify.app/ |
| Backend API | https://a2a-protocol-rn62.onrender.com |
| GitHub | https://github.com/rohan911438/A2A-Protocol |
| Demo Video | https://youtu.be/3KrVJvXWhu8 |
| Workflow Video | https://youtu.be/r3UFY5QrDqk |
| Pitch Deck | https://docs.google.com/presentation/d/1iOp4BNFtgHi1xr0aV76iWBP2igbsvbwzLLiuLD3UAFY/edit?usp=sharing |
| Whitepaper | [docs/WHITEPAPER.md](WHITEPAPER.md) |
| Launch Spec | [docs/launch_spec.json](launch_spec.json) |
| Escrow Contract | https://stellar.expert/explorer/testnet/contract/CBCG25INND2P3BVBBRT44XJHSGDKAMUNEAVWUMI7J2TCIBMJVBNIZ2NU |
| Token Contract | https://stellar.expert/explorer/testnet/contract/CB5YMKKIGH7UFLWDNZRH5P5ENXE7VQIOJSA2FDVQQB3Z7AEUIFQOEFTI |
| Testnet Feedback | https://docs.google.com/spreadsheets/d/1SDXTvTbcdmux87zRt8ZENfPvrhMRcFtBTl6SMnnYIhE/edit |
