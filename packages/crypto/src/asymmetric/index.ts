/**
 * @fileoverview Asymmetric encryption and key derivation
 * @module @vcomm/crypto/asymmetric
 */

import { createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, constants } from 'crypto';
import * as secp256k1 from '@noble/secp256k1';
import { sha256, sha512, hmac } from '../hash';
import { randomBytes, generateIV } from '../random';
import { encrypt, decrypt, generateKey, createKey } from '../symmetric';
import {
  KeyPair,
  PrivateKey,
  PublicKey,
  AsymmetricEncryptOptions,
  HKDFOptions,
  PBKDF2Options,
  ScryptOptions,
  SymmetricKey,
  EncryptionResult,
  EncryptionError,
  DecryptionError,
  CryptoError,
} from '../types';

/**
 * Derive a shared secret using ECDH (X25519/secp256k1)
 * 
 * @param privateKey Our private key
 * @param publicKey Their public key
 * @returns Shared secret
 */
export async function deriveSharedSecret(
  privateKey: PrivateKey,
  publicKey: PublicKey
): Promise<Uint8Array> {
  if (!privateKey.raw) {
    throw new CryptoError('Private key not extractable');
  }
  
  if (privateKey.algorithm === 'x25519' || publicKey.algorithm === 'x25519') {
    // Simplified X25519 - in production use proper X25519 implementation
    return deriveX25519SharedSecret(privateKey.raw, publicKey.raw);
  }
  
  if (privateKey.algorithm === 'secp256k1' && publicKey.algorithm === 'secp256k1') {
    return deriveSecp256k1SharedSecret(privateKey.raw, publicKey.raw);
  }
  
  throw new CryptoError(`Incompatible key types: ${privateKey.algorithm} and ${publicKey.algorithm}`);
}

/**
 * Derive X25519 shared secret
 */
async function deriveX25519SharedSecret(
  privateKey: Uint8Array,
  publicKey: Uint8Array
): Promise<Uint8Array> {
  // Simplified X25519 shared secret derivation
  // In production, use proper X25519 implementation
  const combined = new Uint8Array(privateKey.length + publicKey.length);
  combined.set(privateKey, 0);
  combined.set(publicKey, privateKey.length);
  return sha256(combined);
}

/**
 * Derive secp256k1 shared secret
 */
async function deriveSecp256k1SharedSecret(
  privateKey: Uint8Array,
  publicKey: Uint8Array
): Promise<Uint8Array> {
  try {
    // Get shared point
    const sharedPoint = secp256k1.getSharedSecret(privateKey, publicKey, true);
    // Return x-coordinate as shared secret
    return sha256(sharedPoint.slice(1));
  } catch (error) {
    throw new CryptoError(`Failed to derive shared secret: ${(error as Error).message}`);
  }
}

/**
 * Encrypt data for a recipient using ECIES
 * 
 * @param plaintext Data to encrypt
 * @param recipientPublicKey Recipient's public key
 * @param options Encryption options
 * @returns Encrypted data (ephemeral public key + ciphertext + tag)
 */
export async function encryptForRecipient(
  plaintext: Uint8Array | string,
  recipientPublicKey: PublicKey,
  options: AsymmetricEncryptOptions = {}
): Promise<Uint8Array> {
  if (recipientPublicKey.algorithm !== 'secp256k1' && recipientPublicKey.algorithm !== 'x25519') {
    throw new EncryptionError(`Unsupported algorithm: ${recipientPublicKey.algorithm}`);
  }
  
  // Generate ephemeral key pair
  const ephemeralPrivateKey = secp256k1.utils.randomPrivateKey();
  const ephemeralPublicKey = secp256k1.getPublicKey(ephemeralPrivateKey, true);
  
  // Derive shared secret
  const sharedSecret = await deriveSecp256k1SharedSecret(ephemeralPrivateKey, recipientPublicKey.raw);
  
  // Derive encryption key using HKDF
  const encryptionKey = await hkdf(sharedSecret, {
    hash: 'sha256',
    salt: new Uint8Array(0),
    length: 32,
  });
  
  // Encrypt with AES-256-GCM
  const key = createKey(encryptionKey, 'aes-256-gcm');
  const result = encrypt(plaintext, key);
  
  // Combine ephemeral public key + iv + tag + ciphertext
  const combined = new Uint8Array(
    ephemeralPublicKey.length + 
    result.iv.length + 
    result.tag!.length + 
    result.ciphertext.length
  );
  
  let offset = 0;
  combined.set(ephemeralPublicKey, offset);
  offset += ephemeralPublicKey.length;
  combined.set(result.iv, offset);
  offset += result.iv.length;
  combined.set(result.tag!, offset);
  offset += result.tag!.length;
  combined.set(result.ciphertext, offset);
  
  return combined;
}

