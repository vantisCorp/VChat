---
sidebar_position: 3
title: Cryptography
description: VComm's cryptographic foundations and post-quantum security
---

# Cryptography

VComm uses state-of-the-art cryptographic primitives to ensure end-to-end
security for all communications.

## Cryptographic Primitives

- **Symmetric Encryption**: AES-256-GCM for data encryption
- **Asymmetric Encryption**: X25519 for key exchange, Ed25519 for signatures
- **Hashing**: SHA-256, BLAKE3 for integrity verification
- **Key Derivation**: HKDF for deriving session keys

## Post-Quantum Cryptography

VComm is preparing for the post-quantum era with support for NIST-approved PQC
algorithms. See the [PQC documentation](/docs/security/pqc) for details.

## Key Management

Details on VComm's key management infrastructure are coming soon.
