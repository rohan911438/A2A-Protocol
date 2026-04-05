#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Symbol, Vec,
};

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
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
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
    pub total_amount: i128,
    pub remaining_amount: i128,
    pub deadline: u64,
    pub status: DealStatus,
    pub milestones: Vec<Milestone>,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Token,
    Deal(Symbol),
}

#[contract]
pub struct A2AEscrow;

#[contractimpl]
impl A2AEscrow {
    /// Initialize the contract with management and the target asset (XLM/USDC)
    pub fn initialize(env: Env, admin: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
    }

    /// Create a new deal and lock funds into escrow
    pub fn create_deal(
        env: Env,
        deal_id: Symbol,
        buyer: Address,
        seller: Address,
        verifier: Address,
        total_amount: i128,
        milestones: Vec<Milestone>,
        deadline: u64,
    ) -> Result<(), Error> {
        buyer.require_auth();

        if env.storage().persistent().has(&DataKey::Deal(deal_id.clone())) {
            return Err(Error::AlreadyInitialized);
        }

        // Validate milestone amounts sum to total amount
        let mut sum: i128 = 0;
        for m in milestones.iter() {
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
            total_amount,
            remaining_amount: total_amount,
            deadline,
            status: DealStatus::Funded,
            milestones,
        };

        // Transfer funds from buyer to contract
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).ok_or(Error::NotInitialized)?;
        let client = token::Client::new(&env, &token_addr);
        client.transfer(&buyer, &env.current_contract_address(), &total_amount);

        env.storage().persistent().set(&DataKey::Deal(deal_id.clone()), &deal);

        // Emit creation event
        env.events().publish(
            (symbol_short!("deal_new"), deal_id),
            (buyer, total_amount),
        );

        Ok(())
    }

    /// Authorized release of a specific milestone by the Verifier Agent
    pub fn release_milestone(env: Env, deal_id: Symbol, milestone_idx: u32) -> Result<(), Error> {
        let mut deal: Deal = env.storage().persistent().get(&DataKey::Deal(deal_id.clone())).ok_or(Error::DealNotFound)?;
        
        deal.verifier.require_auth();

        if deal.status != DealStatus::Funded {
            return Err(Error::ProtocolAlreadyCompleted);
        }

        let mut milestones = deal.milestones;
        let mut milestone = milestones.get(milestone_idx).ok_or(Error::InvalidMilestone)?;
        
        if milestone.is_released {
            return Err(Error::MilestoneAlreadyReleased);
        }

        // Transfer milestone amount to seller
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).ok_or(Error::NotInitialized)?;
        let client = token::Client::new(&env, &token_addr);
        let milestone_amount = milestone.amount;
        client.transfer(&env.current_contract_address(), &deal.seller, &milestone_amount);

        // Update state
        milestone.is_released = true;
        milestones.set(milestone_idx, milestone);
        deal.milestones = milestones;
        deal.remaining_amount -= milestone_amount;

        if deal.remaining_amount == 0 {
            deal.status = DealStatus::Completed;
        }

        env.storage().persistent().set(&DataKey::Deal(deal_id.clone()), &deal);
        
        env.events().publish(
            (symbol_short!("milestone"), deal_id),
            milestone_idx,
        );

        Ok(())
    }

    /// Complete the deal and release all remaining funds
    pub fn complete_deal(env: Env, deal_id: Symbol) -> Result<(), Error> {
        let mut deal: Deal = env.storage().persistent().get(&DataKey::Deal(deal_id.clone())).ok_or(Error::DealNotFound)?;
        
        deal.verifier.require_auth();

        if deal.status != DealStatus::Funded {
            return Err(Error::ProtocolAlreadyCompleted);
        }

        let amount_to_release = deal.remaining_amount;

        // Transfer all remaining funds to seller
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).ok_or(Error::NotInitialized)?;
        let client = token::Client::new(&env, &token_addr);
        client.transfer(&env.current_contract_address(), &deal.seller, &amount_to_release);

        // Update state
        deal.remaining_amount = 0;
        deal.status = DealStatus::Completed;
        env.storage().persistent().set(&DataKey::Deal(deal_id.clone()), &deal);

        env.events().publish(
            (symbol_short!("completed"), deal_id),
            amount_to_release,
        );

        Ok(())
    }

    /// Request a refund if the deadline has passed without completion
    pub fn request_refund(env: Env, deal_id: Symbol) -> Result<(), Error> {
        let mut deal: Deal = env.storage().persistent().get(&DataKey::Deal(deal_id.clone())).ok_or(Error::DealNotFound)?;
        
        deal.buyer.require_auth();

        if deal.status != DealStatus::Funded {
            return Err(Error::ProtocolAlreadyCompleted);
        }

        if env.ledger().timestamp() < deal.deadline {
            return Err(Error::DeadlineNotReached);
        }

        let amount_to_refund = deal.remaining_amount;

        // Transfer funds back to buyer
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).ok_or(Error::NotInitialized)?;
        let client = token::Client::new(&env, &token_addr);
        client.transfer(&env.current_contract_address(), &deal.buyer, &amount_to_refund);

        // Update state
        deal.remaining_amount = 0;
        deal.status = DealStatus::Refunded;
        env.storage().persistent().set(&DataKey::Deal(deal_id.clone()), &deal);

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
