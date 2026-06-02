import { dequeuePending, PendingOp } from '../lib/queue';
import { submitBatch } from '../lib/batcher';

const FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 50;

let isFlushing = false;

async function flush(): Promise<void> {
  if (isFlushing) return;
  isFlushing = true;

  try {
    const ops = await dequeuePending();
    if (ops.length === 0) return;

    // Group by sponsor: null = Orbi pays network fee, string = dApp's account pays
    const groups = new Map<string | null, PendingOp[]>();
    for (const op of ops) {
      const key = op.sponsorPublicKey ?? null;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(op);
    }

    console.log(`[flush] ${ops.length} ops across ${groups.size} group(s)`);

    await Promise.all(
      [...groups.entries()].map(([sponsor, groupOps]) =>
        submitBatch(groupOps.slice(0, MAX_BATCH_SIZE), sponsor ?? undefined),
      ),
    );
  } catch (err) {
    console.error('[flush] Error:', err);
  } finally {
    isFlushing = false;
  }
}

export function startFlushWorker(): void {
  console.log(`[worker] Flush worker started — interval ${FLUSH_INTERVAL_MS}ms`);
  setInterval(flush, FLUSH_INTERVAL_MS);
}
