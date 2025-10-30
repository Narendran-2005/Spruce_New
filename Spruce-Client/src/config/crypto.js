/**
 * Crypto Configuration
 * Controls which crypto implementation to use
 */

export const CRYPTO_CONFIG = {
  // Toggle between real and simulated crypto
  // Set to false for demos/testing when real libraries aren't available
  useRealCrypto: typeof window !== 'undefined' && window.crypto?.subtle !== undefined,
  
  // Post-quantum algorithm variants
  kyberVariant: 768,      // NIST Level 3
  dilithiumVariant: 3,    // NIST Level 3
  
  // Symmetric encryption
  aesKeySize: 256,        // AES-256-GCM
  
  // HKDF parameters for key derivation
  hkdfSalt: 'Spruce-v1-HKDF-Salt-2024',
  hkdfInfo: 'Spruce-Hybrid-Session-Key',
  
  // Key export format
  keyFormat: 'base64',    // base64 for storage/transmission
};

