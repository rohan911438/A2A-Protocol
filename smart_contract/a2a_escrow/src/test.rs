#![cfg(test)]
use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{token, vec, Address, Env, Vec};

#[test]
fn test_deal_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let verifier = Address::generate(&env);
    
    // Create a dummy token for testing
    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract(token_admin.clone());
    let token_client = token::Client::new(&env, &token_addr);
    token::StellarAssetClient::new(&env, &token_addr).mint(&buyer, &1000);

    // Register and initialize the contract
    let contract_id = env.register_contract(None, A2AEscrow);
    let client = A2AEscrowClient::new(&env, &contract_id);
    client.initialize(&admin);

    let deal_id = symbol_short!("deal1");
    let total_amount = 500;
    let deadline = 1000;

    let milestones = vec![
        &env,
        Milestone { amount: 200, is_released: false },
        Milestone { amount: 300, is_released: false },
    ];

    // 1. Create Deal
    client.create_deal(&deal_id, &buyer, &seller, &verifier, &token_addr, &total_amount, &milestones, &deadline);

    // Verify buyer balance decreased and contract balance increased
    assert_eq!(token_client.balance(&buyer), 500);
    assert_eq!(token_client.balance(&contract_id), 500);

    // 2. Release Milestone 0
    client.release_milestone(&deal_id, &0);
    assert_eq!(token_client.balance(&seller), 200);
    assert_eq!(token_client.balance(&contract_id), 300);

    // 3. Complete Deal
    client.complete_deal(&deal_id);
    assert_eq!(token_client.balance(&seller), 500);
    assert_eq!(token_client.balance(&contract_id), 0);

    let final_deal = client.get_deal(&deal_id).unwrap();
    assert_eq!(final_deal.status, DealStatus::Completed);
}

#[test]
fn test_batch_milestone_release() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let verifier = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract(token_admin.clone());
    let token_client = token::Client::new(&env, &token_addr);
    token::StellarAssetClient::new(&env, &token_addr).mint(&buyer, &1000);

    let contract_id = env.register_contract(None, A2AEscrow);
    let client = A2AEscrowClient::new(&env, &contract_id);
    client.initialize(&admin);

    let deal_id = symbol_short!("batch1");
    let total_amount = 600;
    let deadline = 1000;

    let milestones = vec![
        &env,
        Milestone { amount: 100, is_released: false },
        Milestone { amount: 200, is_released: false },
        Milestone { amount: 300, is_released: false },
    ];

    client.create_deal(&deal_id, &buyer, &seller, &verifier, &token_addr, &total_amount, &milestones, &deadline);

    // Release milestones 0 and 2 in a single call/transfer.
    let indices = vec![&env, 0u32, 2u32];
    client.release_milestones(&deal_id, &indices);

    assert_eq!(token_client.balance(&seller), 400);
    assert_eq!(token_client.balance(&contract_id), 200);

    let deal = client.get_deal(&deal_id).unwrap();
    assert_eq!(deal.status, DealStatus::Funded);
    assert!(deal.milestones.get(0).unwrap().is_released);
    assert!(!deal.milestones.get(1).unwrap().is_released);
    assert!(deal.milestones.get(2).unwrap().is_released);

    // Re-releasing an already-released milestone in a batch must fail and
    // must not double-pay the seller.
    let dup = vec![&env, 0u32];
    let result = client.try_release_milestones(&deal_id, &dup);
    assert!(result.is_err());
    assert_eq!(token_client.balance(&seller), 400);
}

#[test]
fn test_refund_logic() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let verifier = Address::generate(&env);
    
    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract(token_admin.clone());
    let token_client = token::Client::new(&env, &token_addr);
    token::StellarAssetClient::new(&env, &token_addr).mint(&buyer, &1000);

    let contract_id = env.register_contract(None, A2AEscrow);
    let client = A2AEscrowClient::new(&env, &contract_id);
    client.initialize(&admin);

    let deal_id = symbol_short!("refund1");
    let total_amount = 500;
    let deadline = 1000;

    let milestones = vec![&env, Milestone { amount: 500, is_released: false }];

    client.create_deal(&deal_id, &buyer, &seller, &verifier, &token_addr, &total_amount, &milestones, &deadline);

    // Try refunding before deadline - should fail (panics in mock auth mode if Result is not handled or custom error is thrown)
    // Here we wrap in a check or just advance the ledger
    
    // Advance ledger time to past deadline
    env.ledger().with_mut(|li| {
        li.timestamp = 2000;
    });

    client.request_refund(&deal_id);
    assert_eq!(token_client.balance(&buyer), 1000);
    assert_eq!(token_client.balance(&contract_id), 0);

    let final_deal = client.get_deal(&deal_id).unwrap();
    assert_eq!(final_deal.status, DealStatus::Refunded);
}

// --- Hardening regression tests -------------------------------------------

struct Fixture {
    env: Env,
    contract_id: Address,
    token_addr: Address,
    buyer: Address,
    seller: Address,
    verifier: Address,
}

