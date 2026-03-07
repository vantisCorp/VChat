---
title: Docker Deployment
---

# Docker Deployment

Deploy V-COMM using Docker and Docker Compose.

## Prerequisites

- **Docker**: 24.x or later
- **Docker Compose**: 2.x or later
- **System**: See [Requirements](../getting-started/requirements.md)

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/vantisCorp/VChat.git
cd VChat
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Database
DATABASE_URL=postgresql://vcomm:password@postgres:5432/vcomm
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# URLs
API_URL=https://api.yourdomain.com
WS_URL=wss://api.yourdomain.com
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Verify Deployment

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f

# Health check
curl http://localhost:3001/health
```

## Docker Compose Configuration

```yaml
version: '3.8'

services:
  backend:
    image: vcomm/backend:latest
    build:
      context: ./packages/core
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://vcomm:${DB_PASSWORD}@postgres:5432/vcomm
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  frontend:
    image: vcomm/frontend:latest
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${API_URL}
      - NEXT_PUBLIC_WS_URL=${WS_URL}
    depends_on:
      - backend
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=vcomm
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=vcomm
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vcomm"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: vcomm-network
```

## Production Configuration

### Build Production Images

```bash
# Build backend
docker build -t vcomm/backend:latest ./packages/core

# Build frontend
docker build -t vcomm/frontend:latest ./packages/frontend
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | JWT signing secret (64+ chars) |
| `ENCRYPTION_KEY` | Yes | Data encryption key (32 bytes) |
| `API_URL` | Yes | Public API URL |
| `WS_URL` | Yes | WebSocket URL |

### TLS/SSL Certificates

Mount certificates for HTTPS:

```yaml
nginx:
  volumes:
    - /path/to/certs:/etc/nginx/certs:ro
```

## Management Commands

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Scale

```bash
# Scale backend
docker-compose up -d --scale backend=3
```

### Updates

```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

## Troubleshooting

### Container Exits Immediately

```bash
# Check logs
docker-compose logs backend

# Check health
docker inspect <container_id>
```

### Database Connection Issues

```bash
# Check PostgreSQL
docker-compose exec postgres psql -U vcomm -d vcomm

# Check connection
docker-compose exec backend curl postgres:5432
```

### Out of Disk Space

```bash
# Check disk usage
docker system df

# Clean up
docker system prune -a --volumes
```

## Next Steps

- [Kubernetes Deployment](./kubernetes.md)
- [Terraform Deployment](./terraform.md)
- [Production Checklist](./production.md)