---
sidebar_position: 1
title: GraphQL Queries
description: GraphQL query operations for reading data from V-COMM API
keywords: [graphql, queries, api, data, fetch]
tags: [api, graphql, queries]
---

# GraphQL Queries

GraphQL queries provide flexible data fetching for V-COMM resources. Unlike REST, GraphQL allows you to specify exactly which fields you need in a single request.

## Overview

**Endpoint**: `https://api.vcomm.io/graphql`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## User Queries

### Get Current User

Fetch the authenticated user's profile.

```graphql
query GetCurrentUser {
  me {
    id
    username
    displayName
    email
    avatar
    banner
    bio
    status {
      text
      emoji
      expiresAt
    }
    createdAt
    updatedAt
  }
}
```

**Response**:
```json
{
  "data": {
    "me": {
      "id": "usr_abc123",
      "username": "johndoe",
      "displayName": "John Doe",
      "email": "user@example.com",
      "avatar": "https://cdn.vcomm.io/avatars/usr_abc123.png",
      "banner": null,
      "bio": "Software developer",
      "status": {
        "text": "Working",
        "emoji": "💼",
        "expiresAt": null
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T15:00:00Z"
    }
  }
}
```

### Get User by ID

Fetch a user by their ID.

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    username
    displayName
    avatar
    bio
    status {
      text
      emoji
    }
    createdAt
  }
}
```

**Variables**:
```json
{
  "id": "usr_abc123"
}
```

### Search Users

Search for users with filters.

```graphql
query SearchUsers($query: String!, $limit: Int, $offset: Int) {
  userSearch(query: $query, limit: $limit, offset: $offset) {
    users {
      id
      username
      displayName
      avatar
    }
    total
    hasMore
  }
}
```

**Variables**:
```json
{
  "query": "john",
  "limit": 10,
  "offset": 0
}
```

---

## Channel Queries

### Get Channel

Fetch a single channel.

```graphql
query GetChannel($id: ID!) {
  channel(id: $id) {
    id
    name
    type
    description
    topic
    position
    nsfw
    rateLimit
    category {
      id
      name
      position
    }
    space {
      id
      name
    }
    permissions {
      read
      write
      manage
    }
    stats {
      memberCount
      messageCount
      onlineCount
    }
    createdAt
  }
}
```

### List Channels

List channels in a space.

```graphql
query ListChannels($spaceId: ID!, $type: ChannelType, $limit: Int) {
  channels(spaceId: $spaceId, type: $type, limit: $limit) {
    id
    name
    type
    description
    position
    memberCount
    category {
      id
      name
    }
  }
}
```

**Variables**:
```json
{
  "spaceId": "sp_xyz789",
  "type": "PUBLIC",
  "limit": 50
}
```

### Get Channel Members

Fetch members of a channel.

```graphql
query GetChannelMembers($channelId: ID!, $limit: Int, $after: String) {
  channelMembers(channelId: $channelId, limit: $limit, after: $after) {
    members {
      id
      username
      displayName
      avatar
      status {
        text
        emoji
      }
      roles {
        id
        name
        color
      }
      joinedAt
    }
    total
    hasMore
  }
}
```

---

## Message Queries

### Get Messages

Fetch messages from a channel.

```graphql
query GetMessages($channelId: ID!, $limit: Int, $before: String, $after: String) {
  messages(channelId: $channelId, limit: $limit, before: $before, after: $after) {
    id
    content
    author {
      id
      username
      displayName
      avatar
    }
    timestamp
    editedTimestamp
    attachments {
      id
      filename
      url
      size
      contentType
    }
    embeds {
      title
      description
      color
      fields {
        name
        value
        inline
      }
    }
    reactions {
      emoji
      count
      me
    }
    pinned
    type
  }
}
```

**Variables**:
```json
{
  "channelId": "ch_abc123",
  "limit": 50,
  "before": null
}
```

### Get Message

Fetch a single message.

```graphql
query GetMessage($id: ID!) {
  message(id: $id) {
    id
    content
    author {
      id
      username
      displayName
    }
    channel {
      id
      name
      space {
        id
        name
      }
    }
    timestamp
    editedTimestamp
    attachments {
      id
      filename
      url
    }
    reactions {
      emoji
      count
    }
    replyTo {
      id
      content
      author {
        username
      }
    }
  }
}
```

### Search Messages

Search for messages.

```graphql
query SearchMessages($input: MessageSearchInput!) {
  messageSearch(input: $input) {
    messages {
      id
      content
      author {
        id
        username
      }
      channel {
        id
        name
      }
      timestamp
    }
    total
    hasMore
  }
}
```

**Variables**:
```json
{
  "input": {
    "query": "important announcement",
    "spaceId": "sp_xyz789",
    "limit": 25
  }
}
```

---

## Space Queries

### Get Space

Fetch a space by ID.

```graphql
query GetSpace($id: ID!) {
  space(id: $id) {
    id
    name
    description
    icon
    banner
    ownerId
    features
    permissions {
      manageRoles
      manageChannels
      manageWebhooks
      inviteUsers
      banMembers
    }
    stats {
      memberCount
      onlineCount
      channelCount
    }
    roles {
      id
      name
      color
      position
      permissions
    }
    createdAt
  }
}
```

### List Spaces

List spaces for the current user.

```graphql
query ListSpaces($limit: Int, $offset: Int) {
  spaces(limit: $limit, offset: $offset) {
    id
    name
    description
    icon
    banner
    memberCount
    onlineCount
    joinedAt
    owner {
      id
      username
    }
  }
}
```

### Get Space Members

```graphql
query GetSpaceMembers($spaceId: ID!, $limit: Int, $after: String) {
  spaceMembers(spaceId: $spaceId, limit: $limit, after: $after) {
    members {
      id
      username
      displayName
      avatar
      nick
      status {
        text
        emoji
      }
      roles {
        id
        name
        color
      }
      joinedAt
      premiumSince
    }
    total
    onlineCount
    hasMore
  }
}
```

---

## File Queries

### Get File

Fetch a file by ID.

```graphql
query GetFile($id: ID!) {
  file(id: $id) {
    id
    name
    size
    mimeType
    url
    downloadUrl
    thumbnailUrl
    folder {
      id
      name
      path
    }
    versions {
      id
      version
      size
      createdAt
      uploadedBy {
        id
        username
      }
    }
    permissions {
      read
      write
      delete
      share
    }
    createdAt
    updatedAt
  }
}
```

### List Files

List files in a folder.

```graphql
query ListFiles($folderId: ID, $type: String, $limit: Int, $offset: Int) {
  files(folderId: $folderId, type: $type, limit: $limit, offset: $offset) {
    files {
      id
      name
      size
      mimeType
      thumbnailUrl
      createdAt
    }
    folders {
      id
      name
      fileCount
      createdAt
    }
    totalFiles
    totalFolders
    totalSize
  }
}
```

### Get Storage Info

```graphql
query GetStorageInfo {
  storageInfo {
    used
    total
    available
    percentUsed
    limits {
      maxFileSize
      maxFiles
    }
    breakdown {
      documents
      images
      videos
      other
    }
  }
}
```

---

## Notification Queries

### Get Notifications

Fetch user notifications.

```graphql
query GetNotifications($limit: Int, $unreadOnly: Boolean) {
  notifications(limit: $limit, unreadOnly: $unreadOnly) {
    id
    type
    title
    body
    read
    data
    createdAt
    actor {
      id
      username
      avatar
    }
  }
}
```

### Get Unread Count

```graphql
query GetUnreadCounts {
  unreadCounts {
    mentions
    directMessages
    notifications
    total
  }
}
```

---

## Relationship Queries

### Get Friends

```graphql
query GetFriends {
  friends {
    id
    username
    displayName
    avatar
    status {
      text
      emoji
    }
    friendsSince
  }
}
```

### Get Friend Requests

```graphql
query GetFriendRequests {
  friendRequests {
    incoming {
      id
      user {
        id
        username
        displayName
        avatar
      }
      requestedAt
    }
    outgoing {
      id
      user {
        id
        username
        displayName
        avatar
      }
      requestedAt
    }
  }
}
```

---

## Server Stats Query

### Get Server Statistics

```graphql
query GetServerStats($spaceId: ID!) {
  serverStats(spaceId: $spaceId) {
    members {
      total
      online
      newToday
      newThisWeek
    }
    messages {
      total
      today
      thisWeek
      averagePerDay
    }
    activity {
      mostActiveChannel {
        id
        name
        messageCount
      }
      mostActiveUser {
        id
        username
        messageCount
      }
    }
    growth {
      date
      memberCount
      messageCount
    }
  }
}
```

---

## Query Fragments

Use fragments for reusable field selections:

```graphql
fragment UserFields on User {
  id
  username
  displayName
  avatar
  status {
    text
    emoji
  }
}

