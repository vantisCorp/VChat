---
title: Quick Start Guide
---

# Quick Start Guide

Get V-COMM up and running in minutes with this quick start guide.

## Prerequisites

Ensure you have the following installed:

- **Node.js** 20.x or later
- **pnpm** 8.x or later
- **Docker** 24.x or later (optional, for containerized setup)

## Option 1: Development Setup (Recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/vantisCorp/VChat.git
cd VChat
```

### 2. Run Setup

```bash
make setup
```

This command will:
- Install all Node.js dependencies
- Build the Rust backend
- Set up the database
- Configure development environment

### 3. Start Development Servers

```bash
make dev
```

This starts:
- **Backend**: `http://localhost:3001`
- **Frontend**: `http://localhost:3000`
- **Documentation**: `http://localhost:3002`

### 4. Verify Installation

Open your browser and navigate to `http://localhost:3000`. You should see the V-COMM welcome page.

## Option 2: Docker Setup

### 1. Clone and Configure

```bash
git clone https://github.com/vantisCorp/VChat.git
cd VChat

# Copy environment file
cp .env.example .env
```

### 2. Start Services

```bash
docker-compose up -d
```

### 3. Check Status

```bash
docker-compose ps
```

## What's Next?

After getting V-COMM running:

1. **Create an Account** - Register your first user
2. **Set Up FIDO2** - Enable passwordless authentication
3. **Create a Channel** - Start your first V-CHANNEL
4. **Explore Features** - Try messaging, voice/video calls

## Common Commands

| Command | Description |
|---------|-------------|
| `make setup` | Initialize development environment |
| `make dev` | Start development servers |
| `make build` | Build for production |
| `make test` | Run all tests |
| `make lint` | Run linters |
| `make clean` | Clean build artifacts |

## Troubleshooting

### Port Already in Use

If ports 3000 or 3001 are already in use:

```bash
# Kill processes on ports
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:3001)
```

### Node Version Issues

```bash
# Using nvm
nvm install 20
nvm use 20
```

### Rust Build Fails

```bash
# Update Rust
rustup update stable

# Clear and rebuild
cargo clean
cargo build
```

## Getting Help

- 📖 [Full Installation Guide](./installation.md)
- 💬 [Discord Community](https://discord.gg/vcomm)
- 🐛 [GitHub Issues](https://github.com/vantisCorp/VChat/issues)