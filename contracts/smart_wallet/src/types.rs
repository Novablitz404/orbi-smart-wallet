use soroban_sdk::{contracttype, contracterror, Bytes, BytesN, Map};

// ── Signer types ──────────────────────────────────────────────────────────────

/// Signer key used as storage key (keyed by credential ID for passkeys).
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum SignerKey {
    Secp256r1(Bytes), // WebAuthn credential ID
}

/// Signer value stored alongside the key.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum SignerVal {
    Secp256r1(BytesN<65>), // 65-byte uncompressed secp256r1 public key
}

// ── Signature types ───────────────────────────────────────────────────────────

/// WebAuthn secp256r1 signature — the full assertion response from the passkey.
/// The signed message is: SHA-256(authenticatorData || SHA-256(clientDataJSON))
/// The clientDataJSON must contain the Soroban auth hash as the "challenge" field.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Secp256r1Signature {
    pub authenticator_data: Bytes,
    pub client_data_json: Bytes,
    pub signature: BytesN<64>,  // raw r||s, low-S normalized
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum Signature {
    Secp256r1(Secp256r1Signature),
}

/// Map of signer_key → signature submitted in __check_auth.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Signatures(pub Map<SignerKey, Signature>);

// ── Storage keys ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum DataKey {
    Signer(SignerKey),
    /// Per-wallet guardian G-address derived by relay as:
    ///   HMAC-SHA256(GUARDIAN_MASTER_SECRET, wallet_contract_address)
    /// Can ONLY call replace_passkey — cannot authorize fund transfers.
    Guardian,
    Initialized,
}

// ── Errors ────────────────────────────────────────────────────────────────────

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotFound = 1,
    AlreadyInitialized = 2,
    NotInitialized = 3,
    Unauthorized = 4,
    SignatureKeyValueMismatch = 5,
    ClientDataJsonChallengeIncorrect = 6,
    JsonParseError = 7,
}
