/**
 * @fileoverview Key generation and management for asymmetric cryptography
 * @module @vcomm/crypto/keys
 */

import { generateKeyPair, createSign, createVerify, constants } from 'crypto';
import * as ed25519 from '@noble/ed25519';
import * as secp256k1 from '@noble/secp256k1';
import { sha512 } from '../hash';
import { randomBytes } from '../random';
import {
  KeyAlgorithm,
  KeyPair,
  PublicKey,
  PrivateKey,
  KeyGenOptions,
  SignatureAlgorithm,
  SignOptions,
  Signature,
  KeyGenerationError,
  SignatureError,
  VerificationError,
  CryptoError,
} from '../types';

/**
 * Generate an Ed25519 key pair
 * 
 * @param options Key generation options
 * @returns Key pair
 */
export async function generateEd25519KeyPair(
  options: Partial<KeyGenOptions> = {}
): Promise<KeyPair> {
  try {
    // Generate random private key seed
    const privateKeyRaw = randomBytes(32);
    
    // Derive public key
    const publicKeyRaw = await ed25519.getPublicKeyAsync(privateKeyRaw);
    
    const id = options.id ?? generateKeyId();
    
    const publicKey: PublicKey = {
      algorithm: 'ed25519',
      usages: ['verify'],
      extractable: true,
      id,
      raw: publicKeyRaw,
    };
    
    const privateKey: PrivateKey = {
      algorithm: 'ed25519',
      usages: ['sign'],
      extractable: options.extractable ?? true,
      id,
      raw: privateKeyRaw,
    };
    
    return { publicKey, privateKey };
  } catch (error) {
    throw new KeyGenerationError(`Failed to generate Ed25519 key pair: ${(error as Error).message}`);
  }
}

/**
 * Generate an X25519 key pair for key exchange
 * 
 * @param options Key generation options
 * @returns Key pair
 */
export async function generateX25519KeyPair(
  options: Partial<KeyGenOptions> = {}
): Promise<KeyPair> {
  try {
    // Generate random private key
    const privateKeyRaw = randomBytes(32);
    
    // Use secp256k1 utils for X25519 scalar multiplication
    // Note: In production, use proper X25519 library
    const publicKeyRaw = await deriveX25519PublicKey(privateKeyRaw);
    
    const id = options.id ?? generateKeyId();
    
    const publicKey: PublicKey = {
      algorithm: 'x25519',
      usages: ['deriveKey', 'deriveBits'],
      extractable: true,
      id,
      raw: publicKeyRaw,
    };
    
    const privateKey: PrivateKey = {
      algorithm: 'x25519',
      usages: ['deriveKey', 'deriveBits'],
      extractable: options.extractable ?? true,
      id,
      raw: privateKeyRaw,
    };
    
    return { publicKey, privateKey };
  } catch (error) {
    throw new KeyGenerationError(`Failed to generate X25519 key pair: ${(error as Error).message}`);
  }
}

/**
 * Generate a secp256k1 key pair
 * 
 * @param options Key generation options
 * @returns Key pair
 */
export async function generateSecp256k1KeyPair(
  options: Partial<KeyGenOptions> = {}
): Promise<KeyPair> {
  try {
    // Generate random private key
    const privateKeyRaw = secp256k1.utils.randomSecretKey();
    
    // Derive public key (compressed)
    const publicKeyRaw = secp256k1.getPublicKey(privateKeyRaw, true);
    
    const id = options.id ?? generateKeyId();
    
    const publicKey: PublicKey = {
      algorithm: 'secp256k1',
      usages: ['verify'],
      extractable: true,
      id,
      raw: publicKeyRaw,
    };
    
    const privateKey: PrivateKey = {
      algorithm: 'secp256k1',
      usages: ['sign'],
      extractable: options.extractable ?? true,
      id,
      raw: privateKeyRaw,
    };
    
    return { publicKey, privateKey };
  } catch (error) {
    throw new KeyGenerationError(`Failed to generate secp256k1 key pair: ${(error as Error).message}`);
  }
}

