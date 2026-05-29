use soroban_sdk::{crypto::Hash, panic_with_error, BytesN, Env};
use crate::types::{Error, Secp256r1Signature};

/// Base64url encoding table.
const BASE64URL: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/// Encode 32 bytes as 43-character base64url (no padding).
fn base64url_encode_32(input: &[u8; 32]) -> [u8; 43] {
    let mut out = [0u8; 43];
    let mut i = 0usize;
    let mut o = 0usize;
    while i + 2 < 32 {
        out[o]     = BASE64URL[((input[i] >> 2) & 0x3F) as usize];
        out[o + 1] = BASE64URL[(((input[i] & 0x03) << 4) | (input[i + 1] >> 4)) as usize];
        out[o + 2] = BASE64URL[(((input[i + 1] & 0x0F) << 2) | (input[i + 2] >> 6)) as usize];
        out[o + 3] = BASE64URL[(input[i + 2] & 0x3F) as usize];
        i += 3;
        o += 4;
    }
    // Remaining byte (32 = 10*3 + 2, so 2 remaining bytes)
    out[o]     = BASE64URL[((input[i] >> 2) & 0x3F) as usize];
    out[o + 1] = BASE64URL[(((input[i] & 0x03) << 4) | (input[i + 1] >> 4)) as usize];
    out[o + 2] = BASE64URL[((input[i + 1] & 0x0F) << 2) as usize];
    out
}

/// Minimal JSON parser to extract the "challenge" field from clientDataJSON.
/// clientDataJSON always has "challenge" as one of its first fields so this
/// simple linear scan is safe and avoids pulling in a full JSON library.
fn extract_challenge<'a>(json: &'a [u8]) -> Option<&'a [u8]> {
    const KEY: &[u8] = b"\"challenge\":\"";
    let mut i = 0;
    while i + KEY.len() < json.len() {
        if &json[i..i + KEY.len()] == KEY {
            let start = i + KEY.len();
            let mut end = start;
            while end < json.len() && json[end] != b'"' {
                end += 1;
            }
            return Some(&json[start..end]);
        }
        i += 1;
    }
    None
}

/// Verify a WebAuthn secp256r1 signature against the Soroban auth payload hash.
///
/// The signed message is: SHA-256(authenticator_data || SHA-256(client_data_json))
/// The client_data_json must contain the base64url-encoded auth payload hash as "challenge".
///
/// This intentionally keeps the challenge check — without it an attacker could
/// replay a valid signature from a different auth context.
pub fn verify_secp256r1_signature(
    env: &Env,
    signature_payload: &Hash<32>,
    public_key: &BytesN<65>,
    signature: Secp256r1Signature,
) {
    let Secp256r1Signature {
        mut authenticator_data,
        client_data_json,
        signature,
    } = signature;

    // Build the signed message: authenticator_data || SHA-256(client_data_json)
    let client_data_hash = env.crypto().sha256(&client_data_json);
    authenticator_data.extend_from_array(&client_data_hash.to_array());

    env.crypto().secp256r1_verify(
        public_key,
        &env.crypto().sha256(&authenticator_data),
        &signature,
    );

    // Verify the challenge inside clientDataJSON matches the auth payload.
    // Buffer is 4096 bytes — large enough for any real clientDataJSON.
    // (kalepail used 1024 which could panic on long origin URLs)
    let json_buf = client_data_json.to_buffer::<4096>();
    let json_slice = json_buf.as_slice();

    let challenge = extract_challenge(json_slice)
        .unwrap_or_else(|| panic_with_error!(env, Error::JsonParseError));

    let expected = base64url_encode_32(&signature_payload.to_array());

    if challenge != expected {
        panic_with_error!(env, Error::ClientDataJsonChallengeIncorrect);
    }
}
