---
sidebar_position: 2
title: Users API
description: REST API endpoints for user management, profiles, and preferences
keywords: [users, REST API, profile, preferences, avatar]
tags: [api, users, rest]
---

# Users API

The Users API provides endpoints for managing user profiles, preferences, and account settings. All endpoints require authentication unless otherwise noted.

## Overview

User resources contain profile information, preferences, and account settings. The API supports both user self-management and administrative operations.

## Base URL

```
https://api.vcomm.io/v1/users
```

---

## Endpoints

### Get Current User

Retrieves the authenticated user's profile.

**Endpoint**: `GET /me`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "username": "johndoe",
    "display_name": "John Doe",
    "avatar": "https://cdn.vcomm.io/avatars/usr_abc123.png",
    "banner": "https://cdn.vcomm.io/banners/usr_abc123.png",
    "bio": "Software developer and open source enthusiast",
    "location": "San Francisco, CA",
    "website": "https://johndoe.dev",
    "timezone": "America/Los_Angeles",
    "locale": "en-US",
    "status": {
      "text": "Working from home",
      "emoji": "🏠",
      "expires_at": null
    },
    "custom_status": null,
    "badges": ["early_adopter", "verified"],
    "roles": ["member"],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T15:45:00Z",
    "last_login": "2024-01-20T15:00:00Z",
    "mfa_enabled": true,
    "verified": true
  }
}
```

---

### Update Current User

Updates the authenticated user's profile.

**Endpoint**: `PATCH /me`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "display_name": "John D.",
  "bio": "Updated bio",
  "location": "New York, NY",
  "website": "https://johndoe.dev",
  "timezone": "America/New_York",
  "locale": "en-US"
}
```

**Parameters**:

| Parameter | Type | Max Length | Description |
|-----------|------|------------|-------------|
| `display_name` | string | 50 | Display name |
| `bio` | string | 500 | User biography |
| `location` | string | 100 | Location string |
| `website` | string | 200 | Website URL |
| `timezone` | string | - | IANA timezone identifier |
| `locale` | string | - | Locale code (e.g., en-US) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "display_name": "John D.",
    "bio": "Updated bio",
    "updated_at": "2024-01-20T16:00:00Z"
  }
}
```

---

### Update Status

Updates the user's status.

**Endpoint**: `PUT /me/status`

**Request Body**:
```json
{
  "text": "In a meeting",
  "emoji": "📅",
  "expires_at": "2024-01-20T17:00:00Z"
}
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | string | Status text (max 100 characters) |
| `emoji` | string | Status emoji |
| `expires_at` | string | ISO 8601 timestamp for expiration |

**Predefined Statuses**:

| Status | Emoji | Description |
|--------|-------|-------------|
| `online` | 🟢 | Online and available |
| `idle` | 🟡 | Away from keyboard |
| `dnd` | 🔴 | Do not disturb |
| `invisible` | ⚪ | Appear offline |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "status": {
      "text": "In a meeting",
      "emoji": "📅",
      "expires_at": "2024-01-20T17:00:00Z"
    }
  }
}
```

---

### Get User by ID

Retrieves a public user profile by ID.

**Endpoint**: `GET /{user_id}`

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | string | User ID (usr_xxx format) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "username": "johndoe",
    "display_name": "John Doe",
    "avatar": "https://cdn.vcomm.io/avatars/usr_abc123.png",
    "banner": "https://cdn.vcomm.io/banners/usr_abc123.png",
    "bio": "Software developer and open source enthusiast",
    "status": {
      "text": "Working from home",
      "emoji": "🏠"
    },
    "badges": ["early_adopter", "verified"],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get User by Username

Retrieves a public user profile by username.

**Endpoint**: `GET /username/{username}`

**Response**: Same as Get User by ID

---

### Search Users

Searches for users by various criteria.

**Endpoint**: `GET /search`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |
| `limit` | integer | Results per page (1-100, default 25) |
| `offset` | integer | Pagination offset |
| `sort` | string | Sort field (created, name, relevance) |
| `order` | string | Sort order (asc, desc) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "usr_abc123",
        "username": "johndoe",
        "display_name": "John Doe",
        "avatar": "https://cdn.vcomm.io/avatars/usr_abc123.png",
        "status": { "text": "Working", "emoji": "💼" }
      }
    ],
    "total": 42,
    "limit": 25,
    "offset": 0,
    "has_more": true
  }
}
```

---

### Upload Avatar

Uploads a new avatar image.

**Endpoint**: `POST /me/avatar`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body**:
```
avatar: <binary file>
```