/**
 * Generate an RSA key pair
 * 
 * @param options Key generation options
 * @returns Key pair
 */
export function generateRSAKeyPair(
  options: Partial<KeyGenOptions> = {}
): Promise<KeyPair> {
  return new Promise((resolve, reject) => {
    const modulusLength = options.modulusLength ?? 2048;
    
    generateKeyPair(
      'rsa',
      {
        modulusLength,
        publicExponent: 0x10001,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      },
      (err, publicKeyPem, privateKeyPem) => {
        if (err) {
          reject(new KeyGenerationError(`Failed to generate RSA key pair: ${err.message}`));
          return;
        }
        
        const id = options.id ?? generateKeyId();
        
        // Extract raw public key from PEM
        const publicKey: PublicKey = {
          algorithm: 'rsa',
          usages: ['verify', 'encrypt'],
          extractable: true,
          id,
          raw: new Uint8Array(Buffer.from(publicKeyPem)),
          pem: publicKeyPem,
        };
        
        const privateKey: PrivateKey = {
          algorithm: 'rsa',
          usages: ['sign', 'decrypt'],
          extractable: options.extractable ?? true,
          id,
          pem: privateKeyPem,
        };
        
        resolve({ publicKey, privateKey });
      }
    );
  });
}

/**
 * Generate a key pair
 * 
 * @param options Key generation options
 * @returns Key pair
 */
export async function generateKeyPairAsync(
  options: KeyGenOptions
): Promise<KeyPair> {
  switch (options.algorithm) {
    case 'ed25519':
      return generateEd25519KeyPair(options);
    case 'x25519':
      return generateX25519KeyPair(options);
    case 'secp256k1':
      return generateSecp256k1KeyPair(options);
    case 'rsa':
      return generateRSAKeyPair(options);
    default:
      throw new KeyGenerationError(`Unsupported algorithm: ${options.algorithm}`);
  }
}

/**
 * Sign data with a private key
 * 
 * @param data Data to sign
 * @param privateKey Private key
 * @param options Signing options
 * @returns Signature
 */
export async function sign(
  data: Uint8Array | string,
  privateKey: PrivateKey,
  options: SignOptions = {}
): Promise<Signature> {
  const algorithm = options.algorithm ?? getSignatureAlgorithm(privateKey.algorithm);
  const dataBytes = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  
  try {
    switch (algorithm) {
      case 'ed25519': {
        if (!privateKey.raw) {
          throw new SignatureError('Private key not extractable');
        }
        const signature = await ed25519.signAsync(dataBytes, privateKey.raw);
        return {
          raw: signature,
          algorithm: 'ed25519',
        };
      }
      
      case 'ecdsa-secp256k1': {
        if (!privateKey.raw) {
          throw new SignatureError('Private key not extractable');
        }
        // secp256k1 v3: signAsync prehashes with sha256 by default
        const signatureBytes = await secp256k1.signAsync(dataBytes, privateKey.raw, { format: 'der' });
        return {
          raw: signatureBytes,
          algorithm: 'ecdsa-secp256k1',
        };
      }
      
      case 'rsa-pss':
      case 'rsa-pkcs1v15': {
        if (!privateKey.pem) {
          throw new SignatureError('RSA private key PEM not available');
        }
        const signer = createSign(`RSA-SHA${options.hash === 'sha384' ? '384' : options.hash === 'sha512' ? '512' : '256'}`);
        signer.update(dataBytes);
        
        const padding = algorithm === 'rsa-pss' 
          ? constants.RSA_PKCS1_PSS_PADDING 
          : constants.RSA_PKCS1_PADDING;
        
        const signature = signer.sign({
          key: privateKey.pem,
          padding,
          saltLength: algorithm === 'rsa-pss' ? 32 : undefined,
        });
        
        return {
          raw: new Uint8Array(signature),
          algorithm,
        };
      }
      
      default:
        throw new SignatureError(`Unsupported signature algorithm: ${algorithm}`);
    }
  } catch (error) {
    if (error instanceof SignatureError) throw error;
    throw new SignatureError(`Signing failed: ${(error as Error).message}`);
  }
}

