# @vcomm/access-portal

> Secure Access Portal with RBAC, OAuth Integration, Audit Logging, and Session Management for V-COMM

## Features

- 🔐 **Role-Based Access Control (RBAC)** - Hierarchical roles with permission inheritance
- 🔑 **OAuth 2.0 Integration** - Support for Google, GitHub, Discord, Twitter, Microsoft, Apple
- 📋 **Audit Logging** - Comprehensive activity logging with retention policies
- 📱 **Session Management** - Device tracking, concurrent session limits, automatic cleanup
- 🛡️ **Security Features** - PKCE flow, token encryption, rate limiting
- ⚡ **TypeScript First** - Full type safety and IntelliSense support

## Installation

```bash
npm install @vcomm/access-portal
```

## Quick Start

```typescript
import { createAccessPortal } from '@vcomm/access-portal';

const portal = createAccessPortal({
  jwtSecret: 'your-jwt-secret',
  oauthProviders: [
    {
      provider: 'github',
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      redirectUri: 'https://yourapp.com/auth/callback',
      scopes: ['read:user', 'user:email'],
      enabled: true,
    },
  ],
  session: { defaultDuration: 7 * 24 * 60 * 60, maxSessionsPerUser: 10 },
  audit: { retentionDays: 90, logIpAddresses: true },
});

// Check permissions
const canAccess = portal.hasPermission('user_123', 'server:manage', 'server_456');

// Create custom role
const role = portal.rbac.createRole({
  name: 'Support Agent',
  color: '#00BCD4',
  position: 500,
  permissions: [],
});

// Assign role to user
portal.assignRole('user_123', role.id, 'server_456', 'admin');
```

## Default System Roles

| Role | Position | Description |
|------|----------|-------------|
| Owner | 1000 | Full access to all features |
| Administrator | 900 | Server administration without delete |
| Moderator | 800 | Content moderation and user management |
| Member | 100 | Standard user permissions |
| Guest | 50 | Limited read-only access |
| Bot | 200 | Bot account permissions |

## API Reference

### AccessPortal

Main class providing unified access to all features.

```typescript
const portal = new AccessPortal(options);

portal.hasPermission(userId, permission, scopeId);
portal.assignRole(userId, roleId, scopeId, assignedBy);
portal.revokeRole(userId, roleId, scopeId, revokedBy);
portal.getUserSessions(userId);
portal.getRecentAuditLogs(count);
portal.cleanup();
```

### RBACManager

```typescript
const rbac = new RBACManager();

rbac.createRole(data);
rbac.getRole(roleId);
rbac.updateRole(roleId, updates);
rbac.deleteRole(roleId);
rbac.assignRole(userId, roleId, scopeId, assignedBy);
rbac.revokeRole(userId, roleId, scopeId);
rbac.checkPermission({ userId, permission, scopeId });
rbac.checkPermissions(userId, permissions, scopeId);
```

### OAuthManager

```typescript
const oauth = new OAuthManager();

oauth.registerProvider(config);
oauth.getAuthorizationUrl(provider, redirectUrl);
oauth.handleCallback(provider, code, state);
```

### AuditLogger

```typescript
const audit = new AuditLogger();

audit.logAuthEvent(eventType, userId, metadata);
audit.logUserEvent(eventType, actorId, targetUserId, changes);
audit.logRoleEvent(eventType, actorId, roleId, targetUserId);
audit.query({ eventTypes, startDate, endDate, limit });
```

## License

MIT © Vantis Corporation
