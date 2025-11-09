import { generateKeys } from './encryption.js';

const DB_KEY = 'spruce.permanent.keys.v1';

export async function generatePermanentKeypairs() {
  // Use the new unified encryption API
  const keys = await generateKeys();
  
  // Convert to the format expected by the rest of the app
  const formattedKeys = {
    perm_pub_x25519: keys.x25519Public,
    perm_priv_x25519: keys.x25519Private,
    kyber_pub: keys.kyberPublic,
    kyber_priv: keys.kyberPrivate,
    dilithium_pub: keys.dilithiumPublic,
    dilithium_priv: keys.dilithiumPrivate
  };
  await persistKeys(formattedKeys);
  return formattedKeys;
}

export async function persistKeys(keys) {
  // Simple localStorage storage; can be replaced with IndexedDB later
  localStorage.setItem(DB_KEY, JSON.stringify(keys));
}

export async function loadKeys() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return parsed;
}

export function decodePermanentKeys(keys) {
  // Return keys in base64 format (as expected by the new encryption API)
  return {
    x25519: keys.perm_priv_x25519, // Private key for key exchange
    kyber: keys.kyber_priv, // Private key for decapsulation
    dilithium: keys.dilithium_priv, // Private key for signing
    // Public keys are stored separately and fetched from server
    x25519Public: keys.perm_pub_x25519,
    kyberPublic: keys.kyber_pub,
    dilithiumPublic: keys.dilithium_pub
  };
}

