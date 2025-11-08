import { x25519 } from '@noble/curves/ed25519';
import * as Kyber from 'pqc-kyber';
import { sha256Bytes, hkdfSha256 } from './hkdfUtils.js';
import { dilithiumSign, dilithiumVerify } from './signatureUtils.js';
import { concatBytes } from '../utils/keyUtils.js';

const PROTOCOL_VERSION = 'spruce-hybrid-v1';

export async function senderHandshake(senderKeys, receiverPub) {
  // senderKeys: { x25519: {privateKey}, kyber: {}, dilithium: {privateKey} }
  // receiverPub: { x25519: Uint8Array, kyber: Uint8Array, dilithium: Uint8Array }

  // Ephemeral X25519
  const ephPriv = x25519.utils.randomPrivateKey();
  const ephPub = x25519.getPublicKey(ephPriv);

  // Kyber encapsulate
  const kyber = Kyber.kyber768 || Kyber;
  const { cipherText: kyber_ct, sharedSecret: kyber_ss } = await kyber.encapsulate(receiverPub.kyber);

  // X25519 shared secret
  const x_ss = x25519.getSharedSecret(ephPriv, receiverPub.x25519);

  // Derive session key via HKDF(SHA256(x_ss || kyber_ss))
  const seed = sha256Bytes(concatBytes(x_ss, kyber_ss));
  const salt = sha256Bytes(PROTOCOL_VERSION);
  const session_key = hkdfSha256(seed, salt, 'hybrid-session', 32);

  const timestamp = Date.now();
  const msg = concatBytes(
    sha256Bytes(PROTOCOL_VERSION),
    sha256Bytes(ephPub),
    sha256Bytes(kyber_ct),
    sha256Bytes(new TextEncoder().encode(String(timestamp)))
  );
  const signature = await dilithiumSign(senderKeys.dilithium.privateKey, msg);

  return {
    session_key,
    handshake: { protocol_version: PROTOCOL_VERSION, eph_pub: ephPub, kyber_ct, timestamp, signature }
  };
}

export async function receiverHandshake(receiverKeys, senderPub, handshake) {
  const { eph_pub, kyber_ct, timestamp, signature } = handshake;

  // Verify signature
  const msg = concatBytes(
    sha256Bytes(PROTOCOL_VERSION),
    sha256Bytes(eph_pub),
    sha256Bytes(kyber_ct),
    sha256Bytes(new TextEncoder().encode(String(timestamp)))
  );
  const ok = await dilithiumVerify(senderPub.dilithium, msg, signature);
  if (!ok) throw new Error('Handshake signature verification failed');

  const kyber = Kyber.kyber768 || Kyber;
  const kyber_ss = await kyber.decapsulate(kyber_ct, receiverKeys.kyber.privateKey);
  const x_ss = x25519.getSharedSecret(receiverKeys.x25519.privateKey, eph_pub);

  const seed = sha256Bytes(concatBytes(x_ss, kyber_ss));
  const salt = sha256Bytes(PROTOCOL_VERSION);
  const session_key = hkdfSha256(seed, salt, 'hybrid-session', 32);

  return { session_key };
}

