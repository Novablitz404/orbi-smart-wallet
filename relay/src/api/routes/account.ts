import { Router, Request, Response } from 'express';
import { createHash, randomBytes } from 'crypto';
import { pool } from '../../lib/db';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { developerName, email } = req.body;
  if (!developerName || !email) {
    return res.status(400).json({ error: 'developerName and email required' });
  }

  const rawKey = randomBytes(32).toString('hex');
  const keyHash = createHash('sha256')
    .update(rawKey + (process.env.API_KEY_SECRET ?? ''))
    .digest('hex');

  try {
    await pool.query(
      `INSERT INTO api_keys (key_hash, developer_name, email) VALUES ($1, $2, $3)`,
      [keyHash, developerName, email],
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

export default router;
