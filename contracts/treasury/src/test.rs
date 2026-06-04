#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

fn setup(env: &Env) -> (Address, TreasuryContractClient<'_>, Address, Address, Address) {
    // A SAC we control, standing in for native XLM.
    let issuer = Address::generate(env);
    let sac = env.register_stellar_asset_contract_v2(issuer);
    let token = sac.address();

    let admin = Address::generate(env);
    let deployer = Address::generate(env);

    let contract_id = env.register(TreasuryContract, ());
    let client = TreasuryContractClient::new(env, &contract_id);
    client.initialize(&admin, &deployer, &token);

    // Mint some balance into the treasury so it has revenue to move.
    let sac_admin = StellarAssetClient::new(env, &token);
    sac_admin.mint(&contract_id, &1_000_000);

    (contract_id, client, admin, deployer, token)
}

#[test]
fn initializes_state() {
    let env = Env::default();
    env.mock_all_auths();
    let (_id, client, admin, deployer, _token) = setup(&env);
    assert_eq!(client.admin(), admin);
    assert_eq!(client.deployer(), deployer);
}

#[test]
#[should_panic(expected = "already initialized")]
fn cannot_reinitialize() {
    let env = Env::default();
    env.mock_all_auths();
    let (_id, client, admin, deployer, token) = setup(&env);
    client.initialize(&admin, &deployer, &token);
}

#[test]
fn fund_deployer_moves_native_to_deployer() {
    let env = Env::default();
    env.mock_all_auths();
    let (id, client, _admin, deployer, token) = setup(&env);

    client.fund_deployer(&250_000);

    let tok = TokenClient::new(&env, &token);
    assert_eq!(tok.balance(&deployer), 250_000);
    assert_eq!(tok.balance(&id), 750_000);
    assert_eq!(client.native_balance(), 750_000);
}

#[test]
#[should_panic(expected = "amount must be positive")]
fn fund_deployer_rejects_non_positive() {
    let env = Env::default();
    env.mock_all_auths();
    let (_id, client, _admin, _deployer, _token) = setup(&env);
    client.fund_deployer(&0);
}

#[test]
fn fund_deployer_requires_admin_auth() {
    let env = Env::default();
    env.mock_all_auths();
    let (_id, client, _admin, _deployer, _token) = setup(&env);

    // Stop mocking auths and provide none — require_auth() must reject the call.
    env.set_auths(&[]);
    let res = client.try_fund_deployer(&100);
    assert!(res.is_err());
}

#[test]
fn withdraw_moves_arbitrary_token() {
    let env = Env::default();
    env.mock_all_auths();
    let (id, client, _admin, _deployer, token) = setup(&env);
    let cold = Address::generate(&env);

    client.withdraw(&token, &400_000, &cold);

    let tok = TokenClient::new(&env, &token);
    assert_eq!(tok.balance(&cold), 400_000);
    assert_eq!(tok.balance(&id), 600_000);
}

#[test]
fn set_deployer_redirects_funding() {
    let env = Env::default();
    env.mock_all_auths();
    let (_id, client, _admin, _deployer, token) = setup(&env);
    let new_deployer = Address::generate(&env);

    client.set_deployer(&new_deployer);
    assert_eq!(client.deployer(), new_deployer);

    client.fund_deployer(&123);
    let tok = TokenClient::new(&env, &token);
    assert_eq!(tok.balance(&new_deployer), 123);
}

#[test]
fn set_admin_transfers_control() {
    let env = Env::default();
    env.mock_all_auths();
    let (_id, client, _admin, _deployer, _token) = setup(&env);
    let new_admin = Address::generate(&env);
    client.set_admin(&new_admin);
    assert_eq!(client.admin(), new_admin);
}
