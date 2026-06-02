import { createHash } from 'crypto';
import { pool } from './db';

export interface ApiKeyRecord {
  id: string;
  developerName: string;
  deployerPublicKey: string | null;
  active: boolean;
}

function hashKey(rawKey: string): string {
  return createHash('sha256')
    .update(rawKey + (process.env.API_KEY_SECRET ?? ''))
    .digest('hex');
}

export async function validateApiKey(rawKey: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT id FROM api_keys WHERE key_hash = $1 AND active = true`,
    [hashKey(rawKey)],
  );
  return rows.length > 0;
}

export async function getApiKeyRecord(rawKey: string): Promise<ApiKeyRecord | null> {
  const { rows } = await pool.query(
    `SELECT id, developer_name, deployer_public_key, active
     FROM api_keys WHERE key_hash = $1 AND active = true`,
    [hashKey(rawKey)],
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    developerName: r.developer_name,
    deployerPublicKey: r.deployer_public_key ?? null,
    active: r.active,
  };
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
