/**
 * @fileoverview Cryptographically secure random number generation
 * @module @vcomm/crypto/random
 */

import * as nodeCrypto from 'crypto';
import { CryptoError } from '../types';

/**
 * Generate cryptographically secure random bytes
 * 
 * @param length Number of bytes to generate
 * @returns Random bytes
 */
export function randomBytes(length: number): Uint8Array {
  if (length < 0) {
    throw new CryptoError('Length must be non-negative');
  }
  
  const bytes = new Uint8Array(length);
  
  // Use Web Crypto API if available, otherwise fall back to Node.js crypto
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Node.js fallback
    try {
      const buffer = nodeCrypto.randomBytes(length);
      bytes.set(buffer);
    } catch {
      throw new CryptoError('No secure random source available');
    }
  }
  
  return bytes;
}

/**
 * Generate a random integer in a range
 * 
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 * @returns Random integer
 */
export function randomInt(min: number, max: number): number {
  if (min > max) {
    throw new CryptoError('Min must be less than or equal to max');
  }
  
  const range = max - min + 1;
  
  // Calculate how many bytes we need
  const bytesNeeded = Math.ceil(Math.log2(range) / 8) || 1;
  const maxValid = Math.floor((256 ** bytesNeeded) / range) * range - 1;
  
  let result: number;
  do {
    const bytes = randomBytes(bytesNeeded);
    result = bytes.reduce((acc, byte, i) => acc + byte * (256 ** i), 0);
  } while (result > maxValid);
  
  return (result % range) + min;
}

/**
 * Generate a random UUID v4
 * 
 * @returns UUID string
 */
export function randomUUID(): string {
  const bytes = randomBytes(16);
  
  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 1
  
  // Convert to UUID string
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Generate a random hexadecimal string
 * 
 * @param length Number of bytes (output will be 2x this length)
 * @returns Hexadecimal string
 */
export function randomHex(length: number): string {
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a random base64 string
 * 
 * @param length Number of bytes
 * @returns Base64 encoded string
 */
export function randomBase64(length: number): string {
  const bytes = randomBytes(length);
  return Buffer.from(bytes).toString('base64');
}

/**
 * Generate a random string from a character set
 * 
 * @param length Length of the string
 * @param charset Character set to use
 * @returns Random string
 */
export function randomString(
  length: number,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = '';
  const charsetLength = charset.length;
  
  for (let i = 0; i < length; i++) {
    const index = randomInt(0, charsetLength - 1);
    result += charset[index];
  }
  
  return result;
}

/**
 * Generate a random alphanumeric string
 * 
 * @param length Length of the string
 * @returns Random alphanumeric string
 */
export function randomAlphanumeric(length: number): string {
  return randomString(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
}

/**
 * Generate a random numeric string
 * 
 * @param length Length of the string
 * @returns Random numeric string
 */
export function randomNumeric(length: number): string {
  return randomString(length, '0123456789');
}

/**
 * Shuffle an array in-place using Fisher-Yates algorithm
 * 
 * @param array Array to shuffle
 * @returns The same array (shuffled in-place)
 */
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Generate a random salt for key derivation
 * 
 * @param length Salt length in bytes (default: 16)
 * @returns Salt bytes
 */
export function generateSalt(length: number = 16): Uint8Array {
  return randomBytes(length);
}

/**
 * Generate a random initialization vector
 * 
 * @param length IV length in bytes (default: 12 for GCM)
 * @returns IV bytes
 */
export function generateIV(length: number = 12): Uint8Array {
  return randomBytes(length);
}

/**
 * Generate a random nonce
 * 
 * @param length Nonce length in bytes (default: 12)
 * @returns Nonce bytes
 */
export function generateNonce(length: number = 12): Uint8Array {
  return randomBytes(length);
}

// Default export
export default {
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
};