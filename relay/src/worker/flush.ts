import {
  dequeuePending,
  markBatched,
  markConfirmed,
  markFailed,
  createBatch,
} from '../lib/queue';
import { submitBatch } from '../lib/batcher';

const FLUSH_INTERVAL_MS = 5000;
const MIN_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 50;

let isFlushing = false;

async function flush(): Promise<void> {
  if (isFlushing) return;
  isFlushing = true;

  let batchId: string | null = null;
  try {
    const ops = await dequeuePending();
    if (ops.length < MIN_BATCH_SIZE) return;

    const batch = ops.slice(0, MAX_BATCH_SIZE);
    console.log(`[flush] Batching ${batch.length} ops`);

    batchId = await createBatch(batch.length);
    await markBatched(batch.map(op => op.id), batchId);

    const txHash = await submitBatch(batch);

    await markConfirmed(batchId, txHash);
    console.log(`[flush] Confirmed batch ${batchId} → ${txHash}`);
  } catch (err) {
    console.error('[flush] Error:', err);
    if (batchId) await markFailed(batchId, String(err)).catch(console.error);
  } finally {
    isFlushing = false;
  }
}

export function startFlushWorker(): void {
  console.log(`[worker] Flush worker started — interval ${FLUSH_INTERVAL_MS}ms`);
  setInterval(flush, FLUSH_INTERVAL_MS);
}
