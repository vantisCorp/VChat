# @vcomm/crypto

Cryptographic utilities for V-COMM - a secure voice communication platform. Provides comprehensive cryptographic functionality for end-to-end encryption, secure media transport, and WebRTC security.

## Installation

```bash
npm install @vcomm/crypto
```

## Features

- **Key Generation**: Ed25519, X25519, secp256k1, RSA key pairs
- **Symmetric Encryption**: AES-256-GCM, AES-128-GCM, AES-CBC, ChaCha20-Poly1305
- **Asymmetric Encryption**: ECIES, RSA-OAEP
- **Digital Signatures**: Ed25519, ECDSA-secp256k1, RSA-PSS
- **Hash Functions**: SHA-256/384/512, SHA3, Blake2, HMAC
- **Key Derivation**: HKDF, PBKDF2, Scrypt
- **SRTP**: Secure Real-time Transport Protocol for media
- **DTLS**: Datagram Transport Layer Security utilities for WebRTC
- **Random**: Cryptographically secure random number generation

## Quick Start

### Key Generation

```typescript
import { generateEd25519KeyPair, generateX25519KeyPair } from '@vcomm/crypto';

// Generate Ed25519 key pair for signatures
const signingKeys = await generateEd25519KeyPair();

// Generate X25519 key pair for key exchange
const exchangeKeys = await generateX25519KeyPair();
```

### Symmetric Encryption

```typescript
import { generateKey, encrypt, decrypt } from '@vcomm/crypto';

// Generate a key
const key = generateKey('aes-256-gcm');

// Encrypt data
const result = encrypt('Hello, World!', key);

console.log(result);
// {
//   ciphertext: Uint8Array [...],
//   iv: Uint8Array [...],
//   tag: Uint8Array [...],
//   algorithm: 'aes-256-gcm'
// }

// Decrypt data
const decrypted = decrypt(result, key);
console.log(new TextDecoder().decode(decrypted)); // "Hello, World!"
```

### Digital Signatures

```typescript
import { generateEd25519KeyPair, sign, verify } from '@vcomm/crypto';

const keyPair = await generateEd25519KeyPair();
const message = 'Important message';

// Sign
const signature = await sign(message, keyPair.privateKey);

// Verify
const isValid = await verify(message, signature, keyPair.publicKey);
console.log(isValid); // true
```

### Key Exchange and ECIES

```typescript
import { 
  generateSecp256k1KeyPair, 
  deriveSharedSecret,
  encryptForRecipient,
  decryptForRecipient
} from '@vcomm/crypto';

// Alice and Bob generate key pairs
const aliceKeys = await generateSecp256k1KeyPair();
const bobKeys = await generateSecp256k1KeyPair();

// Alice encrypts message for Bob
const encrypted = await encryptForRecipient('Secret message', bobKeys.publicKey);

// Bob decrypts the message
const decrypted = await decryptForRecipient(encrypted, bobKeys.privateKey);
```

### Key Derivation

```typescript
import { hkdf, pbkdf2, scrypt, deriveSymmetricKey } from '@vcomm/crypto';

// HKDF
const derivedKey = await hkdf(sharedSecret, {
  hash: 'sha256',
  salt: new Uint8Array(16),
  info: new TextEncoder().encode('encryption key'),
  length: 32,
});

// PBKDF2 for password hashing
const passwordKey = await pbkdf2('user-password', {
  hash: 'sha256',
  salt: saltBytes,
  iterations: 100000,
  length: 32,
});

// Scrypt for memory-hard key derivation
const scryptKey = await scrypt('password', {
  salt: saltBytes,
  cost: 16384,
  blockSize: 8,
  parallelization: 1,
  length: 32,
});
```

### Password Hashing

```typescript
import { hashPassword, verifyPassword } from '@vcomm/crypto';

// Hash a password
const { hash, salt, iterations } = await hashPassword('user-password', {
  iterations: 100000,
});

// Verify password
const isValid = await verifyPassword('user-password', hash, salt, iterations);
```

