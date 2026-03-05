---
sidebar_position: 3
title: Channels API
description: REST API endpoints for channel creation, management, and configuration
keywords: [channels, REST API, messaging, chat, communication]
tags: [api, channels, rest]
---

# Channels API

The Channels API provides endpoints for creating, managing, and configuring communication channels. Channels are the primary method for organizing conversations in V-COMM.

## Overview

V-COMM supports multiple channel types:

| Type | Description | Max Members |
|------|-------------|-------------|
| **Public** | Open to all server members | Unlimited |
| **Private** | Invite-only access | Unlimited |
| **Direct** | 1-on-1 conversation | 2 |
| **Group** | Small group conversation | 10 |
| **Voice** | Real-time voice communication | 100 |
| **Announcement** | One-way broadcast channel | Unlimited |

## Base URL

```
https://api.vcomm.io/v1/channels
```

---

## Endpoints

### List Channels

Lists channels accessible to the authenticated user.

**Endpoint**: `GET /`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `space_id` | string | Filter by space |
| `type` | string | Filter by channel type |
| `limit` | integer | Results per page (1-100) |
| `before` | string | Pagination cursor |
| `after` | string | Pagination cursor |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "id": "ch_abc123",
        "name": "general",
        "type": "public",
        "space_id": "sp_xyz789",
        "description": "General discussion channel",
        "position": 0,
        "category_id": "cat_def456",
        "topic": "Welcome to the general channel!",
        "nsfw": false,
        "permissions": {
          "read": true,
          "write": true,
          "manage": false
        },
        "member_count": 1250,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 42,
    "has_more": false
  }
}
```

---

### Create Channel

Creates a new channel.

**Endpoint**: `POST /`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "project-alpha",
  "type": "private",
  "space_id": "sp_xyz789",
  "category_id": "cat_def456",
  "description": "Discussion about Project Alpha",
  "topic": "Project Alpha Development",
  "position": 5,
  "nsfw": false,
  "permission_overwrites": [
    {
      "role_id": "role_abc",
      "allow": ["read", "write", "mention_everyone"],
      "deny": ["manage"]
    }
  ],
  "rate_limit": 10,
  "auto_archive": 1440
}
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Channel name (1-100 chars, lowercase, no spaces) |
| `type` | string | Yes | Channel type (public, private, voice, announcement) |
| `space_id` | string | Yes | Parent space ID |
| `category_id` | string | No | Category ID for organization |
| `description` | string | No | Channel description |
| `topic` | string | No | Channel topic |
| `position` | integer | No | Sort position |
| `nsfw` | boolean | No | NSFW flag |
| `permission_overwrites` | array | No | Permission overrides |
| `rate_limit` | integer | No | Slowmode in seconds (0-21600) |
| `auto_archive` | integer | No | Auto-archive duration in minutes |

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "ch_new123",
    "name": "project-alpha",
    "type": "private",
    "space_id": "sp_xyz789",
    "created_at": "2024-01-20T16:00:00Z"
  }
}
```

---

### Get Channel

Retrieves a specific channel.

**Endpoint**: `GET /{channel_id}`

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `channel_id` | string | Channel ID (ch_xxx format) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "ch_abc123",
    "name": "general",
    "type": "public",
    "space_id": "sp_xyz789",
    "category": {
      "id": "cat_def456",
      "name": "Text Channels",
      "position": 0
    },
    "description": "General discussion channel",
    "topic": "Welcome to the general channel!",
    "position": 0,
    "nsfw": false,
    "rate_limit": 0,
    "permissions": {
      "read": true,
      "write": true,
      "manage": false,
      "mention_everyone": true
    },
    "stats": {
      "member_count": 1250,
      "message_count": 45000,
      "online_count": 42
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T15:00:00Z"
  }
}
```

---

### Update Channel

Updates channel settings.

**Endpoint**: `PATCH /{channel_id}`

**Request Body**:
```json
{
  "name": "general-chat",
  "topic": "Updated topic",
  "description": "Updated description",
  "position": 1,
  "rate_limit": 5
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "ch_abc123",
    "name": "general-chat",
    "updated_at": "2024-01-20T16:00:00Z"
  }
}
```

---

### Delete Channel

Deletes a channel.

**Endpoint**: `DELETE /{channel_id}`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `reason` | string | Reason for deletion |

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Channel deleted successfully"
}
```

---

## Channel Membership

### List Members

Lists channel members.

