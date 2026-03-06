---
title: Installation
description: Detailed installation instructions for V-COMM
---

# Installation Guide

Complete installation instructions for V-COMM development environment.

## System Requirements

### Minimum Requirements

- **OS**: Linux (Ubuntu 22.04+), macOS 12+, Windows 11 (WSL2)
- **CPU**: 4 cores, x86_64 or ARM64
- **RAM**: 8 GB (16 GB recommended)
- **Storage**: 20 GB free space

### Software Requirements

- **Node.js**: 20.x or higher
- **Rust**: 1.75+ with Ferrocene compiler
- **Python**: 3.11+
- **pnpm**: 8.0+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Terraform**: 1.5+
- **Git**: 2.30+

## Installation Steps

### 1. Install Node.js and pnpm

```bash
# Install Node.js 20.x using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20

# Install pnpm
npm install -g pnpm@8.14.1
```

### 2. Install Rust with Ferrocene

```bash
# Install Ferrocene Rust toolchain
curl https://sh.rustup.rs -sSf | sh
source $HOME/.cargo/env

# Install Ferrocene
rustup toolchain install ferrocene
rustup default ferrocene
```

### 3. Install Python and Tools

```bash
# Install Python 3.11
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip

# Install Python dependencies
pip3 install -r requirements.txt
```

### 4. Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 5. Install Terraform

```bash
# Install Terraform
wget https://releases.hashicorp.com/terraform/1.5.7/terraform_1.5.7_linux_amd64.zip
unzip terraform_1.5.7_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Verify installation
terraform version
```

### 6. Clone Repository

```bash
# Clone using GitHub CLI
gh repo clone vantisCorp/VChat

# Or using git
git clone https://github.com/vantisCorp/VChat.git
cd VChat
```

### 7. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Install global tools
pnpm install -g mintlify
pnpm install -g vale
```

### 8. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Required environment variables:

```env
# API Configuration
VCOMM_API_KEY=your_api_key_here
VCOMM_API_SECRET=your_api_secret_here
VCOMM_ENDPOINT=http://localhost:8080

# Encryption
VCOMM_ENCRYPTION_KEY=your_256bit_encryption_key
VCOMM_SIGNING_KEY=your_signing_key

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/vcomm
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Security
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=7d

# Infrastructure
INFRA_TERRAFORM_DIR=./infra/terraform
INFRA_ANSIBLE_DIR=./infra/ansible

# Monitoring
SENTRY_DSN=your_sentry_dsn
PROMETHEUS_ENABLED=true
```

### 9. Start Infrastructure Services

```bash
# Start Docker services
docker-compose up -d

# Verify services are running
docker-compose ps
```

Expected output:

```
NAME              STATUS    PORTS
postgres          Up        0.0.0.0:5432->5432/tcp
redis             Up        0.0.0.0:6379->6379/tcp
prometheus        Up        0.0.0.0:9090->9090/tcp
grafana           Up        0.0.0.0:3001->3000/tcp
```

### 10. Initialize Database

```bash
# Run database migrations
pnpm run db:migrate

# Seed database (optional)
pnpm run db:seed
```

### 11. Build Project

```bash
# Build all packages
pnpm build

# Verify build
ls -la apps/*/dist
ls -la packages/*/dist
```

### 12. Start Development Server

```bash
# Start all services
pnpm dev

# Access web interface
open http://localhost:3000

# Access API documentation
open http://localhost:8080/docs
```

## Verification

Run the verification script:

```bash
pnpm run verify:install
```

This will check:
- ✅ Node.js version
- ✅ Rust installation
- ✅ Python version
- ✅ Docker services
- ✅ Database connection
- ✅ Redis connection
- ✅ API health

## Troubleshooting

### Rust Installation Issues

```bash
# Check Rust version
rustc --version

# Reinstall Rust
curl https://sh.rustup.rs -sSf | sh
```

### pnpm Installation Issues

```bash
# Clear pnpm cache
pnpm store prune

# Reinstall
rm -rf node_modules
pnpm install
```

### Docker Issues

```bash
# Check Docker status
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# View Docker logs
docker-compose logs
```

### Database Connection Issues

```bash
# Check PostgreSQL
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

## Development Containers

For a complete development environment, use DevContainers:

```bash
# Open in VS Code with DevContainers
code .

# Rebuild container
code . --rebuild
```

DevContainer includes:
- All required tools pre-installed
- Node.js 20.x
- Rust with Ferrocene
- Python 3.11
- Docker integration
- VS Code extensions

## Uninstallation

```bash
# Stop all services
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove dependencies
rm -rf node_modules
rm -rf packages/*/node_modules
rm -rf apps/*/node_modules

# Remove build artifacts
pnpm clean
```

## Next Steps

- 📚 [Quickstart Guide](./quickstart) - Get started quickly
- 🏗️ [Architecture](./architecture) - Understand the system
- 🔐 [Authentication](./authentication) - Set up authentication

## Support

- 📧 Email: support@vcomm.dev
- 🐛 [GitHub Issues](https://github.com/vantisCorp/VChat/issues)
- 💬 [Discord Community](https://discord.gg/vcomm)