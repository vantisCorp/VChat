# Frequently Asked Questions

Common questions about V-COMM, its features, security, and usage.

## 🚀 General

### What is V-COMM?

V-COMM is a next-generation secure communication platform built with Zero Trust architecture and Post-Quantum Cryptography. It provides end-to-end encrypted messaging, voice/video calling, file sharing, and advanced collaboration tools.

### Is V-COMM open source?

Yes! V-COMM is open source under the AGPL-3.0 license. We also offer commercial licenses for enterprises that need additional features or support.

### Is V-COMM free to use?

V-COMM is free for individuals and non-commercial use. Commercial licenses are available for organizations that need enterprise features, priority support, or custom deployments.

### What platforms does V-COMM support?

V-COMM supports:
- Web browsers (Chrome, Firefox, Safari, Edge)
- Desktop (Windows, macOS, Linux)
- Mobile (iOS, Android)
- CLI tools for power users

### Can I self-host V-COMM?

Yes! V-COMM is designed to be self-hostable. You can deploy it on your own servers using Docker, Kubernetes, or Terraform. See the [Deployment Guide](Deployment-Guide.md) for details.

## 🔒 Security

### Is V-COMM really secure?

Yes. V-COMM implements enterprise-grade security:
- End-to-end encryption for all messages
- Post-Quantum Cryptography (Kyber, Dilithium)
- Zero Trust Architecture
- OWASP ASVS Level 3 compliance
- FIPS 140-3 validated cryptography
- Regular security audits

### What is Post-Quantum Cryptography?

Post-Quantum Cryptography (PQC) is cryptographic algorithms that are resistant to attacks from quantum computers. V-COMM uses NIST-standardized algorithms like Kyber (for key exchange) and Dilithium (for digital signatures).

### Does V-COMM have backdoors?

No. V-COMM has no backdoors, and we cannot access your encrypted data. All encryption happens client-side, and servers only store encrypted blobs that they cannot decrypt.

### Can V-COMM read my messages?

No. All messages are encrypted end-to-end using the Signal Protocol (for 1:1 chats) or MLS (for groups). The encryption keys never leave your device.

### What happens if my device is compromised?

If your device is compromised, an attacker could access your data while it's stored locally. However:
- They cannot decrypt old messages without your keys
- They cannot read future messages sent to other devices
- You can revoke all sessions and change your encryption keys
- Forward secrecy protects past communications

### Does V-COMM protect against quantum computers?

Yes. V-COMM uses Post-Quantum Cryptography alongside classical encryption. Even if a powerful quantum computer is developed, your communications remain secure.

### What is Duress PIN?

Duress PIN is a security feature that protects users under coercion. If you enter your duress PIN instead of your regular PIN, V-COMM will:
- Appear to work normally
- Delete all sensitive data
- Revoke all encryption keys
- Lock all your devices
- Send a distress signal to trusted contacts

### Does V-COMM work offline?

Yes! V-COMM supports mesh networking (V-MESH) that allows offline communication between nearby devices. Messages are stored and forwarded when connectivity is restored.

### How is V-COMM different from other encrypted messaging apps?

| Feature | V-COMM | Signal | Telegram |
|---------|--------|--------|----------|
| End-to-end encryption | ✅ All messages | ✅ All messages | ⚠️ Optional |
| Post-Quantum Crypto | ✅ Yes | ❌ No | ❌ No |
| Self-hostable | ✅ Yes | ❌ No | ✅ Limited |
| Mesh networking | ✅ Yes | ❌ No | ❌ No |
| Zero Trust | ✅ Yes | ⚠️ Partial | ❌ No |
| Open source | ✅ Yes | ✅ Yes | ⚠️ Server only |

## 🔐 Authentication

### Do I need a password?

No! V-COMM supports passwordless authentication using FIDO2/WebAuthn. You can use hardware security keys (YubiKey), biometrics (Touch ID, Windows Hello), or mobile authenticators.

### Can I use a password if I want?

Yes, you can use a password as a fallback option. However, we recommend using FIDO2 for better security.

### What is FIDO2/WebAuthn?

