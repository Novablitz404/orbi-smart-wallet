#![no_std]

//! Orbi Treasury
//!
//! Holds Orbi's protocol revenue (the fees collected by the relay) and lets the
//! admin top up the Orbi deployer (gas tank) on demand.
//!
//! Security model:
//! - Every state-changing call requires the admin's authorization.
//! - `fund_deployer` can ONLY send native XLM to the deployer address registered
//!   at initialization — it can never be redirected, so a mistyped recipient
//!   cannot drain the treasury. Use it for routine gas-tank top-ups.
//! - `withdraw` is the generic escape hatch (any token, any recipient) for moving
//!   revenue to cold storage. It is admin-only and emits an event.
//! - All movements emit events for off-chain auditing.
//!
//! The admin should be a hardened key — ideally a multisig classic account or a
//! passkey-secured smart wallet — since it controls all of Orbi's revenue.

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype,
    token::TokenClient,
    Address, BytesN, Env,
};

#[contracttype]
pub enum DataKey {
    Admin,
    Deployer,
    NativeToken,
}

/// Emitted when the admin tops up the deployer (gas tank) with native XLM.
#[contractevent]
#[derive(Clone)]
pub struct FundDeployer {
    #[topic]
    pub deployer: Address,
    pub amount: i128,
}

/// Emitted when the admin withdraws a token to an arbitrary address.
#[contractevent]
#[derive(Clone)]
pub struct Withdraw {
    #[topic]
    pub to: Address,
    #[topic]
    pub token: Address,
    pub amount: i128,
}

#[contract]
pub struct TreasuryContract;

#[contractimpl]
impl TreasuryContract {
    /// Initialize the treasury. Callable once.
    ///
    /// - `admin`: the only address that can fund / withdraw / reconfigure.
    /// - `deployer`: the Orbi deployer (gas tank) account that `fund_deployer` tops up.
    /// - `native_token`: the native XLM Stellar Asset Contract address.
    pub fn initialize(env: Env, admin: Address, deployer: Address, native_token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Deployer, &deployer);
        env.storage().instance().set(&DataKey::NativeToken, &native_token);
        env.storage().instance().extend_ttl(100_000, 100_000);
    }

    /// Top up the registered Orbi deployer with `amount` stroops of native XLM.
    /// Admin only. The recipient is fixed to the stored deployer — it can never
    /// be redirected to an arbitrary address.
    pub fn fund_deployer(env: Env, amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let deployer: Address = env.storage().instance().get(&DataKey::Deployer).unwrap();
        let native: Address = env.storage().instance().get(&DataKey::NativeToken).unwrap();
        TokenClient::new(&env, &native).transfer(
            &env.current_contract_address(),
            &deployer,
            &amount,
        );
        FundDeployer { deployer, amount }.publish(&env);
        env.storage().instance().extend_ttl(100_000, 100_000);
    }

    /// Withdraw any token to any address. Admin only. Escape hatch for moving
    /// revenue to cold storage.
    pub fn withdraw(env: Env, token: Address, amount: i128, to: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        TokenClient::new(&env, &token).transfer(
            &env.current_contract_address(),
            &to,
            &amount,
        );
        Withdraw { to, token, amount }.publish(&env);
        env.storage().instance().extend_ttl(100_000, 100_000);
    }

    /// How much of `token` the treasury holds.
    pub fn balance(env: Env, token: Address) -> i128 {
        TokenClient::new(&env, &token).balance(&env.current_contract_address())
    }

    /// Convenience: native XLM balance held by the treasury.
    pub fn native_balance(env: Env) -> i128 {
        let native: Address = env.storage().instance().get(&DataKey::NativeToken).unwrap();
        TokenClient::new(&env, &native).balance(&env.current_contract_address())
    }

    /// Update the deployer that `fund_deployer` tops up. Admin only.
    pub fn set_deployer(env: Env, new_deployer: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Deployer, &new_deployer);
        env.storage().instance().extend_ttl(100_000, 100_000);
    }

    /// Transfer admin rights to a new address. Admin only.
    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &new_admin);
        env.storage().instance().extend_ttl(100_000, 100_000);
    }

    /// Upgrade contract logic. Admin only. Pass the wasm hash of the new contract
    /// uploaded via `stellar contract install`.
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        env.storage().instance().extend_ttl(100_000, 100_000);
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn deployer(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Deployer).unwrap()
    }
}

mod test;
