/**
 * @fileoverview Symmetric encryption utilities (AES-GCM, AES-CBC, ChaCha20-Poly1305)
 * @module @vcomm/crypto/symmetric
 */

import { createCipheriv, createDecipheriv, randomBytes, CipherGCM, DecipherGCM } from 'crypto';
import {
  SymmetricAlgorithm,
  SymmetricKey,
  EncryptOptions,
  DecryptOptions,
  EncryptionResult,
  EncryptionError,
  DecryptionError,
  CryptoError,
} from '../types';
import { generateIV } from '../random';

/**
 * Default algorithms
 */
const DEFAULT_ALGORITHM: SymmetricAlgorithm = 'aes-256-gcm';
const _TAG_LENGTH = 16;

/**
 * Generate a symmetric key
 * 
 * @param algorithm Encryption algorithm
 * @returns Symmetric key
 */
export function generateKey(algorithm: SymmetricAlgorithm = DEFAULT_ALGORITHM): SymmetricKey {
  const keyLength = getKeyLength(algorithm);
  const raw = randomBytes(keyLength);
  
  return {
    raw,
    algorithm,
  };
}

/**
 * Create a symmetric key from raw bytes
 * 
 * @param raw Raw key bytes
 * @param algorithm Encryption algorithm
 * @returns Symmetric key
 */
export function createKey(raw: Uint8Array, algorithm: SymmetricAlgorithm = DEFAULT_ALGORITHM): SymmetricKey {
  const expectedLength = getKeyLength(algorithm);
  
  if (raw.length !== expectedLength) {
    throw new CryptoError(`Invalid key length: expected ${expectedLength} bytes, got ${raw.length}`);
  }
  
  return {
    raw,
    algorithm,
  };
}

/**
 * Encrypt data using symmetric encryption
 * 
 * @param plaintext Data to encrypt
 * @param key Encryption key
 * @param options Encryption options
 * @returns Encryption result
 */
export function encrypt(
  plaintext: Uint8Array | string,
  key: SymmetricKey,
  options: EncryptOptions = {}
): EncryptionResult {
  const algorithm = options.algorithm ?? key.algorithm;
  const iv = options.iv ?? generateIV(getIVLength(algorithm));
  
  try {
    const data = typeof plaintext === 'string' 
      ? Buffer.from(plaintext, 'utf8') 
      : Buffer.from(plaintext);
    
    const isAEAD = isAEADAlgorithm(algorithm);
    
    if (isAEAD) {
      return encryptAEAD(data, key.raw, iv, algorithm, options);
    } else {
      return encryptCBC(data, key.raw, iv, algorithm);
    }
  } catch (error) {
    throw new EncryptionError(`Encryption failed: ${(error as Error).message}`);
  }
}

/**
 * Decrypt data using symmetric encryption
 * 
 * @param result Encryption result
 * @param key Decryption key
 * @param options Decryption options
 * @returns Decrypted data
 */
export function decrypt(
  result: EncryptionResult,
  key: SymmetricKey,
  options: DecryptOptions = {}
): Uint8Array {
  const algorithm = options.algorithm ?? result.algorithm;
  
  try {
    const isAEAD = isAEADAlgorithm(algorithm);
    
    if (isAEAD) {
      return decryptAEAD(
        result.ciphertext,
        key.raw,
        result.iv,
        algorithm,
        result.tag!,
        options
      );
    } else {
      return decryptCBC(result.ciphertext, key.raw, result.iv, algorithm);
    }
  } catch (error) {
    throw new DecryptionError(`Decryption failed: ${(error as Error).message}`);
  }
}

/**
 * Encrypt with AEAD (GCM or ChaCha20-Poly1305)
 */
function encryptAEAD(
  plaintext: Buffer,
  key: Uint8Array,
  iv: Uint8Array,
  algorithm: SymmetricAlgorithm,
  options: EncryptOptions
): EncryptionResult {
  const cipher = createCipheriv(mapAlgorithm(algorithm), Buffer.from(key), Buffer.from(iv)) as CipherGCM;
  
  // Set AAD if provided
  if (options.aad) {
    (cipher as any).setAAD(Buffer.from(options.aad));
  }

  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = (cipher as any).getAuthTag();
  
  return {
    ciphertext: new Uint8Array(encrypted),
    iv: new Uint8Array(iv),
    tag: new Uint8Array(tag),
    algorithm,
  };
}

/**
 * Decrypt with AEAD
 */
function decryptAEAD(
  ciphertext: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  algorithm: SymmetricAlgorithm,
  tag: Uint8Array,
  options: DecryptOptions
): Uint8Array {
  const decipher = createDecipheriv(mapAlgorithm(algorithm), Buffer.from(key), Buffer.from(iv)) as DecipherGCM;
  
  decipher.setAuthTag(Buffer.from(tag));
  
  if (options.aad) {
    (decipher as any).setAAD(Buffer.from(options.aad));
  }
  
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext)),
    decipher.final(),
  ]);
  
  return new Uint8Array(decrypted);
}

/**
 * Encrypt with CBC mode
 */
