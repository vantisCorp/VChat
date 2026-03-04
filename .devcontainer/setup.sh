#!/bin/bash
set -e

echo "🚀 Setting up V-COMM Development Environment..."

# Update package lists
echo "📦 Updating package lists..."
sudo apt-get update -y

# Install system dependencies
echo "🔧 Installing system dependencies..."
sudo apt-get install -y \
    build-essential \
    cmake \
    pkg-config \
    libssl-dev \
    libfreetype6-dev \
    libexpat1-dev \
    libxcb-composite0-dev \
    libxkbcommon-dev \
    libwayland-dev \
    libwayland-egl-dev \
    libinput-dev \
    libpulse-dev \
    libpipewire-0.3-dev \
    libasound2-dev \
    libudev-dev \
    libvulkan-dev \
    libclang-dev \
    protobuf-compiler \
    ripgrep \
    fd-find \
    bat \
    exa \
    htop \
    neofetch \
    tree \
    jq \
    curl \
    wget \
    git \
    unzip \
    zip \
    file

# Install pnpm
echo "📦 Installing pnpm..."
npm install -g pnpm@8.14.1

# Install Turbo
echo "⚡ Installing Turbo..."
pnpm install -g turbo

# Install Gitleaks
echo "🔒 Installing Gitleaks..."
wget -qO - https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_8.18.0_linux_x64.tar.gz | tar -xz
sudo mv gitleaks /usr/local/bin/
sudo chmod +x /usr/local/bin/gitleaks

# Install Terraform
echo "🌍 Installing Terraform..."
wget -qO- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt-get update -y
sudo apt-get install -y terraform

# Install Wasmtime
echo "🦀 Installing Wasmtime..."
curl https://wasmtime.dev/install.sh -sSf | bash

# Install Rust WASM tools
echo "🦀 Installing Rust WASM tools..."
cargo install wasm-pack
cargo install wasm-bindgen-cli
cargo install cargo-tarpaulin

# Install Python tools
echo "🐍 Installing Python tools..."
pip3 install --upgrade pip
pip3 install \
    black \
    pylint \
    mypy \
    pytest \
    pytest-cov \
    pytest-asyncio \
    flake8 \
    isort \
    bandit \
    safety

# Install security tools
echo "🛡️ Installing security tools..."
cargo install cargo-audit
cargo install cargo-outdated
npm install -g snyk
npm install -g trivy

# Install formatting tools
echo "✨ Installing formatting tools..."
npm install -g prettier
npm install -g eslint
npm install -g @commitlint/cli @commitlint/config-conventional

# Install development tools
echo "🛠️ Installing development tools..."
npm install -g nodemon
npm install -g ts-node
npm install -g typescript
npm install -g @vercel/ncc

# Install chaos testing tools
echo "🌪️ Installing chaos testing tools..."
pip3 install chaosmonkey
pip3 install locust
pip3 install toxiproxy

# Install WASM sandbox tools
echo "🦀 Installing WASM sandbox tools..."
cargo install wasmtime-cli
cargo install wasm-sandbox

# Install IPFS tools
echo "🌐 Installing IPFS tools..."
wget -q https://dist.ipfs.io/go-ipfs/v0.24.0/go-ipfs_v0.24.0_linux-amd64.tar.gz
tar -xvzf go-ipfs_v0.24.0_linux-amd64.tar.gz
sudo mv go-ipfs/ipfs /usr/local/bin/
rm -rf go-ipfs*

# Install Rust analyzer components
echo "🦀 Setting up Rust analyzer..."
rustup component add rust-analyzer rust-src rust-std-wasm32-unknown-unknown rust-std-wasm32-wasi

# Install VS Code extensions (alternative method)
echo "📝 Installing VS Code extensions..."
code-server --install-extension dbaeumer.vscode-eslint || true
code-server --install-extension esbenp.prettier-vscode || true
code-server --install-extension rust-lang.rust-analyzer || true
code-server --install-extension EditorConfig.EditorConfig || true

# Setup git configuration
echo "⚙️ Setting up git configuration..."
git config --global core.eol lf
git config --global core.autocrlf input
git config --global core.whitespace trailing-space,space-before-tab
git config --global pull.rebase true
git config --global init.defaultBranch main
git config --global commit.gpgsign false

# Install project dependencies
echo "📦 Installing project dependencies..."
pnpm install --frozen-lockfile

# Build Rust packages
echo "🦀 Building Rust packages..."
cargo build --release 2>/dev/null || cargo build

# Setup pre-commit hooks
echo "🔗 Setting up pre-commit hooks..."
npx husky install

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p reports
mkdir -p chaos-reports
mkdir -p .vcomm/cache
mkdir -p .vcomm/temp
mkdir -p .vcomm/logs

# Setup IPFS
echo "🌐 Setting up IPFS..."
ipfs init
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "GET", "POST"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["Authorization"]'
ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080

# Display system information
echo "🖥️ System Information:"
neofetch || echo "neofetch not available"

# Display installed versions
echo "📋 Installed Versions:"
echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Rust: $(rustc --version)"
echo "Cargo: $(cargo --version)"
echo "Python: $(python3 --version)"
echo "Terraform: $(terraform --version)"
echo "Gitleaks: $(gitleaks --version)"
echo "Turbo: $(turbo --version)"

# Display network information
echo "🌐 Network Information:"
ip addr show || echo "ip addr not available"

# Display disk usage
echo "💾 Disk Usage:"
df -h

# Display memory information
echo "🧠 Memory Information:"
free -h

echo "✅ V-COMM Development Environment setup complete!"
echo "🎉 You're ready to start developing!"
echo ""
echo "📚 Quick Start Commands:"
echo "  pnpm dev              - Start development server"
echo "  pnpm build            - Build all packages"
echo "  pnpm test             - Run tests"
echo "  pnpm lint             - Run linters"
echo "  pnpm run security:all - Run security checks"
echo ""
echo "🔒 Security Commands:"
echo "  pnpm run security:audit  - Run security audit"
echo "  pnpm run security:gitleaks - Run secret detection"
echo ""
echo "🦀 Rust Commands:"
echo "  pnpm run cargo:build    - Build Rust packages"
echo "  pnpm run cargo:test     - Run Rust tests"
echo "  pnpm run cargo:clippy   - Run Rust clippy"
echo ""
echo "📚 Documentation:"
echo "  pnpm run docs:build     - Build documentation"
echo "  pnpm run docs:serve     - Serve documentation"
echo ""
echo "🌪️ Chaos Testing:"
echo "  pnpm run chaos:test     - Run chaos tests"