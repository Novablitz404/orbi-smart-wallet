import { Router, Request, Response } from 'express';
import { pool } from '../../lib/db';
import { deriveWalletAddress } from '../../lib/wallet';

const router = Router();

/**
 * POST /v1/wallet/address
 * Returns the deterministic C-address for a passkey ID.
 * No deployment — safe to call before any transaction.
 */
router.post('/address', async (req: Request, res: Response) => {
  const { passkeyId } = req.body;
  if (!passkeyId) return res.status(400).json({ error: 'passkeyId required' });

  try {
    const walletAddress = deriveWalletAddress(Buffer.from(passkeyId, 'hex'));
    return res.json({ walletAddress });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /v1/wallet/create
 * Register a new wallet — stores email + passkey info for lazy deployment.
 * Actual contract deployment happens on the first transaction.
 */
router.post('/create', async (req: Request, res: Response) => {
  const { passkeyId, publicKey, email } = req.body;

  if (!passkeyId || !publicKey || !email) {
    return res.status(400).json({ error: 'passkeyId, publicKey, email required' });
  }

  try {
    const walletAddress = deriveWalletAddress(Buffer.from(passkeyId, 'hex'));

    await pool.query(
      `INSERT INTO users (wallet_address, email, passkey_id, public_key)
       VALUES ($1, $2, $3, $4)`,
      [walletAddress, email.toLowerCase(), passkeyId, publicKey],
    );

    return res.status(201).json({ walletAddress });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Wallet already registered' });
    }
    console.error('[wallet/create]', err);
    return res.status(500).json({ error: 'Wallet creation failed' });
  }
});

export default router;
