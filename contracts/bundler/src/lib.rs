#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Val, Vec};

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
    /// Auth entries for each call are attached by the relay before submission.
    pub fn execute_batch(env: Env, calls: Vec<Call>) {
        for call in calls.iter() {
            env.invoke_contract::<Val>(&call.contract, &call.function, call.args);
        }
    }
}
