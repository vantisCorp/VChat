---
sidebar_position: 2
title: Spaces
description: Comprehensive guide to V-COMM's Spaces feature for organizing teams and content
keywords: [spaces, teams, organization, workspaces, hierarchy]
tags: [features, spaces]
---

# Spaces

## Overview

Spaces in V-COMM provide a hierarchical organization structure for teams, departments, or projects. They allow you to group related channels, users, and content together while maintaining appropriate access controls.

## Space Hierarchy

```
Workspace
├── Company Space
│   ├── #announcements
│   ├── #general
│   └── Company Files
├── Engineering Space
│   ├── #engineering
│   ├── #code-reviews
│   ├── #architecture
│   └── Engineering Docs
├── Product Space
│   ├── #product-roadmap
│   ├── #feature-requests
│   └── Product Specs
└── Sales Space
    ├── #sales-updates
    ├── #deals
    └── Sales Collateral
```

## Space Types

### Company-Wide Space

The root space that contains all organizational content:

- All workspace members are automatically members
- Contains company-wide announcements and general channels
- Admin-only creation permissions
- Cannot be deleted or archived

### Team Spaces

Spaces for specific teams or departments:

- Department-specific channels and content
- Department admins manage membership
- Cross-functional collaboration enabled
- Hierarchical structure allowed

### Project Spaces

Temporary or permanent spaces for projects:

- Dedicated to specific projects or initiatives
- Members based on project requirements
- Limited lifespan with auto-archive option
- Project-specific tools and integrations

### Partner Spaces

External collaboration spaces:

- Restricted access for external partners
- Guest user management
- Time-limited access with auto-expiration
- Audit logging for all activities

## Space Structure

```typescript
interface Space {
  id: string;
  name: string;
  description?: string;
  type: 'company' | 'team' | 'project' | 'partner';
  workspaceId: string;
  parentId?: string;  // For nested spaces
  
  // Members
  members: SpaceMember[];
  memberCount: number;
  
  // Content
  channels: Channel[];
  folders: SpaceFolder[];
  
  // Settings
  settings: SpaceSettings;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SpaceMember {
  userId: string;
  role: SpaceRole;
  joinedAt: Date;
  permissions: Permission[];
}

enum SpaceRole {
  MEMBER = 'member',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  OWNER = 'owner'
}

interface SpaceSettings {
  // Visibility
  discoverable: boolean;
  allowGuestAccess: boolean;
  
  // Membership
  requireApproval: boolean;
  maxMembers: number;
  
  // Content
  allowChannels: boolean;
  allowFiles: boolean;
  allowApps: boolean;
  
  // Notifications
  defaultNotify: boolean;
  announcementChannel?: string;
  
  // Lifecycle
  autoArchive: number | null;  // days of inactivity
}
```

## Creating Spaces

### Via API

```typescript
const response = await fetch('https://api.vcomm.io/v1/spaces', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Engineering',
    description: 'Engineering team space',
    type: 'team',
    settings: {
      discoverable: true,
      requireApproval: true,
      allowChannels: true,
      allowFiles: true
    }
  })
});

const space = await response.json();
```

### Via SDK

```typescript
import { VComm } from '@vcomm/sdk';

const client = new VComm({ token });

const space = await client.spaces.create({
  name: 'Product',
  type: 'team',
  description: 'Product team collaboration space',
  parentId: null,  // Top-level space
  members: [
    { userId: 'user_123', role: 'admin' },
    { userId: 'user_456', role: 'member' }
  ],
  settings: {
    discoverable: true,
    allowGuestAccess: false,
    requireApproval: false
  }
});
```

## Space Management

### Adding Members

```typescript
// Add a member
await client.spaces.addMember(spaceId, {
  userId: 'user_123',
  role: SpaceRole.MEMBER
});

// Add multiple members
await client.spaces.addMembers(spaceId, [
  { userId: 'user_456', role: SpaceRole.MEMBER },
  { userId: 'user_789', role: SpaceRole.MEMBER }
]);

// Invite external users (partner spaces)
await client.spaces.inviteGuest(spaceId, {
  email: 'partner@example.com',
  role: SpaceRole.MEMBER,
  expiresAt: new Date('2024-12-31')
});
```

### Role Management

```typescript
// Update member role
await client.spaces.updateMemberRole(spaceId, userId, SpaceRole.ADMIN);

// Assign custom permissions
await client.spaces.setPermissions(spaceId, userId, {
  spaces: ['read', 'update'],
  channels: ['create', 'read', 'write', 'delete'],
  files: ['read', 'upload', 'delete'],
  members: ['read', 'manage']
});
```