FIDO2/WebAuthn is a standard for passwordless authentication. It uses public key cryptography instead of passwords, making it more secure and phishing-resistant.

### What happens if I lose my security key?

You should set up multiple authenticators when you register. If you lose your primary authenticator, you can use a backup authenticator or recovery codes to regain access.

### How do I set up Multi-Factor Authentication (MFA)?

V-COMM supports multiple MFA methods:
1. FIDO2/WebAuthn (recommended)
2. TOTP (Google Authenticator, Authy, etc.)
3. SMS (fallback)
4. Recovery codes (offline backup)

You can enable these in your security settings.

## 📱 Features

### What are V-CHANNELS?

V-CHANNELS are different types of communication channels:
- **TXT**: Text channels for real-time messaging
- **ROOMS**: Voice/video rooms for group calls
- **FEEDBACK**: Feedback channels for user input
- **FORUMS**: Discussion forums with cryptographic validation

### What are V-SPACES?

V-SPACES are dynamic guilds where users can create communities, organize channels, and manage members. They're similar to Discord servers but with enhanced privacy and security.

### What is V-DRIVE?

V-DRIVE is a peer-to-peer encrypted storage system. Files are encrypted on your device and stored across the V-COMM network using IPFS, making them resistant to censorship and takedowns.

### What is V-MIGRATOR?

V-MIGRATOR is a tool that helps you migrate from other platforms (Discord, Slack, etc.) to V-COMM while preserving your data and encryption.

### What is V-SHIELD?

V-SHIELD is V-COMM's anti-deepfake technology. It uses AI and biometric analysis to detect and prevent manipulated media from being shared.

### Does V-COMM support voice and video calls?

Yes! V-COMM supports:
- 1:1 voice and video calls
- Group calls with up to 100 participants
- Screen sharing
- AV1 4K streaming
- Opus 256kbps audio codec
- Gaming QoS prioritization

### Can I share files on V-COMM?

Yes. You can share files of any size through:
- Direct message attachments
- V-DRIVE (P2P storage)
- Encrypted file sharing links

All files are encrypted end-to-end.

### Does V-COMM support bots?

Yes! V-COMM has V-BOTS, an AI agent platform. You can create custom bots using our SDK and WASM sandbox.

## 🌐 Networking

### What is V-MESH?

V-MESH is V-COMM's mesh networking feature. It allows devices to communicate directly with each other without internet connectivity. Messages are stored and forwarded automatically.

### How does V-MESH work?

V-MESH uses WebRTC and a decentralized routing protocol. When devices are nearby, they form a mesh network and can exchange messages directly. Messages hop through the mesh until they reach their destination.

### Can I use V-COMM without internet?

Yes, if you're in range of other V-COMM users with V-MESH enabled, you can communicate offline. You can also use V-MESH for local networks.

### What protocols does V-COMM use?

V-COMM uses:
- WebSocket: Real-time messaging
- HTTP/3 (QUIC): API communication
- WebRTC: Voice/video/screen share
- TLS 1.3: Transport encryption

## 💾 Data & Privacy

### Does V-COMM collect my data?

V-COMM collects minimal data:
- Account information (username, display name)
- Authentication data (public keys, tokens)
- Usage statistics (optional, can be disabled)

We do NOT collect:
- Message content
- Contact lists
- Location data
- Voice/video recordings
- File contents

### Where is my data stored?

Your data is stored:
- **Encrypted locally**: On your devices
- **Encrypted on servers**: In PostgreSQL and Redis (encrypted)
- **Decentralized**: In IPFS for backups (encrypted)

Servers only store encrypted data that they cannot decrypt.

### Can I delete my data?

Yes. You can delete your account and all associated data at any time. We provide full data export functionality before deletion.

### Is V-COMM GDPR compliant?

Yes. V-COMM is fully GDPR compliant:
- Data minimization
- Right to erasure
- Data portability
- Explicit consent
- Breach notification within 72 hours
- Data protection by design

### Is V-COMM HIPAA compliant?

Yes. V-COMM implements HIPAA safeguards and can sign Business Associate Agreements (BAAs) for healthcare organizations.

## 🏢 Business & Enterprise

### Do you offer commercial licenses?

