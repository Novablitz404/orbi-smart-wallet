import { Router, Request, Response } from 'express';
import { createHash, randomBytes } from 'crypto';
import { pool } from '../../lib/db';
import { extractBearerToken, getApiKeyRecord } from '../../lib/auth';
import { getHorizonUrl } from '../../lib/stellar';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { developerName, email, deployerPublicKey } = req.body;
  if (!developerName || !email) {
    return res.status(400).json({ error: 'developerName and email required' });
  }

  const rawKey = randomBytes(32).toString('hex');
  const keyHash = createHash('sha256')
    .update(rawKey + (process.env.API_KEY_SECRET ?? ''))
    .digest('hex');

  try {
    await pool.query(
      `INSERT INTO api_keys (key_hash, developer_name, email, deployer_public_key)
       VALUES ($1, $2, $3, $4)`,
      [keyHash, developerName, email, deployerPublicKey ?? null],
    );
    return res.status(201).json({
      apiKey: rawKey,
      message: 'Save this key — it will not be shown again.',
    });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    console.error(err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// Update the deployer public key for an existing API key account.
// dApps call this after generating a Stellar keypair and adding Orbi as co-signer.
router.patch('/deployer', async (req: Request, res: Response) => {
  const rawKey = extractBearerToken(req.headers.authorization);
  if (!rawKey) return res.status(401).json({ error: 'API key required' });

  const record = await getApiKeyRecord(rawKey);
  if (!record) return res.status(401).json({ error: 'Invalid API key' });

  const { deployerPublicKey } = req.body;
  if (!deployerPublicKey) return res.status(400).json({ error: 'deployerPublicKey required' });

  await pool.query(
    `UPDATE api_keys SET deployer_public_key = $1 WHERE id = $2`,
    [deployerPublicKey, record.id],
  );
  return res.json({ ok: true });
});

// Return the XLM balance of the dApp's deployer account on Stellar.
router.get('/balance', async (req: Request, res: Response) => {
  const rawKey = extractBearerToken(req.headers.authorization);
  if (!rawKey) return res.status(401).json({ error: 'API key required' });

  const record = await getApiKeyRecord(rawKey);
  if (!record) return res.status(401).json({ error: 'Invalid API key' });
  if (!record.deployerPublicKey) return res.status(400).json({ error: 'No deployer configured — call PATCH /account/deployer first' });

  try {
    const resp = await fetch(`${getHorizonUrl()}/accounts/${record.deployerPublicKey}`);
    if (resp.status === 404) return res.status(404).json({ error: 'Deployer account not found — fund it on Stellar first' });
    if (!resp.ok) throw new Error(`Horizon returned ${resp.status}`);

    const data: any = await resp.json();
    const native = data.balances?.find((b: any) => b.asset_type === 'native');
    const balanceXlm = native?.balance ?? '0';
    return res.json({
      address: record.deployerPublicKey,
      balanceXlm,
      balanceStroops: String(Math.floor(parseFloat(balanceXlm) * 1e7)),
    });
  } catch (err: any) {
    console.error('[account/balance]', err);
    return res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

export default router;
