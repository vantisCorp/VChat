---
title: Troubleshooting
---

# Troubleshooting Guide

Common issues and their solutions for V-COMM.

## Quick Diagnostics

### Health Check Commands

```bash
# Check service health
make health-check

# Check backend health
curl http://localhost:3001/health

# Check database connection
make db-check

# View service logs
make logs
```

### Log Locations

| Service | Log Location |
|---------|-------------|
| Backend | `logs/backend.log` |
| Frontend | `logs/frontend.log` |
| Database | `logs/postgres.log` |
| Redis | `logs/redis.log` |
| Docker | `docker-compose logs` |

## Installation Issues

### Node.js Version Mismatch

**Symptom**:
```
error: Node.js version 18.x is not supported. Please use 20.x or later.
```

**Solution**:
```bash
# Using nvm
nvm install 20
nvm use 20

# Using n
sudo n 20
```

### pnpm Not Found

**Symptom**:
```
pnpm: command not found
```

**Solution**:
```bash
npm install -g pnpm
```

### Rust Compilation Fails

**Symptom**:
```
error: could not compile `vcomm-core`
```

**Solution**:
```bash
# Update Rust
rustup update stable

# Install required components
rustup component add clippy rustfmt

# Clear build cache
cargo clean

# Rebuild
cargo build --release
```

### PostgreSQL Connection Refused

**Symptom**:
```
Error: Connection refused (os error 111)
```

**Solution**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Enable auto-start
sudo systemctl enable postgresql
```

## Network Issues

### CORS Errors

**Symptom**:
```
Access to XMLHttpRequest at '...' has been blocked by CORS policy
```

**Solution**:

Check CORS configuration in `.env`:
```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### WebSocket Connection Fails

**Symptom**:
```
WebSocket connection to 'wss://...' failed
```

**Solution**:

1. Check WebSocket URL in `.env`:
```bash
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com/ws
```

2. Check Nginx configuration supports WebSockets

### High Latency

**Symptoms**:
- Messages delayed by several seconds
- Voice/video lag

**Solutions**:

1. Check server resources
2. Optimize database queries
3. Enable compression

## Authentication Issues

### Invalid JWT Token

**Symptom**:
```
Error: Invalid token
```

**Solution**:

1. Verify JWT_SECRET is consistent
2. Clear Redis tokens
3. Logout and re-authenticate

### FIDO2 Registration Fails

**Symptom**:
```
Error: Registration failed
```

**Solutions**:

1. Check RP ID matches domain
2. Ensure HTTPS is enabled
3. Check attestation options

## Database Issues

### Migration Fails

**Symptom**:
```
Error: Migration failed
```

**Solution**:

1. Check migration status
2. Rollback and retry
3. Manual fix if needed

### Connection Pool Exhausted

**Symptom**:
```
Error: Timed out waiting for a database connection
```

**Solution**:

1. Increase pool size
2. Check for connection leaks
3. Kill idle connections

### Slow Queries

**Symptom**:
- Slow message loading
- Dashboard takes long to load

**Solution**:

1. Enable query logging
2. Analyze and optimize queries
3. Add missing indexes

## Docker Issues

### Container Exits Immediately

**Symptom**:
```
Container exited with code 1
```

**Solution**:

1. Check logs: `docker-compose logs backend`
2. Check health check configuration
3. Verify resource limits

### Volume Permission Denied

**Symptom**:
```
Error: Permission denied
```

**Solution**:

1. Fix permissions: `sudo chown -R 1000:1000 ./data`
2. Run with correct user

### Out of Disk Space

**Symptom**:
```
Error: No space left on device
```

**Solution**:

1. Check disk usage: `docker system df`
2. Clean up: `docker system prune -a --volumes`

## Kubernetes Issues

### Pod Stuck in Pending

**Symptom**:
```
STATUS: Pending
```

**Solution**:

1. Describe pod: `kubectl describe pod <pod-name>`
2. Check events
3. Verify resources and node selectors

### ImagePullBackOff

**Symptom**:
```
STATUS: ImagePullBackOff
```

**Solution**:

1. Check image name
2. Verify image exists
3. Check image pull secrets

### Service Not Accessible

**Symptom**:
```
Connection refused
```

**Solution**:

1. Check service endpoints
2. Verify service selector
3. Test connectivity

## Performance Issues

### High Memory Usage

**Symptom**:
- Server becomes unresponsive
- OOM kills

**Solution**:

1. Profile memory usage
2. Adjust memory limits
3. Check for memory leaks

### High CPU Usage

**Symptom**:
- Slow response times
- Server overload

**Solution**:

1. Profile CPU usage
2. Optimize queries
3. Scale horizontally

## Getting Help

If you can't resolve your issue:

1. **Search existing issues**: [GitHub Issues](https://github.com/vantisCorp/VChat/issues)
2. **Check documentation**: Browse this site
3. **Join Discord**: [V-COMM Community](https://discord.gg/vcomm)
4. **Create an issue**: Use the bug report template
5. **Contact support**: support@vcomm.app

When reporting issues, include:
- V-COMM version
- Operating system
- Error messages
- Steps to reproduce
- Relevant logs