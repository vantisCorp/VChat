---
sidebar_position: 2
title: GraphQL Mutations
description: GraphQL mutation operations for modifying data in V-COMM API
keywords: [graphql, mutations, api, modify, update]
tags: [api, graphql, mutations]
---

# GraphQL Mutations

GraphQL mutations allow you to modify data in V-COMM. All mutations require authentication and appropriate permissions.

## Overview

**Endpoint**: `https://api.vcomm.io/graphql`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## User Mutations

### Update Profile

Update the authenticated user's profile.

```graphql
mutation UpdateProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    id
    username
    displayName
    bio
    location
    website
    updatedAt
  }
}
```

**Variables**:
```json
{
  "input": {
    "displayName": "John D.",
    "bio": "Updated bio",
    "location": "San Francisco, CA",
    "website": "https://johndoe.dev"
  }
}
```

### Update Status

```graphql
mutation UpdateStatus($input: UpdateStatusInput!) {
  updateStatus(input: $input) {
    status {
      text
      emoji
      expiresAt
    }
  }
}
```

**Variables**:
```json
{
  "input": {
    "text": "In a meeting",
    "emoji": "📅",
    "expiresAt": "2024-01-20T17:00:00Z"
  }
}
```

### Upload Avatar

```graphql
mutation UploadAvatar($file: Upload!) {
  uploadAvatar(file: $file) {
    id
    avatar
    avatarHash
  }
}
```

### Change Password

```graphql
mutation ChangePassword($input: ChangePasswordInput!) {
  changePassword(input: $input) {
    success
    message
  }
}
```

**Variables**:
```json
{
  "input": {
    "currentPassword": "oldPassword123",
    "newPassword": "newSecurePassword456"
  }
}
```

---

## Channel Mutations

### Create Channel

Create a new channel.

```graphql
mutation CreateChannel($input: CreateChannelInput!) {
  createChannel(input: $input) {
    id
    name
    type
    description
    topic
    position
    category {
      id
      name
    }
    space {
      id
      name
    }
    createdAt
  }
}
```

**Variables**:
```json
{
  "input": {
    "name": "project-alpha",
    "type": "PRIVATE",
    "spaceId": "sp_xyz789",
    "description": "Project Alpha discussion",
    "topic": "Development updates",
    "categoryId": "cat_abc123",
    "position": 5
  }
}
```

### Update Channel

```graphql
mutation UpdateChannel($id: ID!, $input: UpdateChannelInput!) {
  updateChannel(id: $id, input: $input) {
    id
    name
    description
    topic
    position
    rateLimit
    updatedAt
  }
}
```

**Variables**:
```json
{
  "id": "ch_abc123",
  "input": {
    "name": "general-chat",
    "topic": "Updated topic",
    "position": 1
  }
}
```

### Delete Channel

```graphql
mutation DeleteChannel($id: ID!, $reason: String) {
  deleteChannel(id: $id, reason: $reason) {
    success
    message
  }
}
```

### Join Channel

```graphql
mutation JoinChannel($id: ID!) {
  joinChannel(id: $id) {
    id
    name
    joinedAt
  }
}
```

### Leave Channel

```graphql
mutation LeaveChannel($id: ID!) {
  leaveChannel(id: $id) {
    success
    message
  }
}
```

---

## Message Mutations

### Create Message

Send a new message.

```graphql
mutation CreateMessage($input: CreateMessageInput!) {
  createMessage(input: $input) {
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
    }
    timestamp
    editedTimestamp
    attachments {
      id
      filename
      url
    }
    embeds {
      title
      description
      fields {
        name
        value
      }
    }
    reactions {
      emoji
      count
      me
    }
  }
}
```

**Variables**:
```json
{
  "input": {
    "channelId": "ch_abc123",
    "content": "Hello world!",
    "embeds": [
      {
        "title": "Rich Embed",
        "description": "This is an embed",
        "color": 5865F2,
        "fields": [
          {
            "name": "Field 1",
            "value": "Value 1",
            "inline": true
          }
        ]
      }
    ],
    "messageReference": {
      "messageId": "msg_xyz789"
    }
  }
}
```

### Update Message

