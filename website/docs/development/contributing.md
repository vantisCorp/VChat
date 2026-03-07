---
sidebar_position: 4
title: Contributing Guide
description: Guide for contributing to V-COMM including pull request process and community guidelines
keywords: [contributing, pull requests, guidelines, community, open source]
tags: [development, contributing]
---

# Contributing Guide

Thank you for considering contributing to V-COMM! We welcome contributions from everyone.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Code Review Process](#code-review-process)
- [Community Guidelines](#community-guidelines)
- [Getting Help](#getting-help)

## Getting Started

### Prerequisites

Before contributing, make sure you have:

- [ ] Read and understood the [Code of Conduct](https://github.com/vantisCorp/VChat/blob/main/CODE_OF_CONDUCT.md)
- [ ] Read the [Development Setup](./setup) guide
- [ ] Read the [Coding Standards](./coding-standards)
- [ ] Read the [Testing Guide](./testing)
- [ ] Set up your development environment

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork

git clone https://github.com/YOUR_USERNAME/VChat.git
cd VChat

# Add upstream remote
git remote add upstream https://github.com/vantisCorp/VChat.git

# Verify remotes
git remote -v
```

### Create a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name

# Or fix branch
git checkout -b fix/issue-number-bug-description
```

## Development Workflow

### 1. Choose an Issue

- Check [GitHub Issues](https://github.com/vantisCorp/VChat/issues) for open issues
- Look for issues labeled `good first issue` if you're new
- Comment on the issue to claim it

### 2. Set Up Your Environment

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your settings

# Start development servers
npm run dev
```

### 3. Make Your Changes

- Follow the [Coding Standards](./coding-standards)
- Write tests for your changes
- Ensure all tests pass
- Update documentation if needed

### 4. Test Your Changes

```bash
# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### 5. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with conventional commit message
git commit -m "feat: add OAuth2 support for Google login"

# Or for fixes
git commit -m "fix(auth): resolve race condition in token validation"
```

See [Commit Standards](#commit-standards) below for guidelines.

### 6. Push Your Changes

```bash
# Push to your fork
git push origin feature/your-feature-name

# Or force push if needed (use carefully)
git push origin feature/your-feature-name --force-with-lease
```

## Pull Request Process

### Before Creating PR

Checklist before submitting a PR:

- [ ] Code follows project [Coding Standards](./coding-standards)
- [ ] All tests pass (`npm test`)
- [ ] Code has appropriate test coverage (>80%)
- [ ] Documentation is updated
- [ ] Commit messages follow [conventional commits](#commit-standards)
- [ ] PR title and description are clear and descriptive
- [ ] PR is linked to an issue (using `#123` syntax)

### Creating a Pull Request

1. Go to the [Pull Requests](https://github.com/vantisCorp/VChat/pulls) page
2. Click "New Pull Request"
3. Select your feature branch from the dropdown
4. Fill out the PR template

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issue
Fixes #123

## Changes Made
- List of changes made
- Why these changes were made

## Testing
- How to test these changes
- Screenshots/videos if applicable

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

### PR Labels

Use appropriate labels for your PR:

- `bug` - Bug fixes
- `enhancement` - New features
- `documentation` - Documentation updates
- `breaking` - Breaking changes
- `security` - Security fixes
- `performance` - Performance improvements
- `refactor` - Code refactoring
- `tests` - Test additions or fixes
- `dependencies` - Dependency updates

## Code Review Process

### Reviewer Guidelines

When reviewing a PR:

1. **Be constructive** - Provide helpful, actionable feedback
2. **Be respectful** - Treat all contributors with respect
3. **Be timely** - Respond to reviews within 48 hours
4. **Be thorough** - Review for code quality, security, and bugs

### Author Guidelines

When your PR is under review:

1. **Respond promptly** - Address review comments within 48 hours
2. **Be open-minded** - Consider all feedback objectively
3. **Ask questions** - Clarify any confusing feedback
4. **Update PR** - Make requested changes or explain why not

### Review Categories

- **Code Quality**: Is the code clean and maintainable?
- **Functionality**: Does the code work as intended?
- **Testing**: Are there adequate tests?
- **Documentation**: Is the documentation updated?
- **Performance**: Are there performance concerns?
- **Security**: Are there security vulnerabilities?

## Commit Standards

### Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `ci` | CI/CD changes |
| `build` | Build system changes |

### Examples

```
feat(auth): add OAuth2 support for Google login

Implement OAuth2 authentication with Google using Passport.js.
Users can now sign up and login with their Google accounts.

Closes #123

---

fix(api): resolve race condition in message delivery

The race condition occurred when multiple messages were sent
simultaneously to the same channel. Fixed by using a lock
to serialize message delivery.

Fixes #456

---

docs(readme): update installation instructions for Windows

Added step-by-step instructions for installing V-COMM on
Windows using WSL2.
```

## Community Guidelines

### Our Values

- **Inclusivity**: We welcome contributions from everyone
- **Respect**: Treat all community members with respect
- **Collaboration**: Work together to improve V-COMM
- **Learning**: Help each other learn and grow
- **Quality**: Strive for high-quality contributions

### Code of Conduct

All contributors must follow our [Code of Conduct](https://github.com/vantisCorp/VChat/blob/main/CODE_OF_CONDUCT.md). Key points:

- Be respectful and inclusive
- Focus on what is best for the community
- Show empathy towards other community members
- Respect differing opinions and viewpoints

### Communication

- Use English for all communication
- Be clear and concise
- Ask questions in issues or discussions
- Be patient with responses

## Project Structure

```
VChat/
├── packages/
│   ├── api/                # REST API
│   ├── websocket/          # WebSocket server
│   ├── frontend/           # React frontend
│   └── shared/             # Shared code
├── docs/                   # Documentation
├── website/                # Docusaurus site
├── .github/                # GitHub templates
├── scripts/                # Utility scripts
└── tests/                  # E2E tests
```

## Types of Contributions

### Bug Reports

Before creating a bug report:

1. Search existing issues first
2. Check if it's been fixed in the latest version
3. Use the bug report template

### Feature Requests

Before suggesting a feature:

1. Check if it already exists or is planned
2. Consider if it fits the project scope
3. Provide a clear description of the feature
4. Explain why it would be valuable

### Documentation

We welcome documentation improvements:

- Fix typos and grammar
- Add examples and tutorials
- Improve clarity
- Translate to other languages

### Code Contributions

We welcome code contributions for:

- Bug fixes
- New features
- Performance improvements
- Test additions
- Code refactoring

## Getting Help

### Resources

- [Documentation](https://docs.vcomm.io)
- [API Reference](https://docs.vcomm.io/api)
- [FAQ](https://docs.vcomm.io/faq)
- [GitHub Issues](https://github.com/vantisCorp/VChat/issues)
- [GitHub Discussions](https://github.com/vantisCorp/VChat/discussions)

### Asking Questions

1. Check documentation first
2. Search existing issues and discussions
3. Create a new discussion if needed
4. Be clear and provide context

### Reporting Issues

When reporting issues, include:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, version, etc.)
- Error messages or screenshots

## Recognition

We appreciate all contributions! Contributors are:

- Listed in our [CONTRIBUTORS](https://github.com/vantisCorp/VChat/blob/main/CONTRIBUTORS.md) file
- Mentioned in release notes for their contributions
- Eligible for V-COMM contributor swag
- Considered for maintainer roles for significant contributions

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](https://github.com/vantisCorp/VChat/blob/main/LICENSE).

## Thank You!

Thank you for taking the time to contribute to V-COMM. Every contribution, no matter how small, helps make V-COMM better for everyone!

## See Also

- [Development Setup](./setup)
- [Coding Standards](./coding-standards)
- [Testing Guide](./testing)
- [API Reference](../api/index)