**Endpoint**: `GET /{channel_id}/members`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Results per page |
| `after` | string | Pagination cursor |
| `status` | string | Filter by status (online, idle, dnd, offline) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "usr_abc123",
        "username": "johndoe",
        "display_name": "John Doe",
        "avatar": "https://cdn.vcomm.io/avatars/usr_abc123.png",
        "status": {
          "text": "Working",
          "emoji": "💼"
        },
        "roles": ["admin", "moderator"],
        "joined_at": "2024-01-15T10:30:00Z",
        "last_read": "2024-01-20T15:00:00Z"
      }
    ],
    "total": 1250,
    "online": 42
  }
}
```

---

### Add Member

Adds a member to a private channel.

**Endpoint**: `POST /{channel_id}/members`

**Request Body**:
```json
{
  "user_id": "usr_xyz789"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_xyz789",
      "username": "janedoe"
    },
    "added_at": "2024-01-20T16:00:00Z"
  }
}
```

---

### Remove Member

Removes a member from a private channel.

**Endpoint**: `DELETE /{channel_id}/members/{user_id}`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

### Join Channel

Joins a public channel.

**Endpoint**: `POST /{channel_id}/join`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "channel": {
      "id": "ch_abc123",
      "name": "general"
    },
    "joined_at": "2024-01-20T16:00:00Z"
  }
}
```

---

### Leave Channel

Leaves a channel.

**Endpoint**: `POST /{channel_id}/leave`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Left channel successfully"
}
```

---

## Permissions

### Get Permissions

Gets user permissions in a channel.

**Endpoint**: `GET /{channel_id}/permissions`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | string | User ID (optional, defaults to current user) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "channel_id": "ch_abc123",
    "permissions": {
      "read": true,
      "write": true,
      "manage": false,
      "mention_everyone": true,
      "embed_links": true,
      "attach_files": true,
      "add_reactions": true,
      "use_external_emoji": true,
      "use_slash_commands": true,
      "connect": true,
      "speak": true,
      "stream": true,
      "mute_members": false,
      "deafen_members": false,
      "move_members": false
    },
    "allowed": ["read", "write", "mention_everyone"],
    "denied": ["manage"]
  }
}
```

---

### Update Permissions

Updates permission overwrites for a role or user.

**Endpoint**: `PUT /{channel_id}/permissions/{target_id}`

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `target_id` | string | Role ID or User ID |

**Request Body**:
```json
{
  "type": "role",
  "allow": ["read", "write", "add_reactions"],
  "deny": ["manage", "mention_everyone"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "target_id": "role_abc",
    "type": "role",
    "allow": ["read", "write", "add_reactions"],
    "deny": ["manage", "mention_everyone"]
  }
}
```

---

### Delete Permission Overwrite

Removes a permission overwrite.

**Endpoint**: `DELETE /{channel_id}/permissions/{target_id}`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Permission overwrite removed"
}
```

---

## Categories

### List Categories

Lists channel categories in a space.

**Endpoint**: `GET /categories`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `space_id` | string | Space ID (required) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat_def456",
        "name": "Text Channels",
        "position": 0,
        "channels": [
          {
            "id": "ch_abc123",
            "name": "general",
            "type": "public"
          }
        ]
      }
    ]
  }
}
```

---

### Create Category

Creates a new channel category.

**Endpoint**: `POST /categories`

**Request Body**:
```json
{
  "name": "Development",
  "space_id": "sp_xyz789",
  "position": 1,
  "permission_overwrites": []
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "cat_new123",
    "name": "Development",
    "position": 1,
    "created_at": "2024-01-20T16:00:00Z"
  }
}
```

---

### Update Category

Updates a category.

**Endpoint**: `PATCH /categories/{category_id}`

**Request Body**:
```json
{
  "name": "Dev Channels",
  "position": 2
}
```

---

### Delete Category

Deletes a category.

**Endpoint**: `DELETE /categories/{category_id}`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `move_channels_to` | string | Category ID to move channels to |

---

## Webhooks

### List Webhooks

Lists webhooks for a channel.