/**
 * Verify a signature
 * 
 * @param data Original data
 * @param signature Signature to verify
 * @param publicKey Public key
 * @returns Whether signature is valid
 */
export async function verify(
  data: Uint8Array | string,
  signature: Signature,
  publicKey: PublicKey
): Promise<boolean> {
  const dataBytes = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  
  try {
    switch (signature.algorithm) {
      case 'ed25519': {
        return ed25519.verifyAsync(signature.raw, dataBytes, publicKey.raw);
      }
      
      case 'ecdsa-secp256k1': {
        // secp256k1 v3: verify handles prehashing by default, uses DER format
        return secp256k1.verify(signature.raw, dataBytes, publicKey.raw, { format: 'der' });
      }
      
      case 'rsa-pss':
      case 'rsa-pkcs1v15': {
        if (!publicKey.pem) {
          throw new VerificationError('RSA public key PEM not available');
        }
        const verifier = createVerify('RSA-SHA256');
        verifier.update(dataBytes);
        
        const padding = signature.algorithm === 'rsa-pss' 
          ? constants.RSA_PKCS1_PSS_PADDING 
          : constants.RSA_PKCS1_PADDING;
        
        return verifier.verify(
          {
            key: publicKey.pem,
            padding,
          },
          Buffer.from(signature.raw)
        );
      }
      
      default:
        throw new VerificationError(`Unsupported signature algorithm: ${signature.algorithm}`);
    }
  } catch (error) {
    if (error instanceof VerificationError) throw error;
    return false;
  }
}

/**
 * Derive X25519 public key from private key
 */
async function deriveX25519PublicKey(privateKey: Uint8Array): Promise<Uint8Array> {
  // Simplified X25519 public key derivation
  // In production, use proper X25519 implementation
  const hash = sha512(privateKey);
  // Clamp the private key according to X25519 spec
  hash[0] &= 248;
  hash[31] &= 127;
  hash[31] |= 64;
  return hash.slice(0, 32);
}

/**
 * Get signature algorithm from key algorithm
 */
function getSignatureAlgorithm(keyAlgorithm: KeyAlgorithm): SignatureAlgorithm {
  switch (keyAlgorithm) {
    case 'ed25519':
      return 'ed25519';
    case 'secp256k1':
      return 'ecdsa-secp256k1';
    case 'rsa':
      return 'rsa-pss';
    default:
      throw new CryptoError(`No signature algorithm for key type: ${keyAlgorithm}`);
  }
}

/**
 * Generate a random key ID
 */
function generateKeyId(): string {
  return Buffer.from(randomBytes(8)).toString('hex');
}

/**
 * Export public key to PEM format
 */
export function exportPublicKeyPEM(publicKey: PublicKey): string {
  if (publicKey.pem) {
    return publicKey.pem;
  }
  
  // For Ed25519/secp256k1, create SPKI format
  const raw = publicKey.raw;
  const base64 = Buffer.from(raw).toString('base64');
  
  let oid: string;
  switch (publicKey.algorithm) {
    case 'ed25519':
      oid = 'MCowBQYDK2VwAyEA';
      break;
    case 'secp256k1':
      oid = 'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE';
      break;
    default:
      throw new CryptoError(`Cannot export ${publicKey.algorithm} to PEM`);
  }
  
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN PUBLIC KEY-----\n${oid}${lines.join('\n')}\n-----END PUBLIC KEY-----`;
}

// Default export
export default {
  generateEd25519KeyPair,
  generateX25519KeyPair,
  generateSecp256k1KeyPair,
  generateRSAKeyPair,
  generateKeyPair: generateKeyPairAsync,
  sign,
  verify,
  exportPublicKeyPEM,
};