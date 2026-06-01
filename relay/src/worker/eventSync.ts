import { Address } from '@stellar/stellar-sdk';
import { xdr } from '@stellar/stellar-sdk';
import { getServer } from '../lib/stellar';
import { getTrackedTokens } from '../lib/tokens';
import { pool } from '../lib/db';

const SYNC_INTERVAL_MS = 30_000;
const EVENT_LIMIT = 200;
// How many ledgers to backfill on first sync (~7 days worth at ~5s/ledger)
const INITIAL_BACKFILL_LEDGERS = 120_960;

let isSyncing = false;

function decodeAddress(scVal: xdr.ScVal): string | null {
  try {
    return Address.fromScVal(scVal).toString();
  } catch {
    return null;
  }
}

function decodeI128(scVal: xdr.ScVal): string {
  try {
    const i128 = scVal.i128();
    const lo = BigInt(i128.lo().toString());
    const hi = BigInt(i128.hi().toString());
    return (hi * (2n ** 64n) + lo).toString();
  } catch {
    return '0';
  }
}

async function syncEvents(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const server = getServer();
    const tokens = getTrackedTokens();

    const { rows: walletRows } = await pool.query(`SELECT wallet_address FROM users`);
    const knownWallets = new Set<string>(walletRows.map((r: any) => r.wallet_address as string));
    if (knownWallets.size === 0) return;

    const latestLedger = await server.getLatestLedger();
    const currentLedger = latestLedger.sequence;

    for (const token of tokens) {
      const { rows: cursorRows } = await pool.query(
        `SELECT last_ledger FROM event_sync_cursors WHERE sac_id = $1`,
        [token.sacId],
      );

      const lastLedger = cursorRows.length > 0
        ? cursorRows[0].last_ledger
        : Math.max(1, currentLedger - INITIAL_BACKFILL_LEDGERS);

      const startLedger = lastLedger + 1;
      if (startLedger > currentLedger) continue;

      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const params = cursor
          ? { filters: [{ type: 'contract' as const, contractIds: [token.sacId] }], cursor, limit: EVENT_LIMIT }
          : { filters: [{ type: 'contract' as const, contractIds: [token.sacId] }], startLedger, limit: EVENT_LIMIT };

        const response = await server.getEvents(params);

        for (const event of response.events) {
          // SAC transfer topics: [Symbol("transfer"), Address(from), Address(to)]
          if (event.topic.length < 3) continue;

          const sym = event.topic[0];
          if (sym.switch().name !== 'scvSymbol') continue;
          if (sym.sym().toString() !== 'transfer') continue;

          const toAddress = decodeAddress(event.topic[2]);
          if (!toAddress || !knownWallets.has(toAddress)) continue;

          const fromAddress = decodeAddress(event.topic[1]) ?? 'unknown';
          const amount = decodeI128(event.value);

          await pool.query(
            `INSERT INTO incoming_transfers
              (wallet_address, from_address, amount, asset_code, asset_sac_id, tx_hash, ledger)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (asset_sac_id, ledger, from_address, wallet_address, amount) DO NOTHING`,
            [toAddress, fromAddress, amount, token.code, token.sacId, event.txHash ?? null, event.ledger],
          );
        }

        const events = response.events;
        hasMore = events.length === EVENT_LIMIT;
        cursor = hasMore ? events[events.length - 1].id : undefined;
        if (!cursor) break;
      }

      await pool.query(
        `INSERT INTO event_sync_cursors (sac_id, last_ledger)
         VALUES ($1, $2)
         ON CONFLICT (sac_id) DO UPDATE SET last_ledger = EXCLUDED.last_ledger`,
        [token.sacId, currentLedger],
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
