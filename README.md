# Orbi — The Smart Wallet for Stellar

**No seed phrase. No gas fees. Just your face.**

Orbi is a passkey-powered smart wallet on the Stellar blockchain. Users sign in and approve transactions with Face ID or Touch ID — no passwords, no seed phrases, no browser extensions. dApps can sponsor network fees on behalf of their users so that the entire onboarding experience is free.

**Live at [orbiwallet.xyz](https://orbiwallet.xyz)**

---

## The Problem

Every crypto wallet today has the same onboarding problem: show the user a 12-word seed phrase, tell them to write it down, and hope they don't lose it. Most people don't make it past that screen. Those who do are one lost piece of paper away from losing everything.

On top of that, every transaction requires the user to hold the network's native token just to pay fees — a confusing concept for anyone coming from traditional finance.

Orbi removes both barriers:

- **Seed phrases replaced by passkeys** — your Face ID or Touch ID is your wallet key, backed up automatically by iCloud Keychain or Google Password Manager
- **Gas fees replaced by dApp sponsorship** — dApps pay network fees on behalf of users; the user pays nothing

---

## Architecture

Orbi is a monorepo with four main components:

```
orbi-smart-wallet/
├── contracts/        # Soroban smart contracts (Rust)
│   ├── smart_wallet/ # Per-user wallet contract
│   ├── bundler/      # Batching + fee collection contract
│   └── upgrade_registry/ # Timelocked upgrade mechanism
├── relay/            # Backend API (Node.js / Express)
├── app/              # Wallet web app — app.orbiwallet.xyz (Next.js)
├── landing/          # Marketing site — orbiwallet.xyz (Next.js)
└── sdk/              # @orbi-wallet/sdk — npm package for dApp developers
```

---

## How It Works

### 1. Wallet Creation

When a user creates a wallet, the browser generates a WebAuthn credential (a secp256r1 keypair) using Face ID or Touch ID. The **65-byte public key** is stored on-chain inside the user's smart wallet contract — the private key never leaves the device.

The relay deploys a new instance of the `smart_wallet` contract using `createCustomContract`, which gives every user a **unique, deterministic contract address** derived from their passkey.

### 2. Transaction Signing

All transactions go through the wallet contract's `execute_with_fee` function. When a user approves a transaction:

1. The relay builds and simulates a Soroban transaction
2. The user is presented with a passkey prompt (Face ID / Touch ID)
3. The browser signs the transaction hash using the WebAuthn credential
4. The relay assembles a `Signatures` map and submits the signed transaction to Stellar
5. On-chain, `__check_auth` verifies the secp256r1 WebAuthn signature against the stored public key

The contract's `__check_auth` enforces that passkey authorization can **only** be used for `execute_with_fee` — it cannot be used to directly authorize arbitrary contract calls, preventing fee bypass attacks.

### 3. Fee Model

Every transaction routes through `execute_with_fee`, which atomically:

- Executes the user's intended operation (transfer, contract call, etc.)
- Collects Orbi's service fee from the wallet in XLM

**Gasless / dApp-sponsored:** When a dApp provides an `apiKey`, the relay switches to `execute_batch_sponsored` on the bundler contract. The user's `fee` is set to `0`. Instead, the dApp's registered Stellar account is charged the total fee atomically in the same transaction. The relay co-signs the dApp's SAC auth entry before submission.

### 4. Relay

The relay (`api.orbiwallet.xyz`) is an Express API backed by PostgreSQL. It handles:

- **Wallet creation** — deploys smart wallet contracts, derives guardians
- **Quote** — simulates a transaction and returns a signed quote with fee details
- **Bundle** — assembles, fee-bumps, and submits signed transactions to Stellar
- **Status** — SSE endpoint for real-time confirmation (~5s on Stellar)
- **Event sync** — background worker that ingests on-chain events and stores transaction history
- **Flush worker** — background worker that retries and confirms pending operations
- **Account / Auth** — session management, email OTP for passkey recovery
- **Developer API** — registration, API key management, deployer balance

### 5. Passkey Recovery

If a user loses their device, they can recover their wallet by verifying their email via OTP. The relay calls `replace_passkey` on the user's wallet contract using a **per-wallet guardian key** — a Stellar keypair derived as `HMAC-SHA256(GUARDIAN_MASTER_SECRET, wallet_contract_address)`. The guardian can **only** call `replace_passkey` — it cannot authorize transfers or any other operation.

### 6. Contract Upgrades

The `upgrade_registry` contract implements a timelocked upgrade mechanism. A pending upgrade proposal is stored globally. Any wallet can call `execute_upgrade` to apply a new WASM hash — but only after the timelock expires. This allows Orbi to ship contract improvements without requiring per-wallet coordination, while giving users time to react.

---

## Contracts

All contracts are written in Rust using the [Soroban SDK](https://developers.stellar.org/docs/build/smart-contracts/overview).

### `smart_wallet`

The core per-user wallet contract. Each user gets their own deployed instance.

| Function | Description |
|---|---|
| `__constructor` | Initializes the wallet with a passkey public key and guardian |
| `__check_auth` | Verifies WebAuthn secp256r1 signatures for transaction authorization |
| `execute_with_fee` | Executes a contract call and collects Orbi's fee atomically |
| `replace_passkey` | Replaces the passkey (guardian-only, used for recovery) |
| `execute_upgrade` | Applies a pending upgrade from the registry |

### `bundler`

Executes batches of contract calls in a single transaction.

| Function | Description |
|---|---|
| `execute_batch` | Runs multiple calls atomically; user pays fee per call |
| `execute_batch_sponsored` | Runs calls with `fee=0`, then charges the dApp account |

### `upgrade_registry`

Stores and manages pending WASM upgrade proposals with a timelock.

### Building contracts

```bash
./contracts/build.sh
```

Always use the build script — it runs `wasm-opt` for size optimization. Never run `stellar contract build` directly.

---

## SDK — `@orbi-wallet/sdk`

The npm package for dApp developers to integrate Orbi wallets.

```bash
npm install @orbi-wallet/sdk
```

### Basic usage

```ts
import { OrbiClient } from '@orbi-wallet/sdk';

// User pays gas
const orbi = new OrbiClient({ apiUrl: 'https://api.orbiwallet.xyz' });

// dApp sponsors gas — one line difference
const orbi = new OrbiClient({
  apiUrl: 'https://api.orbiwallet.xyz',
  apiKey: 'YOUR_API_KEY',
});
```

### Integration flow

```
1. orbi.connect()              → redirect user to Orbi to connect wallet
2. orbi.handleCallback()       → on return, get wallet address + passkey ID
3. orbi.sign()                 → redirect user to approve transaction
4. orbi.handleSignCallback()   → get signed auth entry
5. orbi.bundle()               → submit to relay
6. orbi.waitForConfirmation()  → SSE — confirms in ~5s
```

Orbi uses a **redirect flow** — no popups, no browser extensions. Works on all devices including mobile Safari.

Full API documentation is in [sdk/README.md](sdk/README.md) and at [developers.orbiwallet.xyz](https://developers.orbiwallet.xyz).

---

## Apps

### Wallet app — `app/`

The main wallet interface at `app.orbiwallet.xyz`. Users can:

- Create a wallet with Face ID / Touch ID (one tap, no download)
- Send and receive XLM and Stellar tokens
- View transaction history
- Connect to dApps via the SDK redirect flow
- Manage passkey recovery via email OTP

Built with Next.js, deployed on Vercel.

### Landing page — `landing/`

Marketing site at `orbiwallet.xyz`. Built with Next.js.

---

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL (for the relay)
- Rust + `stellar-contract-env` (for contracts)

### Setup

```bash
# Install all workspace dependencies
npm install

# Relay — copy and fill in env vars
cp relay/.env.example relay/.env

# Run the relay
npm run dev:relay

# Run the wallet app
npm run dev:app
```

### Deploy contracts

```bash
./contracts/build.sh

# Upload WASM and deploy bundler + registry
stellar contract deploy --wasm contracts/target/wasm32-unknown-unknown/release/smart_wallet.wasm ...
```

---

## Deployment

| Component | Platform |
|---|---|
| Relay | Railway |
| Wallet app | Vercel |
| Landing page | Vercel |
| Contracts | Stellar (testnet → mainnet pending audit) |
| Database | Railway PostgreSQL |

---

## License

MIT