### SRTP for Secure Media

```typescript
import { SRTPSession, generateSRTPKey } from '@vcomm/crypto';

// Generate SRTP keying material
const srtpKey = generateSRTPKey('AES_CM_128_HMAC_SHA1_80');

// Create SRTP session
const session = new SRTPSession(
  srtpKey.masterKey,
  srtpKey.masterSalt,
  srtpKey.cryptoSuite
);

// Protect RTP packet
const rtpPacket = new Uint8Array([...]); // Your RTP packet
const srtpPacket = session.protect(rtpPacket);

// Unprotect SRTP packet
const decryptedRtp = session.unprotect(srtpPacket);
```

### DTLS Fingerprinting

```typescript
import { DTLSFingerprintGenerator, createDTLSSession } from '@vcomm/crypto';

// Generate fingerprint from certificate
const certificate = '...'; // PEM encoded certificate
const fingerprint = DTLSFingerprintGenerator.sha256(certificate);

console.log(fingerprint);
// { algorithm: 'sha256', value: 'AA:BB:CC:DD:...' }

// Create DTLS session
const dtlsSession = createDTLSSession();
dtlsSession.initialize(fingerprint, 'server');

// Set remote fingerprint (from SDP)
dtlsSession.setRemoteFingerprint({
  algorithm: 'sha256',
  value: '11:22:33:44:...',
});
```

### Hash Functions

```typescript
import { sha256, sha512, hmac, verifyHmac } from '@vcomm/crypto';

// SHA-256
const hash = sha256('data to hash');

// HMAC
const mac = hmac('data', secretKey, 'sha256');

// Verify HMAC
const isValid = verifyHmac('data', secretKey, mac, 'sha256');
```

### Random Generation

```typescript
import { 
  randomBytes, 
  randomUUID, 
  randomString,
  generateSalt,
  generateIV 
} from '@vcomm/crypto';

// Random bytes
const bytes = randomBytes(32);

// UUID
const uuid = randomUUID();

// Random string
const token = randomString(32);

// Salt and IV
const salt = generateSalt(16);
const iv = generateIV(12);
```

## API Reference

### Key Generation

```typescript
// Algorithms
type KeyAlgorithm = 'ed25519' | 'x25519' | 'secp256k1' | 'rsa';

// Functions
generateEd25519KeyPair(options?: Partial<KeyGenOptions>): Promise<KeyPair>
generateX25519KeyPair(options?: Partial<KeyGenOptions>): Promise<KeyPair>
generateSecp256k1KeyPair(options?: Partial<KeyGenOptions>): Promise<KeyPair>
generateRSAKeyPair(options?: Partial<KeyGenOptions>): Promise<KeyPair>
generateKeyPair(options: KeyGenOptions): Promise<KeyPair>
```

### Symmetric Encryption

```typescript
// Algorithms
type SymmetricAlgorithm = 'aes-256-gcm' | 'aes-256-cbc' | 'aes-128-gcm' | 'aes-128-cbc' | 'chacha20-poly1305';

// Functions
generateKey(algorithm?: SymmetricAlgorithm): SymmetricKey
createKey(raw: Uint8Array, algorithm?: SymmetricAlgorithm): SymmetricKey
encrypt(plaintext: Uint8Array | string, key: SymmetricKey, options?: EncryptOptions): EncryptionResult
decrypt(result: EncryptionResult, key: SymmetricKey, options?: DecryptOptions): Uint8Array
```

### Digital Signatures

```typescript
// Algorithms
type SignatureAlgorithm = 'ed25519' | 'ecdsa-secp256k1' | 'rsa-pss' | 'rsa-pkcs1v15';

// Functions
sign(data: Uint8Array | string, privateKey: PrivateKey, options?: SignOptions): Promise<Signature>
verify(data: Uint8Array | string, signature: Signature, publicKey: PublicKey): Promise<boolean>
```

