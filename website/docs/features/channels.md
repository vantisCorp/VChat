---
sidebar_position: 1
title: Channels
description: Comprehensive guide to V-COMM's channel system for team communication
keywords: [channels, messaging, teams, communication, real-time]
tags: [features, channels]
---

# Channels

## Overview

Channels are the primary method of communication in V-COMM. They provide organized, real-time messaging for teams of any size, from small groups to large communities.

## Channel Types

### Public Channels

Public channels are open to everyone in the workspace:

| Feature | Description |
|---------|-------------|
| Discovery | Visible in channel directory |
| Join | Anyone can join without invitation |
| History | Full message history available |
| Search | Searchable by all members |
| Mentions | @channel and @everyone available |

### Private Channels

Private channels require an invitation to join:

| Feature | Description |
|---------|-------------|
| Discovery | Hidden from non-members |
| Join | Invitation required |
| History | Only visible to members |
| Search | Searchable by members only |
| Mentions | @channel available, @everyone disabled |

### Direct Messages

1:1 or small group conversations:

| Feature | Description |
|---------|-------------|
| Discovery | Not discoverable |
| Join | Invitation only |
| History | E2E encrypted by default |
| Limit | Up to 8 participants |

### Announcements

Broadcast-only channels for important updates:

| Feature | Description |
|---------|-------------|
| Posting | Only designated users can post |
| Reactions | Enabled or disabled by settings |
| Replies | Threaded replies optional |
| Notifications | Always notify all members |

## Channel Structure

```typescript
interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'dm' | 'announcement';
  workspaceId: string;
  
  // Membership
  members: Set<string>;
  memberCount: number;
  
  // Settings
  settings: ChannelSettings;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Security
  permissions: Permission[];
  encryption: EncryptionSettings;
}

interface ChannelSettings {
  // Message settings
  allowThreads: boolean;
  allowReactions: boolean;
  allowFileUploads: boolean;
  maxFileSize: number;        // in bytes
  
  // Notification settings
  notifyAll: boolean;
  muteByDefault: boolean;
  
  // Moderation
  slowMode: number | null;    // seconds between messages
  requireApproval: boolean;   // for joining
  
  // Retention
  messageRetention: number;   // days
  autoArchive: number | null; // days of inactivity
}
```

## Creating Channels

### Via API

```typescript
const response = await fetch('https://api.vcomm.io/v1/channels', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'general',
    type: 'public',
    description: 'Company-wide announcements and discussions',
    settings: {
      allowThreads: true,
      allowReactions: true,
      allowFileUploads: true,
      maxFileSize: 50 * 1024 * 1024  // 50 MB
    }
  })
});

const channel = await response.json();
```

### Via SDK

```typescript
import { VComm } from '@vcomm/sdk';

const client = new VComm({ token });

const channel = await client.channels.create({
  name: 'engineering',
  type: 'private',
  description: 'Engineering team discussions',
  members: ['user_123', 'user_456', 'user_789'],
  settings: {
    slowMode: 5,  // 5 seconds between messages
    requireApproval: true
  }
});
```

## Channel Membership

### Joining Channels

```typescript
// Join a public channel
await client.channels.join(channelId);

// Request to join a private channel
await client.channels.requestJoin(channelId, {
  message: 'I would like to join this channel for project updates'
});

// Accept a join request (moderator only)
await client.channels.acceptJoinRequest(channelId, userId);

// Invite a user
await client.channels.invite(channelId, {
  userId: 'user_123',
  role: 'member'
});
```

### Roles and Permissions

```typescript
enum ChannelRole {
  MEMBER = 'member',
  MODERATOR = 'moderator',
  ADMIN = 'admin'
}

const channelPermissions = {
  member: [
    'read_messages',
    'write_messages',
    'upload_files',
    'add_reactions',
    'create_threads'
  ],
  moderator: [
    ...memberPermissions,
    'manage_messages',
    'manage_members',
    'manage_settings',
    'invite_members'
  ],
  admin: [
    ...moderatorPermissions,
    'delete_channel',
    'manage_roles',
    'manage_bots'
  ]
};
```

## Messaging in Channels

### Sending Messages

