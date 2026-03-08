# Post-Quantum Cryptography

## Overview

V-COMM implements NIST-approved Post-Quantum Cryptography (PQC) algorithms to ensure security against quantum computer attacks.

## Supported Algorithms

### Kyber (Key Encapsulation)
- **Kyber-512**: For constrained devices
- **Kyber-768**: Recommended for most applications
- **Kyber-1024**: Maximum security level

### Dilithium (Digital Signatures)
- **Dilithium2**: Fast verification
- **Dilithium3**: Balanced performance
- **Dilithium5**: Maximum security

## Implementation

```typescript
import { Kyber1024, Dilithium5 } from '@vcomm/crypto';

// Key encapsulation
const kyber = new Kyber1024();
const { ciphertext, sharedSecret } = kyber.encapsulate(publicKey);

// Digital signature
const dilithium = new Dilithium5();
const signature = dilithium.sign(message, privateKey);
```

## Security Considerations

1. **Hybrid Mode**: Always use hybrid encryption (classical + PQC)
2. **Key Rotation**: Rotate keys regularly
3. **Forward Secrecy**: Implement key ratcheting

## References

- [NIST PQC Standards](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [Kyber Specification](https://pq-crystals.org/kyber/)
- [Dilithium Specification](https://pq-crystals.org/dilithium/)