import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { enqueue } from '../../lib/queue';
import { validateApiKey, extractBearerToken } from '../../lib/auth';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token || !(await validateApiKey(token))) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const { authEntryXdr, feeAuthEntryXdr, call, walletAddress, quoteId } = req.body;

  if (!authEntryXdr || !call?.contractId || !call?.function || !Array.isArray(call?.argsXdr) || !walletAddress) {
    return res.status(400).json({ error: 'authEntryXdr, feeAuthEntryXdr, call, walletAddress required' });
  }

  try {
    const id = uuidv4();
    await enqueue({
      id,
      walletAddress,
      contractId: call.contractId,
      functionName: call.function,
      argsXdr: call.argsXdr,
      authEntryXdr,
      feeAuthEntryXdr: feeAuthEntryXdr ?? '',
      feeStroops: 0,
    });
    return res.status(201).json({ opId: id });
  } catch (err: any) {
    console.error('[bundle]', err);
    return res.status(500).json({ error: err.message ?? 'Bundle failed' });
  }
});

export default router;
