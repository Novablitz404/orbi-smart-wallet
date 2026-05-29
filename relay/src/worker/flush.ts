import { dequeuePending } from '../lib/queue';
import { submitBatch } from '../lib/batcher';

const FLUSH_INTERVAL_MS = 5000;
const MIN_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 50;

let isFlushing = false;

async function flush(): Promise<void> {
  if (isFlushing) return;
  isFlushing = true;

  try {
    const ops = await dequeuePending();
    if (ops.length < MIN_BATCH_SIZE) return;

    const batch = ops.slice(0, MAX_BATCH_SIZE);
    console.log(`[flush] Processing ${batch.length} ops`);

    // submitBatch handles batch creation, adaptive splitting on resource errors,
    // and confirmation — no manual batch management needed here
    await submitBatch(batch);
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
