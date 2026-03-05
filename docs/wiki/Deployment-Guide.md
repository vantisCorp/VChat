# Deployment Guide

Complete guide for deploying V-COMM in various environments, from development to production.

## 📋 Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16+ GB |
| Storage | 100 GB SSD | 500+ GB NVMe |
| Network | 100 Mbps | 1 Gbps |

### Software Requirements

- **Docker**: 24.x or later
- **Docker Compose**: 2.x or later
- **Kubernetes**: 1.28+ (for K8s deployment)
- **Terraform**: 1.6+ (for IaC deployment)
- **kubectl**: Latest version
- **Helm**: 3.x (for K8s package management)

## 🐳 Docker Compose Deployment

### Quick Start

1. **Clone Repository**

```bash
git clone https://github.com/vantisCorp/VChat.git
cd VChat
```

2. **Configure Environment**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Services**

```bash
docker-compose up -d
```

4. **Verify Deployment**

```bash
docker-compose ps
docker-compose logs -f
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
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

### Environment Variables

Create `.env` file:

```bash
# Database
DB_PASSWORD=your-secure-password
DATABASE_URL=postgresql://vcomm:${DB_PASSWORD}@postgres:5432/vcomm

# Redis
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# URLs
API_URL=https://api.yourdomain.com
WS_URL=wss://api.yourdomain.com

# PQC
ENABLE_PQC=true

# Logging
LOG_LEVEL=info
```

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.28+)
- kubectl configured
- Helm 3.x installed
- cert-manager for TLS

### 1. Create Namespace

```bash
kubectl create namespace vcomm
```

### 2. Create Secrets

```bash
kubectl create secret generic vcomm-secrets \
  --from-literal=jwt-secret=$(openssl rand -base64 64) \
  --from-literal=encryption-key=$(openssl rand -base64 32) \
  --from-literal=db-password=$(openssl rand -base64 24) \
  -n vcomm
```

### 3. Deploy with Helm

```bash
# Add Helm repository
helm repo add vcomm https://charts.vcomm.app
helm repo update

# Deploy
helm install vcomm vcomm/vcomm \
  --namespace vcomm \
  --values values.yaml
```

### Helm Values

```yaml
# values.yaml
replicaCount: 3

image:
  backend:
    repository: vcomm/backend
    tag: latest
    pullPolicy: Always
  frontend:
    repository: vcomm/frontend
    tag: latest
    pullPolicy: Always

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: vcomm.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: vcomm-tls
      hosts:
        - vcomm.yourdomain.com

resources:
  backend:
    limits:
      cpu: 2
      memory: 4Gi
    requests:
      cpu: 500m
      memory: 1Gi
  frontend:
    limits:
      cpu: 1
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 128Mi

postgresql:
  enabled: true
  auth:
    database: vcomm
    username: vcomm
    existingSecret: vcomm-secrets
  primary:
    persistence:
      size: 100Gi

redis:
  enabled: true
  auth:
    existingSecret: vcomm-secrets
  master:
    persistence:
      size: 10Gi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

### Kubernetes Manifests

```yaml
# kubernetes/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vcomm-backend
  namespace: vcomm
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vcomm-backend
  template:
    metadata:
      labels:
        app: vcomm-backend
    spec:
      containers:
        - name: backend
          image: vcomm/backend:latest
          ports:
            - containerPort: 3001
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: vcomm-secrets
                  key: database-url
            - name: REDIS_URL
              value: redis://vcomm-redis:6379
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: vcomm-secrets
                  key: jwt-secret
          resources:
            limits:
              cpu: 2
              memory: 4Gi
            requests:
              cpu: 500m
              memory: 1Gi
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: vcomm-backend
  namespace: vcomm
spec:
  selector:
    app: vcomm-backend
  ports:
    - port: 3001
      targetPort: 3001
```

## 🏗️ Terraform Deployment

### Infrastructure as Code

V-COMM provides Terraform modules for deploying to major cloud providers.

### AWS Deployment

