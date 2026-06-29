# Issuer FAQ — A2AT (A2A Protocol Token)

**HACD AI Issuance Skill — Document 6 of 8**  
**Date:** 2026-06-29

---

**Q: What is A2AT?**

A2AT is the coordination and governance token of A2A Protocol — a decentralized infrastructure layer for autonomous agent commerce built on Stellar. A2AT aligns incentives between protocol participants: verifiers, sellers, buyers, developers, and governance voters.

---

**Q: What does A2AT do right now, at launch?**

At launch, A2AT enables a reduced x402 protocol fee rate for deals that use A2AT rather than XLM alone. This is the one live utility pathway. All other utilities (verifier staking, governance voting, reputation bonding, developer grants, premium features) are planned and will be implemented as the protocol matures.

---

**Q: Why is the public phase only 10% of supply?**

The public phase (10 HACD lots, 10,000,000 A2AT) is sized to be accessible while preserving the majority of supply for long-term protocol sustainability. The remaining 90% funds community programs, team vesting, treasury reserve, developer grants, and liquidity — all with vesting schedules to prevent concentration.

---

**Q: What does 1 HACD lot represent?**

One HACD lot produces exactly 1,000,000 A2AT. All lots are identical — no tiers, no bonus lots, no preferred pricing. The formation cost reference is 50 HAC per lot.

---

**Q: What is the formation cost reference?**

The formation cost reference (50 HAC per HACD lot) is the on-chain HAC cost required to form each Stack lot. It is a reference to the resources committed to the launch — not a price floor, not a guaranteed redemption value, and not an investment term. The HAC stack cost is non-refundable upon Stack removal.

---

**Q: What happens if I remove my Stack?**

Removing a Stack releases the underlying HACD back to you. The 1,000,000 A2AT tied to that lot are destroyed (burned). The 50 HAC formation cost is not refunded.

---

**Q: Are the smart contracts audited?**

No formal third-party audit has been completed. The Soroban escrow contract uses the explicit authorization model of Soroban SDK 20, which prevents re-entrancy and unauthorized fund access by design. A formal audit is planned before mainnet deployment.

---

**Q: Is A2AT deployed on Hacash mainnet?**

Not yet. The A2AT token contract is currently on Stellar Testnet. The HACD Stack formation via the HACD Launchpad will deploy on Hacash mainnet. The Stellar-side token contract migration to mainnet is planned for Phase 2.

---

**Q: What is x402 payment gating?**

x402 is an HTTP payment standard (inspired by HTTP 402) implemented in A2A Protocol to gate sensitive actions behind a micro-payment confirmation. Actions gated include: escrow creation, milestone release, deal completion, and audit export. In the current demo configuration (`X402_MODE=simulate`), gates pass automatically. In production (`X402_MODE=enforce`), the backend verifies a real Stellar transaction hash via Horizon API before the action proceeds.

---

**Q: Can I use A2AT on Stellar now?**

Yes — the token contract is deployed on Stellar Testnet at `CB5YMKKIGH7UFLWDNZRH5P5ENXE7VQIOJSA2FDVQQB3Z7AEUIFQOEFTI`. The live frontend at https://a2aprotocol.netlify.app/ operates against this testnet contract.

---

**Q: Who controls the Treasury allocation?**

The 20% treasury allocation (20 HACD lots, 20,000,000 A2AT) is held under DAO-controlled release. During the bootstrap phase (pre-DAO), a multisig held by the founding team and community representatives controls treasury release. Full DAO governance transitions at 1 year post-launch or when 20% of supply is distributed to the community, whichever comes first.

---

**Q: Is this a financial investment?**

No. A2AT is a utility token for participation in the A2A Protocol ecosystem. Acquiring A2AT does not entitle the holder to any financial return. This is not financial advice.

---

*Not financial advice. This document is a draft for issuer review under the HACD AI Issuance Skill workflow.*
