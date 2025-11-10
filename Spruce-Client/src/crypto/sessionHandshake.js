import { 
  generateEphemeralKey, 
  kyberEncapsulate, 
  kyberDecapsulate,
  x25519KeyExchange,
  deriveSessionKey,
  dilithiumSign,
  dilithiumVerify
} from './encryption.js';
import useLogStore from '../store/logStore.js';

const PROTOCOL_VERSION = 'spruce-hybrid-v1';

/**
 * Sender side handshake - establishes session key with receiver
 * @param {Object} senderKeys - { x25519: base64, kyber: base64, dilithium: base64 }
 * @param {Object} receiverPub - { x25519: base64, kyber: base64, dilithium: base64 }
 * @returns {Object} { session_key: Uint8Array, handshake: {...} }
 */
export async function senderHandshake(senderKeys, receiverPub, peerId = null) {
  useLogStore.getState().addLog({
    type: 'handshake',
    operation: 'sender_handshake_start',
    peerId,
    message: 'Initiating sender handshake'
  });
  
  // Generate ephemeral X25519 keypair
  const ephemeral = await generateEphemeralKey();
  useLogStore.getState().addLog({
    type: 'session',
    operation: 'ephemeral_key_generated',
    peerId,
    message: 'Ephemeral X25519 keypair generated'
  });
  
  // Kyber encapsulation
  const { ciphertext: kyber_ct, sharedSecret: kyber_ss } = await kyberEncapsulate(receiverPub.kyber);
  useLogStore.getState().addLog({
    type: 'encapsulation',
    operation: 'kyber_encapsulated',
    peerId,
    message: 'Kyber encapsulation completed',
    details: { ciphertextLength: kyber_ct.length }
  });
  
  // X25519 shared secret
  // In simulated mode, pass both public keys (ephemeral_pub + receiver_perm_pub) for deterministic key derivation
  const x_ss = await x25519KeyExchange(ephemeral.private, receiverPub.x25519, ephemeral.public);
  useLogStore.getState().addLog({
    type: 'session',
    operation: 'x25519_key_exchange',
    peerId,
    message: 'X25519 key exchange completed'
  });
  
  // Derive hybrid session key
  const session_key_base64 = await deriveSessionKey(x_ss, kyber_ss);
  useLogStore.getState().addLog({
    type: 'session',
    operation: 'session_key_derived',
    peerId,
    message: 'Hybrid session key derived via HKDF',
    details: { algorithm: 'HKDF-SHA256' }
  });
  
  // Create handshake message for signing
  const timestamp = Date.now();
  const handshakeData = `${ephemeral.public}||${kyber_ct}||${timestamp}`;
  
  // Sign with Dilithium
  const signature = await dilithiumSign(handshakeData, senderKeys.dilithium);
  useLogStore.getState().addLog({
    type: 'handshake',
    operation: 'dilithium_signed',
    peerId,
    message: 'Handshake data signed with Dilithium'
  });
  
  // Convert session key to Uint8Array for compatibility
  const session_key = base64ToUint8(session_key_base64);
  
  useLogStore.getState().addLog({
    type: 'handshake',
    operation: 'sender_handshake_complete',
    peerId,
    message: 'Sender handshake completed successfully'
  });
  
  return {
    session_key,
    handshake: {
      protocol_version: PROTOCOL_VERSION,
      eph_pub: base64ToUint8(ephemeral.public),
      kyber_ct: base64ToUint8(kyber_ct),
      timestamp,
      signature: base64ToUint8(signature)
    }
  };
}

/**
 * Receiver side handshake - derives session key from sender's handshake
 * @param {Object} receiverKeys - { x25519: base64, kyber: base64, dilithium: base64 }
 * @param {Object} senderPub - { x25519: base64, kyber: base64, dilithium: base64 }
 * @param {Object} handshake - { eph_pub: Uint8Array, kyber_ct: Uint8Array, timestamp: number, signature: Uint8Array }
 * @returns {Object} { session_key: Uint8Array }
 */
export async function receiverHandshake(receiverKeys, senderPub, handshake, peerId = null) {
  useLogStore.getState().addLog({
    type: 'handshake',
    operation: 'receiver_handshake_start',
    peerId,
    message: 'Initiating receiver handshake'
  });
  
  const { eph_pub, kyber_ct, timestamp, signature } = handshake;
  
  // Convert Uint8Array to base64 for API
  const eph_pub_b64 = uint8ToBase64(eph_pub);
  const kyber_ct_b64 = uint8ToBase64(kyber_ct);
  const signature_b64 = uint8ToBase64(signature);
  
  // Verify signature
  const handshakeData = `${eph_pub_b64}||${kyber_ct_b64}||${timestamp}`;
  const valid = await dilithiumVerify(handshakeData, signature_b64, senderPub.dilithium);
  
  if (!valid) {
    useLogStore.getState().addLog({
      type: 'handshake',
      operation: 'signature_verification_failed',
      peerId,
      message: 'Handshake signature verification failed',
      level: 'error'
    });
    throw new Error('Handshake signature verification failed');
  }
  
  useLogStore.getState().addLog({
    type: 'handshake',
    operation: 'signature_verified',
    peerId,
    message: 'Dilithium signature verified successfully'
  });
  
  // Kyber decapsulation
  // In simulated mode, we need the receiver's public key to match what sender used
  // The receiver's public key should be available in receiverKeys if it was stored
  // For simulated mode: if receiverKeys has kyberPublic, use it; otherwise derive from private key
  const receiverPubKyber = receiverKeys.kyberPublic || null;
  const kyber_ss = await kyberDecapsulate(kyber_ct_b64, receiverKeys.kyber, receiverPubKyber);
  useLogStore.getState().addLog({
    type: 'decapsulation',
    operation: 'kyber_decapsulated',
    peerId,
    message: 'Kyber decapsulation completed'
  });
  
  // X25519 shared secret
  // In simulated mode, pass both public keys (ephemeral_pub + receiver_perm_pub) for deterministic key derivation
  const receiverPermPubX25519 = receiverKeys.x25519Public || null;
  const x_ss = await x25519KeyExchange(receiverKeys.x25519, eph_pub_b64, receiverPermPubX25519);
  useLogStore.getState().addLog({
    type: 'session',
    operation: 'x25519_key_exchange',
    peerId,
    message: 'X25519 key exchange completed'
  });
  
  // Derive session key
  const session_key_base64 = await deriveSessionKey(x_ss, kyber_ss);
  const session_key = base64ToUint8(session_key_base64);
  
  useLogStore.getState().addLog({
    type: 'session',
    operation: 'session_key_derived',
    peerId,
    message: 'Hybrid session key derived via HKDF',
    details: { algorithm: 'HKDF-SHA256' }
  });
  
  useLogStore.getState().addLog({
    type: 'handshake',
    operation: 'receiver_handshake_complete',
    peerId,
    message: 'Receiver handshake completed successfully'
  });
  
  return { session_key };
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
