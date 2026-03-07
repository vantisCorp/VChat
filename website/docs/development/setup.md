---
sidebar_position: 1
title: Development Setup
description: Complete guide to setting up V-COMM development environment
keywords: [development, setup, environment, local, tools]
tags: [development, setup]
---

# Development Setup

## Overview

This guide walks you through setting up a complete V-COMM development environment on your local machine. Follow these steps to get started with contributing to V-COMM.

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended |
|----------|----------------|-------------|
| Node.js | 18.0.0 | 20.x LTS |
| npm | 9.0.0 | 10.x |
| Docker | 24.0.0 | Latest |
| Docker Compose | 2.20.0 | Latest |
| Git | 2.40.0 | Latest |
| Make | 4.0.0 | Latest |

### Recommended Tools

- **VS Code** with V-COMM extension pack
- **Postman** or **Insomnia** for API testing
- **pgAdmin** for database management
- **Redis Commander** for Redis inspection

## Quick Start

### Using Docker Compose

```bash
# Clone the repository
git clone https://github.com/vantisCorp/VChat.git
cd VChat

# Start all services
make dev-up

# Wait for services to be ready
# This may take a few minutes on first start

# Check service health
make dev-status
```

All services will be available:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8080
- **WebSocket**: ws://localhost:8081
- **API Docs**: http://localhost:8080/docs

## Manual Setup

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install development dependencies
npm install -D \
  @types/node \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint \
  prettier \
  jest \
  @types/jest \
  ts-jest
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

```env
# .env configuration
NODE_ENV=development

# Database
DATABASE_URL=postgresql://vcomm:password@localhost:5432/vcomm_dev
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=your-32-byte-encryption-key-here

# External Services
STORAGE_PROVIDER=local
STORAGE_PATH=./storage

# Email (for development)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-user
SMTP_PASS=your-password

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_MFA=false
```

### 3. Start Database Services

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Wait for databases to be ready
docker-compose ps

# Run database migrations
npm run db:migrate

# Seed database with sample data (optional)
npm run db:seed
```

### 4. Start Development Servers

```bash
# Start API server (in one terminal)
npm run dev:api

# Start WebSocket server (in another terminal)
npm run dev:websocket

# Start frontend dev server (in another terminal)
npm run dev:frontend

# Or start all at once
npm run dev
```

## IDE Setup

### VS Code

Install the recommended extensions:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-azuretools.vscode-docker
code --install-extension PRHt1.github-markdown-preview
```

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:api"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug WebSocket",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:websocket"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Jest Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test:debug"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## Project Structure

```
VChat/
├── packages/
│   ├── api/                    # REST API server
│   ├── websocket/              # WebSocket server
│   ├── frontend/               # React frontend
│   ├── shared/                 # Shared types and utilities
│   └── mobile/                 # React Native mobile app
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
├── .env.example                # Environment template
├── docker-compose.yml          # Local development services
├── docker-compose.prod.yml     # Production services
├── Makefile                    # Development commands
├── package.json                # Root package.json
├── tsconfig.json               # TypeScript configuration
└── turbo.json                  # Turborepo configuration
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- authentication.test.ts

# Run tests matching pattern
npm test -- --grep "authentication"
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=packages/api

# Build with watch mode
npm run build:watch

# Clean build artifacts
npm run clean
```

### Linting and Formatting

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Format all files
npm run format

# Type checking
npm run typecheck
```

### Database Operations

```bash
# Create new migration
npm run db:migrate:create -- name=add_user_status

# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Create migration file
npm run db:migrate:generate -- --name=users_table

# Seed database
npm run db:seed

# Reset database (⚠️ destructive)
npm run db:reset
```

## Makefile Commands

The Makefile provides convenient commands for common tasks:

```bash
# Development
make dev              # Start all dev servers
make dev-up           # Start Docker services
make dev-down         # Stop Docker services
make dev-status       # Check service status
make dev-logs         # View logs

# Database
make db-reset         # Reset database
make db-migrate       # Run migrations
make db-seed          # Seed database
make db-shell         # Open database shell
make redis-cli        # Open Redis CLI

# Testing
make test             # Run all tests
make test-watch       # Run tests in watch mode
make test-coverage    # Generate coverage report
make lint             # Run linter
make lint-fix         # Fix linting issues

# Build
make build            # Build all packages
make build-watch      # Build with watch mode
make clean            # Clean build artifacts

# Utilities
make install          # Install dependencies
make fresh            # Fresh install and setup
make help             # Show all available commands
```

## Debugging

### Debugging API

```bash
# Start API with debug logging
DEBUG=vcomm:* npm run dev:api

# Set specific debug modules
DEBUG=vcomm:api,vcomm:auth npm run dev:api

# Enable verbose logging
LOG_LEVEL=verbose npm run dev:api
```

### Debugging Database

```bash
# Connect to PostgreSQL
make db-shell

# Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Check connection pool
SELECT * FROM pg_stat_activity;

# Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Debugging Redis

```bash
# Connect to Redis
make redis-cli

# Check memory usage
INFO memory

# Monitor commands in real-time
MONITOR

# Check all keys
KEYS *

# Check specific key
GET your-key

# Clear all data (⚠️ destructive)
FLUSHALL
```

## Common Issues

### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use make command to find and kill
make kill-port PORT=8080
```

### Database Connection Errors

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check connection
psql -h localhost -U vcomm -d vcomm_dev
```

### Redis Connection Errors

```bash
# Check if Redis is running
docker-compose ps redis

# Check Redis logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis

# Test connection
redis-cli ping
```

### Module Resolution Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules packages/*/node_modules

# Reinstall dependencies
npm install

# Rebuild all packages
npm run build
```

## Performance Tips

### Faster Development Builds

```bash
# Use Turborepo for faster builds
npm run build -- --turbo

# Build only changed packages
npm run build -- --filter=[HEAD^1]

# Skip type checking during dev
npm run dev -- --no-typecheck
```

### Database Performance

```bash
# Use connection pooling in development
# Add to .env:
DATABASE_POOL_MAX=50
DATABASE_POOL_MIN=10

# Enable query logging
LOG_LEVEL=debug

# Use pgAdmin for visual inspection
# Add to docker-compose.yml:
#   pgadmin:
#     image: dpage/pgadmin4
#     ports:
#       - "5050:80"
```

## Next Steps

After setting up your development environment:

1. Read the [Coding Standards](./coding-standards) to understand our code style
2. Check out the [Testing Guide](./testing) to learn how to write tests
3. Review the [Contributing Guide](../contributing) to understand our contribution process
4. Explore the [Architecture](../architecture/overview) to understand the system design

## See Also

- [Coding Standards](./coding-standards)
- [Testing Guide](./testing)
- [Contributing Guide](../contributing)
- [Architecture Overview](../architecture/overview)
- [API Reference](../api/index)