**File Requirements**:
- Formats: PNG, JPG, GIF, WEBP
- Max size: 8 MB
- Min dimensions: 128x128 pixels
- Max dimensions: 4096x4096 pixels

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "avatar": "https://cdn.vcomm.io/avatars/usr_abc123.png",
    "avatar_hash": "a1b2c3d4e5f6"
  }
}
```

---

### Delete Avatar

Removes the user's avatar.

**Endpoint**: `DELETE /me/avatar`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Avatar removed successfully"
}
```

---

### Upload Banner

Uploads a new profile banner.

**Endpoint**: `POST /me/banner`

**File Requirements**:
- Formats: PNG, JPG, GIF, WEBP
- Max size: 10 MB
- Recommended dimensions: 1200x480 pixels

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "banner": "https://cdn.vcomm.io/banners/usr_abc123.png"
  }
}
```

---

## Preferences

### Get Preferences

Retrieves user preferences.

**Endpoint**: `GET /me/preferences`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "notifications": {
      "email": {
        "enabled": true,
        "mentions": true,
        "direct_messages": true,
        "channel_messages": false,
        "marketing": false
      },
      "push": {
        "enabled": true,
        "mentions": true,
        "direct_messages": true,
        "calls": true
      },
      "desktop": {
        "enabled": true,
        "sound": true,
        "desktop_notifications": true
      }
    },
    "privacy": {
      "profile_visibility": "public",
      "status_visibility": "everyone",
      "online_status": true,
      "read_receipts": true,
      "typing_indicator": true
    },
    "appearance": {
      "theme": "dark",
      "accent_color": "#5865F2",
      "font_size": 14,
      "compact_mode": false,
      "reduce_motion": false
    },
    "accessibility": {
      "screen_reader": false,
      "high_contrast": false,
      "reduce_motion": false
    },
    "audio": {
      "input_device": "default",
      "output_device": "default",
      "input_volume": 100,
      "output_volume": 100,
      "noise_suppression": true,
      "echo_cancellation": true
    }
  }
}
```

---

### Update Preferences

Updates user preferences.

**Endpoint**: `PATCH /me/preferences`

**Request Body**:
```json
{
  "notifications": {
    "email": {
      "marketing": false
    }
  },
  "privacy": {
    "online_status": false
  },
  "appearance": {
    "theme": "light"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "notifications": {
      "email": {
        "marketing": false
      }
    },
    "privacy": {
      "online_status": false
    },
    "appearance": {
      "theme": "light"
    }
  }
}
```

---

## Security Settings

### Get Security Settings

Retrieves security settings for the current user.

**Endpoint**: `GET /me/security`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "mfa_enabled": true,
    "mfa_methods": [
      {
        "type": "totp",
        "added_at": "2024-01-10T10:00:00Z",
        "last_used": "2024-01-20T15:00:00Z"
      },
      {
        "type": "webauthn",
        "name": "YubiKey 5",
        "added_at": "2024-01-15T10:00:00Z"
      }
    ],
    "sessions": {
      "total": 3,
      "current": "sess_abc123"
    },
    "recent_activity": [
      {
        "action": "login",
        "ip_address": "192.168.1.100",
        "location": "San Francisco, CA",
        "timestamp": "2024-01-20T15:00:00Z"
      }
    ]
  }
}
```

---

### Enable MFA (TOTP)

Initiates TOTP setup.

**Endpoint**: `POST /me/security/mfa/totp/setup`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qr_code": "data:image/png;base64,...",
    "backup_codes": [
      "12345-67890",
      "23456-78901",
      "34567-89012"
    ]
  }
}
```

**Verify Setup**: `POST /me/security/mfa/totp/verify`

**Request Body**:
```json
{
  "code": "123456"
}
```

---

### Disable MFA

Disables MFA for the account.

**Endpoint**: `DELETE /me/security/mfa`

**Request Body**:
```json
{
  "password": "currentPassword123",
  "mfa_code": "123456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "MFA disabled successfully"
}
```

---

### Generate Backup Codes

Generates new MFA backup codes.

