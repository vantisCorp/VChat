# Contributing Guide

Thank you for your interest in contributing to V-COMM! This guide will help you get started.

## 🌟 Ways to Contribute

There are many ways to contribute to V-COMM:

- **Code**: Write code for new features, bug fixes, or improvements
- **Documentation**: Improve documentation, write guides, translate content
- **Testing**: Write tests, perform QA, report bugs
- **Design**: Create UI/UX designs, graphics, icons
- **Security**: Find and report vulnerabilities responsibly
- **Community**: Help other users, moderate discussions, spread the word

## 📋 Before You Start

### Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment for all contributors.

### Contributor License Agreement (CLA)

Before contributing code, you'll need to sign our CLA. This ensures that your contributions can be properly licensed and protected.

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: 20.x or later
- **pnpm**: 8.x or later
- **Rust**: 1.75+ (stable or nightly)
- **Docker**: 24.x or later
- **Git**: 2.x or later

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/VChat.git
cd VChat
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/vantisCorp/VChat.git
```

### Install Dependencies

```bash
# Run setup
make setup

# Or manually
pnpm install --frozen-lockfile
cargo build
```

### Environment Setup

Create a `.env` file:

```bash
cp .env.example .env
# Edit .env with your local configuration
```

### Start Development Server

```bash
make dev
```

This starts:
- Backend on `http://localhost:3001`
- Frontend on `http://localhost:3000`
- Documentation on `http://localhost:3002`

## 📝 Coding Standards

### TypeScript/JavaScript

We use:
- **ESLint** for linting
- **Prettier** for formatting
- **TypeScript** strict mode

```bash
# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

**Style Guidelines**:
- Use `const` over `let` when possible
- Prefer arrow functions
- Use template literals for string interpolation
- Document public functions with JSDoc
- Follow Feature-Sliced Design (FSD) architecture

```typescript
// Good
const fetchUser = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// Avoid
function fetchUser(id) {
  return api.get('/users/' + id).then(function(response) {
    return response.data;
  });
}
```

### Rust

We use:
- **clippy** for linting
- **rustfmt** for formatting

```bash
# Run linter
cargo clippy -- -D warnings

# Format code
cargo fmt

# Run tests
cargo test
```

**Style Guidelines**:
- Follow Rust API guidelines
- Use `Result<T, Error>` for fallible operations
- Document public items with `///` comments
- Prefer `unwrap_or_default()` over `unwrap_or(<default>)`
- Use `#[derive]` macros where appropriate

```rust
/// Fetches a user by their unique identifier.
///
/// # Arguments
///
/// * `id` - The unique identifier of the user.
///
/// # Returns
///
/// Returns the user if found, or an error if not found.
pub async fn fetch_user(id: &str) -> Result<User, Error> {
    let user = database::find_user(id).await?;
    Ok(user)
}
```

### Git Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `security`: Security improvements

**Examples**:

```
feat(channels): add message threading support
fix(auth): resolve token refresh edge case
docs(api): update authentication documentation
refactor(crypto): optimize PQC key generation
test(channels): add unit tests for message encryption
```

### Branch Naming

Use descriptive branch names:

```
feat/message-threading
fix/token-refresh
docs/api-reference
refactor/crypto-optimization
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
make test

# Run unit tests only
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run e2e tests
pnpm test:e2e

# Run Rust tests
cargo test
```

### Writing Tests

**Frontend (Jest + React Testing Library)**:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageInput } from './MessageInput';

describe('MessageInput', () => {
  it('should submit message on Enter key', () => {
    const onSend = jest.fn();
    render(<MessageInput onSend={onSend} />);

    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('Hello');
  });
});
```

**Backend (Rust)**:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_encrypt_decrypt_message() {
        let key = generate_key();
        let message = "Hello, World!";
        
        let encrypted = encrypt(message, &key).unwrap();
        let decrypted = decrypt(&encrypted, &key).unwrap();
        
        assert_eq!(message, decrypted);
    }
}
```

### Test Coverage

We aim for high test coverage:
- **Unit tests**: 80%+ coverage
- **Integration tests**: Cover critical paths
- **E2E tests**: Cover user journeys

Check coverage:

```bash
pnpm test:coverage
```

## 📚 Documentation

### Code Documentation

Document all public APIs:

```typescript
/**
 * Sends an encrypted message to a channel.
 * 
 * @param channelId - The unique identifier of the channel
 * @param content - The encrypted message content (base64)
 * @param nonce - The nonce used for encryption (base64)
 * @returns The created message object
 * @throws {ApiError} If the channel doesn't exist or user lacks permission
 * 
 * @example
 * ```typescript
 * const message = await sendMessage('channel-123', encryptedContent, nonce);
 * console.log(message.id);
 * ```
 */
export async function sendMessage(
  channelId: string,
  content: string,
  nonce: string
): Promise<Message> {
  // Implementation
}
```

### Wiki Documentation

When adding features, update relevant wiki pages:

- **Home.md**: Add to features list if applicable
- **API-Reference.md**: Document new API endpoints
- **Architecture-Overview.md**: Update architecture diagrams
- **Installation-Guide.md**: Update setup instructions

## 🔀 Pull Request Process

### Before Submitting

1. **Sync with upstream**:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

2. **Run all checks**:

```bash
make lint
make test
make security-audit
```

3. **Update documentation** if needed

### Creating a PR

1. Push your branch:

```bash
git push origin feat/your-feature
```

2. Go to GitHub and create a Pull Request

3. Fill out the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally
```

### Review Process

1. **Automated checks** run on all PRs
2. **Code review** by maintainers
3. **Feedback** addressed
4. **Approval** required from at least one maintainer
5. **Merge** by maintainer

### After Merge

1. Delete your branch
2. Sync your fork:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

## 🏷️ Release Process

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, backwards compatible

### Release Workflow

1. Create release branch
2. Update CHANGELOG.md
3. Create PR to main
4. Merge and tag release
5. CI/CD handles deployment

## 🔒 Security

### Reporting Vulnerabilities

**Do NOT** open public issues for security vulnerabilities.

Instead, report via:
- Email: security@vcomm.app
- GitHub Security Advisories
- Our bug bounty program (see SECURITY.md)

### Security Guidelines

When contributing code:
- Never commit secrets or credentials
- Use environment variables for configuration
- Validate all user input
- Follow OWASP guidelines
- Run `make security-audit` before committing

## 📖 Project Structure

### Monorepo Layout

```
VChat/
├── .github/            # GitHub configuration
├── docs/               # Documentation
├── infra/              # Infrastructure
├── packages/           # Main packages
│   ├── core/          # Rust backend
│   ├── frontend/      # TypeScript frontend
│   ├── crypto-wasm/   # WASM crypto bindings
│   ├── mobile/        # React Native app
│   └── desktop/       # Tauri desktop app
├── tools/              # Development tools
├── Makefile            # Automation
├── turbo.json          # Turborepo config
└── package.json        # Workspace config
```

### Feature-Sliced Design (FSD)

The frontend uses FSD architecture:

```
packages/frontend/src/
├── app/                # App provider & routes
├── pages/              # Page components
├── widgets/            # UI widgets
├── features/           # Feature modules
├── entities/           # Business entities
└── shared/             # Shared utilities
```

## 🤝 Community

### Getting Help

- **Discord**: Join our community server
- **GitHub Discussions**: Ask questions
- **Issues**: Report bugs or request features

### Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Website contributor section

## 📜 License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 license (or commercial license if applicable).

---

Thank you for contributing to V-COMM! 🎉

**Last Updated**: March 2025  
**Version**: 1.0.0-alpha