/**
 * Decrypt data from a sender using ECIES
 * 
 * @param ciphertext Encrypted data
 * @param recipientPrivateKey Recipient's private key
 * @returns Decrypted data
 */
export async function decryptForRecipient(
  ciphertext: Uint8Array,
  recipientPrivateKey: PrivateKey
): Promise<Uint8Array> {
  if (!recipientPrivateKey.raw) {
    throw new DecryptionError('Private key not extractable');
  }
  
  // Parse the combined data
  // ephemeralPublicKey (33 bytes) + iv (12 bytes) + tag (16 bytes) + ciphertext
  const ephemeralPublicKeyLength = 33;
  const ivLength = 12;
  const tagLength = 16;
  
  if (ciphertext.length < ephemeralPublicKeyLength + ivLength + tagLength) {
    throw new DecryptionError('Ciphertext too short');
  }
  
  let offset = 0;
  const ephemeralPublicKey = ciphertext.slice(offset, offset + ephemeralPublicKeyLength);
  offset += ephemeralPublicKeyLength;
  const iv = ciphertext.slice(offset, offset + ivLength);
  offset += ivLength;
  const tag = ciphertext.slice(offset, offset + tagLength);
  offset += tagLength;
  const encryptedData = ciphertext.slice(offset);
  
  // Derive shared secret
  const sharedSecret = await deriveSecp256k1SharedSecret(recipientPrivateKey.raw, ephemeralPublicKey);
  
  // Derive encryption key using HKDF
  const encryptionKey = await hkdf(sharedSecret, {
    hash: 'sha256',
    salt: new Uint8Array(0),
    length: 32,
  });
  
  // Decrypt with AES-256-GCM
  const key = createKey(encryptionKey, 'aes-256-gcm');
  return decrypt(
    { ciphertext: encryptedData, iv, tag, algorithm: 'aes-256-gcm' },
    key,
    { iv, tag }
  );
}

/**
 * RSA-OAEP encryption
 */
export function rsaEncrypt(
  plaintext: Uint8Array | string,
  publicKeyPem: string,
  label?: Uint8Array
): Uint8Array {
  const data = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : Buffer.from(plaintext);
  
  const options: any = {
    key: publicKeyPem,
    padding: constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
  };
  
  if (label) {
    options.oaepLabel = Buffer.from(label);
  }
  
  try {
    const encrypted = publicEncrypt(options, data);
    return new Uint8Array(encrypted);
  } catch (error) {
    throw new EncryptionError(`RSA encryption failed: ${(error as Error).message}`);
  }
}

/**
 * RSA-OAEP decryption
 */
export function rsaDecrypt(
  ciphertext: Uint8Array,
  privateKeyPem: string,
  label?: Uint8Array
): Uint8Array {
  const options: any = {
    key: privateKeyPem,
    padding: constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
  };
  
  if (label) {
    options.oaepLabel = Buffer.from(label);
  }
  
  try {
    const decrypted = privateDecrypt(options, Buffer.from(ciphertext));
    return new Uint8Array(decrypted);
  } catch (error) {
    throw new DecryptionError(`RSA decryption failed: ${(error as Error).message}`);
  }
}

/**
 * HKDF key derivation
 * 
 * @param inputKeyMaterial Input key material
 * @param options HKDF options
 * @returns Derived key
 */
