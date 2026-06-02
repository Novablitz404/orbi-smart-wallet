#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, panic_with_error, Address, BytesN, Env};

/// Shared upgrade proposal type. Field names and types must stay in sync with
/// the copy in smart_wallet/src/types.rs — both are encoded as the same XDR
/// ScMap so cross-contract deserialization works without a shared crate.
#[contracttype]
#[derive(Clone)]
pub struct UpgradeProposal {
    pub new_wasm_hash: BytesN<32>,
    pub unlock_ledger: u32,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Pending,
}

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized     = 2,
    NoUpgradePending   = 3,
}

// ~7 days at 5 s/ledger
const TIMELOCK_LEDGERS: u32 = 120_960;

#[contract]
pub struct UpgradeRegistry;

#[contractimpl]
impl UpgradeRegistry {
    /// One-time setup. Sets the admin (Orbi's deployer key).
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Propose a wasm upgrade for all wallets. Admin only.
    /// After TIMELOCK_LEDGERS any wallet can call execute_upgrade() to apply it.
    pub fn propose_upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotInitialized));
        admin.require_auth();

        let unlock_ledger = env.ledger().sequence() + TIMELOCK_LEDGERS;
        env.storage()
            .instance()
            .set(&DataKey::Pending, &UpgradeProposal { new_wasm_hash, unlock_ledger });
    }

    /// Cancel a pending upgrade before it executes. Admin only.
    pub fn cancel_upgrade(env: Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotInitialized));
        admin.require_auth();

        if !env.storage().instance().has(&DataKey::Pending) {
            panic_with_error!(&env, Error::NoUpgradePending);
        }
        env.storage().instance().remove(&DataKey::Pending);
    }

    /// Returns the pending upgrade proposal if one exists.
    /// Called by each wallet's execute_upgrade() via cross-contract call.
    pub fn get_pending_upgrade(env: Env) -> Option<UpgradeProposal> {
        env.storage().instance().get(&DataKey::Pending)
    }

    /// Transfer admin to a new address. Current admin must authorize.
    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotInitialized));
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }

    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }
}
