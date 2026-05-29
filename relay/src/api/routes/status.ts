import { Router, Request, Response } from 'express';
import { getOpStatus } from '../../lib/queue';

const router = Router();

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const op = await getOpStatus(id);
  if (!op) return res.status(404).json({ error: 'Op not found' });
  return res.json({
    opId: op.id,
    status: op.status,
    txHash: op.tx_hash ?? null,
    batchId: op.batch_id ?? null,
    error: op.error_message ?? null,
  });
});

export default router;