Edit an existing message.

```graphql
mutation UpdateMessage($id: ID!, $input: UpdateMessageInput!) {
  updateMessage(id: $id, input: $input) {
    id
    content
    editedTimestamp
  }
}
```

**Variables**:
```json
{
  "id": "msg_abc123",
  "input": {
    "content": "Updated message content",
    "embeds": []
  }
}
```

### Delete Message

```graphql
mutation DeleteMessage($id: ID!) {
  deleteMessage(id: $id) {
    success
  }
}
```

### Bulk Delete Messages

```graphql
mutation BulkDeleteMessages($channelId: ID!, $messageIds: [ID!]!) {
  bulkDeleteMessages(channelId: $channelId, messageIds: $messageIds) {
    deleted
    success
  }
}
```

**Variables**:
```json
{
  "channelId": "ch_abc123",
  "messageIds": ["msg_abc123", "msg_def456", "msg_ghi789"]
}
```

---

## Reaction Mutations

### Add Reaction

```graphql
mutation AddReaction($input: AddReactionInput!) {
  addReaction(input: $input) {
    id
    reactions {
      emoji
      count
      me
    }
  }
}
```

**Variables**:
```json
{
  "input": {
    "messageId": "msg_abc123",
    "emoji": "👍"
  }
}
```

### Remove Reaction

```graphql
mutation RemoveReaction($input: RemoveReactionInput!) {
  removeReaction(input: $input) {
    id
    reactions {
      emoji
      count
      me
    }
  }
}
```

### Pin Message

```graphql
mutation PinMessage($id: ID!) {
  pinMessage(id: $id) {
    id
    pinned
    pinnedAt
  }
}
```

### Unpin Message

```graphql
mutation UnpinMessage($id: ID!) {
  unpinMessage(id: $id) {
    id
    pinned
  }
}
```

---

## File Mutations

### Upload File

```graphql
mutation UploadFile($file: Upload!, $folderId: ID, $name: String) {
  uploadFile(file: $file, folderId: $folderId, name: $name) {
    id
    name
    size
    mimeType
    url
    downloadUrl
    thumbnailUrl
    createdAt
  }
}
```

### Update File

```graphql
mutation UpdateFile($id: ID!, $input: UpdateFileInput!) {
  updateFile(id: $id, input: $input) {
    id
    name
    description
    updatedAt
  }
}
```

**Variables**:
```json
{
  "id": "file_abc123",
  "input": {
    "name": "renamed-file.pdf",
    "description": "Updated description"
  }
}
```

### Delete File

```graphql
mutation DeleteFile($id: ID!, $permanent: Boolean) {
  deleteFile(id: $id, permanent: $permanent) {
    success
    message
  }
}
```

### Create Folder

```graphql
mutation CreateFolder($input: CreateFolderInput!) {
  createFolder(input: $input) {
    id
    name
    parentId
    path
    createdAt
  }
}
```

**Variables**:
```json
{
  "input": {
    "name": "New Folder",
    "parentId": "folder_abc123"
  }
}
```

---

## Space Mutations

### Create Space

```graphql
mutation CreateSpace($input: CreateSpaceInput!) {
  createSpace(input: $input) {
    id
    name
    description
    icon
    ownerId
    features
    createdAt
  }
}
```

**Variables**:
```json
{
  "input": {
    "name": "My New Space",
    "description": "A space for discussions",
    "icon": null,
    "features": ["COMMUNITY", "DISCOVERY", "ANALYTICS"]
  }
}
```

### Update Space

```graphql
mutation UpdateSpace($id: ID!, $input: UpdateSpaceInput!) {
  updateSpace(id: $id, input: $input) {
    id
    name
    description
    icon
    banner
    updatedAt
  }
}
```

### Delete Space

```graphql
mutation DeleteSpace($id: ID!) {
  deleteSpace(id: $id) {
    success
    message
  }
}
```

---

## Member Mutations

### Kick Member

Remove a member from a space.

```graphql
mutation KickMember($spaceId: ID!, $userId: ID!, $reason: String) {
  kickMember(spaceId: $spaceId, userId: $userId, reason: $reason) {
    success
    message
  }
}
```

