import { Router, Request, Response } from 'express';
import { Address, Contract, TransactionBuilder, BASE_FEE } from '@stellar/stellar-sdk';
import { pool } from '../../lib/db';
import { deriveWalletAddress, deployWallet } from '../../lib/wallet';
import { getServer, getNativeSacId, getDeployerKeypair, getPassphrase } from '../../lib/stellar';

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

export default router;
