# API Reference

Complete API documentation for V-COMM. This document covers all available endpoints, authentication, and data formats.

## 📡 API Overview

V-COMM provides multiple API interfaces:

- **REST API**: Traditional HTTP endpoints
- **GraphQL API**: Flexible query language
- **WebSocket API**: Real-time communication
- **gRPC API**: High-performance internal communication

### Base URLs

| Environment | Base URL |
|------------|----------|
| Production | `https://api.vcomm.app/v1` |
| Staging | `https://api.staging.vcomm.app/v1` |
| Development | `http://localhost:3001/v1` |

## 🔐 Authentication

All API requests require authentication using JWT tokens.

### Getting Tokens

```http
POST /auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "secure_password"
}
```

**Response**:

```json
{
  "access_token": "eyJhbGciOiJ...",
  "refresh_token": "eyJhbGciOiJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Using Tokens

Include the access token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJ...
```

### Refreshing Tokens

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJ..."
}
```

## 📚 REST API Endpoints

### Authentication

#### Login

```http
POST /v1/auth/login
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | User email or username |
| password | string | Yes | User password |
| mfa_code | string | No | MFA code if enabled |
| device_id | string | No | Unique device identifier |

**Response**: `200 OK`

```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "username": "string",
    "display_name": "string",
    "avatar_url": "string"
  }
}
```

**Error Responses**:

| Status | Description |
|--------|-------------|
| 401 | Invalid credentials |
| 403 | Account locked |
| 429 | Rate limit exceeded |

#### Register