impl Fixture {
    fn client(&self) -> A2AEscrowClient<'_> {
        A2AEscrowClient::new(&self.env, &self.contract_id)
    }
}

fn setup() -> Fixture {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let verifier = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract(token_admin.clone());
    token::StellarAssetClient::new(&env, &token_addr).mint(&buyer, &1_000_000);

    let contract_id = env.register_contract(None, A2AEscrow);
    A2AEscrowClient::new(&env, &contract_id).initialize(&admin);

    Fixture { env, contract_id, token_addr, buyer, seller, verifier }
}

#[test]
fn test_rejects_non_distinct_parties() {
    let f = setup();
    let milestones = vec![&f.env, Milestone { amount: 100, is_released: false }];

    // verifier == seller: seller could self-release.
    let r = f.client().try_create_deal(
        &symbol_short!("d_vs"), &f.buyer, &f.seller, &f.seller,
        &f.token_addr, &100i128, &milestones, &1000u64,
    );
    assert_eq!(r, Err(Ok(Error::InvalidParties)));

    // verifier == buyer: buyer could drain their own deposit past the rules.
    let r = f.client().try_create_deal(
        &symbol_short!("d_vb"), &f.buyer, &f.seller, &f.buyer,
        &f.token_addr, &100i128, &milestones, &1000u64,
    );
    assert_eq!(r, Err(Ok(Error::InvalidParties)));

    // buyer == seller.
    let r = f.client().try_create_deal(
        &symbol_short!("d_bs"), &f.buyer, &f.buyer, &f.verifier,
        &f.token_addr, &100i128, &milestones, &1000u64,
    );
    assert_eq!(r, Err(Ok(Error::InvalidParties)));
}

#[test]
fn test_rejects_deadline_out_of_bounds() {
    let f = setup();
    let milestones = vec![&f.env, Milestone { amount: 100, is_released: false }];

    // Past deadline.
    f.env.ledger().with_mut(|li| li.timestamp = 5_000);
    let r = f.client().try_create_deal(
        &symbol_short!("d_past"), &f.buyer, &f.seller, &f.verifier,
        &f.token_addr, &100i128, &milestones, &4_000u64,
    );
    assert_eq!(r, Err(Ok(Error::InvalidDeadline)));

    // Deadline further out than MAX_DEAL_DURATION (~1 year) - would lock
    // funds effectively forever because refund needs now >= deadline.
    let far = 5_000u64 + 60 * 60 * 24 * 366;
    let r = f.client().try_create_deal(
        &symbol_short!("d_far"), &f.buyer, &f.seller, &f.verifier,
        &f.token_addr, &100i128, &milestones, &far,
    );
    assert_eq!(r, Err(Ok(Error::InvalidDeadline)));
}

#[test]
fn test_rejects_too_many_and_empty_milestones() {
    let f = setup();

    let empty: Vec<Milestone> = Vec::new(&f.env);
    let r = f.client().try_create_deal(
        &symbol_short!("d_empty"), &f.buyer, &f.seller, &f.verifier,
        &f.token_addr, &100i128, &empty, &1000u64,
    );
    assert_eq!(r, Err(Ok(Error::InvalidMilestone)));

    let mut many: Vec<Milestone> = Vec::new(&f.env);
    for _ in 0..51 {
        many.push_back(Milestone { amount: 1, is_released: false });
    }
    let r = f.client().try_create_deal(
        &symbol_short!("d_many"), &f.buyer, &f.seller, &f.verifier,
        &f.token_addr, &51i128, &many, &1000u64,
    );
    assert_eq!(r, Err(Ok(Error::TooManyMilestones)));
}

#[test]
fn test_duplicate_deal_id_rejected() {
    let f = setup();
    let milestones = vec![&f.env, Milestone { amount: 100, is_released: false }];
    let id = symbol_short!("dupe");

    f.client().create_deal(
        &id, &f.buyer, &f.seller, &f.verifier,
        &f.token_addr, &100i128, &milestones, &1000u64,
    );
    let r = f.client().try_create_deal(
        &id, &f.buyer, &f.seller, &f.verifier,
        &f.token_addr, &100i128, &milestones, &1000u64,
    );
    assert_eq!(r, Err(Ok(Error::DealAlreadyExists)));
}

#[test]
fn test_release_after_deadline_blocked_refund_still_works() {
    let f = setup();
    let token_client = token::Client::new(&f.env, &f.token_addr);
    let milestones = vec![
        &f.env,
        Milestone { amount: 100, is_released: false },
        Milestone { amount: 100, is_released: false },
    ];
    let id = symbol_short!("dl1");

    f.client().create_deal(
        &id, &f.buyer, &f.seller, &f.verifier,
        &f.token_addr, &200i128, &milestones, &1000u64,
    );

    // Past the deadline the verifier can no longer release to the seller.
    f.env.ledger().with_mut(|li| li.timestamp = 1_500);
    let r = f.client().try_release_milestone(&id, &0u32);
    assert_eq!(r, Err(Ok(Error::DeadlinePassed)));
    let r = f.client().try_complete_deal(&id);
    assert_eq!(r, Err(Ok(Error::DeadlinePassed)));
    assert_eq!(token_client.balance(&f.seller), 0);

    // The buyer's refund path is the only legal move, and it returns the
    // full escrowed amount.
    f.client().request_refund(&id);
    assert_eq!(token_client.balance(&f.seller), 0);
    let deal = f.client().get_deal(&id).unwrap();
    assert_eq!(deal.status, DealStatus::Refunded);
    assert_eq!(deal.remaining_amount, 0);
}