### Key Derivation

```typescript
hkdf(inputKeyMaterial: Uint8Array, options: HKDFOptions): Promise<Uint8Array>
pbkdf2(password: string | Uint8Array, options: PBKDF2Options): Promise<Uint8Array>
scrypt(password: string | Uint8Array, options: ScryptOptions): Promise<Uint8Array>
deriveSharedSecret(privateKey: PrivateKey, publicKey: PublicKey): Promise<Uint8Array>
deriveSymmetricKey(sharedSecret: Uint8Array, context?: Uint8Array): Promise<SymmetricKey>
```

### SRTP

```typescript
class SRTPSession {
  constructor(masterKey: Uint8Array, masterSalt: Uint8Array, cryptoSuite?: SRTPCryptoSuite)
  protect(rtpPacket: Uint8Array): Uint8Array
  unprotect(srtpPacket: Uint8Array): Uint8Array
}

generateSRTPKey(cryptoSuite?: SRTPCryptoSuite): SRTPKey
createSRTPSession(masterKey: Uint8Array, masterSalt: Uint8Array, cryptoSuite?: SRTPCryptoSuite): SRTPSession
```

### DTLS

```typescript
class DTLSFingerprintGenerator {
  static sha256(certificate: Uint8Array | string): DTLSFingerprint
  static sha384(certificate: Uint8Array | string): DTLSFingerprint
  static verify(certificate: Uint8Array | string, fingerprint: DTLSFingerprint): boolean
}

class DTLSSession {
  initialize(localFingerprint: DTLSFingerprint, role?: DTLSRole): void
  setRemoteFingerprint(fingerprint: DTLSFingerprint): void
  getState(): DTLSState
  getParams(): DTLSSessionParams
  processIncomingPacket(packet: Uint8Array): Uint8Array | null
  createOutgoingPacket(data: Uint8Array, contentType?: number): Uint8Array
  close(): void
}
```

### Hash Functions

```typescript
hash(data: Uint8Array | string, algorithm?: HashAlgorithm): Uint8Array
hashHex(data: Uint8Array | string, algorithm?: HashAlgorithm): string
hmac(data: Uint8Array | string, key: Uint8Array | string, algorithm?: HashAlgorithm): Uint8Array
verifyHmac(data: Uint8Array | string, key: Uint8Array | string, expectedHmac: Uint8Array, algorithm?: HashAlgorithm): boolean

// Convenience functions
sha256(data: Uint8Array | string): Uint8Array
sha384(data: Uint8Array | string): Uint8Array
sha512(data: Uint8Array | string): Uint8Array
```

### Random

```typescript
randomBytes(length: number): Uint8Array
randomInt(min: number, max: number): number
randomUUID(): string
randomHex(length: number): string
randomBase64(length: number): string
randomString(length: number, charset?: string): string
randomAlphanumeric(length: number): string
randomNumeric(length: number): string
generateSalt(length?: number): Uint8Array
generateIV(length?: number): Uint8Array
generateNonce(length?: number): Uint8Array
```

## Security Considerations

1. **Key Storage**: Never store private keys in plaintext. Use secure key storage solutions.
2. **Key Rotation**: Regularly rotate encryption keys for long-lived sessions.
3. **Forward Secrecy**: Use ECDH key exchange for forward secrecy in communications.
4. **Password Hashing**: Always use high iteration counts (100,000+) for PBKDF2.
5. **IV/Nonce**: Never reuse IVs/nonces with the same key.
6. **Constant-Time**: All comparisons use constant-time algorithms to prevent timing attacks.

## Dependencies

- `@noble/ed25519` - Ed25519 signatures
- `@noble/secp256k1` - secp256k1 elliptic curve
- `tweetnacl` - Additional cryptographic primitives

## License

MIT