import { Router, Request, Response } from 'express';
import { Address, Contract, TransactionBuilder, BASE_FEE, xdr, scValToNative, StrKey } from '@stellar/stellar-sdk';
import { pool } from '../../lib/db';
import { deriveWalletAddress, deployWallet } from '../../lib/wallet';
import { getServer, getNativeSacId, getDeployerKeypair, getPassphrase } from '../../lib/stellar';
import { getSacToCodeMap } from '../../lib/tokens';

const router = Router();

/**
 * GET /v1/wallet/balance/:address
 * Returns the native XLM balance by simulating native_sac.balance(address).
 */
router.get('/balance/:address', async (req: Request, res: Response) => {
  const { address } = req.params;
  try {
    const server = getServer();
    const nativeSacId = getNativeSacId();
    const deployer = getDeployerKeypair();
    const networkPassphrase = getPassphrase();

    const nativeSac = new Contract(nativeSacId);
    const account = await server.getAccount(deployer.publicKey());

    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
      .addOperation(nativeSac.call('balance', new Address(address).toScVal()))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if ('error' in sim) return res.json({ balanceStroops: '0', xlm: '0.0000000' });

    const retval = (sim as any).result?.retval;
    if (!retval) return res.json({ balanceStroops: '0', xlm: '0.0000000' });

    const i128 = retval.i128();
    const lo = BigInt(i128.lo().toString());
    const hi = BigInt(i128.hi().toString());
    const balanceStroops = hi * (2n ** 64n) + lo;
    const xlm = (Number(balanceStroops) / 10_000_000).toFixed(7);

    return res.json({ balanceStroops: balanceStroops.toString(), xlm });
  } catch (err: any) {
    console.error('[wallet/balance]', err);
    return res.status(500).json({ error: 'Balance query failed' });
  }
});

/**
 * GET /v1/wallet/token-balance/:walletAddress/:contractId
 * Returns balance of any Stellar token SAC for a wallet address.
 */
router.get('/token-balance/:walletAddress/:contractId', async (req: Request, res: Response) => {
  const { walletAddress, contractId } = req.params;
  try {
    const server = getServer();
    const deployer = getDeployerKeypair();
    const networkPassphrase = getPassphrase();

    const tokenContract = new Contract(contractId);
    const account = await server.getAccount(deployer.publicKey());

    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
      .addOperation(tokenContract.call('balance', new Address(walletAddress).toScVal()))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if ('error' in sim) return res.json({ balance: '0', decimals: 7 });

    const retval = (sim as any).result?.retval;
    if (!retval) return res.json({ balance: '0', decimals: 7 });

    const i128 = retval.i128();
    const lo = BigInt(i128.lo().toString());
    const hi = BigInt(i128.hi().toString());
    const raw = hi * (2n ** 64n) + lo;

    return res.json({ balance: raw.toString(), decimals: 7 });
  } catch (err: any) {
    console.error('[wallet/token-balance]', err);
    return res.json({ balance: '0', decimals: 7 });
  }
});

/**
 * GET /v1/wallet/check-email?email=...
 * Returns { available: true } if the email is not yet registered.
 */