**Endpoint**: `POST /me/security/mfa/backup-codes`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "backup_codes": [
      "12345-67890",
      "23456-78901",
      "34567-89012",
      "45678-90123",
      "56789-01234",
      "67890-12345",
      "78901-23456",
      "89012-34567"
    ]
  }
}
```

---

## Account Management

### Change Email

Initiates email change process.

**Endpoint**: `POST /me/email`

**Request Body**:
```json
{
  "new_email": "newemail@example.com",
  "password": "currentPassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Verification email sent to new address"
}
```

---

### Change Password

Changes the user's password.

**Endpoint**: `POST /me/password`

**Request Body**:
```json
{
  "current_password": "oldPassword123",
  "new_password": "newSecurePassword456",
  "mfa_code": "123456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### Delete Account

Initiates account deletion process.

**Endpoint**: `DELETE /me`

**Request Body**:
```json
{
  "password": "currentPassword123",
  "reason": "No longer needed",
  "feedback": "Optional feedback text"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "deletion_scheduled": "2024-01-27T10:30:00Z",
    "grace_period_days": 7,
    "message": "Account will be deleted in 7 days. You can cancel by logging in."
  }
}
```

---

## Relationships

### Get Relationships

Gets user's relationships (friends, blocked, etc.).

**Endpoint**: `GET /me/relationships`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Relationship type (friend, blocked, incoming, outgoing) |
| `limit` | integer | Results per page |
| `offset` | integer | Pagination offset |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "friends": [
      {
        "id": "usr_xyz789",
        "username": "janedoe",
        "display_name": "Jane Doe",
        "avatar": "https://cdn.vcomm.io/avatars/usr_xyz789.png",
        "status": { "text": "Online", "emoji": "🟢" },
        "friends_since": "2024-01-10T10:00:00Z"
      }
    ],
    "pending_incoming": [
      {
        "id": "usr_def456",
        "username": "bobsmith",
        "display_name": "Bob Smith",
        "avatar": "https://cdn.vcomm.io/avatars/usr_def456.png",
        "requested_at": "2024-01-20T10:00:00Z"
      }
    ],
    "pending_outgoing": [],
    "blocked": []
  }
}
```

---

### Send Friend Request

Sends a friend request to another user.

**Endpoint**: `POST /me/relationships/friends`

**Request Body**:
```json
{
  "user_id": "usr_xyz789"
}
```

**Alternative**: Send by username
```json
{
  "username": "janedoe"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "type": "outgoing",
    "user": {
      "id": "usr_xyz789",
      "username": "janedoe",
      "display_name": "Jane Doe"
    },
    "requested_at": "2024-01-20T16:00:00Z"
  }
}
```

---

### Accept Friend Request

Accepts an incoming friend request.

**Endpoint**: `PUT /me/relationships/friends/{user_id}`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "type": "friend",
    "user": {
      "id": "usr_def456",
      "username": "bobsmith",
      "display_name": "Bob Smith"
    },
    "friends_since": "2024-01-20T16:00:00Z"
  }
}
```

---

### Remove Friend

Removes a user from friends list.

**Endpoint**: `DELETE /me/relationships/friends/{user_id}`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Friend removed successfully"
}
```

---

### Block User

Blocks a user.

**Endpoint**: `POST /me/relationships/blocked`

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
      "username": "badactor"
    },
    "blocked_at": "2024-01-20T16:00:00Z"
  }
}
```

---

### Unblock User

Removes a user from blocked list.

**Endpoint**: `DELETE /me/relationships/blocked/{user_id}`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User unblocked successfully"
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `USER_NOT_FOUND` | 404 | User does not exist |
| `USERNAME_TAKEN` | 409 | Username already in use |
| `EMAIL_TAKEN` | 409 | Email already in use |
| `INVALID_USERNAME` | 400 | Username format is invalid |
| `INVALID_PASSWORD` | 400 | Password doesn't meet requirements |
| `SELF_ACTION` | 400 | Cannot perform action on yourself |
| `ALREADY_FRIENDS` | 409 | Already friends with this user |
| `FRIEND_REQUEST_EXISTS` | 409 | Friend request already exists |
| `USER_BLOCKED` | 403 | Cannot interact with blocked user |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |
| `INVALID_FILE_TYPE` | 415 | File type not supported |

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { VCommClient } from '@vcomm/sdk';

const client = new VCommClient({
  accessToken: 'your-access-token'
});

// Get current user
const me = await client.users.getMe();
console.log(`Logged in as ${me.display_name}`);

// Update profile
await client.users.updateMe({
  bio: 'Software developer',
  location: 'San Francisco, CA'
});

// Upload avatar
await client.users.uploadAvatar(fileInput.files[0]);

// Search users
const results = await client.users.search({ q: 'john', limit: 10 });

// Send friend request
await client.users.addFriend('usr_xyz789');
```

### Python

```python
from vcomm import VCommClient

client = VCommClient(access_token='your-access-token')

# Get current user
me = client.users.get_me()
print(f"Logged in as {me.display_name}")

# Update status
client.users.update_status(
    text='In a meeting',
    emoji='📅'
)

# Get friends
friends = client.users.get_relationships(type='friend')
for friend in friends:
    print(f"- {friend.display_name}")
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Profile updates | 30 requests | 1 minute |
| Avatar upload | 5 requests | 1 minute |
| Search | 30 requests | 1 minute |
| Friend requests | 10 requests | 1 hour |

---

## Related Documentation

- [Authentication API](./authentication) - Authentication endpoints
- [Channels API](./channels) - Channel management
- [Security Overview](../../security/overview) - Security architecture