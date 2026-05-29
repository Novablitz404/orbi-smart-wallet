import { Router, Request, Response } from 'express';
import { createHash, randomInt } from 'crypto';
import { pool } from '../../lib/db';
import { sendRecoveryOtp } from '../../lib/email';
import { deriveGuardianKeypair } from '../../lib/guardian';
import { getServer, getDeployerKeypair, getPassphrase } from '../../lib/stellar';
import { Contract, TransactionBuilder, BASE_FEE, xdr, Address } from '@stellar/stellar-sdk';

const router = Router();
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// POST /v1/recovery/initiate
// User provides email + new passkey. Orbi sends OTP.
router.post('/initiate', async (req: Request, res: Response) => {
  const { email, newPasskeyId, newPublicKey } = req.body;

  if (!email || !newPasskeyId || !newPublicKey) {
    return res.status(400).json({ error: 'email, newPasskeyId, newPublicKey required' });
  }

  try {
    // Look up wallet by email
    const { rows } = await pool.query(
      `SELECT wallet_address FROM users WHERE email = $1`,
      [email.toLowerCase()],
    );
    if (rows.length === 0) {
      // Return same response to avoid email enumeration
      return res.json({ message: 'If that email is registered, a code has been sent.' });
    }

    const walletAddress = rows[0].wallet_address;

    // Generate 6-digit OTP
    const otp = String(randomInt(100000, 999999));
    const otpHash = createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    // Store pending recovery (invalidate previous ones for this wallet)
    await pool.query(
      `INSERT INTO recovery_requests
         (wallet_address, otp_hash, new_passkey_id, new_public_key, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (wallet_address)
       DO UPDATE SET otp_hash = $2, new_passkey_id = $3, new_public_key = $4,
                     expires_at = $5, used = false`,
      [walletAddress, otpHash, newPasskeyId, newPublicKey, expiresAt],
    );

    await sendRecoveryOtp(email, otp);

    return res.json({ message: 'If that email is registered, a code has been sent.' });
  } catch (err: any) {
    console.error('[recovery/initiate]', err);
    return res.status(500).json({ error: 'Recovery initiation failed' });
  }
});

// POST /v1/recovery/confirm
// User submits OTP. Orbi's guardian signs replace_passkey.
router.post('/confirm', async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'email and otp required' });
  }

  try {
    const { rows: userRows } = await pool.query(
      `SELECT wallet_address FROM users WHERE email = $1`,
      [email.toLowerCase()],
    );
    if (userRows.length === 0) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    const walletAddress = userRows[0].wallet_address;
    const otpHash = createHash('sha256').update(String(otp)).digest('hex');

    const { rows } = await pool.query(
      `SELECT new_passkey_id, new_public_key, expires_at
       FROM recovery_requests
       WHERE wallet_address = $1 AND otp_hash = $2 AND used = false`,
      [walletAddress, otpHash],
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    const { new_passkey_id, new_public_key, expires_at } = rows[0];

    if (new Date() > new Date(expires_at)) {
      return res.status(400).json({ error: 'Code expired' });
    }

    // Mark OTP as used immediately
    await pool.query(
      `UPDATE recovery_requests SET used = true WHERE wallet_address = $1`,
      [walletAddress],
    );

    // Guardian signs replace_passkey
    const server = getServer();
    const deployer = getDeployerKeypair();
    const guardian = deriveGuardianKeypair(walletAddress);
    const networkPassphrase = getPassphrase();

    const account = await server.getAccount(deployer.publicKey());
    const walletContract = new Contract(walletAddress);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        walletContract.call(
          'replace_passkey',
          xdr.ScVal.scvBytes(Buffer.from(new_passkey_id, 'hex')),
          xdr.ScVal.scvBytes(Buffer.from(new_public_key, 'hex')),
        )
      )
      .setTimeout(300)
      .build();

    const simResult = await server.simulateTransaction(tx);
    if ('error' in simResult) throw new Error(`Simulation failed: ${simResult.error}`);

    const prepared = await server.prepareTransaction(tx);

    // Guardian signs — authorizes replace_passkey on this specific wallet
    prepared.sign(guardian);

    // Deployer fee-bumps
    const { TransactionBuilder: TB } = await import('@stellar/stellar-sdk');
    const feeBump = TB.buildFeeBumpTransaction(
      deployer,
      String(Number(BASE_FEE) * 3),
      prepared as any,
      networkPassphrase,
    );
    feeBump.sign(deployer);

    const result = await server.sendTransaction(feeBump);
    if (result.status === 'ERROR') {
      throw new Error(`Transaction failed: ${JSON.stringify(result.errorResult)}`);
    }

    // Poll for confirmation
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const status = await server.getTransaction(result.hash);
      if (status.status === 'SUCCESS') {
        return res.json({ txHash: result.hash, message: 'Passkey replaced successfully.' });
      }
      if (status.status === 'FAILED') {
        throw new Error(`Transaction failed on-chain: ${result.hash}`);
      }
    }

    throw new Error('Transaction timed out');
  } catch (err: any) {
    console.error('[recovery/confirm]', err);
    return res.status(500).json({ error: err.message ?? 'Recovery failed' });
  }
});

export default router;
