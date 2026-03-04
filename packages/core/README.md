# V-COMM Core Library

The core Rust library for V-COMM secure communication platform.

## Overview

V-COMM Core provides the fundamental cryptographic primitives, networking protocols, and security features for the V-COMM platform. It's built with Zero Trust architecture and military-grade security standards.

## Features

- 🔒 **End-to-End Encryption**: Signal Protocol for 1:1, MLS for groups
- 🦾 **Post-Quantum Cryptography**: Resistant to quantum computer attacks
- 🌐 **WebRTC**: Real-time audio/video communication
- 🔐 **FIDO2/WebAuthn**: Passwordless authentication
- 👻 **Ghost Mode**: Ephemeral messaging
- 🕸️ **Mesh Networking**: Offline P2P communication
- 🛡️ **Zero Trust**: Every request authenticated and authorized

## Architecture

### Modules

- **`client`**: Main V-COMM client interface
- **`config`**: Configuration management
- **`crypto`**: Cryptographic primitives
- **`error`**: Comprehensive error handling
- **`identity`**: User identity management
- **`messaging`**: Message handling
- **`networking`**: Network connections
- **`protocols`**: Protocol implementations (Signal, MLS, PQC)
- **`security`**: Authentication and authorization
- **`storage`**: Encrypted storage
- **`types`**: Core data types
- **`utils`**: Utility functions

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
vcomm-core = { version = "0.1.0", git = "https://github.com/vantisCorp/VChat" }
```

## Usage

### Basic Example

```rust
use vcomm_core::{VCommClient, Config};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config::builder()
        .server_url("wss://secure.vcomm.dev")
        .enable_mls(true)
        .enable_pqc(true)
        .build()?;

    let client = VCommClient::new(config).await?;
    client.connect().await?;

    Ok(())
}
```

### Cryptographic Operations

```rust
use vcomm_core::crypto::Crypto;

// Generate random key
let key = Crypto::generate_key();

// Encrypt data
let nonce = Crypto::random_bytes(12).try_into().unwrap();
let ciphertext = Crypto::encrypt(b"Hello, V-COMM!", &key, &nonce)?;

// Decrypt data
let plaintext = Crypto::decrypt(&ciphertext, &key, &nonce)?;
```

## Security Features

### Zero Trust Architecture
- Every request authenticated and authorized
- Micro-segmentation of services
- Continuous verification and monitoring

### Post-Quantum Cryptography
- Kyber (KEM) - NIST FIPS 203
- Dilithium (Signature) - NIST FIPS 204

### Hardware Security
- Keys stored in secure enclaves
- FIDO2/WebAuthn authentication
- Duress PIN for emergencies

## Compliance

- ✅ FIPS 140-3
- ✅ FedRAMP Authorized
- ✅ OWASP ASVS Level 3
- ✅ HIPAA Compliant
- ✅ GDPR Compliant

## Building

```bash
# Build all features
cargo build --all-features

# Build specific features
cargo build --features signal,mls,pqc

# Build for WASM
cargo build --features wasm --target wasm32-unknown-unknown
```

## Testing

```bash
# Run all tests
cargo test

# Run with coverage
cargo tarpaulin --out Html

# Run benchmarks
cargo bench
```

## Documentation

```bash
# Generate documentation
cargo doc --all-features --open
```

## License

AGPL-3.0 for open-source version
Commercial license available for enterprise use

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Security

For security vulnerabilities, please email security@vcomm.dev

## Support

- Documentation: https://vcomm.dev/docs
- Issues: https://github.com/vantisCorp/VChat/issues
- Discord: https://discord.gg/vcomm