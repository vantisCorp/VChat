/**
 * @fileoverview Hash functions for cryptographic operations
 * @module @vcomm/crypto/hash
 */

import { createHash, createHmac } from 'crypto';
import { HashAlgorithm, HashOptions, CryptoError } from '../types';

/**
 * Hash data using the specified algorithm
 * 
 * @param data Data to hash
 * @param algorithm Hash algorithm (default: sha256)
 * @returns Hash digest
 */
export function hash(
  data: Uint8Array | string,
  algorithm: HashAlgorithm = 'sha256'
): Uint8Array {
  const nodeAlgorithm = mapAlgorithm(algorithm);
  const hasher = createHash(nodeAlgorithm);
  
  if (typeof data === 'string') {
    hasher.update(data, 'utf8');
  } else {
    hasher.update(Buffer.from(data));
  }
  
  return new Uint8Array(hasher.digest());
}

/**
 * Hash data and return as hex string
 * 
 * @param data Data to hash
 * @param algorithm Hash algorithm (default: sha256)
 * @returns Hex encoded hash
 */
export function hashHex(
  data: Uint8Array | string,
  algorithm: HashAlgorithm = 'sha256'
): string {
  return Buffer.from(hash(data, algorithm)).toString('hex');
}

/**
 * Compute HMAC
 * 
 * @param data Data to authenticate
 * @param key HMAC key
 * @param algorithm Hash algorithm (default: sha256)
 * @returns HMAC digest
 */
export function hmac(
  data: Uint8Array | string,
  key: Uint8Array | string,
  algorithm: HashAlgorithm = 'sha256'
): Uint8Array {
  const nodeAlgorithm = mapAlgorithm(algorithm);
  const hmacHasher = createHmac(nodeAlgorithm, typeof key === 'string' ? key : Buffer.from(key));
  
  if (typeof data === 'string') {
    hmacHasher.update(data, 'utf8');
  } else {
    hmacHasher.update(Buffer.from(data));
  }
  
  return new Uint8Array(hmacHasher.digest());
}

/**
 * Compute HMAC and return as hex string
 * 
 * @param data Data to authenticate
 * @param key HMAC key
 * @param algorithm Hash algorithm (default: sha256)
 * @returns Hex encoded HMAC
 */
export function hmacHex(
  data: Uint8Array | string,
  key: Uint8Array | string,
  algorithm: HashAlgorithm = 'sha256'
): string {
  return Buffer.from(hmac(data, key, algorithm)).toString('hex');
}

/**
 * Verify HMAC
 * 
 * @param data Data to verify
 * @param key HMAC key
 * @param expectedHmac Expected HMAC value
 * @param algorithm Hash algorithm
 * @returns Whether HMAC is valid
 */
export function verifyHmac(
  data: Uint8Array | string,
  key: Uint8Array | string,
  expectedHmac: Uint8Array,
  algorithm: HashAlgorithm = 'sha256'
): boolean {
  const computed = hmac(data, key, algorithm);
  
  // Constant-time comparison
  if (computed.length !== expectedHmac.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < computed.length; i++) {
    result |= computed[i] ^ expectedHmac[i];
  }
  
  return result === 0;
}

/**
 * SHA-1 hash (deprecated for most uses, but needed for SRTP)
 */
export function sha1(data: Uint8Array | string): Uint8Array {
  return hash(data, 'sha1');
}

/**
 * SHA-256 hash
 */
export function sha256(data: Uint8Array | string): Uint8Array {
  return hash(data, 'sha256');
}

/**
 * SHA-384 hash
 */
export function sha384(data: Uint8Array | string): Uint8Array {
  return hash(data, 'sha384');
}

/**
 * SHA-512 hash
 */
export function sha512(data: Uint8Array | string): Uint8Array {
  return hash(data, 'sha512');
}

/**
 * SHA3-256 hash
 */
export function sha3_256(data: Uint8Array | string): Uint8Array {
  return hash(data, 'sha3-256');
}

/**
 * SHA3-512 hash
 */
export function sha3_512(data: Uint8Array | string): Uint8Array {
  return hash(data, 'sha3-512');
}

/**
 * Blake2b hash (using Node.js crypto)
 */
export function blake2b(data: Uint8Array | string, length: number = 64): Uint8Array {
  const hasher = createHash(`blake2b${length * 8}`);
  
  if (typeof data === 'string') {
    hasher.update(data, 'utf8');
  } else {
    hasher.update(Buffer.from(data));
  }
  
  return new Uint8Array(hasher.digest());
}

/**
 * Blake2s hash (using Node.js crypto)
 */
export function blake2s(data: Uint8Array | string, length: number = 32): Uint8Array {
  const hasher = createHash(`blake2s${length * 8}`);
  
  if (typeof data === 'string') {
    hasher.update(data, 'utf8');
  } else {
    hasher.update(Buffer.from(data));
  }
  
  return new Uint8Array(hasher.digest());
}

/**
 * Double SHA-256 (used in Bitcoin)
 */
export function doubleSha256(data: Uint8Array | string): Uint8Array {
  return sha256(sha256(data));
}

/**
 * RIPEMD-160 hash
 */
export function ripemd160(data: Uint8Array | string): Uint8Array {
  const hasher = createHash('ripemd160');
  
  if (typeof data === 'string') {
    hasher.update(data, 'utf8');
  } else {
    hasher.update(Buffer.from(data));
  }
  
  return new Uint8Array(hasher.digest());
}

/**
 * Hash160 (SHA-256 followed by RIPEMD-160, used in Bitcoin)
 */
export function hash160(data: Uint8Array | string): Uint8Array {
  return ripemd160(sha256(data));
}

/**
 * Map algorithm name to Node.js crypto algorithm
 */
function mapAlgorithm(algorithm: HashAlgorithm): string {
  const mapping: Record<HashAlgorithm, string> = {
    'sha1': 'sha1',
    'sha256': 'sha256',
    'sha384': 'sha384',
    'sha512': 'sha512',
    'sha3-256': 'sha3-256',
    'sha3-512': 'sha3-512',
    'blake2b': 'blake2b512',
    'blake2s': 'blake2s256',
  };
  
  const mapped = mapping[algorithm];
  if (!mapped) {
    throw new CryptoError(`Unsupported hash algorithm: ${algorithm}`);
  }
  
  return mapped;
}

// Default export
export default {
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
};