### Ban Member

```graphql
mutation BanMember($input: BanMemberInput!) {
  banMember(input: $input) {
    success
    ban {
      id
      userId
      spaceId
      reason
      expiresAt
    }
  }
}
```

**Variables**:
```json
{
  "input": {
    "spaceId": "sp_abc123",
    "userId": "usr_xyz789",
    "reason": "Violating community guidelines",
    "deleteMessageHistory": false
  }
}
```

### Unban Member

```graphql
mutation UnbanMember($spaceId: ID!, $userId: ID!) {
  unbanMember(spaceId: $spaceId, userId: $userId) {
    success
    message
  }
}
```

---

## Role Mutations

### Create Role

```graphql
mutation CreateRole($spaceId: ID!, $input: CreateRoleInput!) {
  createRole(spaceId: $spaceId, input: $input) {
    id
    name
    color
    position
    permissions
    createdAt
  }
}
```

**Variables**:
```json
{
  "spaceId": "sp_abc123",
  "input": {
    "name": "Moderator",
    "color": 9136738,
    "permissions": ["MANAGE_MESSAGES", "KICK_MEMBERS"],
    "hoist": true,
    "mentionable": true
  }
}
```

### Update Role

```graphql
mutation UpdateRole($roleId: ID!, $input: UpdateRoleInput!) {
  updateRole(roleId: $roleId, input: $input) {
    id
    name
    color
    permissions
    updatedAt
  }
}
```

### Delete Role

```graphql
mutation DeleteRole($roleId: ID!) {
  deleteRole(roleId: $roleId) {
    success
    message
  }
}
```

### Assign Role

```graphql
mutation AssignRole($spaceId: ID!, $userId: ID!, $roleId: ID!) {
  assignRole(spaceId: $spaceId, userId: $userId, roleId: $roleId) {
    id
    roles {
      id
      name
      color
    }
  }
}
```

### Remove Role

```graphql
mutation RemoveRole($spaceId: ID!, $userId: ID!, $roleId: ID!) {
  removeRole(spaceId: $spaceId, userId: $userId, roleId: $roleId) {
    id
    roles {
      id
      name
    }
  }
}
```

---

## Relationship Mutations

### Send Friend Request

```graphql
mutation SendFriendRequest($userId: ID!) {
  sendFriendRequest(userId: $userId) {
    id
    type
    user {
      id
      username
      displayName
    }
    requestedAt
  }
}
```

### Accept Friend Request

```graphql
mutation AcceptFriendRequest($userId: ID!) {
  acceptFriendRequest(userId: $userId) {
    id
    type
    user {
      id
      username
      displayName
    }
    friendsSince
  }
}
```

### Remove Friend

```graphql
mutation RemoveFriend($userId: ID!) {
  removeFriend(userId: $userId) {
    success
    message
  }
}
```

### Block User

```graphql
mutation BlockUser($userId: ID!) {
  blockUser(userId: $userId) {
    id
    user {
      id
      username
    }
    blockedAt
  }
}
```

### Unblock User

```graphql
mutation UnblockUser($userId: ID!) {
  unblockUser(userId: $userId) {
    success
    message
  }
}
```

---

## Invite Mutations

### Create Invite

```graphql
mutation CreateInvite($channelId: ID!, $input: CreateInviteInput!) {
  createInvite(channelId: $channelId, input: $input) {
    code
    url
    channel {
      id
      name
    }
    maxUses
    uses
    expiresAt
    createdAt
  }
}
```

**Variables**:
```json
{
  "channelId": "ch_abc123",
  "input": {
    "maxUses": 10,
    "maxAge": 86400,
    "temporary": false,
    "unique": true
  }
}
```

### Delete Invite

```graphql
mutation DeleteInvite($code: String!) {
  deleteInvite(code: $code) {
    success
    message
  }
}
```

### Accept Invite

```graphql
mutation AcceptInvite($code: String!) {
  acceptInvite(code: $code) {
    success
    space {
      id
      name
    }
    channel {
      id
      name
    }
  }
}
```

---

## Webhook Mutations

### Create Webhook

