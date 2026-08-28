#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Symbol, Vec,
};

#[cfg(test)]
mod test;

/// Soroban persistent storage entries expire (get archived) after their TTL
/// runs out unless explicitly bumped. A single-asset, never-extended deal
/// entry works fine in a demo but silently breaks in production once a deal
/// sits funded for longer than the default TTL window. Every write below
/// extends the entry's TTL so long-lived escrows survive.
const LEDGERS_PER_DAY: u32 = 17280;
const DEAL_TTL_THRESHOLD: u32 = LEDGERS_PER_DAY * 7; // bump once inside 7 days of expiry
const DEAL_TTL_EXTEND_TO: u32 = LEDGERS_PER_DAY * 45; // renew for 45 days

/// Upper bound on how many milestones a single deal can carry. Without a cap,
/// a buyer can create a deal with an enormous milestone vector: every later
/// `release_milestones` call then has to load, clone and re-serialize that
/// vector, and the persistent entry balloons in size. Bounding it keeps the
/// per-call cost of every deal predictable and stops one deal from becoming a
/// gas/DoS trap for the verifier who has to settle it.
const MAX_MILESTONES: u32 = 50;

/// Hard ceiling on how far in the future a deadline may be set (≈ 1 year).
/// The deadline is the *only* path by which a buyer can recover funds if a
/// deal stalls (`request_refund` requires `now >= deadline`). A fat-fingered
/// or malicious deadline decades out would lock the escrowed funds for all
/// practical purposes, since neither party could ever trigger the refund.
const MAX_DEAL_DURATION: u64 = 60 * 60 * 24 * 365;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    DealNotFound = 3,
    Unauthorized = 4,
    InvalidAmount = 5,
    DeadlineNotReached = 6,
    DeadlinePassed = 7,
    InvalidMilestone = 8,
    MilestoneAlreadyReleased = 9,
    ProtocolAlreadyCompleted = 10,
    InvalidDeadline = 11,
    EmptyMilestoneSelection = 12,
    /// A deal already exists under the supplied id. Previously `create_deal`
    /// reused `AlreadyInitialized` for this, which is about the contract
    /// instance, not an individual deal - callers could not tell the two
    /// apart.
    DealAlreadyExists = 13,
    /// Milestone vector exceeds `MAX_MILESTONES`.
    TooManyMilestones = 14,
    /// buyer, seller and verifier must all be distinct addresses. If the
    /// verifier is also the seller they could self-release every milestone
    /// with only their own signature; if the verifier is also the buyer they
    /// could drain their own deposit back out through the "release" path,
    /// bypassing the deadline/refund rules entirely.
    InvalidParties = 15,
    /// A nested (re-entrant) call into a state-changing entrypoint was
    /// detected while an outer call was still in progress. The token address
    /// is caller-supplied, so a malicious token contract could otherwise
    /// re-enter mid-transfer.
    Reentrancy = 16,
    /// A checked integer operation overflowed. Only reachable with crafted,
    /// near-`i128::MAX` amounts; surfaced as a clean error instead of a panic.
    ArithmeticError = 17,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum DealStatus {
    Created = 0,
    Funded = 1,
    Completed = 2,
    Refunded = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub amount: i128,
    pub is_released: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Deal {
    pub id: Symbol,
    pub buyer: Address,
    pub seller: Address,
    pub verifier: Address,
    /// Asset escrowed for this specific deal. Scoping the token to the deal
    /// (instead of one contract-wide asset set at `initialize`) lets the same
    /// deployed contract instance serve concurrent deals in different assets
    /// (native XLM, USDC, a custom SAC, ...) without redeploying per asset -
    /// the single-asset design was the main ceiling on how many independent
    /// buyer/seller pairs the contract could realistically serve.
    pub token: Address,
    pub total_amount: i128,
    pub remaining_amount: i128,
    pub deadline: u64,
    pub status: DealStatus,
    pub milestones: Vec<Milestone>,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Deal(Symbol),
    /// Re-entrancy latch. Set on entry to every fund-moving entrypoint,
    /// cleared on exit via `Drop`. Soroban rolls back *all* storage writes if
    /// a transaction traps, and a re-entrant call is always within the same
    /// transaction, so the latch can never leak across transactions even if
    /// an inner call panics.
    Guard,
}

#[contract]
pub struct A2AEscrow;

/// RAII-style re-entrancy latch. Constructing it fails if the latch is
/// already held (i.e. we are inside a nested call); dropping it releases the
/// latch. Because `token` in every `Deal` is an address the buyer chose,
/// `token::Client::transfer` below is an call into *untrusted* code that can
/// call straight back into this contract - the classic re-entrancy setup.
/// Combined with the strict checks-effects-interactions ordering in every
/// entrypoint (state is persisted *before* the transfer), this closes both
/// same-function and cross-function re-entrancy.
struct Guard<'a> {
    env: &'a Env,
}

