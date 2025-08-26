import { encodeHex } from "@std/encoding/hex";
import { crypto } from "@std/crypto";

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  const random = encodeHex(randomBytes).slice(0, 8);

  return `logo_${timestamp}_${random}`;
}

export function generateShortId(): string {
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  return encodeHex(randomBytes).slice(0, 6);
}
