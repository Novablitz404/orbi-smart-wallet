import { createHash } from 'crypto';
import {
  xdr,
  hash,
  StrKey,
  Address,
  Operation,
} from '@stellar/stellar-sdk';
import { getDeployerKeypair, getPassphrase, getServer } from './stellar';
import { deriveGuardianAddress } from './guardian';

/**
 * Derive the deterministic wallet C-address for a given passkey ID.
 * No transaction needed — computed entirely from known constants.
 *
 * address = sha256(networkId + deployer_G_address + salt)
 * salt    = sha256(passkey_id)
 */
export function deriveWalletAddress(passkeyId: Buffer): string {
  const deployer = getDeployerKeypair();
  const networkPassphrase = getPassphrase();

  const salt = createHash('sha256').update(passkeyId).digest();
  const networkId = createHash('sha256').update(networkPassphrase).digest();

  const preimage = xdr.HashIdPreimage.envelopeTypeContractId(
    new xdr.HashIdPreimageContractId({
      networkId,
      contractIdPreimage: xdr.ContractIdPreimage.contractIdPreimageFromAddress(
        new xdr.ContractIdPreimageFromAddress({
          address: new Address(deployer.publicKey()).toScAddress(),
          salt,
        }),
      ),
    }),
  );

  const contractId = hash(preimage.toXDR());
  return StrKey.encodeContract(contractId);
}

/** Check if a wallet contract is deployed on-chain. */
export async function isWalletDeployed(walletAddress: string): Promise<boolean> {
  try {
    const server = getServer();
    const contractKey = xdr.LedgerKey.contractData(
      new xdr.LedgerKeyContractData({
        contract: new Address(walletAddress).toScAddress(),
        key: xdr.ScVal.scvLedgerKeyContractInstance(),
        durability: xdr.ContractDataDurability.persistent(),
      }),
    );
    const result = await server.getLedgerEntries(contractKey);
    return result.entries.length > 0;
  } catch {
    return false;
  }
}

/**
 * Build the createCustomContract operation that deploys a wallet.
 * The constructor is called automatically with passkey + guardian args.
 * Paired with a fee-bump from the deployer — user pays nothing.
 */
export function buildDeployOperation(
  passkeyId: Buffer,
  publicKey: Buffer,
  walletAddress: string,
): ReturnType<typeof Operation.createCustomContract> {
  const deployer = getDeployerKeypair();
  const wasmHash = process.env.SMART_WALLET_WASM_HASH;
  if (!wasmHash) throw new Error('SMART_WALLET_WASM_HASH env var not set');

  const salt = createHash('sha256').update(passkeyId).digest();
  const guardianAddress = deriveGuardianAddress(walletAddress);

  return Operation.createCustomContract({
    address: new Address(deployer.publicKey()),
    wasmHash: Buffer.from(wasmHash, 'hex'),
    salt,
    constructorArgs: [
      xdr.ScVal.scvBytes(passkeyId),         // passkey_id: BytesN<20>
      xdr.ScVal.scvBytes(publicKey),          // public_key: BytesN<65>
      new Address(guardianAddress).toScVal(), // guardian: Address
    ],
  });
}
