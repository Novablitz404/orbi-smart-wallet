import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { enqueue } from '../../lib/queue';
import { pool } from '../../lib/db';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { authEntryXdr, feeAuthEntryXdr, call, walletAddress, quoteId } = req.body;

  if (!authEntryXdr || !call?.contractId || !call?.function || !Array.isArray(call?.argsXdr) || !walletAddress || !quoteId) {
    return res.status(400).json({ error: 'authEntryXdr, call, walletAddress, quoteId required' });
  }

  try {
    // Bug 1+3: validate quote exists, belongs to this wallet, not expired, not already used
    const { rows } = await pool.query(
      `SELECT fee_stroops, expires_at, used FROM quotes WHERE id = $1 AND wallet_address = $2`,
      [quoteId, walletAddress],
    );
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid quote' });
    const quote = rows[0];
    if (quote.used) return res.status(400).json({ error: 'Quote already used' });
    if (new Date(quote.expires_at) < new Date()) return res.status(400).json({ error: 'Quote expired — request a new one' });

    // Mark quote consumed so it can't be replayed
    await pool.query(`UPDATE quotes SET used = true WHERE id = $1`, [quoteId]);

    const id = uuidv4();
    await enqueue({
      id,
      walletAddress,
      contractId: call.contractId,
      functionName: call.function,
      argsXdr: call.argsXdr,
      authEntryXdr,
      feeAuthEntryXdr: feeAuthEntryXdr ?? '',
      feeStroops: Number(quote.fee_stroops), // Bug 1: use actual quoted amount
    });
    return res.status(201).json({ opId: id });
  } catch (err: any) {
    console.error('[bundle]', err);
    return res.status(500).json({ error: err.message ?? 'Bundle failed' });
  }
});

export default router;
