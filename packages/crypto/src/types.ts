/**
 * @fileoverview Type definitions for the crypto package
 * @module @vcomm/crypto/types
 */

// ============================================================================
// KEY TYPES
// ============================================================================

/**
 * Supported key algorithms
 */
export type KeyAlgorithm = 'ed25519' | 'x25519' | 'secp256k1' | 'rsa';

/**
 * Key usage purposes
 */
export type KeyUsage = 'sign' | 'verify' | 'encrypt' | 'decrypt' | 'deriveKey' | 'deriveBits';

/**
 * Base key interface
 */
export interface Key {
  /** Key algorithm */
  algorithm: KeyAlgorithm;
  
  /** Key usage purposes */
  usages: KeyUsage[];
  
  /** Whether key is extractable */
  extractable: boolean;
  
  /** Key ID for identification */
  id?: string;
}

/**
 * Public key interface
 */
export interface PublicKey extends Key {
  /** Raw public key bytes */
  raw: Uint8Array;
  
  /** PEM encoded public key */
  pem?: string;
}

/**
 * Private key interface
 */
export interface PrivateKey extends Key {
  /** Raw private key bytes (only if extractable) */
  raw?: Uint8Array;
  
  /** PEM encoded private key */
  pem?: string;
}

/**
 * Key pair interface
 */
export interface KeyPair {
  publicKey: PublicKey;
  privateKey: PrivateKey;
}

/**
 * Key generation options
 */
export interface KeyGenOptions {
  /** Key algorithm */
  algorithm: KeyAlgorithm;
  
  /** Key usage purposes */
  usages?: KeyUsage[];
  
  /** Whether key is extractable */
  extractable?: boolean;
  
  /** Key ID */
  id?: string;
  
  /** Key size in bits (for RSA) */
  modulusLength?: number;
}

// ============================================================================
// SYMMETRIC ENCRYPTION TYPES
// ============================================================================

/**
 * Symmetric encryption algorithms
 */
export type SymmetricAlgorithm = 'aes-256-gcm' | 'aes-256-cbc' | 'aes-128-gcm' | 'aes-128-cbc' | 'chacha20-poly1305';

/**
 * Symmetric key interface
 */
export interface SymmetricKey {
  /** Raw key bytes */
  raw: Uint8Array;
  
  /** Algorithm */
  algorithm: SymmetricAlgorithm;
  
  /** Key ID */
  id?: string;
}

/**
 * Symmetric encryption options
 */
export interface EncryptOptions {
  /** Encryption algorithm */
  algorithm?: SymmetricAlgorithm;
  
  /** Initialization vector (auto-generated if not provided) */
  iv?: Uint8Array;
  
  /** Additional authenticated data (for AEAD) */
  aad?: Uint8Array;
  
  /** Tag length in bits (for GCM) */
  tagLength?: number;
}

/**
 * Encryption result
 */
export interface EncryptionResult {
  /** Ciphertext */
  ciphertext: Uint8Array;
  
  /** Initialization vector */
  iv: Uint8Array;
  
  /** Authentication tag (for AEAD) */
  tag?: Uint8Array;
  
  /** Algorithm used */
  algorithm: SymmetricAlgorithm;
}

/**
 * Decryption options
 */
export interface DecryptOptions {
  /** Algorithm (must match encryption, derived from EncryptionResult if not provided) */
  algorithm?: SymmetricAlgorithm;
  
  /** Initialization vector */
  iv?: Uint8Array;
  
  /** Additional authenticated data */
  aad?: Uint8Array;

  /** Authentication tag */
  tag?: Uint8Array;
}

// ============================================================================
// ASYMMETRIC ENCRYPTION TYPES
// ============================================================================

/**
 * Asymmetric encryption algorithms
 */
export type AsymmetricAlgorithm = 'rsa-oaep' | 'ecies' | 'x25519';

/**
 * Asymmetric encryption options
 */
export interface AsymmetricEncryptOptions {
  /** Algorithm */
  algorithm?: AsymmetricAlgorithm;
  
  /** Label for RSA-OAEP */
  label?: Uint8Array;
}

// ============================================================================
// SIGNATURE TYPES
// ============================================================================

/**
 * Signature algorithms
 */
export type SignatureAlgorithm = 'ed25519' | 'ecdsa-secp256k1' | 'rsa-pss' | 'rsa-pkcs1v15';

/**
 * Signature options
 */
export interface SignOptions {
  /** Algorithm */
  algorithm?: SignatureAlgorithm;
  
  /** Hash algorithm for RSA */
  hash?: 'sha256' | 'sha384' | 'sha512';
}

/**
 * Signature result
 */
export interface Signature {
  /** Signature bytes */
  raw: Uint8Array;
  
  /** Algorithm used */
  algorithm: SignatureAlgorithm;
}

// ============================================================================
// HASH TYPES
// ============================================================================

/**
 * Hash algorithms
 */
export type HashAlgorithm = 'sha1' | 'sha256' | 'sha384' | 'sha512' | 'sha3-256' | 'sha3-512' | 'blake2b' | 'blake2s';

/**
 * Hash options
 */
export interface HashOptions {
  /** Algorithm */
  algorithm?: HashAlgorithm;
}

// ============================================================================
// KEY DERIVATION TYPES
// ============================================================================

/**
 * Key derivation functions
 */
