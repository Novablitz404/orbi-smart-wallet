# @orbi-wallet/sdk

The official SDK for integrating [Orbi Smart Wallet](https://orbiwallet.xyz) into any Stellar dApp.

Orbi is a passkey-based smart wallet on Stellar. Users sign transactions with Face ID or Touch ID — no seed phrase, no browser extension. This SDK lets your dApp connect to Orbi wallets and optionally sponsor gas so your users pay nothing.

---

## Install

```bash
npm install @orbi-wallet/sdk
```

---

## Quick Start

### User pays gas (default)

```ts
import { OrbiClient } from '@orbi-wallet/sdk';

const orbi = new OrbiClient({
  apiUrl: 'https://api.orbiwallet.xyz',
});
```

### dApp sponsors gas (gasless)

```ts
import { OrbiClient } from '@orbi-wallet/sdk';

const orbi = new OrbiClient({
  apiUrl: 'https://api.orbiwallet.xyz',
  apiKey: 'YOUR_API_KEY',  // get this from developers.orbiwallet.xyz
});
```

That one line is the only difference. Everything else — connecting, signing, submitting — works exactly the same. Users see the fee crossed out and "Sponsored by [your app]".

---

## How It Works

Orbi uses a **redirect flow** — no popups, no browser extensions. Works on all devices including mobile.

```
1. orbi.connect()          → redirect user to Orbi to connect wallet
2. orbi.handleCallback()   → on return, get wallet address + passkey ID
3. orbi.sign()             → redirect user to approve transaction with passkey
4. orbi.handleSignCallback() + orbi.bundle()  → submit signed tx to relay
5. orbi.waitForConfirmation(opId)             → wait for on-chain confirmation (~5s)
```

---

## Full Example

### Step 1 — Connect wallet

On your "Connect" button:

```ts
orbi.connect({
  redirectUrl: 'https://yourapp.com/callback',
});
// navigates to keys.orbiwallet.xyz, then back to redirectUrl?token=...
```

On your `/callback` page:

```ts
const wallet = await orbi.handleCallback();
if (wallet) {
  // { walletAddress, passkeyId, email }
  localStorage.setItem('walletAddress', wallet.walletAddress);
}
```

### Step 2 — Sign and submit a transaction

```ts
// Redirect user to approve
orbi.sign({
  walletAddress: localStorage.getItem('walletAddress')!,
  contractId: 'YOUR_CONTRACT_ID',
  functionName: 'transfer',
  argsXdr: ['...', '...'],           // XDR-encoded args
  redirectUrl: 'https://yourapp.com/sign-callback',
});
```

On your `/sign-callback` page:

```ts
const result = orbi.handleSignCallback();
if (!result) return; // user cancelled or came directly to this page

const { opId } = await orbi.bundle({
  walletAddress: result.walletAddress,
  quoteId: result.quoteId,
  signedAuthEntryXdr: result.signedAuthEntryXdr,
  contractId: 'YOUR_CONTRACT_ID',
  functionName: 'transfer',
  argsXdr: result.argsXdr,
});

// Wait for on-chain confirmation via SSE
const status = await orbi.waitForConfirmation(opId);
if (status.status === 'confirmed') {
  console.log('tx hash:', status.txHash);
}
```

---

## API Reference

### `new OrbiClient(config)`

| Parameter | Type | Required | Description |
|---|---|---|---|
| `apiUrl` | `string` | Yes | Orbi relay URL — use `https://api.orbiwallet.xyz` |
| `apiKey` | `string` | No | Your developer API key. Enables gas sponsorship. |

---

### Wallet Connection

#### `connect(params)`

Redirects the user to Orbi to connect their wallet.

```ts
orbi.connect({ redirectUrl: 'https://yourapp.com/callback' });
```

#### `handleCallback()`

Call on your callback page after `connect()` redirects back. Returns wallet data or `null` if no token in URL.

```ts
const wallet = await orbi.handleCallback();
// { walletAddress: string, passkeyId: string, email: string } | null
```

---

### Transaction Signing

#### `sign(params)`

Redirects the user to Orbi to approve a transaction with their passkey.

```ts
orbi.sign({
  walletAddress: string,
  contractId: string,
  functionName: string,
  argsXdr: string[],       // XDR-encoded Soroban args
  redirectUrl: string,
});
```

If `apiKey` is set, the user sees the fee as sponsored — they pay nothing.

#### `handleSignCallback()`

Call on your sign-callback page. Returns the signed data needed to call `bundle()`, or `null` if nothing to process.

```ts
const result = orbi.handleSignCallback();
// { signedAuthEntryXdr, quoteId, argsXdr, nativeSacId, walletAddress } | null
```

---

### Relay

#### `bundle(params)`

Submit a signed operation to the Orbi relay for on-chain execution.

```ts
const { opId } = await orbi.bundle({
  walletAddress: string,
  quoteId: string,
  signedAuthEntryXdr: string,
  contractId: string,
  functionName: string,
  argsXdr: string[],
});
```

#### `waitForConfirmation(opId)`

Wait for the operation to be confirmed or fail. Uses SSE — resolves in ~5s on Stellar.

```ts
const status = await orbi.waitForConfirmation(opId);
// { opId, status: 'confirmed' | 'failed', txHash: string | null, error: string | null }
```

#### `getStatus(opId)`

One-shot status check (non-blocking alternative to `waitForConfirmation`).

```ts
const status = await orbi.getStatus(opId);
```

---

### Token Management

#### `watchAsset(params)`

Redirect the user to add a Soroban token to their Orbi wallet.

```ts
orbi.watchAsset({
  contractId: 'TOKEN_CONTRACT_ID',
  redirectUrl: 'https://yourapp.com/callback',
});
```

#### `handleWatchAssetCallback()`

Call on your callback page after `watchAsset()` redirects back.

```ts
const result = orbi.handleWatchAssetCallback();
// { contractId: string, added: boolean } | null
```

---

### Gas Sponsorship (Developer Setup)

These methods are for onboarding your dApp to gas sponsorship. You can also do this through the [developer portal](https://developers.orbiwallet.xyz).

#### `register(params)`

Register a new developer account. Returns a one-time API key — save it immediately.

```ts
const { apiKey } = await orbi.register({
  developerName: 'My App',
  email: 'you@example.com',
});
```

#### `setDeployer(deployerPublicKey)`

Set the Stellar G... address that will fund gas for your users. Requires `apiKey` in constructor.

```ts
await orbi.setDeployer('GABC...XYZ');
```

#### `getDeployerBalance()`

Check your gas tank balance. Requires `apiKey` in constructor.

```ts
const { balanceXlm } = await orbi.getDeployerBalance();
console.log(`${balanceXlm} XLM remaining`);
```

---

## Gas Sponsorship Setup

To sponsor gas for your users:

1. **Create a developer account** at [developers.orbiwallet.xyz](https://developers.orbiwallet.xyz) — get your API key
2. **Create a Stellar keypair** for your gas tank (a regular G... account)
3. **Fund it with XLM** — each sponsored transaction deducts the exact network fee
4. **Set the deployer** in the developer portal (or via `setDeployer()`)
5. **Add `apiKey`** to your `OrbiClient` constructor

That's it. Users with Orbi wallets will see fees as sponsored. Users on other wallets are unaffected.

---

## Notes

- Works on all browsers and mobile — redirect flow, no popups or extensions
- Only works with Orbi smart wallets — other Stellar wallets (Freighter, Lobstr) are unaffected
- Stellar ledger closes every ~5s, so `waitForConfirmation` typically resolves in under 10s
- XDR arg encoding: use `@stellar/stellar-sdk` to build and encode Soroban contract args

---

## Links

- [Orbi Wallet](https://orbiwallet.xyz)
- [Developer Portal](https://developers.orbiwallet.xyz)
- [npm](https://npmjs.com/package/@orbi-wallet/sdk)
- [GitHub](https://github.com/Novablitz404/orbi-smart-wallet)

---

## License

MIT
