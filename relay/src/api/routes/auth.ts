import { Router, Request, Response } from 'express';
import { pool } from '../../lib/db';

const router = Router();

/**
 * POST /v1/auth/tokens
 * Issue a short-lived token encoding a wallet session (2 minute TTL, single use).
 * Called by keys.orbiwallet.xyz after passkey auth, before redirecting back.
 */
router.post('/tokens', async (req: Request, res: Response) => {
  const { walletAddress, credentialId, passkeyId, email } = req.body;
  if (!walletAddress || !credentialId || !passkeyId || !email) {
    return res.status(400).json({ error: 'walletAddress, credentialId, passkeyId, email required' });
  }

  const { rows } = await pool.query(
    `INSERT INTO auth_tokens (wallet_address, credential_id, passkey_id, email)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [walletAddress, credentialId, passkeyId, email],
  );

  return res.json({ token: rows[0].id });
});

/**
 * GET /v1/auth/tokens/:token
 * Exchange a token for wallet session data. Single-use, expires after 2 minutes.
 */
router.get('/tokens/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  const { rows } = await pool.query(
    `UPDATE auth_tokens
     SET used = true
     WHERE id = $1 AND used = false AND expires_at > NOW()
     RETURNING wallet_address, credential_id, passkey_id, email`,
    [token],
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Token not found, already used, or expired' });
  }

  const r = rows[0];
  return res.json({
    walletAddress: r.wallet_address,
    credentialId: r.credential_id,
    passkeyId: r.passkey_id,
    email: r.email,
  });
});

export default router;
