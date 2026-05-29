import { Router, Request, Response } from 'express';
import { xdr } from '@stellar/stellar-sdk';
import { simulateGasFee } from '../../lib/pricer';
import { validateApiKey, extractBearerToken } from '../../lib/auth';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token || !(await validateApiKey(token))) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const { contractId, functionName, argsXdr, walletAddress } = req.body;

  if (!contractId || !functionName || !Array.isArray(argsXdr) || !walletAddress) {
    return res.status(400).json({ error: 'contractId, functionName, argsXdr, walletAddress required' });
  }

  try {
    const args = (argsXdr as string[]).map(a =>
      xdr.ScVal.fromXDR(Buffer.from(a, 'base64'))
    );
    const quote = await simulateGasFee({ contractId, functionName, args, walletAddress });
    return res.json(quote);
  } catch (err: any) {
    console.error('[quote]', err);
    return res.status(500).json({ error: err.message ?? 'Quote failed' });
  }
});

export default router;
