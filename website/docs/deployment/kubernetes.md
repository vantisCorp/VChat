---
sidebar_position: 2
title: Kubernetes Deployment
description: Comprehensive guide to deploying V-COMM on Kubernetes with Helm charts
keywords: [kubernetes, k8s, helm, deployment, containers, orchestration]
tags: [deployment, kubernetes]
---

# Kubernetes Deployment

## Overview

V-COMM provides production-ready Kubernetes manifests and Helm charts for deploying on any Kubernetes cluster. This guide covers deploying V-COMM with high availability, scalability, and security best practices.

## Prerequisites

### Cluster Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Kubernetes | 1.28+ | 1.30+ |
| Nodes | 3 | 5+ |
| CPU | 4 cores | 16+ cores |
| Memory | 16 GB | 64+ GB |
| Storage | 100 GB SSD | 500+ GB SSD |

### Required Tools

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install Helm 3
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify installations
kubectl version --client
helm version
```

### Required Components

- **Ingress Controller**: nginx-ingress, traefik, or Istio gateway
- **Certificate Manager**: cert-manager for TLS certificates
- **Storage Class**: For persistent volumes (e.g., gp3, standard)
- **Secret Management**: HashiCorp Vault or Sealed Secrets

## Helm Chart Installation

### Add V-COMM Helm Repository

```bash
# Add Helm repository
helm repo add vcomm https://helm.vcomm.io
helm repo update

# Search for available charts
helm search repo vcomm
```

### Basic Installation

```bash
# Create namespace
kubectl create namespace vcomm

# Install with default values
helm install vcomm vcomm/vcomm \
  --namespace vcomm \
  --set global.domain=vcomm.example.com
```

### Production Configuration

```yaml
# values-production.yaml
global:
  domain: vcomm.example.com
  environment: production
  imageRegistry: registry.vcomm.io
  imageTag: "v1.0.0"

# Core services
core:
  replicas: 3
  resources:
    requests:
      cpu: "500m"
      memory: "1Gi"
    limits:
      cpu: "2000m"
      memory: "4Gi"
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilization: 70

# Authentication service
auth:
  replicas: 2
  resources:
    requests:
      cpu: "250m"
      memory: "512Mi"
    limits:
      cpu: "1000m"
      memory: "2Gi"

# Real-time (WebSocket) service
realtime:
  replicas: 3
  resources:
    requests:
      cpu: "500m"
      memory: "1Gi"
    limits:
      cpu: "2000m"
      memory: "4Gi"

# API Gateway
gateway:
  replicas: 2
  service:
    type: ClusterIP
  ingress:
    enabled: true
    className: nginx
    annotations:
      cert-manager.io/cluster-issuer: letsencrypt-prod
      nginx.ingress.kubernetes.io/proxy-body-size: "100m"
    hosts:
      - host: api.vcomm.example.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: vcomm-api-tls
        hosts:
          - api.vcomm.example.com

# Database (PostgreSQL)
postgresql:
  enabled: true
  architecture: replication
  primary:
    persistence:
      size: 100Gi
      storageClass: gp3
  readReplicas:
    replicaCount: 2
    persistence:
      size: 100Gi
      storageClass: gp3

# Redis
redis:
  enabled: true
  architecture: replication
  replica:
    replicaCount: 2
  auth:
    enabled: true
  persistence:
    enabled: true
    size: 20Gi

# MinIO (S3-compatible storage)
minio:
  enabled: true
  mode: distributed
  replicas: 4
  persistence:
    size: 500Gi
    storageClass: gp3

# Monitoring
monitoring:
  enabled: true
  prometheus:
    enabled: true
  grafana:
    enabled: true
    adminPassword: "${GRAFANA_PASSWORD}"
  alertmanager:
    enabled: true

# Logging
logging:
  enabled: true
  elasticsearch:
    enabled: true
    replicas: 3
  kibana:
    enabled: true
```

### Install Production Stack

```bash
# Create secrets first
kubectl create secret generic vcomm-secrets \
  --from-literal=database-password=$(openssl rand -base64 32) \
  --from-literal=redis-password=$(openssl rand -base64 32) \
  --from-literal=jwt-secret=$(openssl rand -base64 64) \
  --from-literal=encryption-key=$(openssl rand -base64 32) \
  --namespace=vcomm

# Install with production values
helm install vcomm vcomm/vcomm \
  --namespace vcomm \
  --values values-production.yaml \
  --timeout 10m \
  --wait