impl<'a> Guard<'a> {
    fn acquire(env: &'a Env) -> Result<Self, Error> {
        if env.storage().instance().has(&DataKey::Guard) {
            return Err(Error::Reentrancy);
        }
        env.storage().instance().set(&DataKey::Guard, &true);
        Ok(Guard { env })
    }
}

impl<'a> Drop for Guard<'a> {
    fn drop(&mut self) {
        self.env.storage().instance().remove(&DataKey::Guard);
    }
}

#[contractimpl]
impl A2AEscrow {
    /// Register the protocol admin. The admin has no special fund-moving
    /// power today (every transfer still requires the buyer/verifier's own
    /// signature) - this is reserved for future protocol-level operations
    /// (e.g. fee configuration) and kept auth-gated so nobody else can
    /// squat the admin slot.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        admin.require_auth();

        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().extend_ttl(DEAL_TTL_THRESHOLD, DEAL_TTL_EXTEND_TO);
        Ok(())
    }

    /// Create a new deal and lock funds into escrow for a caller-specified
    /// token, so the contract can host many concurrent deals across
    /// different assets rather than being pinned to one at deploy time.
    pub fn create_deal(
        env: Env,
        deal_id: Symbol,
        buyer: Address,
        seller: Address,
        verifier: Address,
        token: Address,
        total_amount: i128,
        milestones: Vec<Milestone>,
        deadline: u64,
    ) -> Result<(), Error> {
        buyer.require_auth();
        let _guard = Guard::acquire(&env)?;

        let key = DataKey::Deal(deal_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::DealAlreadyExists);
        }

        // buyer / seller / verifier must be three distinct parties. If any two
        // collapse, the two-of-three trust model (buyer funds, verifier
        // releases, buyer refunds after deadline) degenerates into a single
        // party being able to move the escrowed funds at will.
        if buyer == seller || buyer == verifier || seller == verifier {
            return Err(Error::InvalidParties);
        }

        if total_amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let now = env.ledger().timestamp();
        if deadline <= now {
            return Err(Error::InvalidDeadline);
        }
        if deadline - now > MAX_DEAL_DURATION {
            return Err(Error::InvalidDeadline);
        }

        if milestones.is_empty() {
            return Err(Error::InvalidMilestone);
        }
        if milestones.len() > MAX_MILESTONES {
            return Err(Error::TooManyMilestones);
        }

        // Validate every milestone is strictly positive and that they sum to
        // total_amount. Without the positivity check, a mix of oversized and
        // negative milestone amounts could still sum to total_amount while
        // letting release_milestone/complete_deal transfer a negative amount,
        // which token contracts treat as a transfer in the *opposite*
        // direction - silently draining the seller (or the contract's pooled
        // balance from other deals) instead of paying them. `checked_add`
        // turns a crafted near-overflow sum into a clean error instead of a
        // release-profile panic.
        let mut sum: i128 = 0;
        for m in milestones.iter() {
            if m.amount <= 0 {
                return Err(Error::InvalidAmount);
            }
            if m.is_released {
                return Err(Error::InvalidMilestone);
            }
            sum = sum.checked_add(m.amount).ok_or(Error::ArithmeticError)?;
        }
        if sum != total_amount {
            return Err(Error::InvalidAmount);
        }

        let deal = Deal {
            id: deal_id.clone(),
            buyer: buyer.clone(),
            seller,
            verifier,
            token: token.clone(),
            total_amount,
            remaining_amount: total_amount,
            deadline,
            status: DealStatus::Funded,
            milestones,
        };

        // Checks-effects-interactions: persist the fully-formed deal *before*
        // calling into the (untrusted, buyer-chosen) token contract. If the
        // transfer fails the whole transaction reverts, so writing first is
        // safe; writing last would leave a window a re-entrant token could
        // exploit.
        env.storage().persistent().set(&key, &deal);
        env.storage().persistent().extend_ttl(&key, DEAL_TTL_THRESHOLD, DEAL_TTL_EXTEND_TO);

        // Transfer funds from buyer to contract, in the deal's own token.
        let client = token::Client::new(&env, &token);
        client.transfer(&buyer, &env.current_contract_address(), &total_amount);

        // Emit creation event
        env.events().publish(
            (symbol_short!("deal_new"), deal_id),
            (buyer, total_amount),
        );

        Ok(())
    }

    /// Authorized release of a specific milestone by the Verifier Agent
    pub fn release_milestone(env: Env, deal_id: Symbol, milestone_idx: u32) -> Result<(), Error> {
        let mut indices = Vec::new(&env);
        indices.push_back(milestone_idx);
        Self::release_milestones(env, deal_id, indices)
    }

    /// Release several milestones in a single transaction and a single token
    /// transfer. A verifier settling multiple completed phases at once no
    /// longer pays per-milestone base fees and resource costs one call at a
    /// time - this is the difference between a workflow that stays cheap as
    /// deal volume grows and one where cost scales linearly with milestone
    /// count.
    pub fn release_milestones(env: Env, deal_id: Symbol, milestone_indices: Vec<u32>) -> Result<(), Error> {
        let _guard = Guard::acquire(&env)?;

        if milestone_indices.is_empty() {
            return Err(Error::EmptyMilestoneSelection);
        }

        let key = DataKey::Deal(deal_id.clone());
        let mut deal: Deal = env.storage().persistent().get(&key).ok_or(Error::DealNotFound)?;

        deal.verifier.require_auth();

        if deal.status != DealStatus::Funded {
            return Err(Error::ProtocolAlreadyCompleted);
        }

        // Once the deadline is reached the buyer is entitled to a full refund
        // via `request_refund`. Allowing the verifier to keep releasing funds
        // to the seller past that point would let a slow or malicious verifier
        // race (or front-run) the buyer's refund and hand over money for work
        // that was never delivered on time. After the deadline the only legal
        // move is the refund.
        if env.ledger().timestamp() >= deal.deadline {
            return Err(Error::DeadlinePassed);
        }

        let mut milestones = deal.milestones.clone();
        let mut total_release: i128 = 0;

        // Re-reading from `milestones` (mutated in-loop below) rather than an
        // immutable snapshot means a duplicate index in the same batch hits
        // the `MilestoneAlreadyReleased` check on its second occurrence,
        // which is exactly the guard needed to prevent double-paying it.
        for idx in milestone_indices.iter() {
            let mut milestone = milestones.get(idx).ok_or(Error::InvalidMilestone)?;
            if milestone.is_released {
                return Err(Error::MilestoneAlreadyReleased);
            }
            total_release = total_release
                .checked_add(milestone.amount)
                .ok_or(Error::ArithmeticError)?;
            milestone.is_released = true;
            milestones.set(idx, milestone);
        }

        deal.milestones = milestones;
        deal.remaining_amount = deal
            .remaining_amount
            .checked_sub(total_release)
            .ok_or(Error::ArithmeticError)?;
        // Defensive: milestone bookkeeping should make this unreachable, but a
        // negative remainder would mean we just tried to pay out more than the
        // deal holds (i.e. dip into another deal's pooled funds).
        if deal.remaining_amount < 0 {
            return Err(Error::InvalidAmount);
        }
        if deal.remaining_amount == 0 {
            deal.status = DealStatus::Completed;
        }

        // Effects before interaction: persist the mutated deal, then transfer.
        env.storage().persistent().set(&key, &deal);
        env.storage().persistent().extend_ttl(&key, DEAL_TTL_THRESHOLD, DEAL_TTL_EXTEND_TO);

        // Single aggregate transfer for the whole batch instead of one
        // transfer per milestone.
        let client = token::Client::new(&env, &deal.token);
        client.transfer(&env.current_contract_address(), &deal.seller, &total_release);

        env.events().publish(
            (symbol_short!("milestone"), deal_id),
            (milestone_indices, total_release),
        );

        Ok(())
    }

    /// Complete the deal and release all remaining funds
    pub fn complete_deal(env: Env, deal_id: Symbol) -> Result<(), Error> {
        let _guard = Guard::acquire(&env)?;

        let key = DataKey::Deal(deal_id.clone());
        let mut deal: Deal = env.storage().persistent().get(&key).ok_or(Error::DealNotFound)?;

        deal.verifier.require_auth();

        if deal.status != DealStatus::Funded {
            return Err(Error::ProtocolAlreadyCompleted);
        }

        // Same rule as `release_milestones`: after the deadline the buyer's
        // refund right takes precedence over any further verifier release.
        if env.ledger().timestamp() >= deal.deadline {
            return Err(Error::DeadlinePassed);
        }

        let amount_to_release = deal.remaining_amount;

        // Mark every still-unreleased milestone as released so the persisted
        // deal stays internally consistent with `remaining_amount == 0`.
        let mut milestones = deal.milestones.clone();
        let len = milestones.len();
        for i in 0..len {
            let mut m = milestones.get(i).unwrap();
            if !m.is_released {
                m.is_released = true;
                milestones.set(i, m);
            }
        }
        deal.milestones = milestones;

        // Update state, then transfer (checks-effects-interactions).
        deal.remaining_amount = 0;
        deal.status = DealStatus::Completed;
        env.storage().persistent().set(&key, &deal);
        env.storage().persistent().extend_ttl(&key, DEAL_TTL_THRESHOLD, DEAL_TTL_EXTEND_TO);

        let client = token::Client::new(&env, &deal.token);
        client.transfer(&env.current_contract_address(), &deal.seller, &amount_to_release);

        env.events().publish(
            (symbol_short!("completed"), deal_id),
            amount_to_release,
        );

        Ok(())
    }

    /// Request a refund if the deadline has passed without completion
    pub fn request_refund(env: Env, deal_id: Symbol) -> Result<(), Error> {
        let _guard = Guard::acquire(&env)?;

        let key = DataKey::Deal(deal_id.clone());
        let mut deal: Deal = env.storage().persistent().get(&key).ok_or(Error::DealNotFound)?;

        deal.buyer.require_auth();

        if deal.status != DealStatus::Funded {
            return Err(Error::ProtocolAlreadyCompleted);
        }

        if env.ledger().timestamp() < deal.deadline {
            return Err(Error::DeadlineNotReached);
        }

        let amount_to_refund = deal.remaining_amount;

        // Update state, then transfer (checks-effects-interactions).
        deal.remaining_amount = 0;
        deal.status = DealStatus::Refunded;
        env.storage().persistent().set(&key, &deal);
        env.storage().persistent().extend_ttl(&key, DEAL_TTL_THRESHOLD, DEAL_TTL_EXTEND_TO);

        // Transfer funds back to buyer
        let client = token::Client::new(&env, &deal.token);
        client.transfer(&env.current_contract_address(), &deal.buyer, &amount_to_refund);

        env.events().publish(
            (symbol_short!("refunded"), deal_id),
            amount_to_refund,
        );

        Ok(())
    }

    /// Retrieve the current status of a specific deal
    pub fn get_deal(env: Env, deal_id: Symbol) -> Option<Deal> {
        env.storage().persistent().get(&DataKey::Deal(deal_id))
    }
}
