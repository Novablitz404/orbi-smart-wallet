#!/usr/bin/env bash
set -e

# soroban-sdk 21.x requires wasm32-unknown-unknown.
# Use cargo directly — stellar contract build defaults to wasm32v1-none in CLI v26+.

CONTRACTS=(
  "smart_wallet:orbi_smart_wallet"
  "bundler:orbi_bundler"
)

for entry in "${CONTRACTS[@]}"; do
  dir="${entry%%:*}"
  crate="${entry##*:}"

  echo "Building $dir..."
  cargo build \
    --manifest-path "$dir/Cargo.toml" \
    --target wasm32-unknown-unknown \
    --release 2>&1

  WASM="target/wasm32-unknown-unknown/release/${crate}.wasm"
  OUT="$dir/${crate}.wasm"

  if command -v wasm-opt &> /dev/null; then
    wasm-opt -Oz --enable-bulk-memory --strip-debug --strip-producers "$WASM" -o "$OUT"
    echo "$dir → $(wc -c < "$OUT") bytes (optimized)"
  else
    cp "$WASM" "$OUT"
    echo "$dir → $(wc -c < "$OUT") bytes (wasm-opt not found, unoptimized)"
  fi
done

echo "Done."
