import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { pool } from './lib/db';
import { startFlushWorker } from './worker/flush';
import { startEventSyncWorker } from './worker/eventSync';
import quoteRouter from './api/routes/quote';
import bundleRouter from './api/routes/bundle';
import statusRouter from './api/routes/status';
import accountRouter from './api/routes/account';
import recoveryRouter from './api/routes/recovery';
import walletRouter from './api/routes/wallet';
import connectionsRouter from './api/routes/connections';
import authRouter from './api/routes/auth';
import devRouter from './api/routes/dev';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// 30 requests per minute per IP on sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// 10 wallet creations per hour per IP
const createLimiter = rateLimit({
  windowMs: 60 * 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many wallet creations from this IP.' },
});

app.use('/v1/quote', strictLimiter, quoteRouter);
app.use('/v1/bundle', strictLimiter, bundleRouter);
app.use('/v1/wallet/create', createLimiter);
app.use('/v1/status', statusRouter);
app.use('/v1/account', accountRouter);
app.use('/v1/recovery', recoveryRouter);
app.use('/v1/wallet', walletRouter);
app.use('/v1/connections', connectionsRouter);
app.use('/v1/auth', authRouter);
app.use('/v1/dev', devRouter);

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

    ALTER TABLE users ADD COLUMN IF NOT EXISTS deployment_fee_stroops BIGINT NOT NULL DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS deployment_fee_charged BOOLEAN NOT NULL DEFAULT false;

    CREATE TABLE IF NOT EXISTS dapp_connections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wallet_address TEXT NOT NULL,
      origin TEXT NOT NULL,
      app_name TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked_at TIMESTAMPTZ,
      UNIQUE(wallet_address, origin)
    );
    CREATE INDEX IF NOT EXISTS idx_connections_wallet ON dapp_connections(wallet_address);

    CREATE TABLE IF NOT EXISTS auth_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wallet_address TEXT NOT NULL,
      credential_id TEXT NOT NULL,
      passkey_id TEXT NOT NULL,
      email TEXT NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '2 minutes',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id UUID PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      fee_stroops BIGINT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_quotes_wallet ON quotes(wallet_address);

    CREATE TABLE IF NOT EXISTS incoming_transfers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wallet_address TEXT NOT NULL,
      from_address TEXT NOT NULL,
      amount TEXT NOT NULL,
      asset_code TEXT NOT NULL,
      asset_sac_id TEXT NOT NULL,
      tx_hash TEXT,
      ledger INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(asset_sac_id, ledger, from_address, wallet_address, amount)
    );
    CREATE INDEX IF NOT EXISTS idx_incoming_transfers_wallet ON incoming_transfers(wallet_address);

    CREATE TABLE IF NOT EXISTS event_sync_cursors (
      sac_id TEXT PRIMARY KEY,
      last_ledger INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS watched_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wallet_address TEXT NOT NULL,
      contract_id TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      decimals INTEGER NOT NULL DEFAULT 7,
      added_via TEXT NOT NULL DEFAULT 'manual',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(wallet_address, contract_id)
    );
    CREATE INDEX IF NOT EXISTS idx_watched_tokens_wallet ON watched_tokens(wallet_address);

    CREATE TABLE IF NOT EXISTS dev_magic_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token_hash TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS dev_sessions (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_dev_sessions_email ON dev_sessions(email);

    CREATE TABLE IF NOT EXISTS horizon_sync_cursors (
      wallet_address TEXT PRIMARY KEY,
      last_cursor TEXT NOT NULL DEFAULT ''
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_incoming_transfers_tx_hash
      ON incoming_transfers(tx_hash) WHERE tx_hash IS NOT NULL;
  `);
  console.log('[relay] Migrations done.');

  app.listen(PORT, () => {
    console.log(`[relay] Listening on port ${PORT}`);
    startFlushWorker();
    startEventSyncWorker();
  });
}

start().catch(err => {
  console.error('[relay] Startup failed:', err);
  process.exit(1);
});
