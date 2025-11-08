import { importAesKey } from '../utils/keyUtils.js';

export async function aesEncrypt(plaintextBytes, keyBytes, aad) {
  const key = await importAesKey(keyBytes);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad },
    key,
    plaintextBytes
  );
  return { iv, ciphertext: new Uint8Array(enc) };
}

export async function aesDecrypt(ciphertextBytes, keyBytes, iv, aad) {
  const key = await importAesKey(keyBytes);
  const dec = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: aad },
    key,
    ciphertextBytes
  );
  return new Uint8Array(dec);
}

