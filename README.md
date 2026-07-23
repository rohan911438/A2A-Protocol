<p align="center">
  <img src="docs/images/logo.png" width="320" height="320" alt="A2A Protocol Logo" />
</p>

# A2A Protocol — Autonomous Agents That Negotiate, Transact, and Execute On-Chain

[![CI/CD Pipeline](https://github.com/rohan911438/A2A-Protocol/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/rohan911438/A2A-Protocol/actions/workflows/ci-cd.yml)

**Built by Team Brotherhood**

A2A Protocol is a hackathon project for an emerging agent economy: AI agents that can negotiate, authorize payment, settle through escrow, and complete work with on-chain trust guarantees. The product combines autonomous negotiation, Stellar Soroban escrow, x402-style payment gating, and explainable deal summaries so users can define the task while agents handle execution.

## At A Glance

- Define a task once.
- Let agents negotiate the deal.
- Lock funds in on-chain escrow.
- Verify completion before release.
- Keep every critical action auditable.

## Live Deployment

- Frontend: https://a2aprotocol.netlify.app/
- Backend: https://a2a-protocol-rn62.onrender.com
- Backend health check: https://a2a-protocol-rn62.onrender.com/
- Video Link - https://youtu.be/3KrVJvXWhu8?si=Ixmrt1isNr5Y-pZn
- CI/CD workflow file: `.github/workflows/ci-cd.yml`
- CI/CD badge: added at top of this README
- Live demo (frontend): https://a2aprotocol.netlify.app/
- Live API (backend): https://a2a-protocol-rn62.onrender.com
- Escrow contract address: `CCCDR7O4NXP6LBYRK2F3SH67LMMS2ZFNO5EB3O7AIK2LHHT6Y7NVJ7HR`
- Token contract address: `CB5YMKKIGH7UFLWDNZRH5P5ENXE7VQIOJSA2FDVQQB3Z7AEUIFQOEFTI`
- Workflow Video (RiseIn): https://youtu.be/r3UFY5QrDqk?si=7DQqfipm-GlNOP0E
- Pitch Deck: https://docs.google.com/presentation/d/1iOp4BNFtgHi1xr0aV76iWBP2igbsvbwzLLiuLD3UAFY/edit?usp=sharing
- Feedback from testnet users: https://docs.google.com/spreadsheets/d/1SDXTvTbcdmux87zRt8ZENfPvrhMRcFtBTl6SMnnYIhE/edit?usp=sharing

## CI/CD pipeline success screenshot:

![CI/CD pipeline success](docs/images/ci-cd-success.png)



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

```mermaid
flowchart TD
   U[User / Client] --> F[Frontend Dashboard]
   F --> B[FastAPI Backend]
   B --> N[Negotiation Engine]
   N --> BA[Buyer Agent]
   N --> SA[Seller Agents]
   N --> V[Verifier Agent]
   B --> X[x402 Payment Gate]
   X --> S[Soroban Escrow Contract]
   S --> T[Settlement on Stellar Testnet]
   B --> DB[(SQLite + JSON deal state)]
   V --> B
   S --> B
   DB --> B
```

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

## Architectural Diagram Notes

The architecture is intentionally modular so each layer can evolve independently.

- The frontend focuses on user intent, wallet connection, and deal visibility.
- The backend coordinates negotiation, persistence, and payment gating.
- The agent layer handles offer generation, bargaining, and verification.
- The trust layer is enforced by Soroban escrow rather than by a central operator.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS
- Backend: FastAPI (Python)
- AI: LLM-based negotiation system
- Blockchain: Stellar + Soroban
- Wallets: Freighter, Rabet
- Database: SQLite with JSON-backed deal state

## Smart Contracts & Deployment

- Escrow contract address: `CCCDR7O4NXP6LBYRK2F3SH67LMMS2ZFNO5EB3O7AIK2LHHT6Y7NVJ7HR`
- Token contract address: `CB5YMKKIGH7UFLWDNZRH5P5ENXE7VQIOJSA2FDVQQB3Z7AEUIFQOEFTI`
- Network: Stellar Testnet
- RPC endpoint: `https://soroban-testnet.stellar.org:443`

Testnet verification links:

- Escrow contract explorer: https://stellar.expert/explorer/testnet/contract/CCCDR7O4NXP6LBYRK2F3SH67LMMS2ZFNO5EB3O7AIK2LHHT6Y7NVJ7HR
- Token contract explorer: https://stellar.expert/explorer/testnet/contract/CB5YMKKIGH7UFLWDNZRH5P5ENXE7VQIOJSA2FDVQQB3Z7AEUIFQOEFTI
- Soroban RPC endpoint: https://soroban-testnet.stellar.org:443

Contract verification note: open the escrow contract explorer link above to confirm the deployed contract exists on Stellar Testnet and matches the on-chain address used by the app.

Escrow logic overview:

- Funds are locked in a Soroban escrow contract.
- A verifier or authorized participant confirms completion.
- Settlement is released only when the correct on-chain conditions are met.
- x402-style authorization is used to gate sensitive operations before proceeding.

## Protocol Token — A2AT

The A2A Protocol Token (A2AT) is a Soroban-native token that powers the economic coordination layer of the A2A Protocol ecosystem.

**Token contract (Testnet):** `CB5YMKKIGH7UFLWDNZRH5P5ENXE7VQIOJSA2FDVQQB3Z7AEUIFQOEFTI`

**Explorer:** https://stellar.expert/explorer/testnet/contract/CB5YMKKIGH7UFLWDNZRH5P5ENXE7VQIOJSA2FDVQQB3Z7AEUIFQOEFTI

### Token Utility

| Utility | Description |
| :--- | :--- |
| Protocol fee discount | Deals settled using A2AT receive a 50% discount on x402 fees vs. XLM-only deals |
| Verifier staking | Verifier agents must stake A2AT to participate; stake is slashed on fraudulent completions |
| Governance voting | A2AT holders vote on protocol parameter changes (fee schedule, agent types, contract upgrades) |
| Reputation bonding | Sellers bond A2AT to signal quality; higher bond = higher reputation score in the negotiation engine |
| Developer grants | Community treasury distributes A2AT grants to developers building integrations |
| Premium features | Advanced analytics, multi-agent deal rooms, and API access beyond free tier |

### Token Distribution

**Total supply: 100,000,000 A2AT**

| Allocation | % | Tokens | Vesting |
| :--- | :--- | :--- | :--- |
| Community ecosystem | 35% | 35,000,000 | 4-year linear, no cliff |
| Team & contributors | 20% | 20,000,000 | 1-year cliff, 3-year linear |
| Treasury | 20% | 20,000,000 | DAO-controlled release |
| Launchpad (HACD Treasale) | 10% | 10,000,000 | Per HACD schedule |
| Developer grants | 8% | 8,000,000 | Milestone-gated, 2-year |
| Liquidity provision | 5% | 5,000,000 | Locked 1 year, then LP |
| Advisors | 2% | 2,000,000 | 6-month cliff, 2-year linear |

### Demand Drivers

- Every deal created generates fee revenue; 25% is used to buy A2AT from the open market.
- Verifier staking and reputation bonding reduce circulating supply as network usage grows.
- Governance participation requires holding A2AT, creating an incentive to acquire and retain tokens.

For the full tokenomics design and whitepaper, see [docs/WHITEPAPER.md](docs/WHITEPAPER.md).

## Go-To-Market Strategy

A2A Protocol starts with a clear wedge: freelance-style work coordination where trust, payment, and delivery are the main pain points. The GTM strategy is designed to prove value early, then expand into broader agent commerce.

### Phase 1: Prove the Wedge

- Target freelance-style tasks where payment disputes are common.
- Demonstrate fast negotiation plus escrow-backed settlement.
- Use Demo Mode to show the full flow in under three minutes.

### Phase 2: Expand Usage

- Extend from one-off freelance tasks to repeatable service requests.
- Introduce more structured deal templates and agent reputation history.
- Make the protocol useful for startups outsourcing small, high-trust tasks.

### Phase 3: Open the Agent Economy

- Expose the negotiation and escrow workflow as an API.
- Let external agents plug into the protocol.
- Enable recurring, machine-to-machine economic activity.

Target users:

- Freelancers and clients
- Startups that outsource modular work
- AI developers building agent workflows
- Web3 users already comfortable with wallet-based execution

Execution strategy:

1. Lead with a clear demo that shows negotiation, escrow, and settlement end to end.
2. Convert the demo into a repeatable workflow for freelancers and clients.
3. Use integrations and partnerships to move from a project demo to a protocol layer.

## Comparison

| Capability | Traditional Marketplace | Generic AI Agent | A2A Protocol |
|---|---|---|---|
| Negotiation | Manual messaging | Can draft responses | Autonomous agent-to-agent negotiation |
| Payment | Off-chain or manual | No native payment flow | x402-style payment gating + on-chain escrow |
| Trust | Platform-mediated | No trust layer | Verifier agent + Soroban settlement |
| Completion | Human review | Best-effort reasoning | Explicit completion path before release |
| Auditability | Fragmented records | Limited traceability | Structured summaries and on-chain state |
| Economic agency | Human-only | Advisory only | Agents participate directly in workflow |

### Why It Is Different

- Traditional marketplaces coordinate humans.
- Generic AI agents can assist, but they do not settle value safely.
- A2A Protocol combines negotiation, payment authorization, and escrow into one workflow so agents can actually operate in the economy.

## Screenshots



<img width="1829" height="832" alt="image" src="https://github.com/user-attachments/assets/30f78e03-ab7c-42ce-9c4b-edc4c94f9a4d" />

<img width="1696" height="791" alt="image" src="https://github.com/user-attachments/assets/0c7e5a86-d756-4dc3-9ca0-a80753025bb1" />

<img width="1692" height="840" alt="image" src="https://github.com/user-attachments/assets/d9365e69-0b11-404a-8810-1f71d89e376a" />

<img width="1892" height="849" alt="image" src="https://github.com/user-attachments/assets/8ea4b675-9809-4148-afbe-7337c4dbced9" />

<img width="1815" height="818" alt="image" src="https://github.com/user-attachments/assets/20da93db-f533-4fb0-b163-93b2c2a105f8" />

<img width="1882" height="786" alt="image" src="https://github.com/user-attachments/assets/2221c505-60e9-4a06-a17c-cc376b724d29" />






## Demo Video

Video Link - https://youtu.be/3KrVJvXWhu8?si=Ixmrt1isNr5Y-pZn


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

## User Feedback & Implementation

### Table 1: Testnet User Information

| User Name | User Email | User Wallet Address |
| :--- | :--- | :--- |
| Debojyoti De Majumder | ddmpersonalworkspace@gmail.com | GDPRBMUSTPXRDFP5STCWOG4US7TOHTKLXZTXMAKDMCLBO5FMIIZ6O54R |
| Punit | founder@builderbase.xyz | GD7UFEHE4J3RKQ25ZDGGJ4VBUWATV645UUMN4JYDIBMSFCSFOWXSQ6LM |
| Shashwat Shukla | shash.hashed@gmail.com | GBVC7GUZZDXSVMJ6VFHRGMDDDZQJTVSF4WKKNHHLGOSM2QJJVAHEQSUG |
| Harsh Jain | harshjainhp15s@gmail.com | GAYC3UV3PT7HPPAXC5YLYJHUSX6VKFVBYZ5JX6SOJOCJPI76VQN64RYQ |
| Abhishek Singh | abhisheksingh4928@gmail.com | GBBJTJPZOLVQNBHZ2TEIFWR4V62ULDY7LETCCVOAA3IBDPPDRUHTM3UQ |
| Sriz Debnath | srizd449@gmail.com | GJDMMFBBRMMDKXKXNNZSSIKSKENDBEVSHJXKKDKDJDJD |
| Mannu | mannusingh4678@gmail.com | GBZ44OAWEQMKHQ5H4SOZOSM5I6G6RXMJ5JYOG2ODYJPLFWUKYV3XCM4Y |
| Soumajit Goswami | soumajitgoswami4@gmail.com | GA5EZJZ7YLPROX6A76YDLTW7IJ7WSHEYI5GRI7KAOJOY46MTGCDKLD3C |
| Sylvia Barick | taniabarick15@gmail.com | GBYOEY63WVKXY5KTSQZG4FGCDYY2CV7K3SH4ZSVN6IFDWJ464HPFIEIQ |
| Habib Davy | habib@slyky.app | GDZM6BQSZDJXMZ6ACVUDL244S2GTRRCF547F5IYOKBQNMVYQTQREITSU |
| Rimanshu Patel | rimanshupatel3@gmail.com | GCVE5QXJ33NFGVMUCGUTTUVJQ7F6O4G6OPLCIU5O6OQXPYNORGDP3UIY |
| Ahir Sarkar | ahirsarkar2022@gmail.com | GAA6SY6UZDJVSXTJ6MKJKPL6CCRQCO2R74T3LDIVYMBPBZT6CTW63YWK |
| Sahil gupta | sahilgupta7191@gmail.com | GDALHZQE7ZCFRHF262TCHV6MR2FNLOGIF4JA54LOXFW6VBEL2TI3QJWR |
| Prakhar | prakharshrivastav21@gmail.com | GAYC3UV3PT7HPPAXC5YLYJHUSX6VKFVBYZ5JX6SOJOCJPI76VQN64RYQ |
| Shashwat singh | indianstandard648@gmail.com | GBZ44OAWEQMKHQ5H4SOZOSM5I6G6RXMJ5JYOG2ODYJPLFWUKYV3XCM4Y |
| Roan | rohan-kumar-br24-2032@gcect.ac.in | GDJZ7VECTBHR72UMNVI2M7KYJ7NMUD4BM25HE6LIW3BCDBUUO6L4TI2U |
| Samman Das | sammandas234@gmail.com | GAAF4UHWQANTZ6IAPG2NAADHQLAYUZSIOD46ZW7U7NQIAUSYGFY7RAGO |
| Shubhodeep Mondal | mondalshubhodeep30924@gmail.com | GD7UFEHE4J3RKQ25ZDGGJ4VBUWATV645UUMN4JYDIBMSFCSFOWXSQ6LM |
| Shadow_MMN | nnajimakuochukwu4@gmail.com | GDUDJVYNWOB72KBT6HOXJNBO3KHWBDMNHLPL54EDIKAWW4CKHPBKS2WA |
| Ankush Shaw | ankushshaw764@gmail.com | GBBIG4HLPGTLG6BH6YREVWJXEQ4NX74HTD444JD6A6XYS7DOFL2J6DEI |
| Hüseyin Taşkın | huseyintaskinn023@gmail.com | GBMXYR5FRWAWD4CMECCIMCBK2RTPTDQSIILHPQ6ZPK6UXLNX3ZLX2BVG |
| Rudra Pratap Singh | anonyxz03@gmail.com | GBIXBS4PMUKO3AZ3NON6P4YS33UZ3BK6CBFMUFEPZXHRYPBSLHP6VXPE |
| Vinayak | vahi1310@gmail.com | GDT6TJAJIXR3W5WRQS3MVNR6Q63BUX5OR4LIBAWXCYQHCWYLNSSZVN7Q |
| ARYA BHAGAT | aryabhagat249@gmail.com | GBVU7MVAI5O4NTO3WQZDQ5BFSJGIMA6Z2HNJ7QEBRSZ3GS2BWZEJ2VB4 |
| Sadiya Mulani | sadiyamulani03@gmail.com | GBTCGV43NLHEEBMCA5DWFZT6GOJYYCPHXNOEALTBQ7TREIQKQQAVLYT4 |
| Harrison | harystylesdev@gmail.com | GBVKN7TNSZZZW55US75LTO3COWVC5G3XOTRVJ5PKYVUBRPFGNUF2RG6Y |

### Table 2: User Feed Implementation

| User Name | User Email | User Wallet Address | User Feedback | Commit ID |
| :--- | :--- | :--- | :--- | :--- |
| Debojyoti De Majumder | ddmpersonalworkspace@gmail.com | GDPRBMUSTPXRDFP5STCWOG4US7TOHTKLXZTXMAKDMCLBO5FMIIZ6O54R | Better UI and handling of agents, faster agent communication | `cbba947` |
| Punit | founder@builderbase.xyz | GD7UFEHE4J3RKQ25ZDGGJ4VBUWATV645UUMN4JYDIBMSFCSFOWXSQ6LM | Positive feedback, no issues reported | `b9fde95` |
| Shashwat Shukla | shash.hashed@gmail.com | GBVC7GUZZDXSVMJ6VFHRGMDDDZQJTVSF4WKKNHHLGOSM2QJJVAHEQSUG | Multisig support and frontend UI improvements | `cbba947` |
| Harsh Jain | harshjainhp15s@gmail.com | GAYC3UV3PT7HPPAXC5YLYJHUSX6VKFVBYZ5JX6SOJOCJPI76VQN64RYQ | Everything is smooth, confirmed effective problem solving | `152cc8f` |
| Abhishek Singh | abhisheksingh4928@gmail.com | GBBJTJPZOLVQNBHZ2TEIFWR4V62ULDY7LETCCVOAA3IBDPPDRUHTM3UQ | UI can be better, agents conversation improved | `cbba947` |
| Sriz Debnath | srizd449@gmail.com | GJDMMFBBRMMDKXKXNNZSSIKSKENDBEVSHJXKKDKDJDJD | Albedo wallet connection problem addressed | `152cc8f` |
| Mannu | mannusingh4678@gmail.com | GBZ44OAWEQMKHQ5H4SOZOSM5I6G6RXMJ5JYOG2ODYJPLFWUKYV3XCM4Y | Frontend can be improved, overall loved the product | `cbba947` |
| Soumajit Goswami | soumajitgoswami4@gmail.com | GA5EZJZ7YLPROX6A76YDLTW7IJ7WSHEYI5GRI7KAOJOY46MTGCDKLD3C | UI can be better, agent interaction confirmed | `cbba947` |
| Sylvia Barick | taniabarick15@gmail.com | GBYOEY63WVKXY5KTSQZG4FGCDYY2CV7K3SH4ZSVN6IFDWJ464HPFIEIQ | Requested better documentation, resolved with comprehensive docs & launch spec | `b2468df` |
| Habib Davy | habib@slyky.app | GDZM6BQSZDJXMZ6ACVUDL244S2GTRRCF547F5IYOKBQNMVYQTQREITSU | Requested comprehensive documentation, walkthrough guides, and real-world case studies | `836c79c` |
| Rimanshu Patel | rimanshupatel3@gmail.com | GCVE5QXJ33NFGVMUCGUTTUVJQ7F6O4G6OPLCIU5O6OQXPYNORGDP3UIY | Positive feedback, no major issues reported | `b9fde95` |
| Ahir Sarkar | ahirsarkar2022@gmail.com | GAA6SY6UZDJVSXTJ6MKJKPL6CCRQCO2R74T3LDIVYMBPBZT6CTW63YWK | Suggested step-by-step guides, addressed in documentation package | `836c79c` |
| Sahil gupta | sahilgupta7191@gmail.com | GDALHZQE7ZCFRHF262TCHV6MR2FNLOGIF4JA54LOXFW6VBEL2TI3QJWR | Requested better onboarding, clearer explanation of agent actions, and UX improvements | `ac7e114` |
| Prakhar | prakharshrivastav21@gmail.com | GAYC3UV3PT7HPPAXC5YLYJHUSX6VKFVBYZ5JX6SOJOCJPI76VQN64RYQ | Positive feedback, all functions working smoothly | `b9fde95` |
| Shashwat singh | indianstandard648@gmail.com | GBZ44OAWEQMKHQ5H4SOZOSM5I6G6RXMJ5JYOG2ODYJPLFWUKYV3XCM4Y | Positive feedback, confirmed effective economic coordination | `b9fde95` |
| Roan | rohan-kumar-br24-2032@gcect.ac.in | GDJZ7VECTBHR72UMNVI2M7KYJ7NMUD4BM25HE6LIW3BCDBUUO6L4TI2U | Positive feedback, great product execution | `b9fde95` |
| Samman Das | sammandas234@gmail.com | GAAF4UHWQANTZ6IAPG2NAADHQLAYUZSIOD46ZW7U7NQIAUSYGFY7RAGO | Suggested improvements for agentic interaction flow | `cbba947` |
| Shubhodeep Mondal | mondalshubhodeep30924@gmail.com | GD7UFEHE4J3RKQ25ZDGGJ4VBUWATV645UUMN4JYDIBMSFCSFOWXSQ6LM | Reported hero section text glitch, resolved with updated homepage design | `ac7e114` |
| Shadow_MMN | nnajimakuochukwu4@gmail.com | GDUDJVYNWOB72KBT6HOXJNBO3KHWBDMNHLPL54EDIKAWW4CKHPBKS2WA | Reported black-on-black date picker visibility bug, requested onboarding instructions | `cbba947` |
| Ankush Shaw | ankushshaw764@gmail.com | GBBIG4HLPGTLG6BH6YREVWJXEQ4NX74HTD444JD6A6XYS7DOFL2J6DEI | Reported calendar/date picker text color glitch, suggested clearer user onboarding | `cbba947` |
| Hüseyin Taşkın | huseyintaskinn023@gmail.com | GBMXYR5FRWAWD4CMECCIMCBK2RTPTDQSIILHPQ6ZPK6UXLNX3ZLX2BVG | Reported Expiration Epoch text visibility glitch, suggested adding i18n support | `cbba947` |
| Rudra Pratap Singh | anonyxz03@gmail.com | GBIXBS4PMUKO3AZ3NON6P4YS33UZ3BK6CBFMUFEPZXHRYPBSLHP6VXPE | Requested further UI/UX and visual interaction improvements | `cbba947` |
| Vinayak | vahi1310@gmail.com | GDT6TJAJIXR3W5WRQS3MVNR6Q63BUX5OR4LIBAWXCYQHCWYLNSSZVN7Q | Requested refined frontend layouts and improved overall UX | `cbba947` |
| ARYA BHAGAT | aryabhagat249@gmail.com | GBVU7MVAI5O4NTO3WQZDQ5BFSJGIMA6Z2HNJ7QEBRSZ3GS2BWZEJ2VB4 | Reported protocol loading latency after inputs, addressed in optimization fixes | `cbba947` |
| Sadiya Mulani | sadiyamulani03@gmail.com | GBTCGV43NLHEEBMCA5DWFZT6GOJYYCPHXNOEALTBQ7TREIQKQQAVLYT4 | Suggested adding human oversight, spending limits, and transparent audit trails | `cbba947` |
| Harrison | harystylesdev@gmail.com | GBVKN7TNSZZZW55US75LTO3COWVC5G3XOTRVJ5PKYVUBRPFGNUF2RG6Y | Reported demo transaction processing delay, addressed in performance updates | `cbba947` |

## Future Scope

- Cross-chain support for broader settlement options.
- More advanced agent intelligence and negotiation policy learning.
- Real-world integrations with freelance, API, and marketplace platforms.
- Decentralized identity for stronger agent and user trust signals.

## Team

Team: Brotherhood

- Rohan Kumar (@rohan911438) - Solo founder, product, backend, frontend, and smart contract integration.

## Why It Matters

A2A Protocol lays the foundation for a future where AI agents are not just tools, but autonomous economic participants.

It makes agent collaboration economically useful by combining negotiation, escrow, payment gating, and transparent completion logic into one workflow that is understandable to users and credible to judges, developers, and real-world adopters.

## Repository Structure

- `backend/`: FastAPI routes, services, persistence, and Stellar integration.
- `frontend/`: React + Vite UI and wallet interactions.
- `smart_contract/`: Soroban escrow contract and deployment scripts.
- `Agents/`: negotiation, strategy, and reasoning logic.
