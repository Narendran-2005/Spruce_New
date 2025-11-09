import { aesGCMEncrypt, aesGCMDecrypt } from './encryption.js';

/**
 * Encrypt plaintext bytes with AES-GCM
 * @param {Uint8Array} plaintextBytes - Plaintext to encrypt
 * @param {Uint8Array} keyBytes - Session key (32 bytes)
 * @param {Uint8Array|string} aad - Additional authenticated data
 * @returns {Object} { iv: Uint8Array, ciphertext: Uint8Array }
 */
export async function aesEncrypt(plaintextBytes, keyBytes, aad) {
  // Convert Uint8Array to base64 for the new API
  const keyBase64 = uint8ToBase64(keyBytes);
  const plaintext = new TextDecoder().decode(plaintextBytes);
  const aadStr = typeof aad === 'string' ? aad : new TextDecoder().decode(aad);
  
  const result = await aesGCMEncrypt(plaintext, keyBase64, null, aadStr);
  
  return {
    iv: base64ToUint8(result.nonce),
    ciphertext: base64ToUint8(result.ciphertext)
  };
}

/**
 * Decrypt ciphertext bytes with AES-GCM
 * @param {Uint8Array} ciphertextBytes - Ciphertext to decrypt
 * @param {Uint8Array} keyBytes - Session key (32 bytes)
 * @param {Uint8Array} iv - Initialization vector
 * @param {Uint8Array|string} aad - Additional authenticated data
 * @returns {Uint8Array} Plaintext bytes
 */
export async function aesDecrypt(ciphertextBytes, keyBytes, iv, aad) {
  // Convert Uint8Array to base64 for the new API
  const keyBase64 = uint8ToBase64(keyBytes);
  const ciphertextBase64 = uint8ToBase64(ciphertextBytes);
  const nonceBase64 = uint8ToBase64(iv);
  const aadStr = typeof aad === 'string' ? aad : new TextDecoder().decode(aad);
  
  const plaintext = await aesGCMDecrypt(ciphertextBase64, keyBase64, nonceBase64, '', aadStr);
  
  return new TextEncoder().encode(plaintext);
}

// Helper functions
function uint8ToBase64(arr) {
  let str = String.fromCharCode.apply(null, Array.from(arr));
  return btoa(str);
}

function base64ToUint8(str) {
  const bin = atob(str);
  const len = bin.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
