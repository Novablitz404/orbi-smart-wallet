// Inject buffer@6 as the global Buffer in browsers.
// @stellar/js-xdr calls readBigInt64BE/LE on Buffer when deserializing
// Int64 XDR values — these methods don't exist in the browser's native
// TextEncoder-based Buffer or older polyfills.
import { Buffer as BufferPolyfill } from 'buffer';

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).Buffer =
    (window as unknown as Record<string, unknown>).Buffer ?? BufferPolyfill;
}
