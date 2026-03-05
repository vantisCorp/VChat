---
slug: /
title: V-COMM Documentation
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Welcome to V-COMM Documentation

V-COMM is a next-generation secure communication platform built on Zero Trust architecture and Post-Quantum Cryptography. This documentation will help you get started with V-COMM, understand its architecture, and develop on top of it.

## Quick Links

- [Installation Guide](getting-started/installation.md) - Get V-COMM up and running
- [API Reference](api/index.md) - Explore our REST, WebSocket, and GraphQL APIs
- [Architecture Overview](architecture/overview.md) - Understand how V-COMM works
- [Security](security/overview.md) - Learn about our security features

## Key Features

### 🔒 Uncompromising Security

- **Zero Trust Architecture**: Every interaction is verified and encrypted
- **Post-Quantum Cryptography**: Future-proof security using Kyber and Dilithium
- **End-to-End Encryption**: All messages encrypted client-side
- **FIDO2/WebAuthn**: Passwordless authentication

### 🚀 Advanced Communication

- **V-CHANNELS**: TXT, ROOMS, FEEDBACK channels
- **V-SPACES**: Dynamic guilds and communities
- **V-MESH**: Offline mesh networking
- **V-DRIVE**: P2P encrypted storage

### 🌐 Decentralized & Censorship-Resistant

- Self-hostable infrastructure
- Mesh networking for offline communication
- IPFS integration for decentralized backups
- No single point of failure

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 20.x or later
- **pnpm** 8.x or later
- **Rust** 1.75+ (stable or nightly)
- **Docker** 24.x or later

### Quick Install

```bash
# Clone the repository
git clone https://github.com/vantisCorp/VChat.git
cd VChat

# Run setup
make setup

# Start development servers
make dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend server on `http://localhost:3000`
- Documentation server on `http://localhost:3002`

### Docker Installation

```bash
docker-compose up -d
```

## Architecture Overview

V-COMM is built as a monorepo using Turborepo with Feature-Sliced Design (FSD):

```
VChat/
├── packages/
│   ├── core/          # Rust backend (Ferrocene compiler)
│   ├── frontend/      # TypeScript frontend (Next.js)
│   ├── crypto-wasm/   # WASM crypto bindings
│   ├── mobile/        # React Native mobile app
│   └── desktop/       # Tauri desktop app
├── infra/             # Infrastructure as Code
├── docs/              # Documentation
└── tools/             # Development tools
```

## Security Highlights

### Post-Quantum Cryptography

V-COMM uses NIST-standardized PQC algorithms:

- **Kyber1024** - Key Encapsulation Mechanism (KEM)
- **Dilithium5** - Digital Signatures
- **SPHINCS+** - Hash-based Signatures

### Compliance

- ✅ OWASP ASVS Level 3
- ✅ FIPS 140-3
- ✅ FedRAMP Ready
- ✅ HIPAA Compliant
- ✅ GDPR Compliant

### Bug Bounty Program

We offer bounties for security vulnerabilities:

| Severity | Reward |
|----------|--------|
| Critical | $10,000 |
| High | $5,000 |
| Medium | $1,000 |
| Low | $250 |

See [SECURITY.md](https://github.com/vantisCorp/VChat/security) for details.

## Documentation Structure

This documentation is organized into several main sections:

### Getting Started
- Installation guide
- Quick start tutorial
- System requirements

### Architecture
- System overview
- Zero Trust architecture
- Cryptography implementation
- Network protocols

### Security
- Security overview
- Post-Quantum Cryptography
- Authentication & authorization
- Compliance certifications

### Features
- V-CHANNELS
- V-SPACES
- V-MESH
- V-DRIVE
- V-BOTS

### API Reference
- REST API
- WebSocket API
- GraphQL API
- SDK examples

### Deployment
- Docker deployment
- Kubernetes deployment
- Terraform deployment
- Production checklist

### Development
- Development setup
- Coding standards
- Testing guidelines
- Contributing guidelines

## Community & Support

### Get Help

- 📖 [Documentation](/)
- 💬 [Discord](https://discord.gg/vcomm)
- 🐛 [GitHub Issues](https://github.com/vantisCorp/VChat/issues)
- 📧 [Email Support](mailto:support@vcomm.app)

### Contribute

We welcome contributions! See our [Contributing Guide](development/contributing.md) for details.

### License

V-COMM is dual-licensed:
- **AGPL-3.0** for open source use
- **Commercial License** available for enterprise needs

See [LICENSE](https://github.com/vantisCorp/VChat/blob/main/LICENSE) for details.

## Next Steps

1. Read the [Installation Guide](getting-started/installation.md)
2. Explore the [API Reference](api/index.md)
3. Check the [Security](security/overview.md) documentation
4. Join our [Discord community](https://discord.gg/vcomm)

---

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-primary">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
</svg>

Built with ❤️ by [VantisCorp](https://github.com/vantisCorp)