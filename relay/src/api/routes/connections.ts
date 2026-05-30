import { Router, Request, Response } from 'express';
import { pool } from '../../lib/db';

const router = Router();

/**
 * POST /v1/connections
 * Grant a dApp permission to connect to a wallet.
 * Called by the /connect popup after user approves.
 */
router.post('/', async (req: Request, res: Response) => {
  const { walletAddress, origin, appName } = req.body;
  if (!walletAddress || !origin) {
    return res.status(400).json({ error: 'walletAddress and origin required' });
  }

  await pool.query(
    `INSERT INTO dapp_connections (wallet_address, origin, app_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (wallet_address, origin) DO UPDATE
       SET revoked_at = NULL, app_name = EXCLUDED.app_name`,
    [walletAddress, origin, appName ?? ''],
  );

  return res.status(201).json({ ok: true });
});

/**
 * GET /v1/connections?walletAddress=...
 * List all active dApp connections for a wallet.
 */
router.get('/', async (req: Request, res: Response) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

  const { rows } = await pool.query(
    `SELECT id, origin, app_name, created_at
     FROM dapp_connections
     WHERE wallet_address = $1 AND revoked_at IS NULL
     ORDER BY created_at DESC`,
    [walletAddress],
  );

  return res.json(rows.map(r => ({
    id: r.id,
    origin: r.origin,
    appName: r.app_name,
    connectedAt: r.created_at,
  })));
});

/**
 * GET /v1/connections/check?walletAddress=...&origin=...
 * Check if a specific dApp has permission for a wallet.
 */
router.get('/check', async (req: Request, res: Response) => {
  const { walletAddress, origin } = req.query;
  if (!walletAddress || !origin) {
    return res.status(400).json({ error: 'walletAddress and origin required' });
  }

  const { rows } = await pool.query(
    `SELECT id FROM dapp_connections
     WHERE wallet_address = $1 AND origin = $2 AND revoked_at IS NULL`,
    [walletAddress, origin],
  );

  return res.json({ connected: rows.length > 0 });
});

/**
 * DELETE /v1/connections/:id
 * Revoke a dApp's permission (soft delete).
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { walletAddress } = req.body;

  await pool.query(
    `UPDATE dapp_connections SET revoked_at = NOW()
     WHERE id = $1 AND wallet_address = $2`,
    [id, walletAddress],
  );

  return res.json({ ok: true });
});

export default router;
