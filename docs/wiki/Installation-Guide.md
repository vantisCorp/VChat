# Installation Guide

This guide will help you install and configure V-COMM on your system.

## 📋 Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 22.04+ recommended), macOS 12+, or Windows 10+ with WSL2
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: Minimum 2GB free space
- **CPU**: x86_64 or ARM64 with AVX2 support recommended
- **Network**: Stable internet connection for initial setup

### Software Requirements

- **Node.js**: 20.x or later
- **pnpm**: 8.x or later
- **Rust**: 1.75+ (stable or nightly)
- **Docker**: 24.x or later (for containerized deployment)
- **Terraform**: 1.6+ (for infrastructure deployment)

## 🚀 Installation Methods

### Method 1: Quick Start (Recommended for Development)

#### Clone the Repository

```bash
git clone https://github.com/vantisCorp/VChat.git
cd VChat
```

#### Run the Setup Script

```bash
make setup
```

This will:
- Install all dependencies
- Set up the development environment
- Build the Rust backend
- Initialize the database
- Start the development servers

#### Start Development Servers

```bash
make dev
```

This will start:
- Backend server on port 3001
- Frontend server on port 3000
- Documentation server on port 3002

### Method 2: Docker Deployment

#### Using Docker Compose

```bash
# Clone repository
git clone https://github.com/vantisCorp/VChat.git
cd VChat

# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Available Services

- `vcomm-backend`: Rust backend service
- `vcomm-frontend`: Next.js frontend
- `vcomm-database`: PostgreSQL database
- `vcomm-redis`: Redis cache
- `vcomm-nginx`: Reverse proxy

### Method 3: Production Deployment

#### 1. Build from Source

```bash
# Clone repository
git clone https://github.com/vantisCorp/VChat.git
cd VChat

# Install dependencies
make setup

# Build for production
make build
```

#### 2. Configure Environment

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

#### 3. Deploy with Docker

```bash
# Build production images
docker build -t vcomm-backend ./packages/backend
docker build -t vcomm-frontend ./packages/frontend

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

#### 4. Deploy with Kubernetes

```bash
# Install Terraform
make terraform-init

# Plan deployment
make terraform-plan

# Apply configuration
make terraform-apply
```

## 🔧 Configuration

### Environment Variables

#### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://vcomm:vcomm@localhost:5432/vcomm` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for JWT tokens | (generate randomly) |
| `ENCRYPTION_KEY` | 32-byte encryption key | (generate randomly) |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `PORT` | Backend port | `3001` |
| `FRONTEND_PORT` | Frontend port | `3000` |
| `ENABLE_PQC` | Enable Post-Quantum Crypto | `true` |
| `ENABLE_MESH` | Enable Mesh Networking | `true` |
| `ENABLE_IPFS` | Enable IPFS integration | `true` |

### Post-Quantum Cryptography Setup

V-COMM uses Post-Quantum Cryptography (PQC) by default. To configure:

```bash
# Generate PQC keys
make generate-pqc-keys

# Keys will be saved to:
# - packages/backend/config/pqc/public_key.bin
# - packages/backend/config/pqc/private_key.bin
```

### DevContainer Setup

For a complete development environment:

```bash
# Open in VS Code with DevContainer
code --install-extension ms-vscode-remote.remote-containers
code .

# Select "Reopen in Container" when prompted
```

## 🧪 Verification

After installation, verify everything works:

```bash
# Run health check
make health-check

# Run tests
make test

# Run security audit
make security-audit
```

## 📚 Next Steps

- Read the [Architecture Overview](Architecture-Overview.md)
- Learn about [Security Implementation](Security-Implementation.md)
- Check the [API Reference](API-Reference.md)
- Follow the [Deployment Guide](Deployment-Guide.md) for production setup

## 🐛 Troubleshooting

### Common Issues

**Issue**: Port already in use  
**Solution**: Change ports in `.env` file or stop conflicting services

**Issue**: Rust compilation fails  
**Solution**: Ensure Rust is up to date: `rustup update`

**Issue**: Database connection fails  
**Solution**: Check PostgreSQL is running and credentials are correct

**Issue**: PQC key generation fails  
**Solution**: Ensure liboqs is installed: `make install-dependencies`

For more issues, see [Troubleshooting.md](Troubleshooting.md).

## 🆘 Getting Help

- Check the [FAQ](FAQ.md)
- Search [existing issues](https://github.com/vantisCorp/VChat/issues)
- Join our [Discord community](https://discord.gg/vcomm)
- Create a new issue with the template provided

---

**Last Updated**: March 2025  
**Version**: 1.0.0-alpha