# Troubleshooting Guide

Common issues and their solutions for V-COMM.

## 🚨 Quick Diagnostics

### Health Check Commands

```bash
# Check service health
make health-check

# Check backend health
curl http://localhost:3001/health

# Check database connection
make db-check

# Check Redis connection
redis-cli ping

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
| Kubernetes | `kubectl logs <pod> -n vcomm` |

## 🔧 Installation Issues

### Problem: Node.js version mismatch

**Symptoms**:
```
error: Node.js version 18.x is not supported. Please use 20.x or later.
```

**Solution**:
```bash
# Check current Node.js version
node --version

# Install Node.js 20.x using nvm
nvm install 20
nvm use 20

# Or using n
sudo n 20
```

### Problem: pnpm not found

**Symptoms**:
```
pnpm: command not found
```

**Solution**:
```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### Problem: Rust compilation fails

**Symptoms**:
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

### Problem: OpenSSL linking errors

**Symptoms**:
```
error: linking with `cc` failed: exit code: 1
/usr/bin/ld: cannot find -lssl
```

**Solution**:
```bash
# Ubuntu/Debian
sudo apt-get install libssl-dev pkg-config

# macOS
brew install openssl@3
export OPENSSL_DIR=$(brew --prefix openssl@3)

# Fedora
sudo dnf install openssl-devel
```

### Problem: PostgreSQL connection refused

**Symptoms**:
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

# Check connection
psql -U vcomm -d vcomm -h localhost
```

## 🌐 Network Issues

### Problem: CORS errors in browser

**Symptoms**:
```
Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy
```

**Solution**:

1. Check CORS configuration in `.env`:
```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

2. Update backend configuration:
```rust
// Configure CORS in backend
let cors = CorsLayer::new()
    .allow_origin(AllowOrigin::predicate(|origin, _| {
        origin.is_allowed()
    }))
    .allow_methods(Any)
    .allow_headers(Any);
```

### Problem: WebSocket connection fails

**Symptoms**:
```
WebSocket connection to 'wss://...' failed
```

**Solution**:

1. Check WebSocket URL:
```bash
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com/ws
```

2. Check Nginx configuration:
```nginx
location /ws {
    proxy_pass http://backend/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
}
```

3. Check proxy settings:
```bash
# If behind a proxy, ensure it supports WebSockets
# Cloudflare: Enable WebSockets in Network settings
```

### Problem: High latency

**Symptoms**:
- Messages delayed by several seconds
- Voice/video lag
- Slow file uploads

**Solutions**:

1. Check server resources:
```bash
# Check CPU and memory
htop

# Check disk I/O
iostat -x 1

# Check network
ping -c 10 api.vcomm.app
```

2. Optimize configuration:
```bash
# Increase worker connections
# In nginx.conf:
worker_connections 4096;

# Enable compression
gzip on;
gzip_types text/plain application/json;
```

3. Check database performance:
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- Analyze tables
ANALYZE;
```

## 🔐 Authentication Issues

### Problem: Invalid JWT token

**Symptoms**:
```
Error: Invalid token
```

**Solution**:

1. Verify JWT secret is consistent:
```bash
# Check JWT_SECRET in all services
echo $JWT_SECRET
```

2. Clear tokens and re-authenticate:
```bash
# Clear Redis tokens
redis-cli DEL "user:tokens:*"

# Logout and login again
```

3. Check token expiration:
```bash
# Decode JWT to check expiration
echo "eyJhbGciOiJ..." | base64 -d | jq .
```

### Problem: FIDO2/WebAuthn registration fails

**Symptoms**:
```
Error: Registration failed
```

**Solutions**:

1. Check RP ID matches domain:
```javascript
// Correct:
rp: { name: "V-COMM", id: "yourdomain.com" }

// Incorrect:
rp: { name: "V-COMM", id: "api.yourdomain.com" }
```

2. Check HTTPS requirement:
```
WebAuthn requires HTTPS (except for localhost)
```

3. Check attestation options:
```javascript
attestation: 'none', // For cross-platform authenticators
```

### Problem: MFA code rejected

**Symptoms**:
```
Error: Invalid MFA code
```

**Solution**:

1. Check time synchronization:
```bash
# Sync system time
sudo ntpdate -s time.nist.gov

# Or using systemd
timedatectl set-ntp true
```

2. Verify TOTP configuration:
```bash
# Check time drift
totp-cli show-key
```

## 💾 Database Issues

### Problem: Database migration fails

**Symptoms**:
```
Error: Migration failed
```

**Solution**:

1. Check migration status:
```bash
# Using diesel
diesel migration list

# Using sea-orm
sea-orm-cli migrate status
```

2. Rollback and retry:
```bash
# Rollback last migration
diesel migration revert

# Re-run migration
diesel migration run
```

3. Manual fix:
```sql
-- Check __diesel_schema_migrations table
SELECT * FROM __diesel_schema_migrations;

-- Mark migration as applied
INSERT INTO __diesel_schema_migrations (version) VALUES ('20240101000000');
```

### Problem: Database connection pool exhausted

**Symptoms**:
```
Error: Timed out waiting for a database connection
```

**Solution**:

1. Increase pool size:
```bash
DATABASE_MAX_CONNECTIONS=50
DATABASE_MIN_CONNECTIONS=10
```

2. Check for connection leaks:
```sql
-- Check active connections
SELECT pid, usename, state, query FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';
```

### Problem: Slow queries

**Symptoms**:
- Slow message loading
- Dashboard takes long to load

**Solution**:

1. Enable query logging:
```sql
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