fragment ChannelFields on Channel {
  id
  name
  type
  description
  position
}

fragment MessageFields on Message {
  id
  content
  timestamp
  author {
    ...UserFields
  }
  attachments {
    id
    filename
    url
  }
}

query GetChannelWithMessages($channelId: ID!) {
  channel(id: $channelId) {
    ...ChannelFields
  }
  messages(channelId: $channelId, limit: 50) {
    ...MessageFields
  }
}
```

---

## Error Handling

GraphQL returns errors in a standard format:

```json
{
  "data": {
    "user": null
  },
  "errors": [
    {
      "message": "User not found",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["user"],
      "extensions": {
        "code": "USER_NOT_FOUND",
        "http": { "status": 404 }
      }
    }
  ]
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Permission denied |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input |
| `RATE_LIMITED` | Too many requests |

---

## Pagination

V-COMM GraphQL supports two pagination styles:

### Offset-Based Pagination

```graphql
query PaginatedSpaces($limit: Int, $offset: Int) {
  spaces(limit: $limit, offset: $offset) {
    id
    name
  }
}
```

### Cursor-Based Pagination

```graphql
query CursorMessages($channelId: ID!, $first: Int, $after: String) {
  messagesConnection(channelId: $channelId, first: $first, after: $after) {
    edges {
      node {
        id
        content
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { VCommClient, gql } from '@vcomm/sdk';

const client = new VCommClient({
  endpoint: 'https://api.vcomm.io/graphql',
  accessToken: 'your-token'
});

// Query current user
const { data } = await client.query(gql`
  query GetCurrentUser {
    me {
      id
      username
      displayName
    }
  }
`);

console.log(data.me.username);

// Query with variables
const messages = await client.query(
  gql`query GetMessages($channelId: ID!, $limit: Int) {
    messages(channelId: $channelId, limit: $limit) {
      id
      content
    }
  }`,
  { channelId: 'ch_abc123', limit: 50 }
);
```

### Python

```python
from vcomm import VCommClient
from gql import gql

client = VCommClient(
    endpoint='https://api.vcomm.io/graphql',
    access_token='your-token'
)

# Query current user
query = gql('''
  query GetCurrentUser {
    me {
      id
      username
      displayName
    }
  }
''')

result = client.execute(query)
print(result['me']['username'])

# Query with variables
messages_query = gql('''
  query GetMessages($channelId: ID!, $limit: Int) {
    messages(channelId: $channelId, limit: $limit) {
      id
      content
    }
  }
''')

messages = client.execute(
    messages_query,
    variable_values={'channelId': 'ch_abc123', 'limit': 50}
)
```

---

## Rate Limiting

| Operation Type | Limit | Window |
|----------------|-------|--------|
| Query | 100 | 1 minute |
| Search | 30 | 1 minute |
| Complex queries | 30 | 1 minute |

Complex queries are those with:
- More than 10 nested levels
- More than 100 fields
- Multiple nested connections

---

## Related Documentation

- [GraphQL Mutations](./mutations) - Data modifications
- [GraphQL Subscriptions](./subscriptions) - Real-time updates
- [REST API](../rest/authentication) - REST endpoints