function encryptCBC(
  plaintext: Buffer,
  key: Uint8Array,
  iv: Uint8Array,
  algorithm: SymmetricAlgorithm
): EncryptionResult {
  // Apply PKCS7 padding
  const padded = pkcs7Pad(plaintext, 16);
  
  const cipher = createCipheriv(mapAlgorithm(algorithm), Buffer.from(key), Buffer.from(iv));
  cipher.setAutoPadding(false);
  
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()]);
  
  return {
    ciphertext: new Uint8Array(encrypted),
    iv: new Uint8Array(iv),
    algorithm,
  };
}

/**
 * Decrypt with CBC mode
 */
function decryptCBC(
  ciphertext: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  algorithm: SymmetricAlgorithm
): Uint8Array {
  const decipher = createDecipheriv(mapAlgorithm(algorithm), Buffer.from(key), Buffer.from(iv));
  decipher.setAutoPadding(false);
  
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext)),
    decipher.final(),
  ]);
  
  // Remove PKCS7 padding
  return new Uint8Array(pkcs7Unpad(decrypted));
}

/**
 * AES-256-GCM encryption
 */
export function aes256GcmEncrypt(
  plaintext: Uint8Array | string,
  key: Uint8Array,
  iv?: Uint8Array,
  aad?: Uint8Array
): EncryptionResult {
  const symKey = createKey(key, 'aes-256-gcm');
  return encrypt(plaintext, symKey, { iv, aad });
}

/**
 * AES-256-GCM decryption
 */
export function aes256GcmDecrypt(
  ciphertext: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  tag: Uint8Array,
  aad?: Uint8Array
): Uint8Array {
  const symKey = createKey(key, 'aes-256-gcm');
  return decrypt(
    { ciphertext, iv, tag, algorithm: 'aes-256-gcm' },
    symKey,
    { iv, tag, aad }
  );
}

/**
 * ChaCha20-Poly1305 encryption
 */
export function chaChaEncrypt(
  plaintext: Uint8Array | string,
  key: Uint8Array,
  iv?: Uint8Array,
  aad?: Uint8Array
): EncryptionResult {
  const symKey = createKey(key, 'chacha20-poly1305');
  return encrypt(plaintext, symKey, { iv, aad });
}

/**
 * ChaCha20-Poly1305 decryption
 */
export function chaChaDecrypt(
  ciphertext: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  tag: Uint8Array,
  aad?: Uint8Array
): Uint8Array {
  const symKey = createKey(key, 'chacha20-poly1305');
  return decrypt(
    { ciphertext, iv, tag, algorithm: 'chacha20-poly1305' },
    symKey,
    { iv, tag, aad }
  );
}

/**
 * Get key length for algorithm
 */
function getKeyLength(algorithm: SymmetricAlgorithm): number {
  switch (algorithm) {
    case 'aes-256-gcm':
    case 'aes-256-cbc':
    case 'chacha20-poly1305':
      return 32;
    case 'aes-128-gcm':
    case 'aes-128-cbc':
      return 16;
    default:
      throw new CryptoError(`Unknown algorithm: ${algorithm}`);
  }
}

/**
 * Get IV length for algorithm
 */
function getIVLength(algorithm: SymmetricAlgorithm): number {
  switch (algorithm) {
    case 'aes-256-gcm':
    case 'aes-128-gcm':
      return 12; // 96 bits for GCM
    case 'chacha20-poly1305':
      return 12; // 96 bits for ChaCha20
    case 'aes-256-cbc':
    case 'aes-128-cbc':
      return 16; // 128 bits for CBC
    default:
      return 12;
  }
}

/**
 * Check if algorithm is AEAD
 */
function isAEADAlgorithm(algorithm: SymmetricAlgorithm): boolean {
  return algorithm.includes('gcm') || algorithm.includes('poly1305');
}

/**
 * Map algorithm to Node.js name
 */
function mapAlgorithm(algorithm: SymmetricAlgorithm): string {
  const mapping: Record<SymmetricAlgorithm, string> = {
    'aes-256-gcm': 'aes-256-gcm',
    'aes-256-cbc': 'aes-256-cbc',
    'aes-128-gcm': 'aes-128-gcm',
    'aes-128-cbc': 'aes-128-cbc',
    'chacha20-poly1305': 'chacha20-poly1305',
  };
  
  return mapping[algorithm];
}

/**
 * PKCS7 padding
 */
function pkcs7Pad(data: Buffer, blockSize: number): Buffer {
  const padding = blockSize - (data.length % blockSize);
  const padded = Buffer.alloc(data.length + padding);
  data.copy(padded);
  padded.fill(padding, data.length);
  return padded;
}

/**
 * Remove PKCS7 padding
 */
function pkcs7Unpad(data: Buffer): Buffer {
  const padding = data[data.length - 1];
  if (padding === 0 || padding > 16) {
    throw new DecryptionError('Invalid padding');
  }
  
  // Verify padding
  for (let i = 0; i < padding; i++) {
    if (data[data.length - 1 - i] !== padding) {
      throw new DecryptionError('Invalid padding');
    }
  }
  
  return data.slice(0, data.length - padding);
}

// Default export
export default {
  generateKey,
  createKey,
  encrypt,
  decrypt,
  aes256GcmEncrypt,
  aes256GcmDecrypt,
  chaChaEncrypt,
  chaChaDecrypt,
};