router.get('/check-email', async (req: Request, res: Response) => {
  const email = (req.query.email as string | undefined)?.toLowerCase().trim();
  if (!email) return res.status(400).json({ error: 'email required' });

  const { rows } = await pool.query(
    `SELECT 1 FROM users WHERE email = $1 LIMIT 1`,
    [email],
  );
  return res.json({ available: rows.length === 0 });
});

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

    // Deploy the wallet eagerly — deployer pays now, user repays on first send
    console.log(`[wallet/create] Deploying ${walletAddress}`);
    const { txHash, feeStroops } = await deployWallet(
      Buffer.from(passkeyId, 'hex'),
      Buffer.from(publicKey, 'hex'),
      walletAddress,
    );
    console.log(`[wallet/create] Deployed ${walletAddress} tx=${txHash} fee=${feeStroops}`);

    await pool.query(
      `INSERT INTO users (wallet_address, email, passkey_id, public_key, deployment_fee_stroops)
       VALUES ($1, $2, $3, $4, $5)`,
      [walletAddress, email.toLowerCase(), passkeyId, publicKey, feeStroops],
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

/**
 * POST /v1/wallet/lookup
 * Restore a session after sign-out. Given a passkeyId, returns the stored
 * wallet address and email so the app can rebuild localStorage.
 */
router.post('/lookup', async (req: Request, res: Response) => {
  const { passkeyId } = req.body;
  if (!passkeyId) return res.status(400).json({ error: 'passkeyId required' });

  try {
    const result = await pool.query(
      `SELECT wallet_address, email FROM users WHERE passkey_id = $1`,
      [passkeyId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    const { wallet_address, email } = result.rows[0];
    return res.json({ walletAddress: wallet_address, email });
  } catch (err: any) {
    console.error('[wallet/lookup]', err);
    return res.status(500).json({ error: 'Lookup failed' });
  }
});

/**
 * GET /v1/wallet/history/:walletAddress
 * Returns merged outgoing (pending_ops) + incoming (incoming_transfers) transactions.
 */
router.get('/history/:walletAddress', async (req: Request, res: Response) => {
  const { walletAddress } = req.params;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const fetchCount = page * limit + 1; // +1 to detect hasMore

  try {
    const sacToCode = getSacToCodeMap();

    const { rows: ops } = await pool.query(
      `SELECT id, contract_id, function_name, args_xdr, status, tx_hash, created_at
       FROM pending_ops
       WHERE wallet_address = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [walletAddress, fetchCount],
    );

    const outgoing = ops.map((op: any) => {
      const base: any = {
        id: op.id,
        direction: 'outgoing',
        contractId: op.contract_id,
        functionName: op.function_name,
        status: op.status,
        txHash: op.tx_hash ?? null,
        createdAt: op.created_at,
      };

      if (op.function_name === 'transfer') {
        try {
          const args: string[] = op.args_xdr;
          const toVal = xdr.ScVal.fromXDR(args[1], 'base64');
          const amountVal = xdr.ScVal.fromXDR(args[2], 'base64');
          const lo = BigInt(amountVal.i128().lo().toString());
          const hi = BigInt(amountVal.i128().hi().toString());
          base.type = 'transfer';
          base.to = Address.fromScVal(toVal).toString();
          base.amount = (hi * (2n ** 64n) + lo).toString();
          base.assetCode = sacToCode.get(op.contract_id) ?? 'unknown';
        } catch {
          base.type = 'transfer';
        }
      } else {
        base.type = 'contract_call';
      }

      return base;
    });

    const { rows: incoming } = await pool.query(
      `SELECT id, from_address, amount, asset_code, tx_hash, ledger, created_at
       FROM incoming_transfers
       WHERE wallet_address = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [walletAddress, fetchCount],
    );

    const incomingMapped = incoming.map((t: any) => ({
      id: t.id,
      direction: 'incoming',
      type: 'transfer',
      assetCode: t.asset_code,
      amount: t.amount,
      from: t.from_address,
      txHash: t.tx_hash ?? null,
      status: 'confirmed',
      createdAt: t.created_at,
    }));

    const all = [...outgoing, ...incomingMapped].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const offset = (page - 1) * limit;
    const hasMore = all.length > offset + limit;
    const transactions = all.slice(offset, offset + limit);

    return res.json({ transactions, hasMore, page });
  } catch (err: any) {
    console.error('[wallet/history]', err);
    return res.status(500).json({ error: 'History query failed' });
  }
});

/** Simulate a no-arg read call on a contract and return the decoded ScVal. */
async function simulateRead(contractId: string, fn: string): Promise<xdr.ScVal | null> {
  const server = getServer();
  const deployer = getDeployerKeypair();
  const networkPassphrase = getPassphrase();
  const contract = new Contract(contractId);
  const account = await server.getAccount(deployer.publicKey());
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(contract.call(fn))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if ('error' in sim) return null;
  return (sim as any).result?.retval ?? null;
}

/** Read symbol/name/decimals from any token contract via simulation (free, read-only). */
async function fetchTokenMetadata(contractId: string): Promise<{ code: string; name: string; decimals: number } | null> {
  try {
    const [symVal, nameVal, decVal] = await Promise.all([
      simulateRead(contractId, 'symbol'),
      simulateRead(contractId, 'name'),
      simulateRead(contractId, 'decimals'),
    ]);
    if (!symVal) return null; // not a token contract
    const code = String(scValToNative(symVal));
    const name = nameVal ? String(scValToNative(nameVal)) : code;
    const decimals = decVal ? Number(scValToNative(decVal)) : 7;
    return { code, name, decimals };
  } catch (err) {
    console.error('[wallet/token-metadata]', err);
    return null;
  }
}

/**
 * GET /v1/wallet/token-metadata/:contractId
 * Reads a token contract's symbol/name/decimals — used to preview a token before adding.
 */
router.get('/token-metadata/:contractId', async (req: Request, res: Response) => {
  const { contractId } = req.params;
  if (!StrKey.isValidContract(contractId)) {
    return res.status(400).json({ error: 'Invalid contract address' });
  }
  const meta = await fetchTokenMetadata(contractId);
  if (!meta) return res.status(404).json({ error: 'Not a token contract or no metadata' });
  return res.json(meta);
});

/**
 * GET /v1/wallet/tokens/:walletAddress
 * Returns the wallet's manually/dApp-added tokens.
 */
router.get('/tokens/:walletAddress', async (req: Request, res: Response) => {
  const { walletAddress } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT contract_id, code, name, decimals, added_via
       FROM watched_tokens WHERE wallet_address = $1 ORDER BY created_at ASC`,
      [walletAddress],
    );
    return res.json({
      tokens: rows.map((r: any) => ({
        contractId: r.contract_id,
        code: r.code,
        name: r.name,
        decimals: r.decimals,
        addedVia: r.added_via,
      })),
    });
  } catch (err: any) {
    console.error('[wallet/tokens]', err);
    return res.status(500).json({ error: 'Failed to load tokens' });
  }
});

/**
 * POST /v1/wallet/tokens
 * Adds a token to a wallet's watch list. Body: { walletAddress, contractId, addedVia? }
 * Fetches metadata server-side so the client can't spoof code/decimals.
 */
router.post('/tokens', async (req: Request, res: Response) => {
  const { walletAddress, contractId, addedVia } = req.body ?? {};
  if (!walletAddress || !contractId) {
    return res.status(400).json({ error: 'walletAddress and contractId required' });
  }
  if (!StrKey.isValidContract(contractId)) {
    return res.status(400).json({ error: 'Invalid contract address' });
  }

  try {
    const meta = await fetchTokenMetadata(contractId);
    if (!meta) return res.status(404).json({ error: 'Not a valid token contract' });

    const via = addedVia === 'dapp' ? 'dapp' : 'manual';
    await pool.query(
      `INSERT INTO watched_tokens (wallet_address, contract_id, code, name, decimals, added_via)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (wallet_address, contract_id) DO UPDATE
         SET code = EXCLUDED.code, name = EXCLUDED.name, decimals = EXCLUDED.decimals`,
      [walletAddress, contractId, meta.code, meta.name, meta.decimals, via],
    );

    return res.status(201).json({
      token: { contractId, code: meta.code, name: meta.name, decimals: meta.decimals, addedVia: via },
    });
  } catch (err: any) {
    console.error('[wallet/tokens POST]', err);
    return res.status(500).json({ error: 'Failed to add token' });
  }
});

/**
 * DELETE /v1/wallet/tokens/:walletAddress/:contractId
 * Removes a token from a wallet's watch list.
 */
router.delete('/tokens/:walletAddress/:contractId', async (req: Request, res: Response) => {
  const { walletAddress, contractId } = req.params;
  try {
    await pool.query(
      `DELETE FROM watched_tokens WHERE wallet_address = $1 AND contract_id = $2`,
      [walletAddress, contractId],
    );
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('[wallet/tokens DELETE]', err);
    return res.status(500).json({ error: 'Failed to remove token' });
  }
});

export default router;
