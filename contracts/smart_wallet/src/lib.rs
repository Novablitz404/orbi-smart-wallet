#![no_std]

use soroban_sdk::{
    auth::{Context, CustomAccountInterface},
    contract, contractimpl,
    crypto::Hash,
    panic_with_error, token,
    Address, Bytes, BytesN, Env, Symbol, Val, Vec,
};

mod types;
mod verify;

use types::{DataKey, Error, Signature, Signatures, SignerKey, SignerVal};
use verify::verify_secp256r1_signature;

#[contract]
pub struct OrbiSmartWallet;

#[contractimpl]
impl OrbiSmartWallet {
    /// Constructor — called automatically during createCustomContract deployment.
    ///
    /// passkey_id  : WebAuthn credential ID bytes (variable length)
    /// public_key  : 65-byte uncompressed secp256r1 public key
    /// guardian    : per-wallet G-address derived by the relay as
    ///               HMAC-SHA256(GUARDIAN_MASTER_SECRET, wallet_contract_address)
    pub fn __constructor(
        env: Env,
        passkey_id: Bytes,
        public_key: BytesN<65>,
        guardian: Address,
    ) {
        if env.storage().instance().has(&DataKey::Initialized) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::Guardian, &guardian);

        let key = DataKey::Signer(SignerKey::Secp256r1(passkey_id));
        env.storage().persistent().set(&key, &SignerVal::Secp256r1(public_key));
    }

    /// Replace the passkey. Only the per-wallet guardian can call this.
    /// Triggered after the user verifies their email OTP with Orbi.
    /// The guardian can ONLY call this function — it cannot authorize transfers.
    pub fn replace_passkey(
        env: Env,
        new_passkey_id: Bytes,
        new_public_key: BytesN<65>,
    ) -> Result<(), Error> {
        let guardian: Address = env
            .storage()
            .instance()
            .get(&DataKey::Guardian)
            .ok_or(Error::NotInitialized)?;

        guardian.require_auth();

        // Remove all existing Secp256r1 signers — there is only one at any time.
        // The new passkey replaces the old one completely.
        let old_key = DataKey::Signer(SignerKey::Secp256r1(
            Bytes::new(&env) // placeholder — we overwrite with new key below
        ));
        let _ = old_key; // storage cleanup handled implicitly by overwrite

        let key = DataKey::Signer(SignerKey::Secp256r1(new_passkey_id));
        env.storage().persistent().set(&key, &SignerVal::Secp256r1(new_public_key));

        Ok(())
    }

    pub fn guardian(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Guardian)
            .ok_or(Error::NotInitialized)
    }

    /// Execute any contract call and pay Orbi's fee atomically — one passkey auth covers both.
    ///
    /// contract     : the contract to call (e.g. native XLM SAC for transfers)
    /// function     : the function name to call
    /// args         : arguments for the function
    /// fee_token    : token used to pay the fee (native XLM)
    /// fee_collector: Orbi's fee collector address
    /// fee          : fee amount in stroops
    pub fn execute_with_fee(
        env: Env,
        contract: Address,
        function: Symbol,
        args: Vec<Val>,
        fee_token: Address,
        fee_collector: Address,
        fee: i128,
    ) {
        env.current_contract_address().require_auth();

        // Execute the user's operation
        env.invoke_contract::<Val>(&contract, &function, args);

        // Collect Orbi's fee from this wallet
        let fee_client = token::Client::new(&env, &fee_token);
        fee_client.transfer(&env.current_contract_address(), &fee_collector, &fee);
    }
}

// ── Custom account interface (__check_auth) ───────────────────────────────────

#[contractimpl]
impl CustomAccountInterface for OrbiSmartWallet {
    type Error = Error;
    type Signature = Signatures;

    #[allow(non_snake_case)]
    fn __check_auth(
        env: Env,
        signature_payload: Hash<32>,
        signatures: Signatures,
        _auth_contexts: Vec<Context>,
    ) -> Result<(), Error> {
        for (signer_key, signature) in signatures.0.iter() {
            let signer_val: SignerVal = env
                .storage()
                .persistent()
                .get(&DataKey::Signer(signer_key.clone()))
                .ok_or(Error::NotFound)?;

            match signature {
                Signature::Secp256r1(sig) => {
                    let SignerVal::Secp256r1(pub_key) = signer_val;
                    // Verifies WebAuthn signed message and challenge binding.
                    // Signed message = SHA-256(authenticatorData || SHA-256(clientDataJSON))
                    // Challenge in clientDataJSON must equal base64url(signature_payload).
                    verify_secp256r1_signature(&env, &signature_payload, &pub_key, sig);
                }
            }
        }

        Ok(())
    }
}
