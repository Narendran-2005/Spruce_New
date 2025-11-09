import { 
  generateEphemeralKey, 
  kyberEncapsulate, 
  kyberDecapsulate,
  x25519KeyExchange,
  deriveSessionKey,
  dilithiumSign,
  dilithiumVerify
} from './encryption.js';

const PROTOCOL_VERSION = 'spruce-hybrid-v1';

/**
 * Sender side handshake - establishes session key with receiver
 * @param {Object} senderKeys - { x25519: base64, kyber: base64, dilithium: base64 }
 * @param {Object} receiverPub - { x25519: base64, kyber: base64, dilithium: base64 }
 * @returns {Object} { session_key: Uint8Array, handshake: {...} }
 */
export async function senderHandshake(senderKeys, receiverPub) {
  // Generate ephemeral X25519 keypair
  const ephemeral = await generateEphemeralKey();
  
  // Kyber encapsulation
  const { ciphertext: kyber_ct, sharedSecret: kyber_ss } = await kyberEncapsulate(receiverPub.kyber);
  
  // X25519 shared secret
  const x_ss = await x25519KeyExchange(ephemeral.private, receiverPub.x25519);
  
  // Derive hybrid session key
  const session_key_base64 = await deriveSessionKey(x_ss, kyber_ss);
  
  // Create handshake message for signing
  const timestamp = Date.now();
  const handshakeData = `${ephemeral.public}||${kyber_ct}||${timestamp}`;
  
  // Sign with Dilithium
  const signature = await dilithiumSign(handshakeData, senderKeys.dilithium);
  
  // Convert session key to Uint8Array for compatibility
  const session_key = base64ToUint8(session_key_base64);
  
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
export async function receiverHandshake(receiverKeys, senderPub, handshake) {
  const { eph_pub, kyber_ct, timestamp, signature } = handshake;
  
  // Convert Uint8Array to base64 for API
  const eph_pub_b64 = uint8ToBase64(eph_pub);
  const kyber_ct_b64 = uint8ToBase64(kyber_ct);
  const signature_b64 = uint8ToBase64(signature);
  
  // Verify signature
  const handshakeData = `${eph_pub_b64}||${kyber_ct_b64}||${timestamp}`;
  const valid = await dilithiumVerify(handshakeData, signature_b64, senderPub.dilithium);
  
  if (!valid) {
    throw new Error('Handshake signature verification failed');
  }
  
  // Kyber decapsulation
  const kyber_ss = await kyberDecapsulate(kyber_ct_b64, receiverKeys.kyber);
  
  // X25519 shared secret
  const x_ss = await x25519KeyExchange(receiverKeys.x25519, eph_pub_b64);
  
  // Derive session key
  const session_key_base64 = await deriveSessionKey(x_ss, kyber_ss);
  const session_key = base64ToUint8(session_key_base64);
  
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
