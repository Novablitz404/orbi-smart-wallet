import { createHash } from 'crypto';
import { pool } from './db';

export async function validateApiKey(rawKey: string): Promise<boolean> {
  const keyHash = createHash('sha256')
    .update(rawKey + (process.env.API_KEY_SECRET ?? ''))
    .digest('hex');
  const { rows } = await pool.query(
    `SELECT id FROM api_keys WHERE key_hash = $1 AND active = true`,
    [keyHash],
  );
  return rows.length > 0;
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
