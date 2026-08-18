#![cfg(test)]
use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{token, vec, Address, Env};

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
