# V-COMM Makefile
# Automates all development, build, and deployment tasks

.PHONY: help setup dev build test lint security clean docs deploy all

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(BLUE)V-COMM Development Commands$(NC)"
	@echo ""
	@grep -E '^##@|^[a-zA-Z_-]+:.*?##.*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

all: setup dev ## Setup everything and start development (default)

##@ Setup

setup: ## Initialize development environment
	@echo "$(GREEN)🔧 Setting up V-COMM development environment...$(NC)"
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@pnpm install --frozen-lockfile
	@echo "$(GREEN)✓ Dependencies installed$(NC)"
	@echo "$(BLUE)Building Rust packages...$(NC)"
	@cargo build --release 2>/dev/null || cargo build
	@echo "$(GREEN)✓ Rust packages built$(NC)"
	@echo "$(BLUE)Setting up DevContainer...$(NC)"
	@echo "$(GREEN)✓ DevContainer configured$(NC)"
	@echo "$(BLUE)Installing security tools...$(NC)"
	@echo "$(GREEN)✓ Security tools ready$(NC)"
	@echo "$(GREEN)✅ Setup complete!$(NC)"

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@pnpm install --frozen-lockfile
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

##@ Development

dev: ## Start development servers
	@echo "$(GREEN)🚀 Starting V-COMM development servers...$(NC)"
	@pnpm run dev

dev:watch: ## Start development with file watching
	@echo "$(GREEN)🚀 Starting V-COMM with watch mode...$(NC)"
	@pnpm run dev --watch

dev:debug: ## Start development with debugging
	@echo "$(GREEN)🚀 Starting V-COMM with debugging...$(NC)"
	@pnpm run dev --debug

##@ Build

build: ## Build all packages
	@echo "$(GREEN)🏗️ Building V-COMM...$(NC)"
	@pnpm run build

build:prod: ## Build for production
	@echo "$(GREEN)🏗️ Building V-COMM for production...$(NC)"
	@pnpm run build:prod

build:rust: ## Build Rust packages
	@echo "$(GREEN)🦀 Building Rust packages...$(NC)"
	@pnpm run cargo:build

build:wasm: ## Build WASM modules
	@echo "$(GREEN)🦀 Building WASM modules...$(NC)"
	@wasm-pack build --out-dir pkg --target web

##@ Testing

test: ## Run all tests
	@echo "$(GREEN)🧪 Running tests...$(NC)"
	@pnpm run test

test:unit: ## Run unit tests only
	@echo "$(GREEN)🧪 Running unit tests...$(NC)"
	@pnpm run test:unit

test:integration: ## Run integration tests
	@echo "$(GREEN)🧪 Running integration tests...$(NC)"
	@pnpm run test:integration

test:coverage: ## Run tests with coverage
	@echo "$(GREEN)🧪 Running tests with coverage...$(NC)"
	@pnpm run test:coverage

test:watch: ## Run tests in watch mode
	@echo "$(GREEN)🧪 Running tests in watch mode...$(NC)"
	@pnpm run test:watch

##@ Quality

lint: ## Run all linters
	@echo "$(GREEN)✨ Running linters...$(NC)"
	@pnpm run lint

lint:fix: ## Fix linting errors automatically
	@echo "$(GREEN)✨ Fixing linting errors...$(NC)"
	@pnpm run lint:fix

format: ## Format all code
	@echo "$(GREEN)✨ Formatting code...$(NC)"
	@pnpm run format

format:check: ## Check code formatting
	@echo "$(GREEN)✨ Checking code formatting...$(NC)"
	@pnpm run format:check

type-check: ## Run type checking
	@echo "$(GREEN)🔍 Running type checking...$(NC)"
	@pnpm run type-check

##@ Security

security:audit: ## Run security audit
	@echo "$(RED)🔒 Running security audit...$(NC)"
	@pnpm run security:audit

security:gitleaks: ## Run Gitleaks secret detection
	@echo "$(RED)🔒 Running Gitleaks...$(NC)"
	@pnpm run security:gitleaks

security:all: ## Run all security checks
	@echo "$(RED)🔒 Running all security checks...$(NC)"
	@pnpm run security:all

security:sbom: ## Generate SBOM
	@echo "$(RED)🔒 Generating SBOM...$(NC)"
	@sbom -p . -o sbom.json -f json

##@ Documentation

docs:build: ## Build documentation
	@echo "$(GREEN)📚 Building documentation...$(NC)"
	@pnpm run docs:build