export type KDFAlgorithm = 'hkdf' | 'pbkdf2' | 'scrypt' | 'argon2id';

/**
 * HKDF options
 */
export interface HKDFOptions {
  /** Hash algorithm */
  hash: HashAlgorithm;
  
  /** Salt */
  salt: Uint8Array;
  
  /** Info context */
  info?: Uint8Array;
  
  /** Output length in bytes */
  length: number;
}

/**
 * PBKDF2 options
 */
export interface PBKDF2Options {
  /** Hash algorithm */
  hash: HashAlgorithm;
  
  /** Salt */
  salt: Uint8Array;
  
  /** Iteration count */
  iterations: number;
  
  /** Output length in bytes */
  length: number;
}

/**
 * Scrypt options
 */
export interface ScryptOptions {
  /** Salt */
  salt: Uint8Array;
  
  /** CPU/memory cost parameter (N) */
  cost?: number;
  
  /** Block size parameter (r) */
  blockSize?: number;
  
  /** Parallelization parameter (p) */
  parallelization?: number;
  
  /** Output length in bytes */
  length: number;
}

// ============================================================================
// SRTP TYPES
// ============================================================================

/**
 * SRTP crypto suites
 */
export type SRTPCryptoSuite = 
  | 'AES_CM_128_HMAC_SHA1_80'
  | 'AES_CM_128_HMAC_SHA1_32'
  | 'AES_256_CM_HMAC_SHA1_80'
  | 'AES_256_CM_HMAC_SHA1_32'
  | 'AEAD_AES_128_GCM'
  | 'AEAD_AES_256_GCM';

/**
 * SRTP session key
 */
export interface SRTPKey {
  /** Master key */
  masterKey: Uint8Array;
  
  /** Master salt */
  masterSalt: Uint8Array;
  
  /** Crypto suite */
  cryptoSuite: SRTPCryptoSuite;
}

/**
 * SRTP session parameters
 */
export interface SRTPParams {
  /** Derived encryption key */
  encryptionKey: Uint8Array;
  
  /** Derived authentication key */
  authKey: Uint8Array;
  
  /** Derived salt */
  salt: Uint8Array;
  
  /** Key derivation rate */
  keyDerivationRate?: number;
  
  /** Roll-over counter */
  roc?: number;
  
  /** Sequence number */
  seq?: number;
}

/**
 * SRTP packet header
 */
export interface SRTPHeader {
  /** Packet type */
  packetType: number;

  /** Sequence number */
  sequenceNumber: number;

  /** Timestamp */
  timestamp: number;

  /** SSRC */
  ssrc: number;

  /** Contributing source identifiers */
  csrc?: number[];

  /** Header extension */
  extension?: Uint8Array;
  
  /** Raw header bytes */
  raw: Uint8Array;
}

// ============================================================================
// DTLS TYPES
// ============================================================================

/**
 * DTLS version
 */
export interface DTLSVersion {
  major: number;
  minor: number;
}

/**
 * DTLS cipher suite
 */
export type DTLSCipherSuite = 
  | 'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256'
  | 'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384'
  | 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256'
  | 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384'
  | 'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256'
  | 'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256';

/**
 * DTLS fingerprint
 */
export interface DTLSFingerprint {
  /** Hash algorithm */
  algorithm: 'sha256' | 'sha384' | 'sha512';
  
  /** Fingerprint value (hex string) */
  value: string;
}

/**
 * DTLS role
 */
export type DTLSRole = 'client' | 'server';

/**
 * DTLS connection state
 */
export type DTLSState = 'closed' | 'connecting' | 'connected' | 'failed';

/**
 * DTLS session parameters
 */
export interface DTLSSessionParams {
  /** Local fingerprint */
  localFingerprint: DTLSFingerprint;
  
  /** Remote fingerprint */
  remoteFingerprint: DTLSFingerprint;
  
  /** DTLS role */
  role: DTLSRole;
  
  /** Selected cipher suite */
  cipherSuite?: DTLSCipherSuite;
  
  /** Connection state */
  state: DTLSState;
}

// ============================================================================
// RANDOM TYPES
// ============================================================================

/**
 * Random bytes options
 */
export interface RandomOptions {
  /** Number of bytes */
  length: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Base crypto error
 */
export class CryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoError';
  }
}

/**
 * Key generation error
 */
export class KeyGenerationError extends CryptoError {
  constructor(message: string) {
    super(message);
    this.name = 'KeyGenerationError';
  }
}

/**
 * Encryption error
 */
export class EncryptionError extends CryptoError {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}

/**
 * Decryption error
 */
export class DecryptionError extends CryptoError {
  constructor(message: string) {
    super(message);
    this.name = 'DecryptionError';
  }
}

/**
 * Signature error
 */
export class SignatureError extends CryptoError {
  constructor(message: string) {
    super(message);
    this.name = 'SignatureError';
  }
}

/**
 * Verification error
 */
export class VerificationError extends CryptoError {
  constructor(message: string) {
    super(message);
    this.name = 'VerificationError';
  }
}

/**
 * SRTP error
 */
export class SRTPError extends CryptoError {
  constructor(message: string) {
    super(message);
    this.name = 'SRTPError';
  }
}

/**
 * DTLS error
 */
export class DTLError extends CryptoError {
  constructor(message: string) {
    super(message);
    this.name = 'DTLError';
  }
}