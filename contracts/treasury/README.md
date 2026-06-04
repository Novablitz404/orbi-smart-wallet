# Orbi Treasury

Holds Orbi's protocol revenue (the fees collected by the relay) and lets the admin
top up the Orbi deployer (gas tank) on demand.

## Deployed (testnet)

| | |
| --- | --- |
| Treasury contract | `CBQGAXJTIFD5GJY52WHAU6FF2T5A2SCJKQLXSZB3ZQSAG5WFWPUKENNT` |
| Admin | `GAQC2DZFSROS52IVXZSTA7RBYDAQDOTAKYTDPJPBLVWSRJO6ZETQKYIA` (deployer key) |
| Deployer (funded by `fund_deployer`) | `GAQC2DZFSROS52IVXZSTA7RBYDAQDOTAKYTDPJPBLVWSRJO6ZETQKYIA` |
| Native token (XLM SAC) | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |

To make this the relay's fee collector, set the relay env var
`FEE_COLLECTOR_ADDRESS` to the treasury contract id and redeploy.

## Security model

- Every state-changing call requires the **admin's** authorization (`require_auth`).
- `fund_deployer` can **only** send native XLM to the deployer registered at init —
  it can never be redirected, so a mistyped recipient can't drain the treasury.
- `withdraw` is the generic escape hatch (any token, any recipient) for moving
  revenue to cold storage. Admin-only.
- All movements emit events (`FundDeployer`, `Withdraw`) for off-chain auditing.
- The admin should be a hardened key — a multisig classic account or a
  passkey-secured smart wallet. Rotate with `set_admin` (no redeploy needed).

## Interface

| Function | Auth | Purpose |
| --- | --- | --- |
| `initialize(admin, deployer, native_token)` | once | Set up the treasury |
| `fund_deployer(amount)` | admin | Send `amount` stroops of XLM to the registered deployer |
| `withdraw(token, amount, to)` | admin | Move any token to any address |
| `balance(token)` | — | Token balance held by the treasury |
| `native_balance()` | — | XLM balance held by the treasury |
| `set_deployer(new_deployer)` | admin | Change the funding target |
| `set_admin(new_admin)` | admin | Rotate admin |
| `upgrade(new_wasm_hash)` | admin | Upgrade contract logic |
| `admin()` / `deployer()` | — | Views |

## Funding the deployer (CLI)

```bash
./fund-deployer.sh <amount_in_XLM> [network] [source-account]

# examples
./fund-deployer.sh 100                       # 100 XLM, testnet, signed by `deployer`
./fund-deployer.sh 100 mainnet treasury-admin
```

The signer must be the treasury admin. The script prints the treasury balance
before and after.

## Build & deploy

```bash
# from contracts/
./build.sh                                   # builds + wasm-opt → treasury/orbi_treasury.wasm
stellar contract deploy --wasm treasury/orbi_treasury.wasm \
  --network testnet --source-account deployer
stellar contract invoke --id <new-id> --network testnet --source-account deployer \
  -- initialize --admin <G...> --deployer <G...> --native_token <C...>
```
