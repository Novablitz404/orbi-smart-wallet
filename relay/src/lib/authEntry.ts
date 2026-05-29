import {
  xdr,
  Address,
  nativeToScVal,
} from '@stellar/stellar-sdk';

/**
 * Build a combined SorobanAuthorizationEntry for the user's smart wallet.
 *
 * The root invocation is wallet.execute_with_fee(...) — specific to THIS user's
 * wallet only. Multiple users can be batched freely because each user's auth entry
 * is independent of other users' calls.
 *
 * One auth hash → one passkey signature → one Face ID prompt.
 *
 * Structure:
 *   rootInvocation: wallet.execute_with_fee(op_contract, op_fn, op_args, fee_token, fee_collector, fee)
 *     subInvocations:
 *       - op_contract.op_fn(op_args)           ← user's operation
 *       - fee_token.transfer(wallet → orbi, fee) ← Orbi fee
 */
export function buildCombinedAuthEntry(params: {
  walletAddress: string;
  nativeSacId: string;
  feeCollectorAddress: string;
  feeStroops: number;
  opContractId: string;
  opFunctionName: string;
  opArgs: xdr.ScVal[];
  currentLedger: number;
}): xdr.SorobanAuthorizationEntry {
  const {
    walletAddress, nativeSacId, feeCollectorAddress,
    feeStroops, opContractId, opFunctionName, opArgs, currentLedger,
  } = params;

  const feeAmount = nativeToScVal(BigInt(feeStroops), { type: 'i128' });

  // Args for wallet.execute_with_fee(contract, function, args, fee_token, fee_collector, fee)
  const executeWithFeeArgs = [
    new Address(opContractId).toScVal(),
    xdr.ScVal.scvSymbol(opFunctionName),
    xdr.ScVal.scvVec(opArgs),
    new Address(nativeSacId).toScVal(),
    new Address(feeCollectorAddress).toScVal(),
    feeAmount,
  ];

  // Sub-invocations: op call + fee transfer (both require wallet's require_auth)
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

  const feeSub = new xdr.SorobanAuthorizedInvocation({
    function: xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(
      new xdr.InvokeContractArgs({
        contractAddress: new Address(nativeSacId).toScAddress(),
        functionName: Buffer.from('transfer'),
        args: [
          new Address(walletAddress).toScVal(),
          new Address(feeCollectorAddress).toScVal(),
          feeAmount,
        ],
      }),
    ),
    subInvocations: [],
  });

  // Use xdr.Int64 (the SDK's own Hyper type) — NOT the standalone `long` package,
  // which fails the js-xdr `instanceof Hyper` check with "is not a Hyper".
  const nonce = xdr.Int64.fromString(String(Math.floor(Math.random() * 2 ** 52)));

  return new xdr.SorobanAuthorizationEntry({
    credentials: xdr.SorobanCredentials.sorobanCredentialsAddress(
      new xdr.SorobanAddressCredentials({
        address: new Address(walletAddress).toScAddress(),
        nonce,
        signatureExpirationLedger: currentLedger + 1000,
        signature: xdr.ScVal.scvVoid(),
      }),
    ),
    rootInvocation: new xdr.SorobanAuthorizedInvocation({
      function: xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(
        new xdr.InvokeContractArgs({
          contractAddress: new Address(walletAddress).toScAddress(),
          functionName: Buffer.from('execute_with_fee'),
          args: executeWithFeeArgs,
        }),
      ),
      subInvocations: [opSub, feeSub],
    }),
  });
}
