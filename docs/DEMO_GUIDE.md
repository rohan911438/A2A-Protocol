# A2A Protocol — Demo & Judge Walkthrough Guide

## 2-Minute Demo Script

**[0:00–0:20] Hook**
> "What if two AI agents could negotiate a deal, lock payment in escrow, and settle on-chain — without a human touching anything in between? That's A2A Protocol."

**[0:20–0:50] Create Deal**
- Navigate to https://a2aprotocol.netlify.app/
- Connect Freighter wallet
- Click "Create Deal"
- Enter: "Build a landing page for a SaaS product" | Budget: 500 XLM | Min price: 300 XLM | Deadline: 7 days
- Click Submit

**[0:50–1:20] Watch Negotiation**
- Negotiation Room opens automatically
- Point to the chat bubbles: "Buyer agent starts at 400, seller at 450"
- Point to the reasoning panel: "Every offer has an explainable rationale — deadline pressure, reputation score, price gap"
- Deal closes at convergence price

**[1:20–1:45] Smart Deal Summary**
- Navigate to Smart Deal Summary
- "Risk score: Low. Payment structure: 2 milestones. Asset: XLM. Verified delivery path."

**[1:45–2:00] The Point**
> "Traditional marketplaces coordinate humans. A2A Protocol coordinates agents. The infrastructure for autonomous agent commerce is here — and it runs on Stellar."

---

## 5-Minute Demo Script

**[0:00–0:30] Context**
> "AI agents can plan and reason today, but they can't *participate* in the economy. They can't hold funds, enforce agreements, or verify completion without a trusted intermediary. A2A Protocol fixes this."

**[0:30–1:30] Architecture Tour**
- Show the architecture diagram in README
- "Five layers: user intent → coordination → agents → intelligence → trust"
- "The trust layer is a Soroban Rust contract — verifiable on stellar.expert right now"
- Open: `https://stellar.expert/explorer/testnet/contract/CDKOZ25IENHQFRRNTJDXAYAOUSDBPUXLE52UGTNIPWACAMGAMNXMYTQU`
- "This is live. Real contract. Real funds can be locked here."

**[1:30–3:00] Full Flow Demo**
- Create deal (as above)
- In negotiation room, expand reasoning panel per round
  - "Round 1: buyer at 80% of budget. Seller at 120% of floor. Gap: 50 XLM."
  - "Round 2: deadline pressure increases. Seller drops 15%. Buyer raises 10%."
  - "Round 3: gap closes under threshold. Deal closes."
- Navigate through to Deal Summary
  - Milestone breakdown: 40% on delivery, 60% on completion
  - Risk assessment: low risk (high seller reputation, 3 rounds, low volatility)

**[3:00–4:00] Technical Deep Dive**
- Show `smart_contract/a2a_escrow/src/lib.rs` — key functions
  - `create_deal` — buyer auth required, funds transferred to contract
  - `release_milestone` — verifier auth required, per-milestone transfer to seller
  - `request_refund` — buyer auth + deadline check
- "No admin can drain funds. No human can release arbitrarily. The contract enforces the rules."

**[4:00–4:30] Token Design**
- "A2AT creates a closed-loop incentive system"
- Fee discounts → adoption
- Verifier staking → security
- Reputation bonding → quality signals
- Governance → community control

**[4:30–5:00] Closing**
> "What we've built is Phase 1 of a protocol layer for the agent economy. The escrow works. The negotiation works. The token design is ready for launch. We're asking HACD to help us take this from testnet infrastructure to the production-grade protocol that the agent economy needs."

---

## Expected Judge Questions & Answers

**Q: Is the smart contract audited?**
A: Not formally audited at this stage — we're pre-mainnet on testnet. The contract has been reviewed internally, and the Soroban auth model prevents the most common exploit classes (re-entrancy, unauthorized access). A formal audit is planned before mainnet deployment.

**Q: How does the verifier agent work?**
A: Currently the verifier role is an authorized address that calls `release_milestone` or `complete_deal` on the contract. In the demo flow, it's the backend acting as verifier. In production, this transitions to: a staked verifier from the A2AT verifier network, or a quorum of verifiers for high-value deals.

**Q: Is x402 real or simulated?**
A: The x402 payment architecture is fully implemented — the backend has enforce mode that verifies real Stellar tx hashes via Horizon. In demo mode (`X402_MODE=simulate`) gates pass automatically so demos run smoothly. The production configuration switches to enforce mode.

**Q: What's the difference between A2AT and just using XLM?**
A: XLM is the base settlement asset. A2AT is the protocol coordination layer: staking for verifiers, reputation bonding for sellers, governance voting on protocol parameters, and fee discounts that create demand for holding A2AT over XLM. XLM denominated deals still work — A2AT holders just get a 50% fee discount.

**Q: Why Stellar and not Ethereum/Solana?**
A: Three reasons. Speed: 3-5 second finality makes deal flows feel instant. Cost: sub-cent transactions make x402 micro-payments viable — on Ethereum mainnet a $0.01 gate costs more in gas than the fee itself. Soroban: the explicit auth model and no re-entrancy by design is the right security foundation for a contract holding user funds.

**Q: How do you prevent LLM hallucination from breaking deals?**
A: Rule-based bounds. The LLM generates reasoning and a suggested price, but the engine clamps that price to `[initial_offer, budget]` for the buyer and `[min_price, initial_price]` for the seller. Even if the LLM outputs garbage, the negotiation stays within valid bounds. This is the critical design choice that makes the system reliable.

**Q: Single founder — is this a risk?**
A: Yes, and it's acknowledged honestly. The codebase is open-source and fully documented. The architecture is modular — a new developer can contribute to any layer independently. The roadmap includes a community contributor program funded by developer grants from the A2AT treasury.

**Q: What's your GTM after the incubator?**
A: Three-phase: (1) Prove the wedge with freelance-style use cases where payment disputes are common. Demo mode makes the flow accessible to non-Web3 users. (2) Partner with AI developer communities (LangChain, AutoGPT ecosystem) to position A2A as the settlement layer for agent workflows. (3) Open the protocol as an API — external agents can plug in without using the frontend.

---

## Talking Points for Non-Technical Judges

- "Think of A2A Protocol as Escrow-as-a-Service, but the negotiation is automated by AI."
- "Every deal is auditable. Every decision the agent makes is logged and explainable."
- "The contract is on the blockchain right now. You can look it up."
- "8 real people tested it on testnet. Their feedback is documented and incorporated."
- "The token creates economic incentives that make the network more trustworthy as it grows."

## Talking Points for Technical Judges

- "Soroban's auth model means `buyer.require_auth()` at the contract level — the signature is verified by the runtime, not by our backend."
- "The negotiation engine uses a hybrid: LLM for reasoning generation, rule-based bounds for safety. Neither alone is sufficient."
- "x402 is verifiable on-chain — we query Horizon for the tx hash, not a database flag."
- "The CI/CD pipeline runs on every push: Python compileall + Vite production build. No broken deploys."
- "The smart contract error codes are explicit and exhaustive — no silent failures."
