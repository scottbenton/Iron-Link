import { Buffer } from "buffer";

// Postgres `bytea` columns travel over PostgREST as hex strings in the
// `\x<hex>` format. Yjs document bodies (notes, world entry rich text, GM
// notes) are all stored that way, so the conversion lives here rather than
// being re-implemented per service.

export function uint8ArrayToBytea(bytes: Uint8Array): string {
  return "\\x" + Buffer.from(bytes).toString("hex");
}

export function byteaToUint8Array(value: string): Uint8Array {
  return Buffer.from(value.slice(2), "hex");
}
