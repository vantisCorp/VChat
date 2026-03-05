---
sidebar_position: 4
title: Messages API
description: REST API endpoints for sending, receiving, and managing messages
keywords: [messages, REST API, messaging, chat, communication]
tags: [api, messages, rest]
---

# Messages API

The Messages API provides endpoints for sending, retrieving, and managing messages in channels and direct messages. All endpoints require authentication.

## Overview

Messages in V-COMM support rich content including text, emojis, mentions, attachments, embeds, and reactions. Messages are end-to-end encrypted for private communications.

## Base URL

```
https://api.vcomm.io/v1/messages
```

---

## Endpoints

### List Messages

Retrieves messages from a channel or conversation.

**Endpoint**: `GET /channels/{channel_id}`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Messages to retrieve (1-100, default 50) |
| `before` | string | Get messages before this message ID |
| `after` | string | Get messages after this message ID |
| `around` | string | Get messages around this message ID |
| `include_nsfw` | boolean | Include NSFW content |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_abc123",
        "channel_id": "ch_xyz789",
        "author": {
          "id": "usr_abc123",
          "username": "johndoe",
          "display_name": "John Doe",
          "avatar": "https://cdn.vcomm.io/avatars/usr_abc123.png",
          "bot": false
        },
        "content": "Hello everyone! 👋",
        "timestamp": "2024-01-20T10:30:00Z",
        "edited_timestamp": null,
        "tts": false,
        "mentions_everyone": false,
        "mentions": [],
        "mention_roles": [],
        "attachments": [],
        "embeds": [],
        "reactions": [
          {
            "emoji": "👋",
            "count": 5,
            "me": true
          }
        ],
        "pinned": false,
        "type": "default"
      }
    ],
    "has_more_before": true,
    "has_more_after": false
  }
}
```

---

### Send Message

Sends a new message to a channel.

**Endpoint**: `POST /channels/{channel_id}`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "content": "Hello world!",
  "nonce": "unique-string",
  "tts": false,
  "embeds": [],
  "allowed_mentions": {
    "parse": ["users", "roles", "everyone"],
    "users": ["usr_abc123"],
    "roles": ["role_abc"],
    "replied_user": true
  },
  "message_reference": {
    "message_id": "msg_xyz789",
    "fail_if_not_exists": true
  },
  "sticker_ids": ["sticker_abc"],
  "components": []
}
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | No | Message text (max 2000 chars) |
| `nonce` | string | No | Unique ID for deduplication |
| `tts` | boolean | No | Text-to-speech flag |
| `embeds` | array | No | Embedded content |
| `allowed_mentions` | object | No | Mention parsing controls |
| `message_reference` | object | No | Reply to message |
| `sticker_ids` | array | No | Sticker IDs |
| `components` | array | No | Interactive components |

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "msg_new123",
    "channel_id": "ch_xyz789",
    "author": {
      "id": "usr_abc123",
      "username": "johndoe",
      "display_name": "John Doe",
      "avatar": "https://cdn.vcomm.io/avatars/usr_abc123.png"
    },
    "content": "Hello world!",
    "timestamp": "2024-01-20T16:00:00Z",
    "edited_timestamp": null,
    "tts": false,
    "mention_everyone": false,
    "pinned": false,
    "type": "default"
  }
}
```

---

### Get Message

Retrieves a specific message.

**Endpoint**: `GET /{message_id}`

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `message_id` | string | Message ID (msg_xxx format) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "msg_abc123",
    "channel_id": "ch_xyz789",
    "author": { ... },
    "content": "Message content",
    "timestamp": "2024-01-20T10:30:00Z",
    "edited_timestamp": null,
    "tts": false,
    "mentions": [],
    "attachments": [],
    "embeds": [],
    "reactions": [],
    "pinned": false
  }
}
```

---

### Edit Message

Edits an existing message.

**Endpoint**: `PATCH /{message_id}`

**Request Body**:
```json
{
  "content": "Updated message content",
  "embeds": [],
  "allowed_mentions": {
    "parse": []
  },
  "flags": 64
}
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `content` | string | New message content |
| `embeds` | array | New embeds (replaces all) |
| `allowed_mentions` | object | Mention controls |
| `flags` | integer | Message flags |

**Message Flags**:

| Flag | Value | Description |
|------|-------|-------------|
| SUPPRESS_EMBEDS | 4 | Hide embeds |
| SUPPRESS_NOTIFICATIONS | 12 | Silent message |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "msg_abc123",
    "content": "Updated message content",
    "edited_timestamp": "2024-01-20T16:00:00Z"
  }
}
```

---

### Delete Message

Deletes a message.

**Endpoint**: `DELETE /{message_id}`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `reason` | string | Reason for deletion |

**Response** (204 No Content):
```json
{
  "success": true
}
```

---

### Bulk Delete

Deletes multiple messages at once.

**Endpoint**: `POST /bulk-delete`

**Request Body**:
```json
{
  "channel_id": "ch_xyz789",
  "messages": ["msg_abc123", "msg_def456", "msg_ghi789"]
}
```

**Constraints**:
- Maximum 100 messages per request
- Messages must be no older than 14 days
- Requires `MANAGE_MESSAGES` permission

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "deleted": 3
  }
}
```

---

## Reactions

### Create Reaction

Adds a reaction to a message.

**Endpoint**: `PUT /{message_id}/reactions/{emoji}/@me`

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `message_id` | string | Message ID |
| `emoji` | string | Emoji (Unicode or custom format) |

**Examples**:
- Unicode: `👍`
- Custom: `name:id` (e.g., `custom_emoji:123456789`)

**Response** (204 No Content)

---

### Delete Reaction

Removes a reaction from a message.

**Endpoint**: `DELETE /{message_id}/reactions/{emoji}/@me`

**Response** (204 No Content)

---

### List Reactions

Lists all reactions on a message.

**Endpoint**: `GET /{message_id}/reactions/{emoji}`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `after` | string | Get users after this user ID |
| `limit` | integer | Users per page (1-100) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "emoji": "👍",
    "users": [
      {
        "id": "usr_abc123",
        "username": "johndoe",
        "avatar": "https://cdn.vcomm.io/avatars/usr_abc123.png"
      }
    ],
    "total": 5
  }
}
```

---

### Delete All Reactions

Removes all reactions from a message.

**Endpoint**: `DELETE /{message_id}/reactions`

**Response** (204 No Content)

---

### Delete Specific Reactions

Removes all reactions of a specific emoji.

**Endpoint**: `DELETE /{message_id}/reactions/{emoji}`

**Response** (204 No Content)

---

## Pinning

### Pin Message

Pins a message to the channel.

**Endpoint**: `PUT /{message_id}/pin`

**Request Body**:
```json
{
  "reason": "Important announcement"
}
```

**Response** (204 No Content)

---

### Unpin Message

Unpins a message.

**Endpoint**: `DELETE /{message_id}/pin`

**Response** (204 No Content)

---

### List Pinned Messages

Lists all pinned messages in a channel.

**Endpoint**: `GET /channels/{channel_id}/pins`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_abc123",
        "content": "Important announcement!",
        "author": { ... },
        "timestamp": "2024-01-20T10:30:00Z"
      }
    ],
    "total": 5
  }
}
```

---

## Crossposting

### Crosspost Message

Publishes a message from an announcement channel to other channels.

**Endpoint**: `POST /{message_id}/crosspost`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message_id": "msg_abc123",
    "crossposted_channels": 3
  }
}
```

---

## Typing Indicators

### Trigger Typing Indicator

Notifies that the user is typing.

**Endpoint**: `POST /channels/{channel_id}/typing`

**Note**: Triggers typing for 10 seconds. Must be called again to extend.

**Response** (204 No Content)

---

## Search

### Search Messages

Searches for messages in a space.

**Endpoint**: `GET /search`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search query |
| `space_id` | string | Space to search |
| `channel_id` | string | Channel to search |
| `author_id` | string | Filter by author |
| `min_id` | string | Minimum message ID |
| `max_id` | string | Maximum message ID |
| `has` | string | Filter (attachment, link, embed) |
| `limit` | integer | Results per page (1-25) |
| `offset` | integer | Pagination offset |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_abc123",
        "content": "Search result message",
        "author": { ... },
        "channel": {
          "id": "ch_xyz789",
          "name": "general"
        },
        "timestamp": "2024-01-20T10:30:00Z"
      }
    ],
    "total_matches": 42,
    "total_pages": 2,
    "limit": 25,
    "offset": 0
  }
}
```

---

## Direct Messages

### Create DM

Creates or retrieves a direct message channel.

**Endpoint**: `POST /@me`

**Request Body**:
```json
{
  "recipient_id": "usr_xyz789"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "dm_abc123",
    "recipients": [
      {
        "id": "usr_abc123",
        "username": "johndoe"
      },
      {
        "id": "usr_xyz789",
        "username": "janedoe"
      }
    ],
    "last_message_id": "msg_def456"
  }
}
```

---

### List DMs

Lists direct message channels.

