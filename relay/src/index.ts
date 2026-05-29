import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './lib/db';
import { startFlushWorker } from './worker/flush';
import quoteRouter from './api/routes/quote';
import bundleRouter from './api/routes/bundle';
import statusRouter from './api/routes/status';
import accountRouter from './api/routes/account';
import recoveryRouter from './api/routes/recovery';
import walletRouter from './api/routes/wallet';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/v1/quote', quoteRouter);
app.use('/v1/bundle', bundleRouter);
app.use('/v1/status', statusRouter);
app.use('/v1/account', accountRouter);
app.use('/v1/recovery', recoveryRouter);
app.use('/v1/wallet', walletRouter);

app.get('/health', (_req: express.Request, res: express.Response) => res.json({ ok: true }));

async function start() {
  console.log('[relay] Running migrations...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key_hash TEXT NOT NULL UNIQUE,
      developer_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      active BOOLEAN NOT NULL DEFAULT true,
      fee_per_op_stroops INTEGER NOT NULL DEFAULT 10000,
      balance_stroops BIGINT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS pending_ops (
      id UUID PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      contract_id TEXT NOT NULL,
      function_name TEXT NOT NULL,
      args_xdr JSONB NOT NULL DEFAULT '[]',
      auth_entry_xdr TEXT NOT NULL,
      fee_auth_entry_xdr TEXT NOT NULL DEFAULT '',
      fee_stroops INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      batch_id UUID,
      tx_hash TEXT,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS batches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      op_count INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      tx_hash TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_pending_ops_status ON pending_ops(status);
    CREATE INDEX IF NOT EXISTS idx_pending_ops_wallet ON pending_ops(wallet_address);
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wallet_address TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      passkey_id TEXT NOT NULL,
      public_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS recovery_requests (
      wallet_address TEXT NOT NULL UNIQUE,
      otp_hash TEXT NOT NULL,
      new_passkey_id TEXT NOT NULL,
      new_public_key TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);
  console.log('[relay] Migrations done.');

  app.listen(PORT, () => {
    console.log(`[relay] Listening on port ${PORT}`);
    startFlushWorker();
  });
}

start().catch(err => {
  console.error('[relay] Startup failed:', err);
  process.exit(1);
});
