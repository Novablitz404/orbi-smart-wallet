import { pool } from './db';

export type OpStatus = 'pending' | 'batched' | 'confirmed' | 'failed';

export interface PendingOp {
  id: string;
  walletAddress: string;
  contractId: string;
  functionName: string;
  argsXdr: string[];
  authEntryXdr: string;
  feeAuthEntryXdr: string;
  feeStroops: number;
  createdAt: Date;
}

export async function enqueue(op: Omit<PendingOp, 'createdAt'>): Promise<string> {
  const { rows } = await pool.query(
    `INSERT INTO pending_ops
      (id, wallet_address, contract_id, function_name, args_xdr, auth_entry_xdr, fee_auth_entry_xdr, fee_stroops)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [op.id, op.walletAddress, op.contractId, op.functionName,
     JSON.stringify(op.argsXdr), op.authEntryXdr, op.feeAuthEntryXdr, op.feeStroops],
  );
  return rows[0].id;
}

export async function dequeuePending(): Promise<PendingOp[]> {
  const { rows } = await pool.query(
    `SELECT id, wallet_address, contract_id, function_name, args_xdr,
            auth_entry_xdr, fee_auth_entry_xdr, fee_stroops, created_at
     FROM pending_ops
     WHERE status = 'pending'
     ORDER BY created_at ASC
     LIMIT 50`,
  );
  return rows.map(r => ({
    id: r.id,
    walletAddress: r.wallet_address,
    contractId: r.contract_id,
    functionName: r.function_name,
    argsXdr: r.args_xdr,
    authEntryXdr: r.auth_entry_xdr,
    feeAuthEntryXdr: r.fee_auth_entry_xdr,
    feeStroops: r.fee_stroops,
    createdAt: r.created_at,
  }));
}

export async function getOpStatus(id: string) {
  const { rows } = await pool.query(
    `SELECT id, status, tx_hash, batch_id, error_message
     FROM pending_ops WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createBatch(opCount: number): Promise<string> {
  const { rows } = await pool.query(
    `INSERT INTO batches (op_count) VALUES ($1) RETURNING id`,
    [opCount],
  );
  return rows[0].id;
}

export async function markBatched(opIds: string[], batchId: string): Promise<void> {
  await pool.query(
    `UPDATE pending_ops SET status = 'batched', batch_id = $1
     WHERE id = ANY($2::uuid[])`,
    [batchId, opIds],
  );
}

export async function markConfirmed(batchId: string, txHash: string): Promise<void> {
  await pool.query(
    `UPDATE pending_ops SET status = 'confirmed', tx_hash = $1
     WHERE batch_id = $2`,
    [txHash, batchId],
  );
  await pool.query(
    `UPDATE batches SET status = 'confirmed', tx_hash = $1 WHERE id = $2`,
    [txHash, batchId],
  );
}

export async function markFailed(batchId: string, reason?: string): Promise<void> {
  await pool.query(
    `UPDATE pending_ops SET status = 'failed', error_message = $1
     WHERE batch_id = $2`,
    [reason ?? 'batch failed', batchId],
  );
  await pool.query(
    `UPDATE batches SET status = 'failed' WHERE id = $1`,
    [batchId],
  );
}
