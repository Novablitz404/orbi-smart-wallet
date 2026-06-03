import { Router, Request, Response } from 'express';
import { xdr } from '@stellar/stellar-sdk';
import { simulateGasFee } from '../../lib/pricer';
import { buildCombinedAuthEntry } from '../../lib/authEntry';
import { extractBearerToken, getApiKeyRecord } from '../../lib/auth';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { contractId, functionName, argsXdr, walletAddress } = req.body;

  if (!contractId || !functionName || !Array.isArray(argsXdr) || !walletAddress) {
    return res.status(400).json({ error: 'contractId, functionName, argsXdr, walletAddress required' });
  }

  try {
    const args = (argsXdr as string[]).map(a =>
      xdr.ScVal.fromXDR(Buffer.from(a, 'base64'))
    );
    const quote = await simulateGasFee({ contractId, functionName, args, walletAddress });

    // If the request comes from a dApp with a configured deployer, the dApp sponsors
    // the fee. The auth entry is built with fee=0 so the user signs nothing for gas,
    // but the actual fee is stored in the quote for the batcher to charge the dApp.
    const rawKey = extractBearerToken(req.headers.authorization);
    let authFeeStroops = quote.feeStroops;
    let sponsored = false;
    let sponsorName: string | null = null;
    if (rawKey) {
      const record = await getApiKeyRecord(rawKey);
      if (record?.deployerPublicKey) {
        authFeeStroops = 0;
        sponsored = true;
        sponsorName = record.developerName;
      }
    }

    const entry = buildCombinedAuthEntry({
      walletAddress,
      nativeSacId: quote.nativeSacId,
      feeCollectorAddress: quote.feeCollectorAddress,
      feeStroops: authFeeStroops,
      opContractId: contractId,
      opFunctionName: functionName,
      opArgs: args,
      currentLedger: quote.currentLedger,
    });

    return res.json({
      ...quote,
      authEntryXdr: Buffer.from(entry.toXDR()).toString('base64'),
      sponsored,
      sponsorName,
    });
  } catch (err: any) {
    console.error('[quote]', err);
    return res.status(500).json({ error: err.message ?? 'Quote failed' });
  }
});

export default router;
