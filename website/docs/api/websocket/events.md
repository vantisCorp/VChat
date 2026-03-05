---
sidebar_position: 2
title: WebSocket Events
description: Reference for all WebSocket events sent and received through V-COMM Gateway
keywords: [websocket, events, real-time, gateway, payloads]
tags: [api, websocket, real-time]
---

# WebSocket Events

WebSocket events provide real-time updates for all activities in V-COMM. Events are dispatched with opcode 0 and include an event type in the `t` field.

## Event Structure

```json
{
  "op": 0,
  "t": "EVENT_NAME",
  "s": 42,
  "d": {
    // Event data
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `op` | integer | Opcode (always 0 for events) |
| `t` | string | Event type |
| `s` | integer | Sequence number |
| `d` | object | Event data |

---

## Connection Events

### READY

Sent after successful identification. Contains initial state.

```json
{
  "op": 0,
  "t": "READY",
  "s": 1,
  "d": {
    "v": 10,
    "user": {
      "id": "usr_abc123",
      "username": "johndoe",
      "discriminator": "0001",
      "avatar": "avatar_hash",
      "verified": true,
      "mfa_enabled": true,
      "email": "user@example.com"
    },
    "spaces": [
      {
        "id": "sp_xyz789",
        "name": "My Space",
        "icon": "icon_hash",
        "owner_id": "usr_abc123",
        "permissions": 8,
        "features": []
      }
    ],
    "relationships": [
      {
        "id": "usr_def456",
        "type": 1,
        "user": {
          "id": "usr_def456",
          "username": "janedoe"
        }
      }
    ],
    "session_id": "sess_abc123",
    "resume_gateway_url": "wss://gateway.vcomm.io",
    "user_settings": {
      "locale": "en-US",
      "theme": "dark"
    },
    "private_channels": [
      {
        "id": "dm_abc123",
        "type": 1,
        "recipients": ["usr_def456"]
      }
    ]
  }
}
```

### RESUMED

Sent after successful resume.

```json
{
  "op": 0,
  "t": "RESUMED",
  "s": 252,
  "d": {
    "_trace": ["gateway-prd-main-abc123"]
  }
}
```

---

## Channel Events

### CHANNEL_CREATE

A new channel was created.

```json
{
  "op": 0,
  "t": "CHANNEL_CREATE",
  "s": 10,
  "d": {
    "id": "ch_abc123",
    "name": "general",
    "type": 0,
    "space_id": "sp_xyz789",
    "category_id": "cat_def456",
    "position": 0,
    "permission_overwrites": [],
    "nsfw": false,
    "topic": "General discussion"
  }
}
```

### CHANNEL_UPDATE

A channel was updated.

```json
{
  "op": 0,
  "t": "CHANNEL_UPDATE",
  "s": 11,
  "d": {
    "id": "ch_abc123",
    "name": "general-updated",
    "topic": "Updated topic"
  }
}
```

### CHANNEL_DELETE

A channel was deleted.

```json
{
  "op": 0,
  "t": "CHANNEL_DELETE",
  "s": 12,
  "d": {
    "id": "ch_abc123",
    "space_id": "sp_xyz789",
    "name": "deleted-channel"
  }
}
```

---

## Message Events

### MESSAGE_CREATE

A new message was created.

```json
{
  "op": 0,
  "t": "MESSAGE_CREATE",
  "s": 20,
  "d": {
    "id": "msg_abc123",
    "channel_id": "ch_xyz789",
    "author": {
      "id": "usr_abc123",
      "username": "johndoe",
      "display_name": "John Doe",
      "avatar": "avatar_hash",
      "bot": false
    },
    "content": "Hello world!",
    "timestamp": "2024-01-20T10:30:00Z",
    "edited_timestamp": null,
    "tts": false,
    "mention_everyone": false,
    "mentions": [],
    "mention_roles": [],
    "attachments": [],
    "embeds": [],
    "reactions": [],
    "pinned": false,
    "type": 0,
    "webhook_id": null
  }
}
```

### MESSAGE_UPDATE

A message was updated.

```json
{
  "op": 0,
  "t": "MESSAGE_UPDATE",
  "s": 21,
  "d": {
    "id": "msg_abc123",
    "channel_id": "ch_xyz789",
    "content": "Updated content",
    "edited_timestamp": "2024-01-20T10:35:00Z"
  }
}
```

### MESSAGE_DELETE

A message was deleted.

```json
{
  "op": 0,
  "t": "MESSAGE_DELETE",
  "s": 22,
  "d": {
    "id": "msg_abc123",
    "channel_id": "ch_xyz789"
  }
}
```

### MESSAGE_DELETE_BULK

Multiple messages were deleted.

```json
{
  "op": 0,
  "t": "MESSAGE_DELETE_BULK",
  "s": 23,
  "d": {
    "ids": ["msg_abc123", "msg_def456"],
    "channel_id": "ch_xyz789"
  }
}
```

---

## Reaction Events

### MESSAGE_REACTION_ADD

A reaction was added to a message.

```json
{
  "op": 0,
  "t": "MESSAGE_REACTION_ADD",
  "s": 30,
  "d": {
    "user_id": "usr_abc123",
    "channel_id": "ch_xyz789",
    "message_id": "msg_abc123",
    "emoji": {
      "id": null,
      "name": "👍"
    },
    "member": {
      "user": {
        "id": "usr_abc123",
        "username": "johndoe"
      },
      "roles": ["role_abc123"]
    }
  }
}
```

### MESSAGE_REACTION_REMOVE

A reaction was removed from a message.

```json
{
  "op": 0,
  "t": "MESSAGE_REACTION_REMOVE",
  "s": 31,
  "d": {
    "user_id": "usr_abc123",
    "channel_id": "ch_xyz789",
    "message_id": "msg_abc123",
    "emoji": {
      "id": null,
      "name": "👍"
    }
  }
}
```

### MESSAGE_REACTION_REMOVE_ALL

All reactions were removed from a message.

```json
{
  "op": 0,
  "t": "MESSAGE_REACTION_REMOVE_ALL",
  "s": 32,
  "d": {
    "channel_id": "ch_xyz789",
    "message_id": "msg_abc123"
  }
}
```

---

## Presence Events

### PRESENCE_UPDATE

A user's presence was updated.

```json
{
  "op": 0,
  "t": "PRESENCE_UPDATE",
  "s": 40,
  "d": {
    "user": {
      "id": "usr_abc123",
      "username": "johndoe"
    },
    "space_id": "sp_xyz789",
    "status": "online",
    "activities": [
      {
        "name": "Custom Status",
        "type": 4,
        "state": "Working on something important"
      }
    ],
    "client_status": {
      "desktop": "online",
      "mobile": "idle",
      "web": "dnd"
    }
  }
}
```

**Status Values**: `online`, `idle`, `dnd`, `offline`

**Activity Types**:

| Type | Value | Description |
|------|-------|-------------|
| Game | 0 | Playing a game |
| Streaming | 1 | Streaming on Twitch/YouTube |
| Listening | 2 | Listening to music |
| Watching | 3 | Watching something |
| Custom | 4 | Custom status |

### PRESENCE_REPLACE

Bulk presence updates (rare).

```json
{
  "op": 0,
  "t": "PRESENCE_REPLACE",
  "s": 41,
  "d": [
    {
      "user": { "id": "usr_abc123", "username": "johndoe" },
      "status": "online"
    }
  ]
}
```

---

## Typing Events

### TYPING_START

A user started typing.

```json
{
  "op": 0,
  "t": "TYPING_START",
  "s": 50,
  "d": {
    "channel_id": "ch_xyz789",
    "user_id": "usr_abc123",
    "timestamp": 1705758600,
    "member": {
      "user": { "id": "usr_abc123", "username": "johndoe" },
      "roles": []
    }
  }
}
```

---

## Member Events

### GUILD_MEMBER_ADD

A user joined a space.

```json
{
  "op": 0,
  "t": "GUILD_MEMBER_ADD",
  "s": 60,
  "d": {
    "user": {
      "id": "usr_abc123",
      "username": "johndoe",
      "display_name": "John Doe",
      "avatar": "avatar_hash"
    },
    "nick": null,
    "roles": ["role_abc123"],
    "joined_at": "2024-01-20T10:30:00Z",
    "premium_since": null,
    "deaf": false,
    "mute": false,
    "pending": false
  }
}
```

### GUILD_MEMBER_UPDATE

A member was updated.

```json
{
  "op": 0,
  "t": "GUILD_MEMBER_UPDATE",
  "s": 61,
  "d": {
    "space_id": "sp_xyz789",
    "user": {
      "id": "usr_abc123",
      "username": "johndoe"
    },
    "nick": "New Nickname",
    "roles": ["role_abc123", "role_def456"]
  }
}
```

### GUILD_MEMBER_REMOVE

A user left a space.

```json
{
  "op": 0,
  "t": "GUILD_MEMBER_REMOVE",
  "s": 62,
  "d": {
    "space_id": "sp_xyz789",
    "user": {
      "id": "usr_abc123",
      "username": "johndoe"
    }
  }
}
```

---

## Role Events

### GUILD_ROLE_CREATE

A role was created.

```json
{
  "op": 0,
  "t": "GUILD_ROLE_CREATE",
  "s": 70,
  "d": {
    "space_id": "sp_xyz789",
    "role": {
      "id": "role_abc123",
      "name": "Moderator",
      "color": 9136738,
      "hoist": true,
      "position": 2,
      "permissions": 8,
      "managed": false,
      "mentionable": true
    }
  }
}
```

### GUILD_ROLE_UPDATE

A role was updated.

```json
{
  "op": 0,
  "t": "GUILD_ROLE_UPDATE",
  "s": 71,
  "d": {
    "space_id": "sp_xyz789",
    "role": {
      "id": "role_abc123",
      "name": "Admin",
      "permissions": 2147483647
    }
  }
}
```

### GUILD_ROLE_DELETE

A role was deleted.

```json
{
  "op": 0,
  "t": "GUILD_ROLE_DELETE",
  "s": 72,
  "d": {
    "space_id": "sp_xyz789",
    "role_id": "role_abc123"
  }
}
```

---

## User Events

### USER_UPDATE

A user was updated.

```json
{
  "op": 0,
  "t": "USER_UPDATE",
  "s": 80,
  "d": {
    "id": "usr_abc123",
    "username": "johndoe",
    "display_name": "John D.",
    "avatar": "new_avatar_hash",
    "discriminator": "0001"
  }
}
```

---

## Invite Events

### INVITE_CREATE

An invite was created.

```json
{
  "op": 0,
  "t": "INVITE_CREATE",
  "s": 90,
  "d": {
    "code": "abc123xyz",
    "space_id": "sp_xyz789",
    "channel_id": "ch_abc123",
    "inviter": {
      "id": "usr_abc123",
      "username": "johndoe"
    },
    "max_uses": 10,
    "max_age": 86400,
    "temporary": false,
    "created_at": "2024-01-20T10:30:00Z"
  }
}
```

### INVITE_DELETE

An invite was deleted.

```json
{
  "op": 0,
  "t": "INVITE_DELETE",
  "s": 91,
  "d": {
    "code": "abc123xyz",
    "space_id": "sp_xyz789",
    "channel_id": "ch_abc123"
  }
}
```

---

## Voice Events

### VOICE_STATE_UPDATE

A voice state was updated.

```json
{
  "op": 0,
  "t": "VOICE_STATE_UPDATE",
  "s": 100,
  "d": {
    "user_id": "usr_abc123",
    "space_id": "sp_xyz789",
    "channel_id": "ch_voice123",
    "session_id": "voice_sess_abc123",
    "deaf": false,
    "mute": false,
    "self_deaf": false,
    "self_mute": false,
    "suppress": false
  }
}
```

### VOICE_SERVER_UPDATE

Voice server information (for connection).

```json
{
  "op": 0,
  "t": "VOICE_SERVER_UPDATE",
  "s": 101,
  "d": {
    "token": "voice_token_abc123",
    "space_id": "sp_xyz789",
    "endpoint": "voice-us-east.vcomm.io"
  }
}
```

---

## Client Events (Sent by Client)

### Gateway Status Update

Update the client's status.

```json
{
  "op": 3,
  "d": {
    "since": null,
    "activities": [
      {
        "name": "Custom Status",
        "type": 4,
        "state": "Working"
      }
    ],
    "status": "dnd",
    "afk": false
  }
}
```

### Voice State Update

Update voice state (join/leave voice channel).

```json
{
  "op": 4,
  "d": {
    "space_id": "sp_xyz789",
    "channel_id": "ch_voice123",
    "self_mute": false,
    "self_deaf": false
  }
}
```

### Request Space Members

Request members for a space.

```json
{
  "op": 8,
  "d": {
    "space_id": "sp_xyz789",
    "query": "",
    "limit": 0,
    "presences": true,
    "user_ids": ["usr_abc123", "usr_def456"],
    "nonce": "abc123xyz"
  }
}
```

---

## Gateway Payload Limits

| Limit | Value |
|-------|-------|
| Max payload size | 4096 bytes (without compression) |
| Max characters | 2000 for message content |
| Max embed size | 6000 characters |

---

## Event Filtering

Use intents to filter events:

```javascript
const INTENTS = {
  SPACES: 1 << 0,
  SPACE_MEMBERS: 1 << 1,
  SPACE_MESSAGES: 1 << 2,
  DIRECT_MESSAGES: 1 << 3,
  MESSAGE_CONTENT: 1 << 4,
  PRESENCES: 1 << 5,
  TYPING: 1 << 6,
  REACTIONS: 1 << 7,
  VOICE: 1 << 8,
  INVITES: 1 << 9
};

// Combine intents
const myIntents = INTENTS.SPACES | INTENTS.SPACE_MESSAGES | INTENTS.PRESENCES;
```

---

## Error Events

### Gateway Error

Gateway error event.

```json
{
  "op": 0,
  "t": "GATEWAY_ERROR",
  "s": 500,
  "d": {
    "code": 4000,
    "message": "Unknown error",
    "details": {}
  }
}
```

### Rate Limit

Rate limit warning.

```json
{
  "op": 0,
  "t": "RATE_LIMIT",
  "s": 501,
  "d": {
    "retry_after": 5000,
    "limit": 120,
    "remaining": 0
  }
}
```

---

## Related Documentation

- [WebSocket Connection](./connection) - Connection setup and lifecycle
- [WebSocket Gateway](./gateway) - Advanced gateway features
- [Messages API](../rest/messages) - Message management