/**
 * @fileoverview Cryptographic utilities for V-COMM
 * @module @vcomm/crypto
 * 
 * Provides comprehensive cryptographic functionality for secure voice communication:
 * - Key generation and management (Ed25519, X25519, secp256k1, RSA)
 * - Symmetric encryption (AES-GCM, AES-CBC, ChaCha20-Poly1305)
 * - Asymmetric encryption (ECIES, RSA-OAEP)
 * - Digital signatures (Ed25519, ECDSA, RSA-PSS)
 * - Hash functions (SHA-256/384/512, SHA3, Blake2)
 * - Key derivation (HKDF, PBKDF2, Scrypt)
 * - SRTP for secure media transport
 * - DTLS utilities for WebRTC
 */

// ============================================================================
// TYPES
// ============================================================================

export * from './types';

// ============================================================================
// RANDOM
// ============================================================================

export {
  randomBytes,
  randomInt,
  randomUUID,
  randomHex,
  randomBase64,
  randomString,
  randomAlphanumeric,
  randomNumeric,
  shuffle,
  generateSalt,
  generateIV,
  generateNonce,
} from './random';

// ============================================================================
// HASH
// ============================================================================

export {
  hash,
  hashHex,
  hmac,
  hmacHex,
  verifyHmac,
  sha256,
  sha384,
  sha512,
  sha3_256,
  sha3_512,
  blake2b,
  blake2s,
  doubleSha256,
  ripemd160,
  hash160,
} from './hash';

// ============================================================================
// SYMMETRIC ENCRYPTION
// ============================================================================

export {
  generateKey,
  createKey,
  encrypt,
  decrypt,
  aes256GcmEncrypt,
  aes256GcmDecrypt,
  chaChaEncrypt,
  chaChaDecrypt,
} from './symmetric';

// ============================================================================
// ASYMMETRIC / KEY DERIVATION
// ============================================================================

export {
  deriveSharedSecret,
  encryptForRecipient,
  decryptForRecipient,
  rsaEncrypt,
  rsaDecrypt,
  hkdf,
  pbkdf2,
  scrypt,
  deriveSymmetricKey,
} from './asymmetric';

// ============================================================================
// KEYS / SIGNATURES
// ============================================================================

export {
  generateEd25519KeyPair,
  generateX25519KeyPair,
  generateSecp256k1KeyPair,
  generateRSAKeyPair,
  sign,
  verify,
  exportPublicKeyPEM,
} from './keys';

<<<<<<< HEAD
=======
// Re-export generateKeyPairAsync as generateKeyPair
>>>>>>> 6a949b1 (fix: resolve TypeScript build errors across multiple packages)
import { generateKeyPairAsync } from './keys';
export { generateKeyPairAsync as generateKeyPair };

// ============================================================================
// SRTP
// ============================================================================

export {
  SRTPSession,
  createSRTPSession,
  generateSRTPKey,
} from './srtp';

// ============================================================================
// DTLS
// ============================================================================

export {
  DTLSFingerprintGenerator,
  DTLSSession,
  createDTLSSession,
  DTLS_VERSION_1_0,
  DTLS_VERSION_1_2,
  DTLS_VERSION_1_3,
  WEBRTC_CIPHERER_SUITES,
} from './dtls';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

import { randomBytes } from './random';
import { sha256 } from './hash';
import { generateKey, encrypt, decrypt } from './symmetric';
import { generateEd25519KeyPair, sign, verify } from './keys';

/**
 * Quick encrypt function using AES-256-GCM
 */
export function quickEncrypt(
  plaintext: string | Uint8Array,
  password: string
): { ciphertext: string; iv: string; tag: string } {
  const key = generateKey('aes-256-gcm');
  const result = encrypt(plaintext, key);
  
  return {
    ciphertext: Buffer.from(result.ciphertext).toString('base64'),
    iv: Buffer.from(result.iv).toString('base64'),
    tag: Buffer.from(result.tag!).toString('base64'),
  };
}

/**
 * Quick decrypt function using AES-256-GCM
 */
export function quickDecrypt(
  ciphertext: string,
  key: Uint8Array,
  iv: string,
  tag: string
): Uint8Array {
  const symKey = { raw: key, algorithm: 'aes-256-gcm' as const };
  
  return decrypt(
    {
      ciphertext: Buffer.from(ciphertext, 'base64'),
      iv: Buffer.from(iv, 'base64'),
      tag: Buffer.from(tag, 'base64'),
      algorithm: 'aes-256-gcm',
    },
    symKey,
    {
      algorithm: 'aes-256-gcm',
      iv: Buffer.from(iv, 'base64'),
      tag: Buffer.from(tag, 'base64'),
    }
  );
}

/**
 * Generate a secure password hash using PBKDF2
 */
import { pbkdf2 } from './asymmetric';
import { generateSalt } from './random';

export async function hashPassword(
  password: string,
  options: { iterations?: number; saltLength?: number } = {}
): Promise<{ hash: string; salt: string; iterations: number }> {
  const iterations = options.iterations ?? 100000;
  const saltLength = options.saltLength ?? 16;
  const salt = generateSalt(saltLength);
  
  const hash = await pbkdf2(password, {
    hash: 'sha256',
    salt,
    iterations,
    length: 32,
  });
  
  return {
    hash: Buffer.from(hash).toString('base64'),
    salt: Buffer.from(salt).toString('base64'),
    iterations,
  };
}

/**
 * Verify a password hash
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  salt: string,
  iterations: number
): Promise<boolean> {
  const saltBytes = Buffer.from(salt, 'base64');
  const expectedHash = Buffer.from(storedHash, 'base64');
  
  const computedHash = await pbkdf2(password, {
    hash: 'sha256',
    salt: saltBytes,
    iterations,
    length: 32,
  });
  
  // Constant-time comparison
  if (computedHash.length !== expectedHash.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash[i] ^ expectedHash[i];
  }
  
  return result === 0;
}

// Default export
export default {
  randomBytes,
  sha256,
  generateKey,
  encrypt,
  decrypt,
  generateEd25519KeyPair,
  sign,
  verify,
  quickEncrypt,
  quickDecrypt,
  hashPassword,
  verifyPassword,
};