# @vcomm/sentry-config

Centralized Sentry configuration package for V-COMM applications. This package provides unified error tracking, performance monitoring, and release management across all V-COMM services.

## Features

- 🎯 **Unified Configuration**: Single source of truth for Sentry settings
- 📊 **Performance Monitoring**: Built-in transaction and span tracking
- 🔒 **Security First**: Automatic filtering of sensitive data
- 🚀 **Easy Integration**: Simple API for quick setup
- 🔧 **Express Middleware**: Ready-to-use handlers for Node.js servers

## Installation

```bash
pnpm add @vcomm/sentry-config
```

## Quick Start

### Backend (Node.js)

```typescript
import { initSentry, captureException, sentryRequestHandler, sentryErrorHandler } from '@vcomm/sentry-config';

// Initialize Sentry
initSentry({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
});

// Express middleware
app.use(sentryRequestHandler());

// Your routes here...

// Error handler (must be after all routes)
app.use(sentryErrorHandler());
```

### Frontend (React)

```typescript
import { initSentry, captureException } from '@vcomm/sentry-config/react';

initSentry({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: 'production',
  enableSessionReplay: true,
});

// Capture errors
try {
  // ... code
} catch (error) {
  captureException(error, {
    user: { id: '123', username: 'john' },
    tags: { feature: 'chat' },
  });
}
```

## API Reference

### `initSentry(config)`

Initialize Sentry with configuration options.

```typescript
interface SentryConfig {
  dsn: string;                              // Sentry DSN
  environment: 'development' | 'staging' | 'production';
  release?: string;                         // Release version
  tracesSampleRate?: number;                // 0-1, default 0.1
  profilesSampleRate?: number;              // 0-1, default 0.1
  enableProfiling?: boolean;                // Enable profiling
  enableSessionReplay?: boolean;            // Enable session replay
  debug?: boolean;                          // Debug mode
}
```

### `captureException(error, context?)`

Capture an exception with optional context.

```typescript
captureException(new Error('Something went wrong'), {
  user: { id: '123', username: 'john' },
  tags: { component: 'ChatWindow' },
  extra: { attemptedAction: 'sendMessage' },
  fingerprint: ['chat-error', 'send-message'],
});
```

### `captureMessage(message, level?, context?)`

Capture a message with severity level.

```typescript
captureMessage('User login successful', 'info', {
  tags: { action: 'auth' },
});
```

### `startTransaction(name, op, data?)`

Start a performance transaction.

```typescript
const transaction = startTransaction('sendMessage', 'message.send', {
  channelId: 'abc123',
});

// Do work...
transaction.finish();
```

### `setUser(user)`

Set the current user context.

```typescript
setUser({
  id: '123',
  username: 'john_doe',
  email: 'john@example.com',
  roles: ['admin', 'moderator'],
});
```

### `addBreadcrumb(message, category?, level?, data?)`

Add a breadcrumb for event context.

```typescript
addBreadcrumb('API request started', 'http', 'info', {
  url: '/api/messages',
  method: 'POST',
});
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SENTRY_DSN` | Sentry project DSN | Yes |
| `SENTRY_RELEASE` | Release version | No |
| `NODE_ENV` | Environment (development/staging/production) | Yes |

## GitHub Actions Integration

This package works seamlessly with the Sentry GitHub Actions workflow:

```yaml
# .github/workflows/sentry.yml
jobs:
  create-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g @sentry/cli
      - run: |
          sentry-cli releases new "$VERSION"
          sentry-cli releases set-commits "$VERSION" --auto
          sentry-cli releases finalize "$VERSION"
```

## Security Considerations

- Sensitive headers (Authorization, Cookie) are automatically filtered
- Health check transactions are excluded from monitoring
- User PII is minimized by default
- Development errors are not sent unless explicitly enabled

## License

AGPL-3.0 - See [LICENSE](../../LICENSE) for details.