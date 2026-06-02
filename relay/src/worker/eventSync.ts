import { Address, xdr } from '@stellar/stellar-sdk';
import { getServer } from '../lib/stellar';
import { getTrackedTokens } from '../lib/tokens';
import { pool } from '../lib/db';

const SYNC_INTERVAL_MS = 30_000;
const EVENT_LIMIT = 200;
const INITIAL_BACKFILL_LEDGERS = 100_000;
// Self-heal: every RECONCILE_EVERY ticks re-scan the last RECONCILE_LEDGERS
// regardless of cursor. Idempotent inserts auto-recover any skipped transfer.
const RECONCILE_LEDGERS = 17_280; // ~24h at ~5s/ledger
const RECONCILE_EVERY = 20;       // ~10 min at 30s interval

// Pre-encoded at module load — avoids re-encoding every tick.
// SAC transfer events: topic[0]=Symbol("transfer"), topic[1]=from, topic[2]=to.
const TRANSFER_TOPIC_XDR = xdr.ScVal.scvSymbol('transfer').toXDR().toString('base64');

let isSyncing = false;
let tickCount = 0;

function decodeAddress(scVal: xdr.ScVal): string | null {
  try { return Address.fromScVal(scVal).toString(); } catch { return null; }
}

function decodeI128(scVal: xdr.ScVal): string {
  try {
    const i128 = scVal.i128();
    const lo = BigInt(i128.lo().toString());
    const hi = BigInt(i128.hi().toString());
    return (hi * (2n ** 64n) + lo).toString();
  } catch { return '0'; }
}

/**
 * Scan a ledger range for one token, filtered at the RPC level to only return
 * transfers where topic[2] (recipient) is in walletBatchXdr.
 *
 * On mainnet high-volume contracts (e.g. USDC) this means we receive only
 * transfers TO our users, not all global transfers — regardless of volume.
 */
async function scanRange(
  server: ReturnType<typeof getServer>,
  token: { code: string; sacId: string },
  startLedger: number,
  currentLedger: number,
  knownWallets: Set<string>,
): Promise<void> {
  const filter = {
    type: 'contract' as const,
    contractIds: [token.sacId],
    // Topic filter pushed to the RPC: only Symbol("transfer") events where the
    // recipient (topic[2]) is one of our known wallet addresses.
    // Soroban RPC only supports prefix topic matching — no wildcard for intermediate
    // positions. Filter on topic[0]="transfer" only; recipient check is in the loop.
    topics: [[TRANSFER_TOPIC_XDR]],
  };

  let cursor: string | undefined;
  let scanStart = startLedger;

  while (true) {
    const params = cursor
      ? { filters: [filter], cursor, limit: EVENT_LIMIT }
      : { filters: [filter], startLedger: scanStart, limit: EVENT_LIMIT };

    let response;
    try {
      response = await server.getEvents(params);
    } catch (err: any) {
      // startLedger predates the RPC's retention window. The error message states
      // the actual valid range (e.g. "ledger range: 2739838 - 2860797"); resume
      // from the real minimum so we scan every retained ledger.
      const msg = String(err?.message ?? '');
      if (!cursor && /ledger range/i.test(msg)) {
        const m = msg.match(/(\d+)\s*-\s*\d+/);
        const rpcMin = m ? parseInt(m[1], 10) : currentLedger - RECONCILE_LEDGERS;
        scanStart = Math.max(scanStart, rpcMin);
        response = await server.getEvents({
          filters: [filter], startLedger: scanStart, limit: EVENT_LIMIT,
        });
      } else {
        throw err;
      }
    }

    for (const event of response.events) {
      // Defensive check — topic filter already guarantees this in practice.
      if (event.topic.length < 3) continue;
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

    if (response.events.length < EVENT_LIMIT) break;
    cursor = response.events[response.events.length - 1].id;
    if (!cursor) break;
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

    const reconcile = (tickCount++ % RECONCILE_EVERY) === 0;

    for (const token of tokens) {
      try {
        const { rows: cursorRows } = await pool.query(
          `SELECT last_ledger FROM event_sync_cursors WHERE sac_id = $1`,
          [token.sacId],
        );

        const lastLedger = cursorRows.length > 0
          ? cursorRows[0].last_ledger
          : Math.max(1, currentLedger - INITIAL_BACKFILL_LEDGERS);

        let startLedger = lastLedger + 1;
        if (reconcile) startLedger = Math.min(startLedger, Math.max(1, currentLedger - RECONCILE_LEDGERS));
        if (startLedger > currentLedger) continue;

        await scanRange(server, token, startLedger, currentLedger, knownWallets);

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
