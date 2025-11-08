import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';

export function hkdfSha256(ikm, salt, info, length = 32) {
  const key = hkdf(sha256, ikm, salt, typeof info === 'string' ? new TextEncoder().encode(info) : info, length);
  return new Uint8Array(key);
}

export function sha256Bytes(data) {
  const d = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return new Uint8Array(sha256(d));
}

