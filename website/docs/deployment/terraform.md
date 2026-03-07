---
sidebar_position: 3
title: Terraform Infrastructure
description: Deploy V-COMM infrastructure using Terraform with Infrastructure as Code best practices
keywords: [terraform, iac, infrastructure, aws, azure, gcp, deployment]
tags: [deployment, terraform, infrastructure]
---

# Terraform Infrastructure

## Overview

V-COMM provides production-ready Terraform modules for deploying complete infrastructure on major cloud providers. This guide covers Infrastructure as Code (IaC) best practices and multi-cloud deployment strategies.

## Supported Cloud Providers

| Provider | Module | Status |
|----------|--------|--------|
| AWS | `vcomm-aws` | ✅ Production Ready |
| Azure | `vcomm-azure` | ✅ Production Ready |
| GCP | `vcomm-gcp` | ✅ Production Ready |
| DigitalOcean | `vcomm-do` | 🚧 Beta |

## Prerequisites

### Install Terraform

```bash
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.7.0/terraform_1.7.0_linux_amd64.zip
unzip terraform_1.7.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Verify installation
terraform version
```

### Configure Cloud Credentials

```bash
# AWS
aws configure

# Azure
az login

# GCP
gcloud auth application-default login
```

## AWS Deployment

### Module Configuration

```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "vcomm-terraform-state"
    key            = "vcomm/production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "vcomm-terraform-locks"
  }
}

provider "aws" {
  region = var.region
  
  default_tags {
    tags = {
      Project     = "V-COMM"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

module "vcomm" {
  source = "github.com/vcomm/terraform-aws-vcomm"
  
  # Environment
  environment = var.environment
  region      = var.region
  
  # Network
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
  
  # Cluster
  cluster_version    = "1.30"
  cluster_name       = "vcomm-${var.environment}"
  
  # Node groups
  node_groups = {
    general = {
      instance_types = ["m6i.xlarge"]
      min_size       = 3
      max_size       = 10
      desired_size   = 3
    }
    realtime = {
      instance_types = ["c6i.2xlarge"]
      min_size       = 2
      max_size       = 20
      desired_size   = 2
      labels = {
        workload = "realtime"
      }
    }
  }
  
  # Database
  database = {
    engine         = "postgres"
    engine_version = "16.2"
    instance_class = "db.r6g.xlarge"
    multi_az       = true
    storage        = 500
  }
  
  # Redis
  redis = {
    node_type      = "cache.r6g.large"
    num_cache_nodes = 3
    multi_az       = true
  }
  
  # Storage
  storage = {
    bucket_name = "vcomm-files-${var.environment}"
    size_gb     = 1000
  }
  
  # Domain
  domain = var.domain
  enable_cdn = true
  
  # Monitoring
  enable_monitoring = true
  log_retention     = 30
  
  # Security
  enable_waf        = true
  enable_guardduty = true
  
  tags = var.tags
}
```

### Variables

```hcl
# variables.tf
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain" {
  description = "Domain name for V-COMM"
  type        = string
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
```

### Outputs

```hcl
# outputs.tf
output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.vcomm.cluster_endpoint
}

output "database_endpoint" {
  description = "RDS endpoint"
  value       = module.vcomm.database_endpoint
}

output "redis_endpoint" {
  description = "ElastiCache endpoint"
  value       = module.vcomm.redis_endpoint
}

output "api_url" {
  description = "V-COMM API URL"
  value       = module.vcomm.api_url
}

output "kubeconfig_command" {
  description = "Command to update kubeconfig"
  value       = module.vcomm.kubeconfig_command
}
```

## Azure Deployment

### Module Configuration

```hcl
# main.tf for Azure
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  
  backend "azurerm" {
    resource_group_name  = "vcomm-terraform"
    storage_account_name = "vcommterraformstate"
    container_name       = "tfstate"
    key                  = "vcomm-production.tfstate"
  }
}

provider "azurerm" {
  features {}
  
  skip_provider_registration = true
}

module "vcomm_azure" {
  source = "github.com/vcomm/terraform-azure-vcomm"
  
  # Resource Group
  resource_group_name = "vcomm-${var.environment}"
  location            = var.location
  
  # Network
  vnet_cidr           = "10.0.0.0/16"
  subnet_cidrs = {
    aks       = "10.0.0.0/20"
    database  = "10.0.16.0/24"
    redis     = "10.0.17.0/24"
    private   = "10.0.32.0/20"
  }
  
  # AKS Cluster
  aks_cluster = {
    kubernetes_version = "1.30"
    node_count         = 3
    node_size          = "Standard_D4s_v5"
    enable_auto_scaling = true
    min_count          = 3
    max_count          = 10
  }
  
  # Database (Azure PostgreSQL)
  database = {
    sku_name      = "GP_Standard_D4s_v3"
    storage_mb    = 512000
    version       = "16"
    geo_redundant = true
  }
  
  # Redis (Azure Cache)
  redis = {
    sku         = "Premium"
    capacity    = 2
    family      = "C"
  }
  
  # Storage
  storage = {
    account_type = "Standard_GRS"
    account_tier = "Standard"
  }
  
  # Domain and SSL
  domain = var.domain
  
  tags = var.tags
}
```

