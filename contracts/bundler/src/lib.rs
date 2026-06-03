#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol, Val, Vec};

#[contracttype]
#[derive(Clone)]
pub struct Call {
    pub contract: Address,
    pub function: Symbol,
    pub args: Vec<Val>,
}

#[contract]
pub struct OrbiBundler;

#[contractimpl]
impl OrbiBundler {
    /// Execute a batch of contract calls in a single transaction.
    pub fn execute_batch(env: Env, calls: Vec<Call>) {
        for call in calls.iter() {
            env.invoke_contract::<Val>(&call.contract, &call.function, call.args);
        }
    }

    /// dApp-sponsored variant: runs user ops (each with fee=0) then collects
    /// total_fee from the dApp's Stellar account via the native XLM SAC.
    /// dapp_account must have Orbi's relay key as a co-signer — Orbi signs
    /// the SAC auth entry before submission.
    pub fn execute_batch_sponsored(
        env: Env,
        calls: Vec<Call>,
        dapp_account: Address,
        fee_token: Address,
        fee_collector: Address,
        total_fee: i128,
    ) {
        for call in calls.iter() {
            env.invoke_contract::<Val>(&call.contract, &call.function, call.args);
        }
        if total_fee > 0 {
            let token_client = token::Client::new(&env, &fee_token);
            token_client.transfer(&dapp_account, &fee_collector, &total_fee);
        }
    }
}