Yes. Commercial licenses are available for organizations that need:
- Priority support
- Custom deployments
- SLA guarantees
- White-label options
- Enterprise integrations
- Custom features

Contact us at sales@vcomm.app for pricing.

### Can I integrate V-COMM with my existing systems?

Yes. V-COMM provides:
- REST API
- GraphQL API
- WebSocket API
- SDKs for JavaScript, TypeScript, Rust, Python, Go
- Webhooks for integrations
- Custom bot development

### Do you offer support?

Yes. We offer different support tiers:
- **Community**: Free support via Discord and GitHub
- **Standard**: Email support (24-hour response)
- **Premium**: Priority support (4-hour response)
- **Enterprise**: 24/7 dedicated support

### Can I get an SLA?

Yes. Commercial licenses include SLAs with:
- 99.9% uptime guarantee
- Response time commitments
- Credit for downtime
- Disaster recovery procedures

## 🛠️ Development

### How do I contribute?

We welcome contributions! See the [Contributing Guide](Contributing-Guide.md) for details.

### What's the tech stack?

- **Backend**: Rust with Ferrocene compiler
- **Frontend**: TypeScript with Next.js
- **Cryptography**: Signal Protocol, MLS, Kyber, Dilithium
- **Database**: PostgreSQL, Redis
- **Infrastructure**: Kubernetes, Terraform
- **CI/CD**: GitHub Actions

### Can I build apps on V-COMM?

Yes! V-COMM provides:
- V-BOTS SDK for building AI agents
- WASM sandbox for custom functionality
- API access for third-party integrations
- Webhooks for event handling

### How do I report bugs?

Please report bugs using our [issue templates](../.github/ISSUE_TEMPLATE/):
- [Bug Report](../.github/ISSUE_TEMPLATE/BUG_REPORT.yml)
- [Feature Request](../.github/ISSUE_TEMPLATE/FEATURE_REQUEST.yml)

### How do I report security vulnerabilities?

Security vulnerabilities should be reported responsibly via [SECURITY.md](../SECURITY.md). Please email security@vcomm.app with details.

### Is there a bug bounty program?

Yes! V-COMM offers bug bounties:
- **Critical**: $10,000
- **High**: $5,000
- **Medium**: $1,000
- **Low**: $250

See [SECURITY.md](../SECURITY.md) for details.

## 📦 Deployment

### Can I self-host V-COMM?

Yes. V-COMM is fully self-hostable. See the [Deployment Guide](Deployment-Guide.md) for instructions.

### What are the system requirements?

**Minimum**:
- CPU: 4 cores
- RAM: 8 GB
- Storage: 100 GB SSD
- Network: 100 Mbps

**Recommended for 1000 users**:
- CPU: 8 cores
- RAM: 16 GB
- Storage: 500 GB NVMe
- Network: 1 Gbps

### What cloud providers do you support?

V-COMM supports deployment on:
- AWS (EKS, ECS, EC2)
- Google Cloud (GKE, Compute Engine)
- Azure (AKS, VMs)
- DigitalOcean
- Linode
- Any Kubernetes cluster

### Do you provide Docker images?

Yes. Docker images are available on Docker Hub and GitHub Container Registry.

### Can I use V-COMM in an on-premise environment?

Yes. V-COMM is designed for air-gapped environments and can be deployed completely offline with mesh networking.

## 🆘 Support

### Where can I get help?

- **Documentation**: Check our [wiki](Home.md)
- **FAQ**: This document
- **Issues**: Search or create on GitHub
- **Discord**: Join our community server
- **Email**: support@vcomm.app

### How do I contact support?

- **Email**: support@vcomm.app
- **Discord**: [Join our server](https://discord.gg/vcomm)
- **GitHub**: [Create an issue](https://github.com/vantisCorp/VChat/issues)

### What's your response time?

- **Community**: Best effort
- **Standard**: 24 hours
- **Premium**: 4 hours
- **Enterprise**: 1 hour

---

Still have questions? [Contact us](mailto:support@vcomm.app) or join our [Discord server](https://discord.gg/vcomm).

**Last Updated**: March 2025  
**Version**: 1.0.0-alpha