import { Address } from '@stellar/stellar-sdk';
import { xdr } from '@stellar/stellar-sdk';
import { getServer } from '../lib/stellar';
import { getTrackedTokens } from '../lib/tokens';
import { pool } from '../lib/db';

const SYNC_INTERVAL_MS = 30_000;
const EVENT_LIMIT = 200;
// How many ledgers to backfill on first sync. The testnet RPC retains ~120,960
// ledgers (~7 days); we stay safely inside that so a cold-start backfill never
// races the retention boundary as ledgers close during the scan.
const INITIAL_BACKFILL_LEDGERS = 100_000;
// Self-heal window: every RECONCILE_EVERY ticks we re-scan the last
// RECONCILE_LEDGERS ledgers regardless of the cursor. Inserts are idempotent
// (UNIQUE + ON CONFLICT DO NOTHING), so any transfer a stuck/advanced cursor
// skipped within the last ~24h is recovered automatically — no manual rewind.
const RECONCILE_LEDGERS = 17_280; // ~24h
const RECONCILE_EVERY = 20;       // ~10 min at a 30s interval

let isSyncing = false;
let tickCount = 0;

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

    // Curated tokens + every token any wallet has added to their watch list.
    const tokenMap = new Map<string, { code: string; sacId: string }>();
    for (const t of getTrackedTokens()) tokenMap.set(t.sacId, t);
    const { rows: watchedRows } = await pool.query(
      `SELECT DISTINCT contract_id, code FROM watched_tokens`,
    );
    for (const w of watchedRows as any[]) {
      if (!tokenMap.has(w.contract_id)) tokenMap.set(w.contract_id, { code: w.code, sacId: w.contract_id });
    }
    const tokens = [...tokenMap.values()];

    const { rows: walletRows } = await pool.query(`SELECT wallet_address FROM users`);
    const knownWallets = new Set<string>(walletRows.map((r: any) => r.wallet_address as string));
    if (knownWallets.size === 0) return;

    const latestLedger = await server.getLatestLedger();
    const currentLedger = latestLedger.sequence;

    // Periodically widen the scan to self-heal any recently-missed transfers.
    const reconcile = (tickCount++ % RECONCILE_EVERY) === 0;

    for (const token of tokens) {
      // One token failing (e.g. a stale backfill window) must not abort the rest.
      try {
        const { rows: cursorRows } = await pool.query(
          `SELECT last_ledger FROM event_sync_cursors WHERE sac_id = $1`,
          [token.sacId],
        );

        const lastLedger = cursorRows.length > 0
          ? cursorRows[0].last_ledger
          : Math.max(1, currentLedger - INITIAL_BACKFILL_LEDGERS);

        let startLedger = lastLedger + 1;
        // On a reconcile tick, look back at least RECONCILE_LEDGERS even if the
        // cursor is already caught up — re-scanning is idempotent.
        if (reconcile) startLedger = Math.min(startLedger, Math.max(1, currentLedger - RECONCILE_LEDGERS));
        if (startLedger > currentLedger) continue;

        let cursor: string | undefined;
        let hasMore = true;

        while (hasMore) {
          const params = cursor
            ? { filters: [{ type: 'contract' as const, contractIds: [token.sacId] }], cursor, limit: EVENT_LIMIT }
            : { filters: [{ type: 'contract' as const, contractIds: [token.sacId] }], startLedger, limit: EVENT_LIMIT };

          let response;
          try {
            response = await server.getEvents(params);
          } catch (err: any) {
            // startLedger older than the RPC's retention window. The error states
            // the valid range (e.g. "... ledger range: 2739838 - 2860797"); resume
            // from the RPC's real minimum so we scan every ledger it still retains
            // (only what's genuinely outside retention is lost — unrecoverable anyway).
            const msg = String(err?.message ?? '');
            if (!cursor && /ledger range/i.test(msg)) {
              const m = msg.match(/(\d+)\s*-\s*\d+/);
              const rpcMin = m ? parseInt(m[1], 10) : currentLedger - RECONCILE_LEDGERS;
              startLedger = Math.max(startLedger, rpcMin);
              response = await server.getEvents({
                filters: [{ type: 'contract' as const, contractIds: [token.sacId] }],
                startLedger, limit: EVENT_LIMIT,
              });
            } else {
              throw err;
            }
          }

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
      } catch (tokenErr) {
        console.error(`[eventSync] token ${token.code} (${token.sacId}) failed:`, tokenErr);
      }
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
