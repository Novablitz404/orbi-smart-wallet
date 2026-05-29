import {
  xdr,
  Address,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import Long from 'long';
import { randomBytes } from 'crypto';

/**
 * Build a combined SorobanAuthorizationEntry for the user's smart wallet.
 * Covers both the Orbi fee transfer AND the user's operation as sub-invocations
 * under execute_batch — one auth hash, one passkey signature, one Face ID prompt.
 *
 * Structure:
 *   rootInvocation: bundler.execute_batch([fee_call, op_call])
 *     subInvocations:
 *       - native_sac.transfer(wallet → orbi_collector, fee)
 *       - op_contract.op_fn(args)
 */
export function buildCombinedAuthEntry(params: {
  walletAddress: string;
  bundlerContractId: string;
  nativeSacId: string;
  feeCollectorAddress: string;
  feeStroops: number;
  opContractId: string;
  opFunctionName: string;
  opArgs: xdr.ScVal[];
  currentLedger: number;
}): xdr.SorobanAuthorizationEntry {
  const {
    walletAddress, bundlerContractId, nativeSacId, feeCollectorAddress,
    feeStroops, opContractId, opFunctionName, opArgs, currentLedger,
  } = params;

  const feeAmount = nativeToScVal(BigInt(feeStroops), { type: 'i128' });

  // ScVal representations matching exactly what batcher.ts builds for execute_batch
  const feeCallScVal = xdr.ScVal.scvMap([
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('args'), val: xdr.ScVal.scvVec([new Address(walletAddress).toScVal(), new Address(feeCollectorAddress).toScVal(), feeAmount]) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('contract'), val: new Address(nativeSacId).toScVal() }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('function'), val: xdr.ScVal.scvSymbol('transfer') }),
  ]);
  const opCallScVal = xdr.ScVal.scvMap([
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('args'), val: xdr.ScVal.scvVec(opArgs) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('contract'), val: new Address(opContractId).toScVal() }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('function'), val: xdr.ScVal.scvSymbol(opFunctionName) }),
  ]);

  // Sub-invocations for the auth tree
  const feeSub = new xdr.SorobanAuthorizedInvocation({
    function: xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(
      new xdr.InvokeContractArgs({
        contractAddress: new Address(nativeSacId).toScAddress(),
        functionName: Buffer.from('transfer'),
        args: [new Address(walletAddress).toScVal(), new Address(feeCollectorAddress).toScVal(), feeAmount],
      }),
    ),
    subInvocations: [],
  });
  const opSub = new xdr.SorobanAuthorizedInvocation({
    function: xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(
      new xdr.InvokeContractArgs({
        contractAddress: new Address(opContractId).toScAddress(),
        functionName: Buffer.from(opFunctionName),
        args: opArgs,
      }),
    ),
    subInvocations: [],
  });

  // Long is required for int64 nonce — Long is a transitive dep of stellar-sdk
  const nonceBytes = randomBytes(8);
  const nonce = Long.fromBits(nonceBytes.readInt32BE(4), nonceBytes.readInt32BE(0), false);

  return new xdr.SorobanAuthorizationEntry({
    credentials: xdr.SorobanCredentials.sorobanCredentialsAddress(
      new xdr.SorobanAddressCredentials({
        address: new Address(walletAddress).toScAddress(),
        nonce: nonce as unknown as xdr.Int64,
        signatureExpirationLedger: currentLedger + 1000,
        signature: xdr.ScVal.scvVoid(),
      }),
    ),
    rootInvocation: new xdr.SorobanAuthorizedInvocation({
      function: xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(
        new xdr.InvokeContractArgs({
          contractAddress: new Address(bundlerContractId).toScAddress(),
          functionName: Buffer.from('execute_batch'),
          args: [xdr.ScVal.scvVec([feeCallScVal, opCallScVal])],
        }),
      ),
      subInvocations: [feeSub, opSub],
    }),
  });
}