## GCP Deployment

### Module Configuration

```hcl
# main.tf for GCP
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  backend "gcs" {
    bucket = "vcomm-terraform-state"
    prefix = "vcomm/production"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "vcomm_gcp" {
  source = "github.com/vcomm/terraform-gcp-vcomm"
  
  project_id = var.project_id
  region     = var.region
  
  # Network
  vpc_name    = "vcomm-vpc"
  subnet_cidr = "10.0.0.0/16"
  
  # GKE Cluster
  gke_cluster = {
    name               = "vcomm-${var.environment}"
    kubernetes_version = "1.30"
    node_count         = 3
    machine_type       = "e2-standard-4"
    disk_size_gb       = 100
    auto_scaling = {
      min_node_count = 3
      max_node_count = 10
    }
  }
  
  # Cloud SQL (PostgreSQL)
  cloud_sql = {
    tier            = "db-custom-4-16384"
    disk_size_gb    = 500
    disk_type       = "PD_SSD"
    high_availability = true
  }
  
  # Memorystore (Redis)
  redis = {
    tier        = "STANDARD_HA"
    memory_size = 8
  }
  
  # Cloud Storage
  storage = {
    location = var.region
    class    = "STANDARD"
  }
  
  # Domain
  domain = var.domain
  
  # Monitoring
  enable_monitoring = true
  
  labels = var.labels
}
```

## Deployment Workflow

### Initialize and Plan

```bash
# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan changes
terraform plan -out=tfplan

# Review plan
terraform show tfplan
```

### Apply Changes

```bash
# Apply changes
terraform apply tfplan

# Or apply with auto-approve (use with caution)
terraform apply -auto-approve
```

### Destroy Resources

```bash
# Destroy all resources (use with extreme caution)
terraform destroy

# Destroy specific resource
terraform destroy -target=module.vcomm.aws_db_instance.main
```

## Workspaces

### Managing Multiple Environments

```bash
# Create workspaces
terraform workspace new development
terraform workspace new staging
terraform workspace new production

# Select workspace
terraform workspace select production

# List workspaces
terraform workspace list

# Use in configuration
locals {
  environment = terraform.workspace
}
```

### Environment-Specific Variables

```hcl
# environments/production.tfvars
environment  = "production"
region       = "us-east-1"
instance_type = "m6i.xlarge"
node_count   = 5

# environments/staging.tfvars
environment  = "staging"
region       = "us-east-1"
instance_type = "m6i.large"
node_count   = 2
```

```bash
# Apply with specific variables
terraform apply -var-file="environments/production.tfvars"
```

## State Management

### Remote State

```hcl
# S3 backend with state locking
terraform {
  backend "s3" {
    bucket         = "vcomm-terraform-state"
    key            = "vcomm/production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

### State Commands

```bash
# List resources in state
terraform state list

# Show specific resource
terraform state show module.vcomm.aws_db_instance.main

# Move resource
terraform state mv module.vcomm.aws_db_instance.main module.vcomm.database.main

# Remove resource from state
terraform state rm module.vcomm.aws_db_instance.old

# Import existing resource
terraform import module.vcomm.aws_s3_bucket.files existing-bucket-name
```

## Secrets Management

### Using HashiCorp Vault

```hcl
data "vault_generic_secret" "vcomm_secrets" {
  path = "secret/vcomm/production"
}

module "vcomm" {
  # ... other config
  
  database_password = data.vault_generic_secret.vcomm_secrets.data["database_password"]
  jwt_secret        = data.vault_generic_secret.vcomm_secrets.data["jwt_secret"]
}
```

### Using AWS Secrets Manager

```hcl
data "aws_secretsmanager_secret_version" "vcomm_secrets" {
  secret_id = "vcomm/production"
}

module "vcomm" {
  # ... other config
  
  database_password = jsondecode(data.aws_secretsmanager_secret_version.vcomm_secrets.secret_string)["database_password"]
}
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.7.0
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Terraform Init
        run: terraform init
      
      - name: Terraform Plan
        run: terraform plan -out=tfplan
        continue-on-error: true
      
      - name: Terraform Apply
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: terraform apply -auto-approve tfplan
```

## Best Practices

### Code Organization

```
terraform/
├── modules/
│   ├── vpc/
│   ├── eks/
│   ├── rds/
│   └── redis/
├── environments/
│   ├── development/
│   ├── staging/
│   └── production/
├── shared/
│   └── remote-state/
└── policies/
    └── guardrails/
```

### Naming Conventions

```hcl
# Resource naming
locals {
  name_prefix = "${var.project}-${var.environment}"
  
  name = {
    vpc         = "${local.name_prefix}-vpc"
    cluster     = "${local.name_prefix}-eks"
    database    = "${local.name_prefix}-db"
    redis       = "${local.name_prefix}-redis"
    bucket      = "${var.project}-${var.environment}-files"
  }
}
```

## See Also

- [Kubernetes Deployment](./kubernetes)
- [Production Deployment](./production)
- [Docker Deployment](./docker)
- [Security Best Practices](../security/best-practices)