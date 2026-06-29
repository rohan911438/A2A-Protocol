<p align="center">
  <img src="docs/images/logo.png" width="200" height="200" alt="A2A Protocol" />
</p>

<h1 align="center">A2A Protocol</h1>
<p align="center"><strong>The infrastructure layer for autonomous agent commerce</strong></p>
<p align="center">AI agents that negotiate, transact, and settle on-chain — no human intermediation required.</p>

<p align="center">
  <a href="https://github.com/rohan911438/A2A-Protocol/actions/workflows/ci-cd.yml">
    <img src="https://github.com/rohan911438/A2A-Protocol/actions/workflows/ci-cd.yml/badge.svg" alt="CI/CD Pipeline" />
  </a>
  <img src="https://img.shields.io/badge/Network-Stellar_Testnet-7B6CF6?style=flat" alt="Stellar" />
  <img src="https://img.shields.io/badge/Contract-Soroban-22D3EE?style=flat" alt="Soroban" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=flat" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Frontend-React_+_Vite-61DAFB?style=flat" alt="React" />
  <img src="https://img.shields.io/badge/AI-Gemini_LLM-4285F4?style=flat" alt="Gemini" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat" alt="MIT" />
</p>

<p align="center">
  <a href="https://a2aprotocol.netlify.app/"><strong>Live Demo</strong></a> ·
  <a href="https://youtu.be/3KrVJvXWhu8"><strong>Demo Video</strong></a> ·
  <a href="docs/WHITEPAPER.md"><strong>Whitepaper</strong></a> ·
  <a href="docs/launch_spec.json"><strong>Launch Spec</strong></a>
</p>

---

## What Is A2A Protocol?

A2A Protocol is a **decentralized infrastructure layer** that enables AI agents to negotiate, authorize payment, and settle work agreements on-chain — without human intermediation.

A user defines a task once. Then the protocol takes over:

1. A **buyer agent** represents the user's demand and makes offers.
2. **Seller agents** respond with counter-offers.
3. The **negotiation engine** drives agents toward a Pareto-optimal price using LLM reasoning bounded by rule-based constraints.
4. Agreed terms are locked in a **Soroban escrow contract** on Stellar.
5. A **verifier agent** confirms delivery before releasing payment.
6. Settlement is automatic, auditable, and trustless.

**Built on Stellar. Powered by Gemini. Secured by Soroban.**

---

## Live Deployment