### Space Settings

```typescript
// Update space settings
await client.spaces.update(spaceId, {
  name: 'Updated Name',
  description: 'Updated description',
  settings: {
    discoverable: false,
    requireApproval: true,
    autoArchive: 180  // Archive after 180 days inactive
  }
});

// Archive a space
await client.spaces.archive(spaceId);

// Delete a space
await client.spaces.delete(spaceId);
```

## Channel Management in Spaces

### Creating Channels

```typescript
// Create a channel in a space
const channel = await client.channels.create({
  name: 'engineering-general',
  type: 'public',
  spaceId: spaceId,
  description: 'General engineering discussions'
});

// Create a private channel
const privateChannel = await client.channels.create({
  name: 'leadership',
  type: 'private',
  spaceId: spaceId,
  members: ['user_123', 'user_456']
});
```

### Channel Organization

```typescript
// Organize channels in folders
await client.spaces.createFolder(spaceId, {
  name: 'Development',
  channels: ['#engineering', '#code-reviews']
});

await client.spaces.createFolder(spaceId, {
  name: 'Planning',
  channels: ['#standups', '#sprint-planning']
});
```

## File Management

### Space Folders

```typescript
// Create folders
await client.spaces.createFolder(spaceId, {
  name: 'Documents',
  description: 'Shared documents'
});

// Upload files to space
const file = await client.files.upload({
  spaceId: spaceId,
  file: fileData,
  folderId: 'folder_123'
});

// Create sharing link
const shareLink = await client.files.share(file.id, {
  expiresIn: 86400,  // 24 hours
  allowDownload: true
});
```

## Notifications

### Space-Wide Announcements

```typescript
// Send space-wide announcement
await client.spaces.sendAnnouncement(spaceId, {
  content: 'Important update about the project timeline',
  notifyAll: true,
  channels: ['#general', '#announcements']
});

// Set announcement channel
await client.spaces.update(spaceId, {
  settings: {
    announcementChannel: '#announcements'
  }
});
```

### Notification Preferences

```typescript
// Set space-level notifications
await client.spaces.setNotifications(spaceId, {
  level: 'all' | 'mentions' | 'none',
  channels: {
    default: 'all',
    exceptions: {
      '#announcements': 'all',
      '#random': 'none'
    }
  }
});
```

## Permissions

### Space Permissions

```typescript
const spacePermissions = {
  member: {
    spaces: ['read'],
    channels: ['read', 'write'],
    files: ['read', 'upload'],
    members: ['read']
  },
  moderator: {
    spaces: ['read', 'update'],
    channels: ['create', 'read', 'write', 'delete'],
    files: ['read', 'upload', 'delete'],
    members: ['read', 'manage']
  },
  admin: {
    spaces: ['create', 'read', 'update', 'delete'],
    channels: ['create', 'read', 'write', 'delete'],
    files: ['create', 'read', 'upload', 'delete'],
    members: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update']
  },
  owner: {
    // All permissions plus delete space
    ...adminPermissions,
    spaces: ['create', 'read', 'update', 'delete']
  }
};
```

## Analytics

### Space Analytics

```typescript
// Get space statistics
const analytics = await client.spaces.getAnalytics(spaceId, {
  period: '30d'
});

console.log({
  activeMembers: analytics.members.active,
  totalMessages: analytics.messages.total,
  activeChannels: analytics.channels.active,
  fileUploads: analytics.files.uploads,
  storageUsed: analytics.files.storageUsed
});
```

## Integrations

### Space-Level Apps

```typescript
// Install app to space
await client.apps.install(spaceId, {
  appId: 'vcomm-jira-integration',
  config: {
    jiraUrl: 'https://company.atlassian.net',
    apiKey: '***'
  }
});

// Configure app settings
await client.apps.updateConfig(spaceId, appId, {
  syncIssues: true,
  syncComments: false
});
```

## Best Practices

### Space Organization

1. **Logical hierarchy**: Group related spaces together
2. **Clear naming**: Use descriptive names (`#engineering`, `#product`)
3. **Purpose documentation**: Add descriptions for each space
4. **Regular review**: Archive unused spaces

### Access Control

1. **Principle of least privilege**: Grant minimum necessary permissions
2. **Regular audits**: Review space membership quarterly
3. **Guest management**: Limit guest access to partner spaces
4. **Approval workflow**: Require approval for space access

## See Also

- [Channels](./channels)
- [Mesh](./mesh)
- [API Reference](../api/index)