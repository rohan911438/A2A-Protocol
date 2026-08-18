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
}

#[contract]
pub struct A2AEscrow;

#[contractimpl]
impl A2AEscrow {
    /// Register the protocol admin. The admin has no special fund-moving
    /// power today (every transfer still requires the buyer/verifier's own
    /// signature) - this is reserved for future protocol-level operations
    /// (e.g. fee configuration) and kept auth-gated so nobody else can
    /// squat the admin slot.
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();

        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().extend_ttl(DEAL_TTL_THRESHOLD, DEAL_TTL_EXTEND_TO);
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

        let key = DataKey::Deal(deal_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AlreadyInitialized);
        }

        if total_amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        if deadline <= env.ledger().timestamp() {
            return Err(Error::InvalidDeadline);
        }

        // Validate every milestone is strictly positive and that they sum to
        // total_amount. Without the positivity check, a mix of oversized and
        // negative milestone amounts could still sum to total_amount while
        // letting release_milestone/complete_deal transfer a negative amount,
        // which token contracts treat as a transfer in the *opposite*
        // direction - silently draining the seller (or the contract's pooled
        // balance from other deals) instead of paying them.
        let mut sum: i128 = 0;
        for m in milestones.iter() {
            if m.amount <= 0 {
                return Err(Error::InvalidAmount);
            }
            sum += m.amount;
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

        // Transfer funds from buyer to contract, in the deal's own token.
        let client = token::Client::new(&env, &token);
        client.transfer(&buyer, &env.current_contract_address(), &total_amount);

        env.storage().persistent().set(&key, &deal);
        env.storage().persistent().extend_ttl(&key, DEAL_TTL_THRESHOLD, DEAL_TTL_EXTEND_TO);

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
        if milestone_indices.is_empty() {
            return Err(Error::EmptyMilestoneSelection);
        }

        let key = DataKey::Deal(deal_id.clone());
        let mut deal: Deal = env.storage().persistent().get(&key).ok_or(Error::DealNotFound)?;

        deal.verifier.require_auth();

        if deal.status != DealStatus::Funded {
            return Err(Error::ProtocolAlreadyCompleted);
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
            total_release += milestone.amount;
            milestone.is_released = true;
            milestones.set(idx, milestone);
        }

        // Single aggregate transfer for the whole batch instead of one
        // transfer per milestone.
        let client = token::Client::new(&env, &deal.token);
        client.transfer(&env.current_contract_address(), &deal.seller, &total_release);

        deal.milestones = milestones;
        deal.remaining_amount -= total_release;
        if deal.remaining_amount == 0 {
            deal.status = DealStatus::Completed;
        }

        env.storage().persistent().set(&key, &deal);
        env.storage().persistent().extend_ttl(&key, DEAL_TTL_THRESHOLD, DEAL_TTL_EXTEND_TO);

        env.events().publish(
            (symbol_short!("milestone"), deal_id),
            (milestone_indices, total_release),
        );

        Ok(())
    }

    /// Complete the deal and release all remaining funds
    pub fn complete_deal(env: Env, deal_id: Symbol) -> Result<(), Error> {
        let key = DataKey::Deal(deal_id.clone());
        let mut deal: Deal = env.storage().persistent().get(&key).ok_or(Error::DealNotFound)?;

        deal.verifier.require_auth();

        if deal.status != DealStatus::Funded {
            return Err(Error::ProtocolAlreadyCompleted);
        }

        let amount_to_release = deal.remaining_amount;

        // Transfer all remaining funds to seller
        let client = token::Client::new(&env, &deal.token);
        client.transfer(&env.current_contract_address(), &deal.seller, &amount_to_release);

        // Update state
        deal.remaining_amount = 0;
        deal.status = DealStatus::Completed;
        env.storage().persistent().set(&key, &deal);
        env.storage().persistent().extend_ttl(&key, DEAL_TTL_THRESHOLD, DEAL_TTL_EXTEND_TO);

        env.events().publish(
            (symbol_short!("completed"), deal_id),
            amount_to_release,
        );

        Ok(())
    }

    /// Request a refund if the deadline has passed without completion
    pub fn request_refund(env: Env, deal_id: Symbol) -> Result<(), Error> {
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

        // Transfer funds back to buyer
        let client = token::Client::new(&env, &deal.token);
        client.transfer(&env.current_contract_address(), &deal.buyer, &amount_to_refund);

        // Update state
        deal.remaining_amount = 0;
        deal.status = DealStatus::Refunded;
        env.storage().persistent().set(&key, &deal);
        env.storage().persistent().extend_ttl(&key, DEAL_TTL_THRESHOLD, DEAL_TTL_EXTEND_TO);

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
