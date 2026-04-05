# A2A Protocol — Autonomous Agents That Negotiate, Transact, and Execute On-Chain

**Built by Team Brotherhood**

A2A Protocol is a hackathon project for an emerging agent economy: AI agents that can negotiate, authorize payment, settle through escrow, and complete work with on-chain trust guarantees. The product combines autonomous negotiation, Stellar Soroban escrow, x402-style payment gating, and explainable deal summaries so users can define the task while agents handle execution.

## Live Deployment

- Frontend: https://a2aprotocol.netlify.app/
- Backend: https://a2a-protocol-rn62.onrender.com
- Backend health check: https://a2a-protocol-rn62.onrender.com/

## Problem Statement

Today’s AI agents can reason, plan, and automate work, but they still lack the native ability to participate in real economic activity.

The gaps are structural:

- Agents cannot natively negotiate contracts with counterparties.
- Payment risk still depends on manual coordination or trusted intermediaries.
- Buyers and sellers do not have a trustless way to lock funds before work begins.
- Execution is slow because confirmation, authorization, and settlement happen in separate systems.
- Marketplaces still rely on human back-and-forth for pricing, milestones, and completion checks.

The result is friction everywhere: delayed deals, unclear obligations, failed handoffs, and weak trust between parties.

## Our Solution

A2A Protocol turns agents into active economic participants.

The system lets a buyer define a task once, then the protocol coordinates the rest: buyer and seller agents negotiate, a verifier agent checks completion, and Stellar-based escrow secures payment until the work is confirmed. For sensitive steps, x402-style payment authorization gates critical actions so the platform can require explicit payment before releasing contracts, summaries, or settlement workflows.

The core idea is simple: users express intent, while agents negotiate, transact, and execute on-chain with guardrails.

## Key Features

- Autonomous agent negotiation for pricing, timing, and acceptance.
- On-chain escrow using Stellar Soroban.
- x402-style payment gating for authorization-sensitive actions.
- Explainable AI decision-making with reasoning summaries.
- Verifier agent support for trustless completion checks.
- Smart Deal Summary for readable deal state, risk, and milestones.
- One-click Demo Mode for fast walkthroughs during judging.
- Agent reputation and activity tracking for negotiation context.

## Architecture Overview

### 1. User Layer

Users submit tasks, connect a Stellar wallet, and define deal preferences such as budget, deadline, and seller criteria.

### 2. Agent Layer

Buyer agents represent demand, seller agents compete or respond, and verifier agents confirm delivery and completion conditions.

### 3. Intelligence Layer

The negotiation engine applies pricing logic, offer history, deadline pressure, and reputation signals to generate structured decisions.

### 4. Payment Layer

x402-style micropayments authorize critical actions, while Stellar transactions handle escrow funding, release, and settlement.

### 5. Trust Layer

Soroban smart contracts hold funds and enforce escrow rules so settlement can happen without relying on a central intermediary.

## Workflow

1. User submits a task.
2. Buyer agent is created.
3. Seller agents bid or respond.
4. Agents negotiate until terms converge.
5. Smart Deal Summary is generated.
6. x402 payment authorization is required for gated actions.
7. Escrow contract is created on Stellar.
8. Work is submitted.
9. Verifier agent validates completion.
10. Payment is released from escrow.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS
- Backend: FastAPI (Python)
- AI: LLM-based negotiation system
- Blockchain: Stellar + Soroban
- Wallets: Freighter, Rabet
- Database: SQLite with JSON-backed deal state

## Smart Contracts & Deployment

- Escrow contract address: `CDKOZ25IENHQFRRNTJDXAYAOUSDBPUXLE52UGTNIPWACAMGAMNXMYTQU`
- Token contract address: `CB5YMKKIGH7UFLWDNZRH5P5ENXE7VQIOJSA2FDVQQB3Z7AEUIFQOEFTI`
- Network: Stellar Testnet
- RPC endpoint: `https://soroban-testnet.stellar.org:443`

Contract link placeholder: Insert contract link here

Escrow logic overview:

- Funds are locked in a Soroban escrow contract.
- A verifier or authorized participant confirms completion.
- Settlement is released only when the correct on-chain conditions are met.
- x402-style authorization is used to gate sensitive operations before proceeding.

## Go-To-Market Strategy

A2A Protocol starts with a clear wedge: freelance-style work coordination where trust, payment, and delivery are the main pain points.

Target users:

- Freelancers and clients
- Startups that outsource modular work
- AI developers building agent workflows
- Web3 users already comfortable with wallet-based execution

Adoption strategy:

1. Start with a simple freelance negotiation and escrow use case.
2. Expand into API and service marketplaces.
3. Open the protocol to an agent economy where autonomous systems can transact repeatedly.

## Screenshots

### Homepage UI

![Homepage UI](link-to-homepage-screenshot)

### Agent Negotiation

![Agent Negotiation](link-to-negotiation-screenshot)

### Deal Summary

![Deal Summary](link-to-deal-summary-screenshot)

### Payment Flow

![Payment Flow](link-to-payment-flow-screenshot)

### Dashboard

![Dashboard](link-to-dashboard-screenshot)

## Demo Video

2 to 3 minute demo video: Insert demo video link here

## How to Run Locally

### Prerequisites

- Python 3.11+
- Node.js 20+
- npm

### Backend

1. Install Python dependencies:

   ```bash
   python -m pip install -r requirements.txt
   ```

2. Create a root `.env` file with API keys, wallet addresses, and contract IDs.

3. Start the backend:

   ```bash
   python -m backend.main
   ```

4. Backend runs at:

   ```text
   http://127.0.0.1:8000
   ```

### Frontend

1. Move into the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `frontend/.env`:

   ```env
   VITE_API_BASE=http://127.0.0.1:8000
   VITE_HORIZON_URL=https://horizon-testnet.stellar.org
   VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
   VITE_STELLAR_NETWORK=TESTNET
   ```

4. Start the frontend:

   ```bash
   npm run dev
   ```

### Production Frontend Deployment

`netlify.toml` is already configured for the frontend build with:

- Base directory: `frontend`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`

Set these environment variables in Netlify:

```env
VITE_API_BASE=https://a2a-protocol-rn62.onrender.com
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_STELLAR_NETWORK=TESTNET
```

After deployment, add the Netlify domain to backend CORS settings in Render.

## Future Scope

- Cross-chain support for broader settlement options.
- More advanced agent intelligence and negotiation policy learning.
- Real-world integrations with freelance, API, and marketplace platforms.
- Decentralized identity for stronger agent and user trust signals.

## Team

Team: Brotherhood

- Add member name, role, and GitHub profile here.
- Add member name, role, and GitHub profile here.
- Add member name, role, and GitHub profile here.

## Why It Matters

A2A Protocol lays the foundation for a future where AI agents are not just tools, but autonomous economic participants.

It makes agent collaboration economically useful by combining negotiation, escrow, payment gating, and transparent completion logic into one workflow that is understandable to users and credible to judges, developers, and real-world adopters.

## Repository Structure

- `backend/`: FastAPI routes, services, persistence, and Stellar integration.
- `frontend/`: React + Vite UI and wallet interactions.
- `smart_contract/`: Soroban escrow contract and deployment scripts.
- `Agents/`: negotiation, strategy, and reasoning logic.