**Endpoint**: `GET /{channel_id}/webhooks`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "webhooks": [
      {
        "id": "wh_abc123",
        "name": "CI Notifications",
        "avatar": "https://cdn.vcomm.io/avatars/wh_abc123.png",
        "channel_id": "ch_abc123",
        "creator": {
          "id": "usr_abc123",
          "username": "johndoe"
        },
        "url": "https://api.vcomm.io/webhooks/wh_abc123/xxx",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### Create Webhook

Creates a new webhook.

**Endpoint**: `POST /{channel_id}/webhooks`

**Request Body**:
```json
{
  "name": "Deploy Bot",
  "avatar": "data:image/png;base64,..."
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "wh_new123",
    "name": "Deploy Bot",
    "url": "https://api.vcomm.io/webhooks/wh_new123/secret_token",
    "created_at": "2024-01-20T16:00:00Z"
  }
}
```

---

### Update Webhook

Updates a webhook.

**Endpoint**: `PATCH /{channel_id}/webhooks/{webhook_id}`

**Request Body**:
```json
{
  "name": "Updated Name",
  "channel_id": "ch_xyz789"
}
```

---

### Delete Webhook

Deletes a webhook.

**Endpoint**: `DELETE /{channel_id}/webhooks/{webhook_id}`

---

## Invites

### Create Invite

Creates a channel invite.

**Endpoint**: `POST /{channel_id}/invites`

**Request Body**:
```json
{
  "max_uses": 10,
  "max_age": 86400,
  "temporary": false,
  "unique": true
}
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `max_uses` | integer | Max uses (0 = unlimited) |
| `max_age` | integer | Expiry in seconds (0 = never) |
| `temporary` | boolean | Grant temporary membership |
| `unique` | boolean | Force unique invite code |

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "code": "abc123xyz",
    "url": "https://vcomm.io/invite/abc123xyz",
    "channel": {
      "id": "ch_abc123",
      "name": "general"
    },
    "inviter": {
      "id": "usr_abc123",
      "username": "johndoe"
    },
    "uses": 0,
    "max_uses": 10,
    "max_age": 86400,
    "expires_at": "2024-01-21T16:00:00Z",
    "created_at": "2024-01-20T16:00:00Z"
  }
}
```

---

### Get Invites

Lists channel invites.

**Endpoint**: `GET /{channel_id}/invites`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "invites": [
      {
        "code": "abc123xyz",
        "url": "https://vcomm.io/invite/abc123xyz",
        "uses": 5,
        "max_uses": 10,
        "expires_at": "2024-01-21T16:00:00Z",
        "created_at": "2024-01-20T16:00:00Z"
      }
    ]
  }
}
```

---

## Voice Channels

### Connect to Voice

Initiates voice connection.

**Endpoint**: `POST /{channel_id}/voice/connect`

**Request Body**:
```json
{
  "self_mute": false,
  "self_deaf": false,
  "video": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "endpoint": "voice-us-east.vcomm.io",
    "token": "voice_token_xxx",
    "session_id": "voice_sess_xxx",
    "guild_id": "sp_xyz789"
  }
}
```

---

### Voice Status

Updates voice status.

**Endpoint**: `PATCH /{channel_id}/voice/status`

**Request Body**:
```json
{
  "self_mute": true,
  "self_deaf": false,
  "request_to_speak": false
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CHANNEL_NOT_FOUND` | 404 | Channel does not exist |
| `INSUFFICIENT_PERMISSIONS` | 403 | Missing required permission |
| `CHANNEL_NAME_TAKEN` | 409 | Channel name already exists |
| `MAX_CHANNELS` | 400 | Maximum channels reached |
| `INVALID_CHANNEL_TYPE` | 400 | Invalid channel type |
| `NOT_A_MEMBER` | 403 | Not a member of private channel |
| `ALREADY_JOINED` | 409 | Already a channel member |

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { VCommClient } from '@vcomm/sdk';

const client = new VCommClient({ accessToken: 'your-token' });

// List channels
const channels = await client.channels.list({ space_id: 'sp_xyz789' });

// Create channel
const newChannel = await client.channels.create({
  name: 'new-channel',
  type: 'public',
  space_id: 'sp_xyz789'
});

// Update channel
await client.channels.update('ch_abc123', {
  topic: 'New topic'
});

// Create webhook
const webhook = await client.channels.createWebhook('ch_abc123', {
  name: 'Notification Bot'
});

// Create invite
const invite = await client.channels.createInvite('ch_abc123', {
  max_uses: 10,
  max_age: 86400
});
```

### Python

```python
from vcomm import VCommClient

client = VCommClient(access_token='your-token')

# List channels
channels = client.channels.list(space_id='sp_xyz789')

# Create channel
new_channel = client.channels.create(
    name='new-channel',
    type='public',
    space_id='sp_xyz789'
)

# Get members
members = client.channels.get_members('ch_abc123')
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Channel creation | 10 | 10 minutes |
| Channel updates | 30 | 1 minute |
| Webhook creation | 10 | 1 hour |
| Invite creation | 20 | 1 hour |

---

## Related Documentation

- [Messages API](./messages) - Message management
- [WebSocket Events](../websocket/events) - Real-time events
- [Channels Feature](../../features/channels) - Feature overview