2. Analyze and optimize:
```sql
-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM messages WHERE channel_id = 'xxx';

-- Add missing indexes
CREATE INDEX idx_messages_channel_created ON messages(channel_id, created_at DESC);
```

3. Vacuum and analyze:
```sql
VACUUM ANALYZE;
```

## 🐳 Docker Issues

### Problem: Container exits immediately

**Symptoms**:
```
Container exited with code 1
```

**Solution**:

1. Check logs:
```bash
docker-compose logs backend
```

2. Check health check:
```bash
docker inspect <container_id> --format='{{json .State.Health}}'
```

3. Check resource limits:
```yaml
# Increase memory limits
deploy:
  resources:
    limits:
      memory: 4G
```

### Problem: Docker volume permission denied

**Symptoms**:
```
Error: Permission denied
```

**Solution**:

1. Fix permissions:
```bash
# Fix volume permissions
sudo chown -R 1000:1000 ./data/postgres
sudo chown -R 1000:1000 ./data/redis
```

2. Run with correct user:
```yaml
services:
  backend:
    user: "${UID}:${GID}"
```

### Problem: Out of disk space

**Symptoms**:
```
Error: No space left on device
```

**Solution**:

1. Check disk usage:
```bash
df -h
docker system df
```

2. Clean up Docker:
```bash
# Remove unused resources
docker system prune -a --volumes

# Remove old images
docker image prune -a
```

## ☸️ Kubernetes Issues

### Problem: Pod stuck in Pending

**Symptoms**:
```
STATUS: Pending
```

**Solution**:

1. Describe pod:
```bash
kubectl describe pod <pod-name> -n vcomm
```

2. Check events:
```bash
kubectl get events -n vcomm --sort-by='.lastTimestamp'
```

3. Common causes:
- Insufficient resources: Check node capacity
- PVC not bound: Check storage class
- Node selectors: Check node labels

### Problem: ImagePullBackOff

**Symptoms**:
```
STATUS: ImagePullBackOff
```

**Solution**:

1. Check image name:
```bash
kubectl describe pod <pod-name> -n vcomm
```

2. Verify image exists:
```bash
docker pull vcomm/backend:latest
```

3. Check image pull secrets:
```bash
kubectl get secrets -n vcomm
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=<username> \
  --docker-password=<password> \
  -n vcomm
```

### Problem: Service not accessible

**Symptoms**:
```
Connection refused
```

**Solution**:

1. Check service endpoints:
```bash
kubectl get endpoints -n vcomm
```

2. Check service selector:
```bash
kubectl describe service vcomm-backend -n vcomm
```

3. Test connectivity:
```bash
kubectl run test --rm -it --image=busybox -- wget -qO- vcomm-backend:3001/health
```

## 🔒 Security Issues

### Problem: Certificate errors

**Symptoms**:
```
SSL: CERTIFICATE_VERIFY_FAILED
```

**Solution**:

1. Check certificate:
```bash
openssl s_client -connect api.vcomm.app:443
```

2. Renew certificate:
```bash
# Using cert-manager
kubectl get certificates -n vcomm
kubectl describe certificate vcomm-tls -n vcomm
```

3. Check certificate chain:
```bash
curl -vI https://api.vcomm.app 2>&1 | grep -A10 "SSL certificate"
```

### Problem: Gitleaks detects secrets

**Symptoms**:
```
Gitleaks found 3 secrets
```

**Solution**:

1. Identify leaked secrets:
```bash
gitleaks detect --source . -v
```

2. Rotate compromised secrets:
```bash
# Generate new secrets
openssl rand -base64 64  # New JWT_SECRET
openssl rand -base64 32  # New ENCRYPTION_KEY
```

3. Remove from history:
```bash
# Use BFG Repo-Cleaner or git filter-repo
git filter-repo --invert-paths --path .env
```

## 📊 Performance Issues

### Problem: High memory usage

**Symptoms**:
- Server becomes unresponsive
- OOM kills

**Solution**:

1. Profile memory:
```bash
# For Rust backend
cargo flamegraph --root

# Check heap usage
valgrind --leak-check=full ./target/release/vcomm
```

2. Adjust limits:
```yaml
resources:
  limits:
    memory: 4Gi
  requests:
    memory: 2Gi
```

### Problem: High CPU usage

**Symptoms**:
- Slow response times
- Server overload

**Solution**:

1. Profile CPU:
```bash
# Using perf
perf record -g -p <pid>
perf report

# Using async-profiler
./profiler.sh -d 60 <pid>
```

2. Optimize queries:
```sql
-- Check slow queries
SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

## 🆘 Getting Help

If you can't resolve your issue:

1. **Search existing issues**: [GitHub Issues](https://github.com/vantisCorp/VChat/issues)
2. **Check documentation**: [Wiki Home](Home.md)
3. **Join Discord**: [V-COMM Community](https://discord.gg/vcomm)
4. **Create an issue**: Use the [Bug Report Template](../.github/ISSUE_TEMPLATE/BUG_REPORT.yml)
5. **Contact support**: support@vcomm.app

When reporting issues, please include:
- V-COMM version
- Operating system
- Error messages
- Steps to reproduce
- Relevant logs

---

**Last Updated**: March 2025  
**Version**: 1.0.0-alpha