```graphql
mutation CreateWebhook($channelId: ID!, $input: CreateWebhookInput!) {
  createWebhook(channelId: $channelId, input: $input) {
    id
    name
    avatar
    url
    channel {
      id
      name
    }
    createdAt
  }
}
```

**Variables**:
```json
{
  "channelId": "ch_abc123",
  "input": {
    "name": "CI Notifications",
    "avatar": "data:image/png;base64,..."
  }
}
```

### Update Webhook

```graphql
mutation UpdateWebhook($webhookId: ID!, $input: UpdateWebhookInput!) {
  updateWebhook(webhookId: $webhookId, input: $input) {
    id
    name
    avatar
    updatedAt
  }
}
```

### Delete Webhook

```graphql
mutation DeleteWebhook($webhookId: ID!) {
  deleteWebhook(webhookId: $webhookId) {
    success
    message
  }
}
```

---

## Notification Mutations

### Mark Notifications Read

```graphql
mutation MarkNotificationsRead($input: MarkNotificationsReadInput!) {
  markNotificationsRead(input: $input) {
    success
    markedCount
  }
}
```

**Variables**:
```json
{
  "input": {
    "notificationIds": ["notif_abc123", "notif_def456"],
    "markAll": false
  }
}
```

---

## Batch Mutations

### Batch Create Messages

```graphql
mutation BatchCreateMessages($input: BatchCreateMessagesInput!) {
  batchCreateMessages(input: $input) {
    messages {
      id
      content
    }
    success
    errors {
      index
      message
    }
  }
}
```

**Variables**:
```json
{
  "input": {
    "channelId": "ch_abc123",
    "messages": [
      { "content": "Message 1" },
      { "content": "Message 2" },
      { "content": "Message 3" }
    ]
  }
}
```

---

## Error Handling

```json
{
  "data": {
    "createChannel": null
  },
  "errors": [
    {
      "message": "Channel name is too long",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["createChannel"],
      "extensions": {
        "code": "VALIDATION_ERROR",
        "validationErrors": {
          "name": ["Must be at most 100 characters"]
        }
      }
    }
  ]
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

// Create channel
const { data } = await client.mutate(gql`
  mutation CreateChannel($input: CreateChannelInput!) {
    createChannel(input: $input) {
      id
      name
      type
    }
  }
`, {
  variables: {
    input: {
      name: 'new-channel',
      type: 'PUBLIC',
      spaceId: 'sp_xyz789'
    }
  }
});

console.log('Created channel:', data.createChannel.id);

// Send message
const message = await client.mutate(gql`
  mutation CreateMessage($input: CreateMessageInput!) {
    createMessage(input: $input) {
      id
      content
      timestamp
    }
  }
`, {
  variables: {
    input: {
      channelId: 'ch_abc123',
      content: 'Hello from GraphQL!'
    }
  }
});
```

### Python

```python
from vcomm import VCommClient
from gql import gql

client = VCommClient(
    endpoint='https://api.vcomm.io/graphql',
    access_token='your-token'
)

# Create channel
mutation = gql('''
  mutation CreateChannel($input: CreateChannelInput!) {
    createChannel(input: $input) {
      id
      name
      type
    }
  }
''')

result = client.execute(mutation, variable_values={
    'input': {
        'name': 'new-channel',
        'type': 'PUBLIC',
        'spaceId': 'sp_xyz789'
    }
})

print('Created channel:', result['createChannel']['id'])

# Update profile
update_mutation = gql('''
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      displayName
      bio
    }
  }
''')

result = client.execute(update_mutation, variable_values={
    'input': {
        'displayName': 'John D.',
        'bio': 'Updated bio'
    }
})
```

---

## Rate Limiting

| Operation Type | Limit | Window |
|----------------|-------|--------|
| Message create | 10 | 1 second (per channel) |
| Message update | 5 | 1 second |
| Channel create | 5 | 10 minutes |
| Role create | 10 | 1 hour |
| Bulk operations | 20 | 1 minute |

---

## Related Documentation

- [GraphQL Queries](./queries) - Data fetching
- [GraphQL Subscriptions](./subscriptions) - Real-time updates
- [REST API](../rest/authentication) - REST endpoints