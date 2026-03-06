# V-COMM Documentation System

This documentation system uses **Mintlify CLI** for local development and preview, combined with **Vale** for linting and **Docusaurus** for production builds.

## 🚀 Quick Start

### Local Development

```bash
# Start Mintlify dev server
pnpm run docs:dev

# Access at http://localhost:3000
```

### Validation

```bash
# Validate Mintlify configuration
pnpm run docs:validate

# Run Vale linting
pnpm run docs:lint
```

## 📁 Structure

```
docs/
├── .vale.ini              # Vale linting configuration
├── docs.json              # Mintlify configuration
├── developers/            # Developer documentation
│   ├── introduction.md
│   ├── quickstart.md
│   ├── installation.md
│   ├── architecture.md
│   ├── authentication.md
│   └── api-reference.md
├── images/                # Images and diagrams
├── logo/                  # Logo and branding
├── scripts/               # Documentation scripts
├── snippets/              # Code snippets for reuse
│   ├── authentication/
│   ├── messaging/
│   └── api/
├── styles/                # Custom styles
└── tools/                 # Documentation tools
```

## 📝 Writing Documentation

### Creating New Pages

1. Create a new markdown file in `developers/` directory
2. Add frontmatter with title and description:

```markdown
---
title: Page Title
description: Page description
---

# Content here
```

3. Update `docs.json` to include the new page in navigation

### Using Code Snippets

Reuse code snippets from `snippets/` directory:

```markdown
<CodeGroup>
```typescript snippets/authentication/basic-auth.md
```

```python snippets/authentication/basic-auth.md
```
</CodeGroup>
```

### Code Syntax Highlighting

Use fenced code blocks with language identifier:

```markdown
\`\`\`typescript
const greeting: string = "Hello, V-COMM!";
\`\`\`
```

## 🔧 Configuration

### Mintlify Configuration

Edit `docs.json` to customize:
- Navigation structure
- Branding (logo, colors)
- Integrations (OpenAI, etc.)
- Footer links

### Vale Linting

Edit `.vale.ini` to customize:
- Style rules
- Vocabulary
- Specific rules for different sections

## 🤖 AI-Powered Features

The documentation includes OpenAI integration for:
- Smart search
- Auto-generated summaries
- Code explanations

Enable in `docs.json`:

```json
{
  "integrations": {
    "openai": {
      "enabled": true
    }
  }
}
```

## 🚢 Deployment

### Automatic Deployment

Documentation is automatically deployed on push to `main` branch via GitHub Actions (`.github/workflows/docs.yml`).

### Manual Deployment

```bash
# Deploy to Mintlify
cd docs
mintlify deploy --token=$MINTLIFY_TOKEN
```

## 📊 Monitoring

Documentation metrics are tracked:
- Page views
- Search queries
- User engagement
- Broken links

## 🔒 Security

- Documentation is version-controlled
- Secrets stored in GitHub Actions secrets
- Automatic security scanning
- Dependency updates

## 🤝 Contributing

1. Create a new branch: `git checkout -b docs/your-feature`
2. Make changes following the style guide
3. Run linting: `pnpm run docs:lint`
4. Validate: `pnpm run docs:validate`
5. Create PR with detailed description

## 📚 Additional Resources

- [Mintlify Documentation](https://docs.mintlify.com/)
- [Vale Documentation](https://vale.sh/)
- [Docusaurus Documentation](https://docusaurus.io/)
- [Markdown Guide](https://www.markdownguide.org/)

## 💡 Best Practices

1. **Keep it simple**: Use clear, concise language
2. **Be specific**: Provide concrete examples
3. **Stay updated**: Keep documentation in sync with code
4. **Use snippets**: Reuse code snippets
5. **Test locally**: Always preview before pushing
6. **Follow style**: Use Vale linting for consistency

## 🆘 Troubleshooting

### Mintlify Dev Server Won't Start

```bash
# Clear cache and restart
rm -rf node_modules
pnpm install
pnpm run docs:dev
```

### Vale Linting Errors

```bash
# Update Vale configuration
vale docs/ --config=docs/.vale.ini
```

### Preview Not Working

```bash
# Validate configuration
cd docs
mintlify validate

# Check for syntax errors
# Look at the error output for specific issues
```

## 📞 Support

- 📧 Email: support@vcomm.dev
- 🐛 [GitHub Issues](https://github.com/vantisCorp/VChat/issues)
- 💬 [Discord Community](https://discord.gg/vcomm)