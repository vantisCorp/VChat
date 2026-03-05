# 🤝 Contributing to V-COMM

Thank you for your interest in contributing to V-COMM! We welcome contributions from the community and are grateful for any help.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

Examples of behavior that contributes to a positive environment:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Git**: Version control system
- **Node.js**: 20.x or later
- **Rust**: 1.75 or later (with Ferrocene compiler)
- **pnpm**: 8.x or later
- **Docker**: For containerized development

### Setup Development Environment

```bash
# 1. Fork the repository
# Click "Fork" on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/VChat.git
cd VChat

# 3. Add upstream remote
git remote add upstream https://github.com/vantisCorp/VChat.git

# 4. Install dependencies
make setup

# 5. Start development server
make dev
```

## 🔧 Development Workflow

### Branch Naming

Follow this convention for branch names:

```
feature/description           # New feature
fix/description              # Bug fix
refactor/description         # Code refactoring
docs/description             # Documentation update
security/description         # Security fix
test/description             # Test additions
```

### Conventional Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/changes
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks
- `security`: Security fixes
- `revert`: Revert previous commit

**Examples**:
```bash
feat(auth): add FIDO2 authentication support
fix(crypto): resolve memory leak in encryption module
docs(readme): update installation instructions
perf(networking): optimize WebRTC connection handling
```

## 📝 Coding Standards

### General Guidelines

1. **Write clean, readable code**
2. **Add comments for complex logic**
3. **Follow DRY (Don't Repeat Yourself)**
4. **Keep functions small and focused**
5. **Use meaningful variable names**

### Rust Guidelines

```rust
// ✓ Good
async fn send_message(
    channel_id: &ChannelId,
    content: &str,
) -> VCommResult<MessageId> {
    // Implementation
}

// ✗ Bad
async fn sm(c: &str, m: &str) -> Res<String> {
    // Implementation
}
```

- Follow [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- Use `cargo fmt` for formatting
- Use `cargo clippy` for linting
- Write documentation comments (`///`)
- Include examples in documentation

### TypeScript/JavaScript Guidelines

```typescript
// ✓ Good
interface User {
    id: string;
    username: string;
    email: string;
}

async function authenticateUser(credentials: Credentials): Promise<User> {
    // Implementation
}

// ✗ Bad
var u = { id: '', n: '', e: '' };
function auth(c) { /* ... */ }
```

- Use TypeScript for type safety
- Follow [TypeScript best practices](https://typescript-eslint.io/rules/)
- Use `prettier` for formatting
- Use `eslint` for linting
- Write JSDoc comments for public APIs

## 🧪 Testing

### Test Requirements

- Unit tests for all new functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Minimum 90% code coverage

### Running Tests

```bash
# Run all tests
make test

# Run unit tests only
make test:unit

# Run tests with coverage
make test:coverage

# Run tests in watch mode
make test:watch
```

### Writing Tests

```rust
// Rust tests
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let plaintext = b"Hello, World!";
        let key = Crypto::generate_key();
        let nonce = Crypto::random_bytes(12).try_into().unwrap();

        let ciphertext = Crypto::encrypt(plaintext, &key, &nonce).unwrap();
        let decrypted = Crypto::decrypt(&ciphertext, &key, &nonce).unwrap();

        assert_eq!(decrypted, plaintext);
    }
}
```

```typescript
// TypeScript tests
describe('AuthService', () => {
    it('should authenticate valid credentials', async () => {
        const result = await authService.authenticate(validCredentials);
        expect(result.success).toBe(true);
    });

    it('should reject invalid credentials', async () => {
        const result = await authService.authenticate(invalidCredentials);
        expect(result.success).toBe(false);
    });
});
```

## 📚 Documentation

### Documentation Requirements

- Update README for user-facing changes
- Add inline code comments
- Update API documentation
- Add examples for new features
- Update CHANGELOG

### Documentation Format

```markdown
## Feature Name

Brief description of the feature.

### Usage

```bash
command arg1 arg2
```

### Example

```rust
let result = feature_name(args);
```

### Notes

- Important note 1
- Important note 2
```

## 🔀 Pull Request Process

### Before Submitting

1. Update documentation
2. Add/update tests
3. Run all tests: `make test`
4. Run linting: `make lint`
5. Run security checks: `make security:all`
6. Format code: `make format`
8. Rebase on latest main: `git rebase upstream/main`

### Creating Pull Request

1. Push your branch: `git push origin feature/your-feature`
2. Create PR on GitHub
3. Fill out PR template completely
4. Link related issues
5. Request review from maintainers

### PR Review Process

1. Automated checks must pass
2. At least one maintainer approval required
3. Address review comments
4. Squash commits if needed
5. Merge after approval

## 🚀 Release Process

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality additions
- **PATCH**: Backwards-compatible bug fixes

### Release Steps

1. Update version in package.json: `make version:bump TYPE=patch`
2. Update CHANGELOG.md
3. Create release branch: `git checkout -b release/vX.X.X`
4. Tag release: `git tag -a vX.X.X -m "Release vX.X.X"`
5. Push tag: `git push origin vX.X.X`
6. GitHub Actions will:
   - Build release artifacts
   - Run security scans
   - Generate SBOM
   - Deploy to production
   - Publish release notes

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Security scan passed
- [ ] Release notes prepared
- [ ] Version bumped
- [ ] Tag created and pushed

## 📧 Getting Help

If you need help:

- Join our [Discord](https://discord.gg/A5MzwsRj7D)
- Open a [GitHub Discussion](https://github.com/vantisCorp/VChat/discussions)
- Create an [issue](https://github.com/vantisCorp/VChat/issues)

## 🙏 Acknowledgments

Thank you for contributing to V-COMM! Your contributions help make secure communication accessible to everyone.

---

**Last Updated**: 2024-03-04