export async function hkdf(
  inputKeyMaterial: Uint8Array,
  options: HKDFOptions
): Promise<Uint8Array> {
  const { hash: hashAlg, salt, info = new Uint8Array(0), length } = options;
  
  // Extract
  const prk = hmac(inputKeyMaterial, salt, hashAlg);
  
  // Expand
  const hashLength = hashAlg === 'sha256' ? 32 : hashAlg === 'sha384' ? 48 : 64;
  const blocks = Math.ceil(length / hashLength);
  
  const output = new Uint8Array(blocks * hashLength);
  let previousBlock = new Uint8Array(0);
  
  for (let i = 0; i < blocks; i++) {
    const input = new Uint8Array(previousBlock.length + info.length + 1);
    input.set(previousBlock, 0);
    input.set(info, previousBlock.length);
    input[input.length - 1] = i + 1;
    
    previousBlock = hmac(input, prk, hashAlg);
    output.set(previousBlock, i * hashLength);
  }
  
  return output.slice(0, length);
}

/**
 * PBKDF2 key derivation
 * 
 * @param password Password
 * @param options PBKDF2 options
 * @returns Derived key
 */
export async function pbkdf2(
  password: string | Uint8Array,
  options: PBKDF2Options
): Promise<Uint8Array> {
  const { hash: hashAlg, salt, iterations, length } = options;
  
  const passwordBytes = typeof password === 'string' 
    ? new TextEncoder().encode(password) 
    : password;
  
  // Simplified PBKDF2 using HMAC
  // In production, use crypto.pbkdf2
  const prf = (data: Uint8Array) => hmac(data, passwordBytes, hashAlg);
  
  const hashLength = hashAlg === 'sha256' ? 32 : hashAlg === 'sha384' ? 48 : 64;
  const blocks = Math.ceil(length / hashLength);
  
  const output = new Uint8Array(blocks * hashLength);
  
  for (let blockIndex = 1; blockIndex <= blocks; blockIndex++) {
    const blockInput = new Uint8Array(salt.length + 4);
    blockInput.set(salt, 0);
    
    // Big-endian block index
    blockInput[salt.length] = (blockIndex >> 24) & 0xff;
    blockInput[salt.length + 1] = (blockIndex >> 16) & 0xff;
    blockInput[salt.length + 2] = (blockIndex >> 8) & 0xff;
    blockInput[salt.length + 3] = blockIndex & 0xff;
    
    let u = prf(blockInput);
    const block = new Uint8Array(u);
    
    for (let i = 1; i < iterations; i++) {
      u = prf(u);
      for (let j = 0; j < block.length; j++) {
        block[j] ^= u[j];
      }
    }
    
    output.set(block, (blockIndex - 1) * hashLength);
  }
  
  return output.slice(0, length);
}

/**
 * Scrypt key derivation
 * 
 * @param password Password
 * @param options Scrypt options
 * @returns Derived key
 */
export async function scrypt(
  password: string | Uint8Array,
  options: ScryptOptions
): Promise<Uint8Array> {
  const { salt, cost = 16384, blockSize = 8, parallelization = 1, length } = options;
  
  // Use Node.js scrypt
  const { scrypt: nodeScrypt } = await import('crypto');
  
  return new Promise((resolve, reject) => {
    const passwordBuffer = typeof password === 'string' 
      ? Buffer.from(password, 'utf8') 
      : Buffer.from(password);
    
    nodeScrypt(
      passwordBuffer,
      Buffer.from(salt),
      length,
      {
        N: cost,
        r: blockSize,
        p: parallelization,
        maxmem: 128 * cost * blockSize * 2,
      },
      (err, derivedKey) => {
        if (err) {
          reject(new CryptoError(`Scrypt failed: ${err.message}`));
        } else {
          resolve(new Uint8Array(derivedKey));
        }
      }
    );
  });
}

/**
 * Derive a symmetric key from a shared secret
 */
export async function deriveSymmetricKey(
  sharedSecret: Uint8Array,
  context?: Uint8Array
): Promise<SymmetricKey> {
  const keyMaterial = await hkdf(sharedSecret, {
    hash: 'sha256',
    salt: new Uint8Array(0),
    info: context,
    length: 32,
  });
  
  return createKey(keyMaterial, 'aes-256-gcm');
}

// Default export
export default {
  deriveSharedSecret,
  encryptForRecipient,
  decryptForRecipient,
  rsaEncrypt,
  rsaDecrypt,
  hkdf,
  pbkdf2,
  scrypt,
  deriveSymmetricKey,
};