**Endpoint**: `GET /@me`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "id": "dm_abc123",
        "recipients": [
          {
            "id": "usr_xyz789",
            "username": "janedoe",
            "avatar": "https://cdn.vcomm.io/avatars/usr_xyz789.png",
            "status": { "text": "Online", "emoji": "🟢" }
          }
        ],
        "last_message": {
          "id": "msg_def456",
          "content": "Hey there!",
          "timestamp": "2024-01-20T15:00:00Z"
        }
      }
    ]
  }
}
```

---

## Message Formatting

### Markdown Support

V-COMM supports standard Markdown formatting:

```markdown
**Bold text**
*Italic text*
~~Strikethrough~~
`Inline code`
```
Code block
```

> Blockquote

# Heading
## Subheading

[Link text](https://example.com)
```

### Mentions

| Type | Format | Example |
|------|--------|---------|
| User mention | `<@USER_ID>` | `<@usr_abc123>` |
| Role mention | `<@&ROLE_ID>` | `<@&role_abc123>` |
| Channel mention | `<#CHANNEL_ID>` | `<#ch_xyz789>` |
| Everyone | `@everyone` | `@everyone` |
| Here | `@here` | `@here` |

### Embeds

Message embeds for rich content:

```json
{
  "title": "Embed Title",
  "description": "Embed description",
  "url": "https://example.com",
  "color": 5865F2,
  "timestamp": "2024-01-20T10:30:00Z",
  "footer": {
    "text": "Footer text",
    "icon_url": "https://example.com/icon.png"
  },
  "image": {
    "url": "https://example.com/image.png"
  },
  "thumbnail": {
    "url": "https://example.com/thumb.png"
  },
  "video": {
    "url": "https://example.com/video.mp4"
  },
  "provider": {
    "name": "Provider Name",
    "url": "https://example.com"
  },
  "author": {
    "name": "Author Name",
    "url": "https://example.com",
    "icon_url": "https://example.com/icon.png"
  },
  "fields": [
    {
      "name": "Field 1",
      "value": "Value 1",
      "inline": true
    },
    {
      "name": "Field 2",
      "value": "Value 2",
      "inline": true
    }
  ]
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MESSAGE_NOT_FOUND` | 404 | Message does not exist |
| `INSUFFICIENT_PERMISSIONS` | 403 | Missing required permission |
| `MESSAGE_TOO_LONG` | 400 | Message exceeds character limit |
| `RATE_LIMITED` | 429 | Too many messages sent |
| `CANNOT_SEND_EMPTY` | 400 | Cannot send empty message |
| `MESSAGE_TOO_OLD` | 403 | Cannot edit/delete old message |
| `REACTION_BLOCKED` | 403 | Reaction blocked by user |
| `PIN_LIMIT_REACHED` | 400 | Maximum pins reached |

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { VCommClient } from '@vcomm/sdk';

const client = new VCommClient({ accessToken: 'your-token' });

// Send message
const message = await client.messages.send('ch_xyz789', {
  content: 'Hello world!',
  embeds: [{
    title: 'Rich embed',
    description: 'This is an embed'
  }]
});

// Reply to message
const reply = await client.messages.send('ch_xyz789', {
  content: 'This is a reply',
  messageReference: {
    messageId: 'msg_abc123'
  }
});

// Add reaction
await client.messages.createReaction('msg_abc123', '👍');

// Edit message
await client.messages.edit('msg_abc123', {
  content: 'Updated content'
});

// Search messages
const results = await client.messages.search({
  query: 'important',
  spaceId: 'sp_xyz789'
});
```

### Python

```python
from vcomm import VCommClient

client = VCommClient(access_token='your-token')

# Send message
message = client.messages.send(
    'ch_xyz789',
    content='Hello world!',
    tts=False
)

# Add reaction
client.messages.create_reaction('msg_abc123', '👍')

# List messages with pagination
messages = client.messages.list(
    'ch_xyz789',
    limit=50,
    before='msg_xyz789'
)

# Delete message
client.messages.delete('msg_abc123')
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Send message | 10 | 1 second (per channel) |
| Send message | 50 | 1 minute (global) |
| Edit message | 10 | 1 second |
| Delete message | 5 | 1 second |
| Create reaction | 5 | 1 second |
| Search | 100 | 1 minute |

---

## Message Limits

| Limit | Value |
|-------|-------|
| Max message length | 2000 characters |
| Max embeds per message | 10 |
| Max attachments per message | 10 |
| Max reactions per message | 20 |
| Max pin per channel | 50 |
| Max age for editing | 24 hours |
| Max age for deletion | 14 days |

---

## Related Documentation

- [Channels API](./channels) - Channel management
- [Files API](./files) - File uploads
- [WebSocket Events](../websocket/events) - Real-time message events