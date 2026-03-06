<div align="center">

# 🤝 Contributing to V-COMM

**Thank you for considering contributing to V-COMM!**

![License](https://img.shields.io/badge/license-AGPL%203.0-red?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)
![Contributors](https://img.shields.io/badge/contributors-welcome-orange?style=for-the-badge)

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Review Process](#code-review-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Community Guidelines](#community-guidelines)
- [Getting Help](#getting-help)

---

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

```bash
# Required
- Node.js >= 20.x
- Rust >= 1.75
- Git >= 2.40
- Docker >= 24.0 (optional)

# Tools
- npm or yarn or pnpm
- make
- VS Code (recommended) with extensions
```

### Initial Setup

```bash
# 1. Fork the repository
# Click "Fork" button on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/VChat.git
cd VChat

# 3. Add upstream remote
git remote add upstream https://github.com/vantisCorp/VChat.git

# 4. Install dependencies
make setup

# 5. Create a development branch
git checkout -b feature/your-feature-name

# 6. Start development
make dev
```

### Development Environment

We provide multiple development environments:

<details>
<summary><kbd>🐳 Docker Environment</kbd></summary>

```bash
# Using Docker Compose
docker-compose up -d

# Access container
docker exec -it vcomm bash

# Run commands inside container
make dev
```

</details>

<details>
<summary><kbd>📦 DevContainer (VS Code)</kbd></summary>

```bash
# Open in VS Code with DevContainer
code --remote=ssh-remote+host /path/to/VChat
# VS Code will prompt to reopen in DevContainer
```

</details>

<details>
<summary><kbd>🖥️ Local Environment</kbd></summary>

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start services
make dev
```

</details>

---

## 🔄 Development Workflow

### Branching Strategy

We follow **GitFlow** branching model:

```
main
  └── develop
        ├── feature/*
        ├── bugfix/*
        ├── hotfix/*
        └── release/*
```

#### Branch Types

| Branch | Purpose | Example |
|--------|---------|---------|
| `main` | Production-ready code | Never commit directly |
| `develop` | Integration branch | Latest features |
| `feature/*` | New features | `feature/mobile-app` |
| `bugfix/*` | Bug fixes | `bugfix/login-issue` |
| `hotfix/*` | Urgent production fixes | `hotfix/security-patch` |
| `release/*` | Release preparation | `release/v0.2.0` |

### Workflow Steps

```bash
# 1. Sync with upstream
git fetch upstream
git checkout develop
git merge upstream/develop

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 4. Push to your fork
git push origin feature/your-feature

# 5. Create Pull Request
# Visit GitHub and create PR from your fork
```

### Syncing Your Fork

```bash
# Sync with upstream
git fetch upstream
git checkout develop
git merge upstream/develop
git push origin develop
```

---

## 📐 Code Standards

### General Guidelines

- **Language**: TypeScript with strict mode
- **Style**: Follow existing code patterns
- **Formatting**: Prettier (auto-formatted on save)
- **Linting**: ESLint (must pass before commit)
- **Naming**: camelCase for variables, PascalCase for components

### TypeScript Standards

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

async function getUser(id: string): Promise<User> {
  const user = await db.users.findUnique({ where: { id } });
  return user;
}

// ❌ Bad
interface user {
  id: any;
  name: any;
}

function getUser(id) {
  return db.users.findUnique({ where: { id } });
}
```

### React Standards

```typescript
// ✅ Good
const UserProfile: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};

// ❌ Bad
function UserProfile(props) {
  return (
    <div>
      <h1>{props.user.name}</h1>
    </div>
  );
}
```

### Rust Standards

```rust
// ✅ Good
use std::error::Error;

pub async fn encrypt_message(
    message: &[u8],
    key: &[u8],
) -> Result<Vec<u8>, Box<dyn Error>> {
    let cipher = aes_gcm_encrypt(message, key)?;
    Ok(cipher)
}

// ❌ Bad
pub fn encrypt(m: Vec<u8>, k: Vec<u8>) -> Vec<u8> {
    aes_gcm_encrypt(m, k)
}
```

### File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Utilities | camelCase | `formatDate.ts` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Types | PascalCase | `User.ts` |
| Tests | camelCase with `.test` suffix | `user.test.ts` |

### Code Organization

```
src/
├── app/              # App routing
├── components/       # Reusable components
├── features/         # Feature modules
├── hooks/            # Custom hooks
├── lib/              # External libraries
├── services/         # API services
├── stores/           # State management
├── types/            # TypeScript types
├── utils/            # Utility functions
└── config/           # Configuration files
```

---

## 📝 Commit Guidelines

### Conventional Commits

We use **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add FIDO2 support` |
| `fix` | Bug fix | `fix(messaging): resolve connection timeout` |
| `docs` | Documentation | `docs(readme): update installation guide` |
| `style` | Code style | `style(ui): format code with prettier` |
| `refactor` | Code refactoring | `refactor(api): simplify request handler` |
| `perf` | Performance | `perf(encryption): optimize AES-GCM` |
| `test` | Tests | `test(auth): add unit tests` |
| `build` | Build system | `build(ci): add GitHub Actions` |
| `ci` | CI configuration | `ci(github): update workflow` |
| `chore` | Maintenance | `chore(deps): update dependencies` |
| `revert` | Revert commit | `revert: feat(auth)` |

### Commit Examples

```bash
# ✅ Good commit
git commit -m "feat(messaging): add message reactions

Implement message reaction functionality with:
- Emoji picker
- Reaction counts
- Real-time updates

Closes #123"
```

```bash
# ❌ Bad commit
git commit -m "added reactions"
```

### Commit Message Format

#### Subject Line

- Use imperative mood ("add" not "added")
- Capitalize first letter
- No period at end
- Limit to 50 characters

#### Body

- Wrap at 72 characters
- Explain what and why, not how
- Use bullet points for multiple items

#### Footer

- Reference issues (#123)
- BREAKING CHANGE: description
- Co-authored-by: name <email>

### Commitlint

Our CI uses **Commitlint** to enforce commit standards:

```bash
# Validate locally
npm run commitlint -- --from=HEAD~1

# Fix commit messages
git commit --amend -m "corrected message"
```

---

## 🔀 Pull Request Process

### Before Creating PR

1. ✅ Sync with upstream latest
2. ✅ All tests passing
3. ✅ Code formatted with Prettier
4. ✅ Linting passes
5. ✅ Documentation updated
6. ✅ Commit messages follow convention
7. ✅ PR description filled out

### Creating PR

```bash
# 1. Push your branch
git push origin feature/your-feature

# 2. Create PR on GitHub
# Visit: https://github.com/vantisCorp/VChat/compare
```

### PR Template

We provide a PR template. Fill out:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] E2E tests added
- [ ] Manual testing done

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests passing
```

### PR Review Process

1. **Automated Checks** (required)
   - CI/CD pipeline passes
   - Security scans pass
   - Code coverage maintained

2. **Code Review** (required)
   - At least 2 approvals
   - All comments addressed
   - No blocking issues

3. **Merge** (by maintainers)
   - Squash merge to main/develop
   - Delete branch after merge

### Review Guidelines

#### For Reviewers

- Be constructive and respectful
- Focus on code quality and logic
- Provide actionable feedback
- Respond within 48 hours

#### For Authors

- Respond to all comments
- Make requested changes or explain why not
- Keep PR up-to-date with develop branch

---

## 🧪 Testing Requirements

### Test Coverage

- **Minimum Coverage**: 85%
- **New Features**: 100% coverage required
- **Critical Code**: 100% coverage required

### Test Types

#### Unit Tests

```typescript
// Example unit test
describe('encryptMessage', () => {
  it('should encrypt message with AES-GCM', () => {
    const message = Buffer.from('Hello, World!');
    const key = generateKey();

    const encrypted = encryptMessage(message, key);

    expect(encrypted).toBeDefined();
    expect(encrypted.length).toBeGreaterThan(0);
  });
});
```

#### Integration Tests

```typescript
// Example integration test
describe('Messaging API', () => {
  it('should send and receive messages', async () => {
    const sender = await createTestUser();
    const receiver = await createTestUser();

    await sendMessage(sender.id, receiver.id, 'Hello!');
    const messages = await getMessages(receiver.id);

    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('Hello!');
  });
});
```

#### E2E Tests

```typescript
// Example E2E test
describe('User Registration Flow', () => {
  it('should register new user', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'secure123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });
});
```

### Running Tests

```bash
# Run all tests
make test

# Run unit tests only
make test:unit

# Run integration tests
make test:integration

# Run E2E tests
make test:e2e

# Generate coverage report
make test:coverage

# Watch mode
make test:watch
```

### Test Requirements

- All tests must pass before PR
- New features require tests
- Bug fixes require regression tests
- Complex code requires documentation

---

## 📚 Documentation

### Documentation Requirements

- **New Features**: Must document API, usage, and examples
- **Bug Fixes**: Update relevant documentation
- **Breaking Changes**: Update migration guides
- **Code Comments**: Explain complex logic

### Documentation Types

#### Code Documentation

```typescript
/**
 * Encrypts a message using AES-256-GCM
 *
 * @param message - The message to encrypt (plaintext)
 * @param key - The encryption key (32 bytes)
 * @returns Encrypted message (ciphertext)
 * @throws Error if encryption fails
 *
 * @example
 * ```ts
 * const encrypted = encryptMessage(Buffer.from('hello'), key);
 * ```
 */
export function encryptMessage(
  message: Buffer,
  key: Buffer,
): Promise<Buffer> {
  // Implementation
}
```

#### API Documentation

Document all API endpoints:

```markdown
### POST /api/messages

Creates a new message.

**Request Body:**
```json
{
  "recipientId": "string",
  "content": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "timestamp": "number"
}
```
```

#### User Documentation

Update user-facing docs in `/docs`:

```markdown
## Sending Messages

To send a message, click the compose button...
```

### Documentation Tools

- **Code**: JSDoc comments
- **API**: OpenAPI/Swagger spec
- **Users**: Docusaurus markdown
- **Diagrams**: Mermaid diagrams

---

## 👥 Community Guidelines

### Code of Conduct

We enforce a strict Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers
- Focus on what is best for the community
- Show empathy towards other community members

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.

### Communication Channels

- 📖 [GitHub Discussions](https://github.com/vantisCorp/VChat/discussions)
- 💬 [Discord](https://discord.gg/A5MzwsRj7D)
- 🐦 [Twitter](https://twitter.com/vcomm_secure)
- 📧 [Email](mailto:community@vcomm.io)

### Reporting Issues

If you experience or witness unacceptable behavior:

1. Contact: conduct@vcomm.io
2. Provide details and evidence
3. We will investigate within 48 hours

---

## 💡 Getting Help

### Resources

- 📖 [Documentation](https://vantis-corp.github.io/VChat/)
- 🎥 [Tutorials](https://youtube.com/@vcomm_secure)
- 📝 [Examples](https://github.com/vantisCorp/VChat/tree/main/examples)
- 🐛 [Issue Tracker](https://github.com/vantisCorp/VChat/issues)

### Asking Questions

Before asking, please:

1. ✅ Search existing issues
2. ✅ Read documentation
3. ✅ Check examples

When asking, provide:

- Context and goal
- What you tried
- Expected vs actual behavior
- Error messages
- Environment details

### Where to Ask

- **Questions**: GitHub Discussions
- **Bugs**: GitHub Issues
- **Security**: SECURITY.md
- **Urgent**: Discord or email

---

## 🏆 Recognition

### Contributors Hall of Fame

All contributors are recognized in:

- [CONTRIBUTORS.md](CONTRIBUTORS.md)
- [README.md](README.md)
- Release notes
- Website credits

### Contributor Benefits

- 🌟 Featured in contributor list
- 🏅 Contributor badge on profile
- 🎁 Rewards for significant contributions
- 💼 Priority consideration for opportunities
- 📢 Featured in announcements

### Becoming a Maintainer

Active contributors may be invited to become maintainers:

- Consistent high-quality contributions
- Positive community engagement
- Understanding of codebase
- Alignment with project vision

---

## 📜 License & CLA

### Contributor License Agreement (CLA)

All contributors must sign our CLA:

[![CLA assistant](https://cla-assistant.io/readme/badge/vantisCorp/VChat)](https://cla-assistant.io/vantisCorp/VChat)

The CLA ensures:

- We can distribute your contributions
- You retain copyright
- No patent grants required

### License

Contributions are licensed under:

- **AGPL-3.0** for open source
- **Commercial** for enterprise use

See [LICENSE](LICENSE) for details.

---

## 🎯 Contribution Areas

### Ways to Contribute

#### Code

- 🐛 Fix bugs
- ✨ Add features
- ⚡ Improve performance
- 🧪 Write tests
- 📝 Update documentation

#### Design

- 🎨 UI/UX improvements
- 🖼️ Create graphics
- 📐 Design patterns
- 🎭 Animations

#### Documentation

- 📚 Write docs
- 🎥 Create tutorials
- 📝 Improve examples
- 🌍 Translations

#### Community

- 💬 Help others
- 🐦 Share on social media
- 🎤 Give talks
- 📝 Write blog posts

### Good First Issues

Start with easy issues:

[![Good First Issues](https://img.shields.io/github/issues/vantisCorp/VChat/good%20first%20issue?style=for-the-badge)](https://github.com/vantisCorp/VChat/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

### Help Wanted

Need help with:

[![Help Wanted](https://img.shields.io/github/issues/vantisCorp/VChat/help%20wanted?style=for-the-badge)](https://github.com/vantisCorp/VChat/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)

---

## 📊 Contribution Stats

[![Contributors](https://contrib.rocks/image?repo=vantisCorp/VChat)](https://github.com/vantisCorp/VChat/graphs/contributors)

---

<div align="center">

## 🙏 Thank You!

**Every contribution matters. Thank you for making V-COMM better!**

---

**[⬆️ Back to Top](#-contributing-to-v-comm)**

---

Made with ❤️ by the V-COMM Community

</div>
</div>