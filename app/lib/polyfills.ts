// @stellar/js-xdr's XdrReader calls readBigInt64BE / writeBigInt64BE on the
// global Buffer when (de)serializing Int64/Hyper XDR values. The Buffer that
// Turbopack provides in the browser is missing these methods, causing
// "this._buffer.readBigInt64BE is not a function".
//
// Fix: force buffer@6 as the global Buffer AND patch the BigInt64 methods onto
// its prototype (implemented via DataView) so every Buffer instance has them,
// regardless of which Buffer js-xdr ends up referencing.
import { Buffer as NodeBuffer } from 'buffer';

type BufLike = Uint8Array & {
  readBigInt64BE?: (offset?: number) => bigint;
  readBigUInt64BE?: (offset?: number) => bigint;
  writeBigInt64BE?: (value: bigint, offset?: number) => number;
  writeBigUInt64BE?: (value: bigint, offset?: number) => number;
};

function patchPrototype(proto: BufLike | undefined) {
  if (!proto) return;

  if (typeof proto.readBigInt64BE !== 'function') {
    proto.readBigInt64BE = function (this: Uint8Array, offset = 0): bigint {
      return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigInt64(offset, false);
    };
  }
  if (typeof proto.readBigUInt64BE !== 'function') {
    proto.readBigUInt64BE = function (this: Uint8Array, offset = 0): bigint {
      return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigUint64(offset, false);
    };
  }
  if (typeof proto.writeBigInt64BE !== 'function') {
    proto.writeBigInt64BE = function (this: Uint8Array, value: bigint, offset = 0): number {
      new DataView(this.buffer, this.byteOffset, this.byteLength).setBigInt64(offset, value, false);
      return offset + 8;
    };
  }
  if (typeof proto.writeBigUInt64BE !== 'function') {
    proto.writeBigUInt64BE = function (this: Uint8Array, value: bigint, offset = 0): number {
      new DataView(this.buffer, this.byteOffset, this.byteLength).setBigUint64(offset, value, false);
      return offset + 8;
    };
  }
}

if (typeof window !== 'undefined') {
  const g = globalThis as unknown as { Buffer?: { prototype: BufLike } };

  // Patch the buffer@6 prototype (what our app + bundled deps import).
  patchPrototype(NodeBuffer.prototype as unknown as BufLike);

  // Force buffer@6 as the global so js-xdr's bare `Buffer` reference uses it.
  if (!g.Buffer) {
    g.Buffer = NodeBuffer as unknown as { prototype: BufLike };
  }

  // Patch whatever Buffer ended up global, in case it differs from buffer@6.
  patchPrototype(g.Buffer?.prototype);
}