```hcl
# main.tf
provider "aws" {
  region = var.region
}

module "vcomm" {
  source = "github.com/vantisCorp/VChat//infra/terraform/modules/vcomm"

  region     = var.region
  environment = var.environment
  
  # VPC Configuration
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
  
  # Database
  database_instance_class = "db.r6g.xlarge"
  database_storage        = 100
  
  # Cache
  cache_node_type = "cache.r6g.large"
  cache_nodes     = 2
  
  # Kubernetes
  cluster_version    = "1.28"
  cluster_node_count = 3
  node_instance_type = "m6i.xlarge"
  
  # Domain
  domain_name = "vcomm.yourdomain.com"
  
  tags = {
    Environment = var.environment
    Project     = "V-COMM"
  }
}
```

### Terraform Variables

```hcl
# variables.tf
variable "region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  default     = "production"
}

variable "domain_name" {
  description = "Domain name for V-COMM"
  type        = string
}
```

### Deploy with Terraform

```bash
# Initialize
terraform init

# Plan
terraform plan -var="domain_name=vcomm.yourdomain.com"

# Apply
terraform apply -var="domain_name=vcomm.yourdomain.com"
```

## 🌐 Cloud-Specific Deployments

### AWS EKS

```bash
# Create EKS cluster
eksctl create cluster -f infra/eks/cluster.yaml

# Configure kubectl
aws eks update-kubeconfig --name vcomm-cluster --region us-east-1

# Deploy
kubectl apply -f kubernetes/
```

### Google GKE

```bash
# Create GKE cluster
gcloud container clusters create vcomm-cluster \
  --num-nodes=3 \
  --machine-type=e2-standard-4 \
  --region=us-central1

# Get credentials
gcloud container clusters get-credentials vcomm-cluster --region us-central1

# Deploy
kubectl apply -f kubernetes/
```

### Azure AKS

```bash
# Create AKS cluster
az aks create \
  --resource-group vcomm-rg \
  --name vcomm-cluster \
  --node-count 3 \
  --node-vm-size Standard_D4s_v3

# Get credentials
az aks get-credentials --resource-group vcomm-rg --name vcomm-cluster

# Deploy
kubectl apply -f kubernetes/
```

## 🔧 Configuration

### Nginx Configuration

```nginx
# infra/nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name vcomm.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name vcomm.yourdomain.com;

        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;
        ssl_protocols TLSv1.3 TLSv1.2;
        ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256';
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

        # API proxy
        location /api/ {
            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket proxy
        location /ws {
            proxy_pass http://backend/ws;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 86400;
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

## 🔒 Security Configuration

### TLS Certificates

Using Let's Encrypt with cert-manager:

```yaml
# cert-manager-issuer.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: security@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

### Network Policies

```yaml
# kubernetes/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: vcomm-network-policy
  namespace: vcomm
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3001
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: UDP
          port: 53
    - to:
        - podSelector:
            matchLabels:
              app: postgresql
      ports:
        - protocol: TCP
          port: 5432
```

## 📊 Monitoring

### Prometheus Configuration

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'vcomm-backend'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - vcomm
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: vcomm-backend
```

### Grafana Dashboard

Import the V-COMM dashboard from `infra/monitoring/grafana-dashboard.json`.

## 🔄 Updates & Maintenance

### Rolling Updates

```bash
# Update backend image
kubectl set image deployment/vcomm-backend \
  backend=vcomm/backend:v1.1.0 \
  -n vcomm

# Monitor rollout
kubectl rollout status deployment/vcomm-backend -n vcomm
```

### Database Migrations

```bash
# Run migrations
kubectl exec -it deployment/vcomm-backend -n vcomm -- \
  ./vcomm migrate
```

### Backup

```bash
# Backup PostgreSQL
kubectl exec -it postgresql-0 -n vcomm -- \
  pg_dump -U vcomm vcomm > backup_$(date +%Y%m%d).sql

# Backup to S3
aws s3 cp backup_$(date +%Y%m%d).sql s3://vcomm-backups/
```

## 🐛 Troubleshooting

### Common Issues

**Pod not starting**:
```bash
kubectl describe pod <pod-name> -n vcomm
kubectl logs <pod-name> -n vcomm
```

**Database connection issues**:
```bash
kubectl exec -it postgresql-0 -n vcomm -- psql -U vcomm -c "SELECT 1"
```

**Certificate issues**:
```bash
kubectl describe certificate vcomm-tls -n vcomm
```

---

**Last Updated**: March 2025  
**Version**: 1.0.0-alpha