import { x25519 } from '@noble/curves/ed25519';
import * as Kyber from 'pqc-kyber';
import { generateDilithium } from './signatureUtils.js';
import { toBase64, fromBase64 } from '../utils/keyUtils.js';

const DB_KEY = 'spruce.permanent.keys.v1';

export async function generatePermanentKeypairs() {
  // X25519
  const xPriv = x25519.utils.randomPrivateKey();
  const xPub = x25519.getPublicKey(xPriv);

  // Kyber768
  const kyber = Kyber.kyber768 || Kyber;
  const { publicKey: kyberPub, secretKey: kyberPriv } = await kyber.keyPair();

  // Dilithium3
  const { publicKey: dPub, privateKey: dPriv } = await generateDilithium();

  const keys = {
    perm_pub_x25519: toBase64(xPub),
    perm_priv_x25519: toBase64(xPriv),
    kyber_pub: toBase64(kyberPub),
    kyber_priv: toBase64(kyberPriv),
    dilithium_pub: toBase64(dPub),
    dilithium_priv: toBase64(dPriv)
  };
  await persistKeys(keys);
  return keys;
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
  return {
    x25519: {
      publicKey: fromBase64(keys.perm_pub_x25519),
      privateKey: fromBase64(keys.perm_priv_x25519)
    },
    kyber: {
      publicKey: fromBase64(keys.kyber_pub),
      privateKey: fromBase64(keys.kyber_priv)
    },
    dilithium: {
      publicKey: fromBase64(keys.dilithium_pub),
      privateKey: fromBase64(keys.dilithium_priv)
    }
  };
}

