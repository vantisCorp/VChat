---
title: Installation Guide
---

# Installation Guide

This guide will help you install and configure V-COMM on your system.

## System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|------------|
| Operating System | Linux (Ubuntu 22.04+), macOS 12+, Windows 10+ (WSL2) |
| CPU | 4 cores |
| RAM | 8 GB |
| Storage | 100 GB SSD |
| Network | 100 Mbps |

### Recommended Requirements

| Component | Requirement |
|-----------|------------|
| CPU | 8+ cores |
| RAM | 16+ GB |
| Storage | 500+ GB NVMe |
| Network | 1 Gbps |

## Software Prerequisites

### Required Software

- **Node.js**: 20.x or later
- **pnpm**: 8.x or later
- **Rust**: 1.75+ (stable or nightly)
- **Docker**: 24.x or later
- **Git**: 2.x or later

### Optional Software

- **Terraform**: 1.6+ (for infrastructure deployment)
- **kubectl**: Latest (for Kubernetes deployment)
- **Helm**: 3.x (for Kubernetes package management)

## Installation Methods

### Method 1: Quick Start (Development)

1. **Clone the Repository**

```bash
git clone https://github.com/vantisCorp/VChat.git
cd VChat
```

2. **Run the Setup Script**

```bash
make setup
```

This will:
- Install all dependencies
- Set up the development environment
- Build the Rust backend
- Initialize the database
- Start the development servers

3. **Start Development Servers**

```bash
make dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend server on `http://localhost:3000`
- Documentation server on `http://localhost:3002`

### Method 2: Docker Deployment

1. **Clone and Configure**

```bash
git clone https://github.com/vantisCorp/VChat.git
cd VChat

# Copy environment file
cp .env.example .env
# Edit .env with your configuration
```

2. **Start Services**

```bash
docker-compose up -d
```

3. **Verify Deployment**

```bash
docker-compose ps
docker-compose logs -f
```

### Method 3: Production Deployment

#### Build from Source

```bash
# Clone repository
git clone https://github.com/vantisCorp/VChat.git
cd VChat

# Install dependencies
make setup

# Build for production
make build
```

#### Configure Environment

Create a `.env.production` file:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vcomm
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key

# Network
API_URL=https://api.yourdomain.com
WS_URL=wss://api.yourdomain.com

# Features
ENABLE_PQC=true
ENABLE_MESH_NETWORKING=true
ENABLE_IPFS=true
```

#### Deploy with Docker

```bash
# Build production images
docker build -t vcomm-backend ./packages/core
docker build -t vcomm-frontend ./packages/frontend

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Variables

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `ENCRYPTION_KEY` | 32-byte encryption key | Required |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `PORT` | Backend port | `3001` |
| `FRONTEND_PORT` | Frontend port | `3000` |
| `ENABLE_PQC` | Enable Post-Quantum Crypto | `true` |
| `ENABLE_MESH` | Enable Mesh Networking | `true` |
| `ENABLE_IPFS` | Enable IPFS integration | `true` |

## Post-Quantum Cryptography Setup

V-COMM uses Post-Quantum Cryptography (PQC) by default. To configure:

```bash
# Generate PQC keys
make generate-pqc-keys

# Keys will be saved to:
# - packages/core/config/pqc/public_key.bin
# - packages/core/config/pqc/private_key.bin
```

## DevContainer Setup

For a complete development environment using VS Code DevContainers:

1. **Install VS Code Extensions**

```bash
code --install-extension ms-vscode-remote.remote-containers
```

2. **Open in Container**

```bash
code .
# Select "Reopen in Container" when prompted
```

## Verification

After installation, verify everything works:

```bash
# Run health check
make health-check

# Run tests
make test

# Run security audit
make security-audit
```

## Troubleshooting

### Common Issues

#### Node.js Version Mismatch

```bash
# Using nvm
nvm install 20
nvm use 20
```

#### pnpm Not Found

```bash
npm install -g pnpm
```

#### Rust Compilation Fails

```bash
# Update Rust
rustup update stable

# Install required components
rustup component add clippy rustfmt

# Clear and rebuild
cargo clean
cargo build --release
```

#### PostgreSQL Connection Refused

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

## Next Steps

- Read the [Quick Start Guide](./quick-start.md)
- Explore the [Architecture Overview](../architecture/overview.md)
- Learn about [Security Features](../security/overview.md)