#[test]
fn test_negative_milestone_amount_rejected() {
    let f = setup();
    // Two milestones that sum to total_amount but one is negative: without
    // the positivity check a later release could transfer a negative amount
    // (a reverse transfer that drains the seller / the pool).
    let milestones = vec![
        &f.env,
        Milestone { amount: 300, is_released: false },
        Milestone { amount: -100, is_released: false },
    ];
    let r = f.client().try_create_deal(
        &symbol_short!("d_neg"), &f.buyer, &f.seller, &f.verifier,
        &f.token_addr, &200i128, &milestones, &1000u64,
    );
    assert_eq!(r, Err(Ok(Error::InvalidAmount)));
}

#[test]
fn test_complete_deal_marks_milestones_released() {
    let f = setup();
    let milestones = vec![
        &f.env,
        Milestone { amount: 100, is_released: false },
        Milestone { amount: 150, is_released: false },
    ];
    let id = symbol_short!("cmpl");
    f.client().create_deal(
        &id, &f.buyer, &f.seller, &f.verifier,
        &f.token_addr, &250i128, &milestones, &1000u64,
    );
    f.client().complete_deal(&id);
    let deal = f.client().get_deal(&id).unwrap();
    assert_eq!(deal.status, DealStatus::Completed);
    assert_eq!(deal.remaining_amount, 0);
    assert!(deal.milestones.iter().all(|m| m.is_released));
}

// --- Circuit breaker + initialization guard -----------------------------

fn setup_uninit() -> Fixture {
    let env = Env::default();
    env.mock_all_auths();

    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let verifier = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract(token_admin.clone());
    token::StellarAssetClient::new(&env, &token_addr).mint(&buyer, &1_000_000);

    let contract_id = env.register_contract(None, A2AEscrow);
    // Deliberately NOT initialized.
    Fixture { env, contract_id, token_addr, buyer, seller, verifier }
}

#[test]
fn test_create_deal_requires_init() {
    let f = setup_uninit();
    let milestones = vec![&f.env, Milestone { amount: 100, is_released: false }];
    let r = f.client().try_create_deal(
        &symbol_short!("noinit"), &f.buyer, &f.seller, &f.verifier,
        &f.token_addr, &100i128, &milestones, &1000u64,
    );
    assert_eq!(r, Err(Ok(Error::NotInitialized)));
}

#[test]
fn test_set_paused_requires_init() {
    let f = setup_uninit();
    let r = f.client().try_set_paused(&true);
    assert_eq!(r, Err(Ok(Error::NotInitialized)));
}

#[test]
fn test_pause_blocks_new_deals_but_never_freezes_escrowed_funds() {
    let f = setup();
    let token_client = token::Client::new(&f.env, &f.token_addr);

    // A deal funded *before* the pause.
    let live = symbol_short!("live");
    let milestones = vec![
        &f.env,
        Milestone { amount: 100, is_released: false },
        Milestone { amount: 100, is_released: false },
    ];
    f.client().create_deal(
        &live, &f.buyer, &f.seller, &f.verifier,
        &f.token_addr, &200i128, &milestones, &10_000u64,
    );

    // Pause.
    f.client().set_paused(&true);
    assert!(f.client().is_paused());

    // New deals are refused.
    let r = f.client().try_create_deal(
        &symbol_short!("blocked"), &f.buyer, &f.seller, &f.verifier,
        &f.token_addr, &100i128,
        &vec![&f.env, Milestone { amount: 100, is_released: false }],
        &10_000u64,
    );
    assert_eq!(r, Err(Ok(Error::ContractPaused)));

    // ...but the already-escrowed deal can still be released while paused.
    f.client().release_milestone(&live, &0u32);
    assert_eq!(token_client.balance(&f.seller), 100);

    // ...and refunded while paused (advance past the deadline first).
    f.env.ledger().with_mut(|li| li.timestamp = 20_000);
    f.client().request_refund(&live);
    assert_eq!(token_client.balance(&f.buyer), 1_000_000 - 100);

    // Unpause restores normal deal creation.
    f.client().set_paused(&false);
    assert!(!f.client().is_paused());
    f.client().create_deal(
        &symbol_short!("resumed"), &f.buyer, &f.seller, &f.verifier,
        &f.token_addr, &100i128,
        &vec![&f.env, Milestone { amount: 100, is_released: false }],
        &30_000u64,
    );
}