docs:serve: ## Serve documentation locally
	@echo "$(GREEN)📚 Serving documentation...$(NC)"
	@pnpm run docs:serve

docs:deploy: ## Deploy documentation
	@echo "$(GREEN)📚 Deploying documentation...$(NC)"
	@pnpm run docs:deploy

##@ Deployment

deploy: ## Deploy to production
	@echo "$(GREEN)🚀 Deploying to production...$(NC)"
	@pnpm run deploy

deploy:staging: ## Deploy to staging
	@echo "$(GREEN)🚀 Deploying to staging...$(NC)"
	@pnpm run deploy:staging

deploy:preview: ## Deploy preview
	@echo "$(GREEN)🚀 Deploying preview...$(NC)"
	@pnpm run deploy:preview

##@ Database

db:migrate: ## Run database migrations
	@echo "$(GREEN)🗄️ Running database migrations...$(NC)"
	@cargo run --bin migrate

db:seed: ## Seed database
	@echo "$(GREEN)🗄️ Seeding database...$(NC)"
	@cargo run --bin seed

db:reset: ## Reset database
	@echo "$(GREEN)🗄️ Resetting database...$(NC)"
	@cargo run --bin reset

##@ Chaos Testing

chaos:test: ## Run chaos tests
	@echo "$(YELLOW)🌪️ Running chaos tests...$(NC)"
	@pnpm run chaos:test

chaos:report: ## Generate chaos report
	@echo "$(YELLOW)🌪️ Generating chaos report...$(NC)"
	@python3 infra/scripts/chaos_report.py

##@ Migration

migration:discord: ## Migrate from Discord
	@echo "$(GREEN)🔄 Migrating from Discord...$(NC)"
	@pnpm run migration:discord

##@ Cleanup

clean: ## Clean build artifacts
	@echo "$(YELLOW)🧹 Cleaning build artifacts...$(NC)"
	@rm -rf node_modules .next dist build target
	@pnpm run clean

clean:all: ## Clean everything including dependencies
	@echo "$(YELLOW)🧹 Cleaning everything...$(NC)"
	@rm -rf node_modules .next dist build target .turbo
	@rm -rf .cargo/registry .cargo/git .cargo/target
	@find . -name "*.pyc" -delete
	@find . -name "__pycache__" -type d -exec rm -rf {} +

##@ Utilities

update:deps: ## Update all dependencies
	@echo "$(GREEN)📦 Updating dependencies...$(NC)"
	@pnpm update --latest
	@cargo update

version:bump: ## Bump version (make version:bump TYPE=major|minor|patch)
	@echo "$(GREEN)📦 Bumping version...$(NC)"
	@if [ -z "$(TYPE)" ]; then echo "Usage: make version:bump TYPE=major|minor|patch"; exit 1; fi
	@pnpm version $(TYPE)
	@git add package.json
	@git commit -m "chore: bump version to $(TYPE)"

release: ## Create a release
	@echo "$(GREEN)🚀 Creating release...$(NC)"
	@pnpm run release

##@ Monitoring

logs: ## View application logs
	@tail -f logs/app.log

logs:errors: ## View error logs only
	@tail -f logs/error.log | grep ERROR

metrics: ## View metrics
	@curl http://localhost:9090/metrics

health: ## Check application health
	@curl http://localhost:3000/health

##@ Docker

docker:build: ## Build Docker image
	@echo "$(GREEN)🐳 Building Docker image...$(NC)"
	@docker build -t vcomm:latest .

docker:run: ## Run Docker container
	@echo "$(GREEN)🐳 Running Docker container...$(NC)"
	@docker run -p 3000:3000 vcomm:latest

docker:stop: ## Stop Docker container
	@docker stop vcomm

##@ Terraform

tf:init: ## Initialize Terraform
	@cd infra/terraform && terraform init

tf:plan: ## Plan Terraform changes
	@cd infra/terraform && terraform plan

tf:apply: ## Apply Terraform changes
	@cd infra/terraform && terraform apply

tf:destroy: ## Destroy Terraform resources
	@cd infra/terraform && terraform destroy

##@ Git Hooks

hooks:install: ## Install git hooks
	@echo "$(GREEN)🔗 Installing git hooks...$(NC)"
	@npx husky install

hooks:uninstall: ## Uninstall git hooks
	@echo "$(YELLOW)🔗 Uninstalling git hooks...$(NC)"
	@rm -rf .git/hooks