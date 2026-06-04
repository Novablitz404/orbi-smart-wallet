#!/usr/bin/env bash
#
# Fund the Orbi deployer (gas tank) from the treasury.
#
# Usage:
#   ./fund-deployer.sh <amount_in_XLM> [network] [source-account]
#
# Examples:
#   ./fund-deployer.sh 100            # fund 100 XLM on testnet, signed by `deployer`
#   ./fund-deployer.sh 100 mainnet treasury-admin
#
# The signing key (source-account) must be the treasury admin.
#
set -euo pipefail

# Treasury contract id per network. Override with TREASURY_ID env if needed.
TREASURY_TESTNET="CBQGAXJTIFD5GJY52WHAU6FF2T5A2SCJKQLXSZB3ZQSAG5WFWPUKENNT"
TREASURY_MAINNET=""   # set once deployed to mainnet

AMOUNT_XLM="${1:-}"
NETWORK="${2:-testnet}"
SOURCE="${3:-deployer}"

if [ -z "$AMOUNT_XLM" ]; then
  echo "Usage: $0 <amount_in_XLM> [network] [source-account]"
  echo "Example: $0 100"
  exit 1
fi

if [ -n "${TREASURY_ID:-}" ]; then
  ID="$TREASURY_ID"
elif [ "$NETWORK" = "mainnet" ]; then
  ID="$TREASURY_MAINNET"
else
  ID="$TREASURY_TESTNET"
fi

if [ -z "$ID" ]; then
  echo "ERROR: no treasury id for network '$NETWORK'. Set TREASURY_ID env or edit this script." >&2
  exit 1
fi

# XLM -> stroops (1 XLM = 10,000,000 stroops), integer.
STROOPS=$(awk "BEGIN { printf \"%.0f\", $AMOUNT_XLM * 10000000 }")

echo "→ Funding deployer with $AMOUNT_XLM XLM ($STROOPS stroops)"
echo "  treasury: $ID"
echo "  network:  $NETWORK   signer: $SOURCE"
echo

echo -n "  balance before: "
stellar contract invoke --id "$ID" --network "$NETWORK" --source-account "$SOURCE" -- native_balance 2>/dev/null

stellar contract invoke \
  --id "$ID" \
  --network "$NETWORK" \
  --source-account "$SOURCE" \
  -- fund_deployer --amount "$STROOPS"

echo -n "  balance after:  "
stellar contract invoke --id "$ID" --network "$NETWORK" --source-account "$SOURCE" -- native_balance 2>/dev/null

echo "✅ Done."
