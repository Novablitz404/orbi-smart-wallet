import { Router, Request, Response } from 'express';
import { createHash, randomBytes } from 'crypto';
import { pool } from '../../lib/db';
import { sendMagicLink } from '../../lib/email';
import { getHorizonUrl } from '../../lib/stellar';

const router = Router();

const MAGIC_LINK_EXPIRY_MINUTES = 15;
const SESSION_EXPIRY_DAYS = 7;
const DEVELOPERS_URL = process.env.DEVELOPERS_URL ?? 'https://developers.orbiwallet.xyz';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function getSessionRecord(req: Request): Promise<{ email: string } | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const { rows } = await pool.query(
    `SELECT email FROM dev_sessions
     WHERE token = $1 AND expires_at > NOW()`,
    [token],
  );
  return rows[0] ?? null;
}

// POST /v1/dev/magic-link — send a magic link to a registered developer email
router.post('/magic-link', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  const { rows } = await pool.query(
    `SELECT id FROM api_keys WHERE email = $1 AND active = true`,
    [email],
  );
  // Always respond 200 to avoid email enumeration
  if (rows.length === 0) return res.json({ ok: true });

  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

  await pool.query(
    `INSERT INTO dev_magic_links (token_hash, email, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, email, expiresAt],
  );

  const magicUrl = `${DEVELOPERS_URL}/verify?token=${token}`;
  await sendMagicLink(email, magicUrl);

  return res.json({ ok: true });
});

// POST /v1/dev/verify — exchange magic link token for a session token
router.post('/verify', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });

  const tokenHash = hashToken(token);
  const { rows } = await pool.query(
    `UPDATE dev_magic_links
     SET used = true
     WHERE token_hash = $1 AND used = false AND expires_at > NOW()
     RETURNING email`,
    [tokenHash],
  );

  if (rows.length === 0) return res.status(401).json({ error: 'Invalid or expired link' });

  const { email } = rows[0];
  const sessionToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO dev_sessions (token, email, expires_at) VALUES ($1, $2, $3)`,
    [sessionToken, email, expiresAt],
  );

  return res.json({ sessionToken, expiresAt });
});

// GET /v1/dev/me — get account info for the logged-in developer
router.get('/me', async (req: Request, res: Response) => {
  const session = await getSessionRecord(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const { rows } = await pool.query(
    `SELECT developer_name, email, deployer_public_key, key_hash FROM api_keys
     WHERE email = $1 AND active = true`,
    [session.email],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Account not found' });

  const r = rows[0];
  // Show last 4 chars of key hash as a hint — raw key is never stored
  const keyHint = r.key_hash.slice(-4);

  return res.json({
    developerName: r.developer_name,
    email: r.email,
    deployerPublicKey: r.deployer_public_key ?? null,
    apiKeyHint: `orbi_••••••••${keyHint}`,
  });
});

// GET /v1/dev/balance — deployer XLM balance
router.get('/balance', async (req: Request, res: Response) => {
  const session = await getSessionRecord(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const { rows } = await pool.query(
    `SELECT deployer_public_key FROM api_keys WHERE email = $1 AND active = true`,
    [session.email],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Account not found' });

  const deployerPublicKey = rows[0].deployer_public_key;
  if (!deployerPublicKey) return res.status(400).json({ error: 'No deployer configured' });

  try {
    const resp = await fetch(`${getHorizonUrl()}/accounts/${deployerPublicKey}`);
    if (resp.status === 404) return res.status(404).json({ error: 'Deployer account not found — fund it on Stellar first' });
    if (!resp.ok) throw new Error(`Horizon returned ${resp.status}`);

    const data: any = await resp.json();
    const native = data.balances?.find((b: any) => b.asset_type === 'native');
    const balanceXlm = native?.balance ?? '0';
    return res.json({
      address: deployerPublicKey,
      balanceXlm,
      balanceStroops: String(Math.floor(parseFloat(balanceXlm) * 1e7)),
    });
  } catch (err: any) {
    console.error('[dev/balance]', err);
    return res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// PATCH /v1/dev/deployer — set or update the deployer public key
router.patch('/deployer', async (req: Request, res: Response) => {
  const session = await getSessionRecord(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const { deployerPublicKey } = req.body;
  if (!deployerPublicKey) return res.status(400).json({ error: 'deployerPublicKey required' });

  await pool.query(
    `UPDATE api_keys SET deployer_public_key = $1 WHERE email = $2`,
    [deployerPublicKey, session.email],
  );
  return res.json({ ok: true });
});

// POST /v1/dev/rotate-key — generate a new API key (returns raw key once)
router.post('/rotate-key', async (req: Request, res: Response) => {
  const session = await getSessionRecord(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const rawKey = randomBytes(32).toString('hex');
  const keyHash = createHash('sha256')
    .update(rawKey + (process.env.API_KEY_SECRET ?? ''))
    .digest('hex');

  await pool.query(
    `UPDATE api_keys SET key_hash = $1 WHERE email = $2`,
    [keyHash, session.email],
  );

  return res.json({
    apiKey: rawKey,
    message: 'Save this key — it will not be shown again.',
  });
});

export default router;