```

## High Availability Configuration

### Pod Disruption Budgets

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: vcomm-core-pdb
  namespace: vcomm
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app.kubernetes.io/name: vcomm-core
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: vcomm-realtime-pdb
  namespace: vcomm
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app.kubernetes.io/name: vcomm-realtime
```

### Node Affinity

```yaml
# Spread pods across nodes and availability zones
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app.kubernetes.io/name
                operator: In
                values:
                  - vcomm-core
          topologyKey: kubernetes.io/hostname
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app.kubernetes.io/name
                operator: In
                values:
                  - vcomm-core
          topologyKey: topology.kubernetes.io/zone
```

### Topology Spread Constraints

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app.kubernetes.io/name: vcomm-core
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels:
        app.kubernetes.io/name: vcomm-core
```

## Networking

### Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: vcomm-ingress
  namespace: vcomm
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/websocket-services: "vcomm-realtime"
spec:
  tls:
    - hosts:
        - vcomm.example.com
        - api.vcomm.example.com
      secretName: vcomm-tls
  rules:
    - host: vcomm.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: vcomm-frontend
                port:
                  number: 80
    - host: api.vcomm.example.com
      http:
        paths:
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: vcomm-realtime
                port:
                  number: 8081
          - path: /
            pathType: Prefix
            backend:
              service:
                name: vcomm-gateway
                port:
                  number: 8080
```

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: vcomm-network-policy
  namespace: vcomm
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/part-of: vcomm
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: vcomm-ingress
      ports:
        - protocol: TCP
          port: 8080
        - protocol: TCP
          port: 8081
  egress:
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: postgresql
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: redis
      ports:
        - protocol: TCP
          port: 6379
```

## Storage

### Persistent Volume Configuration

```yaml
# Storage class for SSD volumes
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: vcomm-fast
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  encrypted: "true"
  kmsKeyId: "arn:aws:kms:region:account:key/key-id"
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
```

### Backup Configuration

```yaml
# Velero backup schedule
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: vcomm-daily-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  template:
    includedNamespaces:
      - vcomm
    excludedResources:
      - events
      - pods
    snapshotVolumes: true
    ttl: 720h  # 30 days retention
```

## Monitoring

### Prometheus ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: vcomm-monitor
  namespace: vcomm
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app.kubernetes.io/part-of: vcomm
  endpoints:
    - port: metrics
      path: /metrics
      interval: 30s
```

### Grafana Dashboard

```bash
# Import V-COMM dashboards
kubectl create configmap vcomm-dashboards \
  --from-file=dashboards/ \
  --namespace monitoring

# Label for Grafana to pick up
kubectl label configmap vcomm-dashboards \
  grafana_dashboard="1" \
  --namespace monitoring
```

## Upgrading

### Rolling Updates

```bash
# Check current release
helm list -n vcomm

# Upgrade with new values
helm upgrade vcomm vcomm/vcomm \
  --namespace vcomm \
  --values values-production.yaml \
  --set global.imageTag=v1.1.0 \
  --wait

# Monitor rollout
kubectl rollout status deployment/vcomm-core -n vcomm
```

### Rollback

```bash
# Check history
helm history vcomm -n vcomm

# Rollback to previous version
helm rollback vcomm -n vcomm

# Rollback to specific revision
helm rollback vcomm 2 -n vcomm
```

## Scaling

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: vcomm-core-hpa
  namespace: vcomm
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vcomm-core
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Vertical Pod Autoscaler

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: vcomm-core-vpa
  namespace: vcomm
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vcomm-core
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
      - containerName: vcomm-core
        minAllowed:
          cpu: 250m
          memory: 512Mi
        maxAllowed:
          cpu: 4000m
          memory: 8Gi
        controlledResources: ["cpu", "memory"]
```

## Troubleshooting

### Common Issues

```bash
# Check pod status
kubectl get pods -n vcomm
kubectl describe pod <pod-name> -n vcomm

# Check logs
kubectl logs -f deployment/vcomm-core -n vcomm

# Check events
kubectl get events -n vcomm --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n vcomm
kubectl top nodes
```

### Debug Mode

```bash
# Enable debug logging
kubectl set env deployment/vcomm-core LOG_LEVEL=debug -n vcomm

# Run debug container
kubectl run -i --tty debug --image=busybox --restart=Never -- sh

# Port forward for local debugging
kubectl port-forward svc/vcomm-gateway 8080:8080 -n vcomm
```

## See Also

- [Docker Deployment](./docker)
- [Production Deployment](./production)
- [Architecture Overview](../architecture/overview)
- [Security Best Practices](../security/best-practices)