```typescript
// Simple text message
await client.messages.send(channelId, {
  content: 'Hello, world!'
});

// Message with formatting
await client.messages.send(channelId, {
  content: '**Important**: Check the new documentation!',
  format: 'markdown'
});

// Message with attachments
await client.messages.send(channelId, {
  content: 'Here is the report',
  attachments: [
    {
      type: 'file',
      url: 'https://files.vcomm.io/reports/q4.pdf',
      name: 'Q4 Report.pdf',
      size: 1024000
    }
  ]
});

// Threaded reply
await client.messages.send(channelId, {
  content: 'I agree with this proposal',
  threadId: 'msg_parent_123'
});
```

### Real-time Updates

```typescript
// Subscribe to channel messages
const subscription = client.channels.subscribe(channelId, {
  onMessage: (message) => {
    console.log('New message:', message);
  },
  onUpdate: (message) => {
    console.log('Message updated:', message);
  },
  onDelete: (messageId) => {
    console.log('Message deleted:', messageId);
  },
  onMemberJoin: (member) => {
    console.log('Member joined:', member);
  },
  onMemberLeave: (memberId) => {
    console.log('Member left:', memberId);
  }
});

// Unsubscribe
subscription.unsubscribe();
```

## Channel Management

### Channel Settings

```typescript
// Update channel settings
await client.channels.update(channelId, {
  name: 'new-channel-name',
  description: 'Updated description',
  settings: {
    slowMode: 10,
    allowFileUploads: true,
    maxFileSize: 100 * 1024 * 1024
  }
});

// Archive a channel
await client.channels.archive(channelId);

// Delete a channel
await client.channels.delete(channelId);
```

### Moderation Tools

```typescript
// Enable slow mode
await client.channels.setSlowMode(channelId, 30);  // 30 seconds

// Pin a message
await client.messages.pin(messageId);

// Delete a message
await client.messages.delete(messageId);

// Warn a user
await client.channels.warnMember(channelId, userId, {
  reason: 'Spamming',
  message: 'Please avoid sending repeated messages.'
});

// Mute a user in channel
await client.channels.muteMember(channelId, userId, {
  duration: 3600,  // 1 hour
  reason: 'Harassment'
});
```

## Notifications

### Channel Notifications

```typescript
// Set notification preferences
await client.channels.setNotifications(channelId, {
  level: 'all' | 'mentions' | 'none',
  mobile: {
    enabled: true,
    sound: 'default'
  },
  desktop: {
    enabled: true,
    sound: 'default'
  }
});

// Custom keywords
await client.channels.setKeywords(channelId, {
  keywords: ['urgent', 'important', '@me'],
  notifyOn: 'keyword_or_mention'
});
```

## Webhooks and Integrations

### Incoming Webhooks

```typescript
// Create an incoming webhook
const webhook = await client.webhooks.create(channelId, {
  name: 'CI/CD Notifications',
  description: 'Deployment status updates'
});

// Use the webhook URL to send messages
await fetch(webhook.url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Deployment completed successfully!',
    embeds: [{
      title: 'Build #1234',
      description: 'All tests passed',
      color: 'green',
      fields: [
        { name: 'Branch', value: 'main' },
        { name: 'Commit', value: 'abc123' }
      ]
    }]
  })
});
```

### Outgoing Webhooks

```typescript
// Create an outgoing webhook
await client.webhooks.createOutgoing(channelId, {
  name: 'Auto-reply Bot',
  triggerWords: ['help', 'support'],
  url: 'https://your-server.com/webhook',
  events: ['message_created']
});
```

## Analytics

### Channel Statistics

```typescript
// Get channel analytics
const analytics = await client.channels.getAnalytics(channelId, {
  period: '30d'
});

console.log({
  totalMessages: analytics.messages.total,
  activeMembers: analytics.members.active,
  avgResponseTime: analytics.engagement.avgResponseTime,
  peakActivity: analytics.activity.peak
});
```

## Best Practices

### Channel Organization

1. **Use descriptive names**: `#engineering-standups`, `#marketing-campaign-q4`
2. **Create clear purposes**: Add descriptions explaining the channel's purpose
3. **Archive unused channels**: Keep the workspace clean
4. **Use prefixes**: `#proj-`, `#team-`, `#ext-` for external

### Moderation Guidelines

1. **Set clear rules**: Pin a message with channel rules
2. **Use slow mode**: Prevent spam in active channels
3. **Regular cleanup**: Remove inactive members
4. **Monitor conversations**: Use moderation bots

## See Also

- [Spaces](./spaces)
- [API Reference](../api/index)
- [Getting Started](../getting-started/quick-start)