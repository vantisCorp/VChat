---
title: Frequently Asked Questions
---

# Frequently Asked Questions

Common questions about V-COMM, its features, security, and usage.

## General

### What is V-COMM?

V-COMM is a next-generation secure communication platform built with Zero Trust architecture and Post-Quantum Cryptography. It provides end-to-end encrypted messaging, voice/video calling, file sharing, and advanced collaboration tools.

### Is V-COMM open source?

Yes! V-COMM is open source under the AGPL-3.0 license. We also offer commercial licenses for enterprises.

### Is V-COMM free to use?

V-COMM is free for individuals and non-commercial use. Commercial licenses are available for organizations.

### Can I self-host V-COMM?

Yes! V-COMM is designed to be self-hostable. See the [Deployment Guide](deployment/docker.md).

## Security

### Is V-COMM really secure?

Yes. V-COMM implements enterprise-grade security:
- End-to-end encryption for all messages
- Post-Quantum Cryptography (Kyber, Dilithium)
- Zero Trust Architecture
- OWASP ASVS Level 3 compliance

### What is Post-Quantum Cryptography?

Post-Quantum Cryptography (PQC) is cryptographic algorithms resistant to attacks from quantum computers. V-COMM uses NIST-standardized algorithms like Kyber and Dilithium.

### Does V-COMM have backdoors?

No. V-COMM has no backdoors, and we cannot access your encrypted data. All encryption happens client-side.

### Can V-COMM read my messages?

No. All messages are encrypted end-to-end using the Signal Protocol (1:1) or MLS (groups).

### What is Duress PIN?

Duress PIN protects users under coercion. If you enter your duress PIN, V-COMM will:
- Appear to work normally
- Delete all sensitive data
- Revoke all encryption keys
- Send a distress signal to trusted contacts

### Does V-COMM work offline?

Yes! V-COMM supports mesh networking (V-MESH) for offline communication.

### How is V-COMM different from other encrypted messaging apps?

| Feature | V-COMM | Signal | Telegram |
|---------|--------|--------|----------|
| End-to-end encryption | ✅ All messages | ✅ All messages | ⚠️ Optional |
| Post-Quantum Crypto | ✅ Yes | ❌ No | ❌ No |
| Self-hostable | ✅ Yes | ❌ No | ✅ Limited |
| Mesh networking | ✅ Yes | ❌ No | ❌ No |
| Zero Trust | ✅ Yes | ⚠️ Partial | ❌ No |

## Authentication

### Do I need a password?

No! V-COMM supports passwordless authentication using FIDO2/WebAuthn.

### What is FIDO2/WebAuthn?

FIDO2/WebAuthn is a standard for passwordless authentication using public key cryptography.

### What happens if I lose my security key?

Set up multiple authenticators when you register. You can also use recovery codes.

## Features

### What are V-CHANNELS?

V-CHANNELS are different types of communication channels:
- **TXT**: Text channels
- **ROOMS**: Voice/video rooms
- **FEEDBACK**: Feedback channels
- **FORUMS**: Discussion forums

### What is V-DRIVE?

V-DRIVE is a peer-to-peer encrypted storage system using IPFS.

### Does V-COMM support voice and video calls?

Yes! V-COMM supports 1:1 and group calls with AV1 4K streaming and Opus audio.

### Can I share files on V-COMM?

Yes. Files are encrypted end-to-end and can be shared via V-DRIVE.

## Networking

### What is V-MESH?

V-MESH is V-COMM's mesh networking feature for offline communication between nearby devices.

### How does V-MESH work?

V-MESH uses WebRTC and a decentralized routing protocol. Messages are stored and forwarded automatically.

## Data & Privacy

### Does V-COMM collect my data?

V-COMM collects minimal data. We do NOT collect message content, contact lists, or voice/video recordings.

### Where is my data stored?

Your data is stored encrypted locally and on servers. Servers only store encrypted data they cannot decrypt.

### Can I delete my data?

Yes. You can delete your account and all data at any time.

### Is V-COMM GDPR compliant?

Yes. V-COMM is fully GDPR compliant.

## Business & Enterprise

### Do you offer commercial licenses?

Yes. Commercial licenses are available for organizations. Contact sales@vcomm.app.

### Can I integrate V-COMM with my systems?

Yes. V-COMM provides REST, GraphQL, and WebSocket APIs, plus SDKs for multiple languages.

### Do you offer support?

Yes. Support tiers include Community (free), Standard, Premium, and Enterprise.

## Development

### How do I contribute?

See the [Contributing Guide](development/contributing.md).

### What's the tech stack?

- **Backend**: Rust with Ferrocene compiler
- **Frontend**: TypeScript with Next.js
- **Cryptography**: Signal Protocol, MLS, Kyber, Dilithium
- **Database**: PostgreSQL, Redis
- **Infrastructure**: Kubernetes, Terraform

### How do I report bugs?

Use our [Issue Templates](https://github.com/vantisCorp/VChat/issues).

### How do I report security vulnerabilities?

Email security@vcomm.app with details.

### Is there a bug bounty program?

Yes! V-COMM offers bug bounties up to $10,000 for critical vulnerabilities.

## Deployment

### Can I self-host V-COMM?

Yes. V-COMM is fully self-hostable. See the [Deployment Guide](deployment/docker.md).

### What are the system requirements?

**Minimum**: 4 cores CPU, 8 GB RAM, 100 GB SSD
**Recommended**: 8+ cores CPU, 16+ GB RAM, 500+ GB NVMe

### What cloud providers do you support?

AWS, Google Cloud, Azure, DigitalOcean, Linode, and any Kubernetes cluster.

## Support

### Where can I get help?

- **Documentation**: Browse this site
- **Discord**: Join our community server
- **GitHub**: Create an issue
- **Email**: support@vcomm.app

Still have questions? [Contact us](mailto:support@vcomm.app).