| Service | URL |
|---|---|
| Frontend | https://a2aprotocol.netlify.app/ |
| Backend API | https://a2a-protocol-rn62.onrender.com |
| Escrow Contract | [`CDKOZ25...YTQU`](https://stellar.expert/explorer/testnet/contract/CDKOZ25IENHQFRRNTJDXAYAOUSDBPUXLE52UGTNIPWACAMGAMNXMYTQU) |
| Protocol Token | [`CB5YMK...EFTI`](https://stellar.expert/explorer/testnet/contract/CB5YMKKIGH7UFLWDNZRH5P5ENXE7VQIOJSA2FDVQQB3Z7AEUIFQOEFTI) |
| Demo Video | https://youtu.be/3KrVJvXWhu8 |

Network: **Stellar Testnet** · RPC: `https://soroban-testnet.stellar.org:443`

---

## The Problem

AI agents can reason, plan, and automate — but they cannot participate in the economy.

The gaps are structural:

- Agents have no native way to enter binding agreements with counterparties.
- Payment remains at risk until manual review confirms delivery.
- Buyers and sellers rely on trust or intermediaries, not verifiable on-chain state.
- Negotiation is still human-to-human, even when both sides have clear parameters.

The result: delayed deals, failed handoffs, unclear obligations, and weak trust between parties in any agent-mediated workflow.

---

## The Solution

A2A Protocol gives agents the economic infrastructure they need.

```
User defines a task
        ↓
Agents negotiate autonomously (LLM-driven, rule-bounded)
        ↓
Terms locked in Soroban escrow
        ↓
Verifier agent confirms delivery
        ↓
Payment released on-chain
```

Every critical step is logged, explainable, and auditable. Users retain visibility and control. Agents do the work.

---

## Key Features

| Feature | Description |
|---|---|
| **Autonomous negotiation** | Buyer and seller agents use LLM reasoning to converge on price, timeline, and terms |
| **On-chain escrow** | Soroban smart contract holds funds until verified completion |
| **Milestone-based release** | Payments released per milestone, not all at once |
| **Verifier agent** | Third-party agent validates delivery before any release |
| **x402 payment gating** | Sensitive actions require micro-payment authorization |
| **Explainable AI** | Every negotiation round produces structured reasoning logs |
| **Smart Deal Summary** | Human-readable risk score, payment structure, and deal metrics |
| **Deadline enforcement** | Buyer can claim refund via contract if deadline passes without completion |
| **Wallet-native UX** | Freighter and Rabet integration — no custodial accounts |

---

## Architecture

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
│   Stellar Testnet · XLM / A2AT                           │
└─────────────────────────────────────────────────────────┘
```

### Layers

**User Intent Layer** — React + Vite frontend. Users connect a Stellar wallet, define a task (title, budget, deadline, min price), and monitor deal progress in real time.

**Coordination Layer** — FastAPI backend. Manages the full deal lifecycle: creation → negotiation → approval → on-chain acceptance → escrow funding → milestone release → completion. x402 micro-payment gates protect sensitive actions.

**Agent Layer** — Three agent roles: Buyer Agent (represents demand), Seller Agent (represents supply), Verifier Agent (validates delivery). Agents operate within rule-bounded parameters to prevent invalid states regardless of LLM output.

**Intelligence Layer** — The Negotiation Engine orchestrates Gemini LLM calls to generate natural-language reasoning for each offer, combined with deterministic strategy bounds. Each round produces a structured reasoning entry: price adjustments, deadline urgency, reputation signal, risk level.

**Trust Layer** — Soroban Rust smart contract (`A2AEscrow`) holding funds with explicit state machine: `Created → Funded → Completed / Refunded`. Verifier authorization is required for all fund releases. Only the buyer can trigger a refund after deadline expiry.

---

## Smart Contract

**Contract: A2AEscrow** · Soroban SDK 20 · Rust

| Function | Authorized By | Effect |
|---|---|---|
| `initialize` | Admin | Set admin address and accepted token |
| `create_deal` | Buyer | Lock funds, store deal state, emit event |
| `release_milestone` | Verifier | Transfer milestone amount to seller |
| `complete_deal` | Verifier | Release all remaining funds to seller |
| `request_refund` | Buyer | Return funds after deadline passes |
| `get_deal` | Anyone | Read current deal state |

Security properties:
- Admin cannot extract user funds — only designated verifier can authorize release.
- Milestone amounts are validated at creation time (must sum to `total_amount`).
- Re-entrancy is not possible in Soroban's execution model.
- Deadline enforcement uses `env.ledger().timestamp()` — not manipulable off-chain.

---

## Protocol Token — A2AT

The **A2A Protocol Token (A2AT)** is a Soroban-native token powering the A2A Protocol ecosystem.

**Token contract (Testnet):** `CB5YMKKIGH7UFLWDNZRH5P5ENXE7VQIOJSA2FDVQQB3Z7AEUIFQOEFTI`

| Utility | Description |
|---|---|
| Protocol fee discount | 50% discount on x402 fees for A2AT-settled deals |
| Verifier staking | Verifiers stake A2AT; stake slashed on fraudulent releases |
| Governance | A2AT holders vote on fee schedules, contract upgrades, treasury |
| Reputation bonding | Sellers bond A2AT to signal quality in the negotiation engine |
| Developer grants | Treasury distributes A2AT to integration builders |
| Premium features | Advanced analytics and API access beyond free tier |

**Total supply: 100,000,000 A2AT**

| Allocation | % | Vesting |
|---|---|---|
| Community ecosystem | 35% | 4-year linear |
| Team | 20% | 1-year cliff + 3-year linear |
| Treasury | 20% | DAO-controlled |
| HACD Launchpad | 10% | Per HACD schedule |
| Developer grants | 8% | Milestone-gated |
| Liquidity | 5% | 1-year lock |
| Advisors | 2% | 6-month cliff + 2-year linear |

See [docs/WHITEPAPER.md](docs/WHITEPAPER.md) for full tokenomics design.

---

## Screenshots

<img width="1851" height="906" alt="Dashboard" src="https://github.com/user-attachments/assets/4193f6a9-9a4c-4e48-944d-613e5e54445c" />

<img width="1696" height="791" alt="Create Deal" src="https://github.com/user-attachments/assets/0c7e5a86-d756-4dc3-9ca0-a80753025bb1" />

<img width="1692" height="840" alt="Negotiation Room" src="https://github.com/user-attachments/assets/d9365e69-0b11-404a-8810-1f71d89e376a" />

<img width="1892" height="849" alt="Agent Reasoning Panel" src="https://github.com/user-attachments/assets/8ea4b675-9809-4148-afbe-7337c4dbced9" />

<img width="1815" height="818" alt="Smart Deal Summary" src="https://github.com/user-attachments/assets/20da93db-f533-4fb0-b163-93b2c2a105f8" />

<img width="1882" height="786" alt="Deal Completion" src="https://github.com/user-attachments/assets/2221c505-60e9-4a06-a17c-cc376b724d29" />

---

## CI/CD

[![CI/CD Pipeline](https://github.com/rohan911438/A2A-Protocol/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/rohan911438/A2A-Protocol/actions/workflows/ci-cd.yml)

![CI/CD pipeline success](docs/images/ci-cd-success.png)

The pipeline runs on every push to `main`:
1. Backend syntax check (`python -m compileall`)
2. Frontend dependency install + production build
3. Deploy hooks to Netlify and Render (on main push)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Python 3.11, FastAPI, Pydantic v2 |
| AI Engine | Google Gemini (`google-generativeai`) |
| Smart Contract | Rust, Soroban SDK 20 |
| Wallets | Freighter, Rabet |
| Database | SQLite + JSON deal state |
| CI/CD | GitHub Actions |
| Hosting | Netlify (frontend), Render (backend) |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- A Stellar testnet wallet (Freighter browser extension)
- A Gemini API key ([get one here](https://aistudio.google.com))

### 1. Clone

```bash
git clone https://github.com/rohan911438/A2A-Protocol.git
cd A2A-Protocol
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in GEMINI_API_KEY and other values
```

### 3. Start backend

```bash
python -m pip install -r requirements.txt
python -m backend.main
# Runs at http://127.0.0.1:8000
```

### 4. Start frontend

```bash
cd frontend
cp .env.example .env   # or create frontend/.env manually
npm install
npm run dev
# Runs at http://localhost:5173
```

**Frontend `.env` for local development:**

```env
VITE_API_BASE=http://127.0.0.1:8000
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_STELLAR_NETWORK=TESTNET
```

### 5. Run the demo flow

1. Open `http://localhost:5173`
2. Connect your Freighter wallet
3. Click **Create Deal** — enter a task description, budget, and deadline
4. The negotiation room opens automatically — watch agents negotiate in real time
5. Review the **Smart Deal Summary** with risk score and payment structure
6. Complete the escrow flow to lock funds on-chain

---

## Deployment

### Frontend → Netlify

Build settings:
```
Base directory:  frontend
Build command:   npm ci && npm run build
Publish dir:     dist
```

Environment variables (Netlify dashboard):
```
VITE_API_BASE=https://a2a-protocol-rn62.onrender.com
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_STELLAR_NETWORK=TESTNET
```

### Backend → Render

`render.yaml` is pre-configured. Required environment variables:
```
CORS_ORIGINS=https://your-site.netlify.app
GEMINI_API_KEY=your_key_here
DEFAULT_SELLER_WALLET=your_seller_stellar_key
X402_MODE=simulate
```

Full deployment guide: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## How Negotiation Works

Each negotiation round:

1. **Buyer agent** receives current context (budget, offer history, deadline) → Gemini generates a natural-language counter-offer with a price.
2. Price is clamped to `[initial_offer, budget]` — LLM cannot exceed budget regardless of output.
3. **Seller agent** receives updated history → Gemini generates a response with a counter-price.
4. Price is clamped to `[min_price, initial_price]` — LLM cannot go below seller floor.
5. If `buyer_price >= seller_price`, deal closes at seller's price.
6. The engine stores a structured reasoning entry for each round: price delta, deadline urgency, reputation score, risk level.
7. After max rounds (default 3), the engine returns the last known prices even if no full convergence — the backend uses this to progress the deal.

This hybrid approach (LLM reasoning + rule-based bounds) ensures the negotiation is explainable, bounded, and never produces an invalid deal state.

---

## x402 Payment Authorization

Sensitive protocol actions are gated behind micro-payment confirmation:

| Action | Fee |
|---|---|
| Escrow authorization | 0.01 XLM |
| Payment release | 0.01 XLM |
| Deal completion | 0.01 XLM |
| Audit export | 0.01 XLM |

In `simulate` mode (default), gates pass automatically. Set `X402_MODE=enforce` for production behavior where Stellar tx hashes are verified on-chain via Horizon before actions proceed.

---

## User Feedback (Testnet)

8 users tested the protocol on Stellar Testnet. Feedback was incorporated across commits.

| User | Feedback | Commit |
|---|---|---|
| Debojyoti De Majumder | Better agent communication speed, UI improvements | `cbba947` |
| Punit (builderbase.xyz) | Positive — no issues | `b9fde95` |
| Shashwat Shukla | Multisig support request, UI improvements | `cbba947` |
| Harsh Jain | Smooth experience, effective problem solving confirmed | `152cc8f` |
| Abhishek Singh | Agent conversation improved, UI polish | `cbba947` |
| Sriz Debnath | Albedo wallet connection addressed | `152cc8f` |
| Mannu | Frontend improvements, loved the product | `cbba947` |
| Soumajit Goswami | UI polish, agent interaction confirmed | `cbba947` |

Full feedback spreadsheet: [View on Google Sheets](https://docs.google.com/spreadsheets/d/1SDXTvTbcdmux87zRt8ZENfPvrhMRcFtBTl6SMnnYIhE/edit?usp=sharing)

---

## Comparison

| Capability | Traditional Marketplace | Generic AI Agent | A2A Protocol |
|---|---|---|---|
| Negotiation | Human messaging | Advisory drafts only | Autonomous agent-to-agent convergence |
| Payment security | Platform-mediated | No native payment | Soroban on-chain escrow |
| Completion verification | Human review | Best-effort reasoning | Verifier agent + on-chain state |
| Dispute protection | Platform arbitration | None | Deadline-triggered refund |
| Auditability | Fragmented records | Minimal | Structured reasoning logs + on-chain events |
| Economic agency | Human-only | Advisory only | Agents are first-class economic actors |

---

## Why Stellar + Soroban

- **Speed** — Stellar settles in 3-5 seconds, making deal flows feel responsive.
- **Cost** — Transactions cost fractions of a cent, enabling x402 micro-payments that would be impractical on Ethereum mainnet.
- **Soroban** — Rust-based smart contracts with explicit auth model. No re-entrancy. No EVM footguns. Deterministic execution.
- **Ecosystem** — SEP standards (Freighter, Anchor, USDC) provide a complete financial rails layer without reinventing primitives.

---

## Roadmap

**Phase 1 — Foundation** *(complete)*
- Soroban escrow contract deployed
- LLM negotiation engine
- x402 payment gating
- Full-stack deployment with CI/CD
- Testnet user feedback

**Phase 2 — Agent Economy** *(Q3 2026)*
- Multi-seller competitive bidding
- A2AT reputation staking
- Open agent SDK
- Mainnet deployment
- HACD Launchpad token launch

**Phase 3 — Interoperability** *(Q4 2026)*
- Cross-chain assets (USDC, bridged)
- External marketplace API
- Decentralized agent identity

**Phase 4 — Autonomous Infrastructure** *(2027)*
- Machine-to-machine deal initiation (no human UI)
- Recurring deal subscriptions
- Agent-operated DAOs

---

## Repository Structure

```
A2A-Protocol/
├── Agents/                    # Negotiation engine and agent logic
│   ├── negotiation_engine.py  # LLM + rule-based negotiation orchestrator
│   ├── buyer_agent.py         # Buyer agent with strategy bounds
│   ├── seller_agent.py        # Seller agent with floor constraints
│   ├── llm_negotiator.py      # Gemini API integration and prompt templates
│   ├── strategy.py            # Offer calculation and acceptance logic
│   └── utils.py               # Logging and formatting utilities
├── backend/                   # FastAPI backend
│   ├── routes/
│   │   ├── deal.py            # Deal lifecycle API (15+ endpoints)
│   │   └── root.py            # Health check
│   ├── services/
│   │   ├── stellar_service.py  # Horizon + transaction building
│   │   ├── x402_service.py     # x402 payment gate logic
│   │   ├── negotiation_service.py  # Bridges backend to Agents/
│   │   ├── database_service.py # SQLite persistence
│   │   ├── wallet_service.py   # Wallet state tracking
│   │   └── deal_store.py       # Deal CRUD operations
│   └── models/schemas.py       # Pydantic request/response models
├── frontend/                   # React + Vite UI
│   └── src/
│       ├── pages/              # Dashboard, CreateDeal, NegotiationRoom, DealSummary, etc.
│       ├── services/           # DealService, StellarWalletService, ContractService
│       └── context/            # WalletContext (global wallet state)
├── smart_contract/a2a_escrow/
│   └── src/
│       ├── lib.rs              # A2AEscrow Soroban contract
│       └── test.rs             # Unit tests
├── docs/
│   ├── WHITEPAPER.md           # Full protocol whitepaper
│   └── launch_spec.json        # HACD incubator submission spec
├── .env.example                # Environment variable template
├── .github/workflows/ci-cd.yml # CI/CD pipeline
├── render.yaml                 # Render backend deployment config
├── netlify.toml                # Netlify frontend deployment config
├── requirements.txt            # Python dependencies
└── DEPLOYMENT.md               # Deployment guide
```

---

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes with clear commit messages
4. Ensure the CI/CD pipeline passes (frontend build + backend syntax check)
5. Open a pull request describing what you changed and why

For bugs, use GitHub Issues. For security vulnerabilities, see below.

---

## Security

- Private keys never touch the backend. All signing happens in the user's wallet extension.
- Report security vulnerabilities via GitHub Issues with the `security` label.
- Do not post exploit details publicly until a patch is released.

---

## License

MIT License — see [LICENSE](LICENSE)

---

## Team

**Team Brotherhood**

**Rohan Kumar** — Founder · Full-stack engineer · Smart contract developer  
GitHub: [@rohan911438](https://github.com/rohan911438)

---

<p align="center">
  <strong>A2A Protocol</strong> — Built on Stellar · Secured by Soroban · Powered by AI
</p>
<p align="center">
  <a href="https://a2aprotocol.netlify.app/">Live Demo</a> ·
  <a href="https://youtu.be/3KrVJvXWhu8">Demo Video</a> ·
  <a href="docs/WHITEPAPER.md">Whitepaper</a>
</p>
