import { Asset, Horizon } from '@stellar/stellar-sdk';
import { getPassphrase, getHorizonUrl, getNativeSacId } from '../lib/stellar';
import { pool } from '../lib/db';

const SYNC_INTERVAL_MS = 30_000;
const EFFECTS_LIMIT = 200;
// Process N wallets concurrently per tick. Keep low to avoid rate-limiting Horizon.
const CONCURRENCY = 5;

let isSyncing = false;

// Horizon returns decimal amounts ("10.0000000"); convert to stroops for storage.
function amountToStroops(amount: string): string {
  const [int, dec = ''] = amount.split('.');
  const padded = dec.padEnd(7, '0').slice(0, 7);
  return (BigInt(int) * 10_000_000n + BigInt(padded)).toString();
}

// Map Horizon effect asset fields to { code, sacId }. Returns null for unknown assets.
function effectToAsset(
  effect: any,
  passphrase: string,
): { code: string; sacId: string } | null {
  if (effect.asset_type === 'native') {
    return { code: 'XLM', sacId: getNativeSacId() };
  }
  if (effect.asset_code && effect.asset_issuer) {
    try {
      const sacId = new Asset(effect.asset_code, effect.asset_issuer).contractId(passphrase);
      return { code: effect.asset_code, sacId };
    } catch { return null; }
  }
  return null;
}

async function syncWallet(
  server: Horizon.Server,
  walletAddress: string,
  passphrase: string,
): Promise<void> {
  const { rows } = await pool.query(
    'SELECT last_cursor FROM horizon_sync_cursors WHERE wallet_address = $1',
    [walletAddress],
  );
  const lastCursor: string = rows.length > 0 ? rows[0].last_cursor : '';

  let page = await server
    .effects()
    .forAccount(walletAddress)
    .cursor(lastCursor)
    .limit(EFFECTS_LIMIT)
    .order('asc')
    .call();

  let latestCursor = lastCursor;

  while (true) {
    const { records } = page;
    if (records.length === 0) break;

    for (const effect of records) {
      // account_credited: classic payments, path payments, claimable balance claims
      // contract_credited: SAC token transfers to Soroban contract accounts (our smart wallets)
      if (effect.type !== 'account_credited' && effect.type !== 'contract_credited') {
        latestCursor = effect.paging_token;
        continue;
      }

      const asset = effectToAsset(effect, passphrase);
      if (!asset) { latestCursor = effect.paging_token; continue; }

      const amount = amountToStroops((effect as any).amount);

      // Dedup via paging_token stored in tx_hash — unique per effect across all of Horizon.
      await pool.query(
        `INSERT INTO incoming_transfers
          (wallet_address, from_address, amount, asset_code, asset_sac_id, tx_hash, ledger)
         VALUES ($1, $2, $3, $4, $5, $6, 0)
         ON CONFLICT (tx_hash) WHERE tx_hash IS NOT NULL DO NOTHING`,
        [walletAddress, 'unknown', amount, asset.code, asset.sacId, effect.paging_token],
      );

      latestCursor = effect.paging_token;
    }

    if (records.length < EFFECTS_LIMIT) break;
    page = await page.next();
  }

  if (latestCursor !== lastCursor) {
    await pool.query(
      `INSERT INTO horizon_sync_cursors (wallet_address, last_cursor)
       VALUES ($1, $2)
       ON CONFLICT (wallet_address) DO UPDATE SET last_cursor = EXCLUDED.last_cursor`,
      [walletAddress, latestCursor],
    );
  }
}

async function syncEvents(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const passphrase = getPassphrase();
    const server = new Horizon.Server(getHorizonUrl());

    const { rows: walletRows } = await pool.query('SELECT wallet_address FROM users');
    const wallets: string[] = walletRows.map((r: any) => r.wallet_address);
    if (wallets.length === 0) return;

    for (let i = 0; i < wallets.length; i += CONCURRENCY) {
      const batch = wallets.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(w =>
          syncWallet(server, w, passphrase).catch(err =>
            console.error(`[eventSync] wallet ${w} failed:`, err),
          ),
        ),
      );
    }
  } catch (err) {
    console.error('[eventSync] Error:', err);
  } finally {
    isSyncing = false;
  }
}

export function startEventSyncWorker(): void {
  console.log(`[worker] Event sync worker started — interval ${SYNC_INTERVAL_MS}ms`);
  syncEvents();
  setInterval(syncEvents, SYNC_INTERVAL_MS);
}