```http
POST /v1/auth/register
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email |
| username | string | Yes | Unique username |
| password | string | Yes | Password (min 12 chars) |
| public_key | string | Yes | Base64 encoded public key |
| pqc_public_key | string | Yes | Base64 encoded PQC public key |

**Response**: `201 Created`

```json
{
  "user_id": "uuid",
  "verification_required": true
}
```

#### Logout

```http
POST /v1/auth/logout
Authorization: Bearer {token}
```

**Response**: `204 No Content`

#### WebAuthn Registration

```http
POST /v1/auth/webauthn/register/start
Authorization: Bearer {token}
```

**Response**:

```json
{
  "challenge": "base64_encoded_challenge",
  "rp": {
    "name": "V-COMM",
    "id": "vcomm.app"
  },
  "user": {
    "id": "base64_encoded_user_id",
    "name": "username",
    "displayName": "Display Name"
  },
  "pubKeyCredParams": [
    {"type": "public-key", "alg": -7},
    {"type": "public-key", "alg": -257}
  ]
}
```

```http
POST /v1/auth/webauthn/register/finish
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "credential_id",
  "rawId": "base64_encoded_raw_id",
  "response": {
    "clientDataJSON": "base64_encoded",
    "attestationObject": "base64_encoded"
  },
  "type": "public-key"
}
```

### Users

#### Get Current User

```http
GET /v1/users/me
Authorization: Bearer {token}
```

**Response**: `200 OK`

```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "display_name": "string",
  "avatar_url": "string",
  "status": "online|idle|dnd|offline",
  "created_at": "2024-01-01T00:00:00Z",
  "settings": {
    "theme": "dark",
    "notifications_enabled": true,
    "locale": "en"
  },
  "public_key": "base64_encoded",
  "pqc_public_key": "base64_encoded"
}
```

#### Update User

```http
PATCH /v1/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "display_name": "New Name",
  "status": "online",
  "settings": {
    "theme": "light"
  }
}
```

**Response**: `200 OK`

#### Get User by ID

```http
GET /v1/users/{user_id}
Authorization: Bearer {token}
```

**Response**: `200 OK`

```json
{
  "id": "uuid",
  "username": "string",
  "display_name": "string",
  "avatar_url": "string",
  "status": "online",
  "public_key": "base64_encoded"
}
```

### Channels

#### List Channels

```http
GET /v1/channels
Authorization: Bearer {token}
```

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter by type: txt, room, forum, ticket |
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 50, max: 100) |

**Response**: `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "general",
      "type": "txt",
      "description": "General discussion",
      "member_count": 42,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "total_pages": 2
  }
}
```

#### Create Channel

```http
POST /v1/channels
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "channel-name",
  "type": "txt",
  "description": "Channel description",
  "encryption_enabled": true
}
```

**Response**: `201 Created`

```json
{
  "id": "uuid",
  "name": "channel-name",
  "type": "txt",
  "description": "Channel description",
  "encryption_key": "base64_encoded_channel_key",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Get Channel

```http
GET /v1/channels/{channel_id}
Authorization: Bearer {token}
```

**Response**: `200 OK`

#### Update Channel

```http
PATCH /v1/channels/{channel_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "new-name",
  "description": "New description"
}
```

#### Delete Channel

```http
DELETE /v1/channels/{channel_id}
Authorization: Bearer {token}
```

**Response**: `204 No Content`

### Messages

#### List Messages

```http
GET /v1/channels/{channel_id}/messages
Authorization: Bearer {token}
```

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| before | string | Message ID for pagination |
| after | string | Message ID for pagination |
| limit | integer | Messages per page (default: 50) |

**Response**: `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "channel_id": "uuid",
      "sender_id": "uuid",
      "content": "base64_encrypted_content",
      "nonce": "base64_nonce",
      "attachments": [
        {
          "id": "uuid",
          "filename": "document.pdf",
          "size": 1024,
          "content_type": "application/pdf"
        }
      ],
      "created_at": "2024-01-01T00:00:00Z",
      "edited_at": null
    }
  ],
  "has_more": true
}
```

#### Send Message

```http
POST /v1/channels/{channel_id}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "base64_encrypted_content",
  "nonce": "base64_nonce",
  "attachments": ["attachment_id_1", "attachment_id_2"]
}
```

**Response**: `201 Created`

```json
{
  "id": "uuid",
  "channel_id": "uuid",
  "sender_id": "uuid",
  "content": "base64_encrypted_content",
  "nonce": "base64_nonce",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Edit Message

```http
PATCH /v1/channels/{channel_id}/messages/{message_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "base64_new_encrypted_content",
  "nonce": "base64_nonce"
}
```

#### Delete Message

```http
DELETE /v1/channels/{channel_id}/messages/{message_id}
Authorization: Bearer {token}
```

**Response**: `204 No Content`

### Files

#### Upload File

```http
POST /v1/files/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary]
channel_id: uuid (optional)
```

**Response**: `201 Created`

```json
{
  "id": "uuid",
  "filename": "document.pdf",
  "size": 1024,
  "content_type": "application/pdf",
  "url": "https://storage.vcomm.app/files/uuid",
  "encryption_key": "base64_key"
}
```

#### Download File

```http
GET /v1/files/{file_id}
Authorization: Bearer {token}
```

**Response**: `200 OK` (binary data)

### V-DRIVE (P2P Storage)

#### List Files

```http
GET /v1/drive
Authorization: Bearer {token}
```

**Response**: `200 OK`

```json
{
  "files": [
    {
      "id": "uuid",
      "name": "document.pdf",
      "size": 1024,
      "cid": "QmXxxx...", 
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total_size": 1024,
  "storage_limit": 10737418240
}
```

#### Upload to V-DRIVE

```http
POST /v1/drive/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary]
encrypt: true
```

**Response**: `201 Created`

```json
{
  "id": "uuid",
  "name": "document.pdf",
  "size": 1024,
  "cid": "QmXxxx...",
  "peers": 3
}
```

## 🔌 WebSocket API

### Connection

```javascript
const ws = new WebSocket('wss://api.vcomm.app/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    op: 1, // Identify
    d: {
      token: 'Bearer eyJhbGciOiJ...'
    }
  }));
};
```

### Gateway Events

| OP Code | Name | Description |
|---------|------|-------------|
| 0 | Dispatch | Server event |
| 1 | Identify | Client authentication |
| 2 | Hello | Server hello |
| 3 | Heartbeat | Keep connection alive |
| 4 | Resume | Resume session |
| 5 | Reconnect | Server requests reconnect |

### Event Types

#### Message Create

```json
{
  "op": 0,
  "t": "MESSAGE_CREATE",
  "d": {
    "id": "uuid",
    "channel_id": "uuid",
    "sender_id": "uuid",
    "content": "base64_encrypted",
    "nonce": "base64_nonce",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Message Update

```json
{
  "op": 0,
  "t": "MESSAGE_UPDATE",
  "d": {
    "id": "uuid",
    "channel_id": "uuid",
    "content": "base64_encrypted",
    "nonce": "base64_nonce",
    "edited_at": "2024-01-01T00:01:00Z"
  }
}
```

#### Message Delete

```json
{
  "op": 0,
  "t": "MESSAGE_DELETE",
  "d": {
    "id": "uuid",
    "channel_id": "uuid"
  }
}
```

#### Presence Update

```json
{
  "op": 0,
  "t": "PRESENCE_UPDATE",
  "d": {
    "user_id": "uuid",
    "status": "online",
    "activity": {
      "type": "playing",
      "name": "Game Name"
    }
  }
}
```

#### Typing Start

```json
{
  "op": 0,
  "t": "TYPING_START",
  "d": {
    "user_id": "uuid",
    "channel_id": "uuid"
  }
}
```

### Voice/Video Events

#### Voice State Update

```json
{
  "op": 0,
  "t": "VOICE_STATE_UPDATE",
  "d": {
    "user_id": "uuid",
    "channel_id": "uuid",
    "session_id": "uuid",
    "deaf": false,
    "mute": false,
    "self_deaf": false,
    "self_mute": false,
    "video_enabled": true,
    "screen_enabled": false
  }
}
```

## 📊 GraphQL API

### Endpoint

```http
POST /graphql
Authorization: Bearer {token}
Content-Type: application/json
```

### Schema

```graphql
type Query {
  me: User!
  user(id: ID!): User
  channel(id: ID!): Channel
  channels(type: ChannelType, page: Int, limit: Int): ChannelConnection!
  message(id: ID!): Message
  search(query: String!, type: SearchType): SearchResult!
}

type Mutation {
  createChannel(input: CreateChannelInput!): Channel!
  updateChannel(id: ID!, input: UpdateChannelInput!): Channel!
  deleteChannel(id: ID!): Boolean!
  sendMessage(channelId: ID!, input: SendMessageInput!): Message!
  editMessage(id: ID!, input: EditMessageInput!): Message!
  deleteMessage(id: ID!): Boolean!
  updateUser(input: UpdateUserInput!): User!
}

type Subscription {
  messageCreated(channelId: ID!): Message!
  messageUpdated(channelId: ID!): Message!
  messageDeleted(channelId: ID!): ID!
  presenceUpdated(userId: ID!): Presence!
  typingStarted(channelId: ID!): TypingUser!
  voiceStateUpdated(channelId: ID!): VoiceState!
}

type User {
  id: ID!
  username: String!
  displayName: String!
  avatarUrl: String
  status: UserStatus!
  createdAt: DateTime!
  publicKey: String!
  pqcPublicKey: String!
}

type Channel {
  id: ID!
  name: String!
  type: ChannelType!
  description: String
  memberCount: Int!
  createdAt: DateTime!
  messages(before: ID, after: ID, limit: Int): MessageConnection!
}

type Message {
  id: ID!
  channelId: ID!
  senderId: ID!
  sender: User!
  content: String!
  nonce: String!
  attachments: [Attachment!]!
  createdAt: DateTime!
  editedAt: DateTime
}

enum ChannelType {
  TXT
  ROOM
  FORUM
  TICKET
}

enum UserStatus {
  ONLINE
  IDLE
  DND
  OFFLINE
}

scalar DateTime
```

### Example Queries

#### Get Current User

```graphql
query {
  me {
    id
    username
    displayName
    status
    publicKey
    pqcPublicKey
  }
}
```

#### List Channels

```graphql
query GetChannels($type: ChannelType, $page: Int, $limit: Int) {
  channels(type: $type, page: $page, limit: $limit) {
    data {
      id
      name
      type
      memberCount
    }
    pagination {
      total
      totalPages
    }
  }
}
```

### Example Mutations

#### Create Channel

```graphql
mutation CreateChannel($input: CreateChannelInput!) {
  createChannel(input: $input) {
    id
    name
    type
    encryptionKey
  }
}
```

#### Send Message

```graphql
mutation SendMessage($channelId: ID!, $input: SendMessageInput!) {
  sendMessage(channelId: $channelId, input: $input) {
    id
    content
    nonce
    createdAt
  }
}
```

### Example Subscriptions

#### Message Created

```graphql
subscription OnMessageCreated($channelId: ID!) {
  messageCreated(channelId: $channelId) {
    id
    senderId
    content
    nonce
    createdAt
  }
}
```

## ⚡ Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Auth endpoints | 10 | 1 minute |
| API endpoints | 100 | 1 minute |
| WebSocket messages | 50 | 1 second |
| File uploads | 10 | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

## ❌ Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request was invalid",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_REQUEST | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Permission denied |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| RATE_LIMITED | 429 | Rate limit exceeded |
| INTERNAL_ERROR | 500 | Server error |

## 📝 SDK Examples

### JavaScript/TypeScript

```typescript
import { VCOMMClient } from '@vcomm/sdk';

const client = new VCOMMClient({
  token: process.env.VCOMM_TOKEN
});

// Send a message
const message = await client.channels.sendMessage('channel-id', {
  content: encryptedContent,
  nonce: nonce
});

// Subscribe to messages
client.on('messageCreate', (message) => {
  console.log('New message:', message);
});
```

### Rust

```rust
use vcomm_client::{Client, Config};

let client = Client::new(Config {
    token: std::env::var("VCOMM_TOKEN")?,
});

// Send a message
let message = client
    .channels()
    .send_message("channel-id", SendMessageRequest {
        content: encrypted_content,
        nonce,
    })
    .await?;
```

---

**Last Updated**: March 2025  
**Version**: 1.0.0-alpha  
**API Version**: v1