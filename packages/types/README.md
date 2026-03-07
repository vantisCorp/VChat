# @vcomm/types

Shared type definitions for V-COMM voice communication platform.

## Overview

This package provides comprehensive TypeScript type definitions used throughout the V-COMM platform. It includes types for users, channels, servers, messages, voice communication, permissions, events, and API interactions.

## Installation

```bash
npm install @vcomm/types
```

## Features

- **User Types**: User profiles, presence, settings, and activity
- **Channel Types**: Text, voice, and video channel definitions
- **Server Types**: Server configuration, members, and roles
- **Message Types**: Messages, attachments, embeds, and reactions
- **Voice Types**: Voice states, connection options, and audio settings
- **Permission Types**: Comprehensive permission flags and utilities
- **Event Types**: Strongly typed event system
- **API Types**: API responses, pagination, and rate limiting
- **Utility Types**: Deep partial, nullable, optional, and more

## Usage

### User Types

```typescript
import { UserProfile, UserStatus, UserPresence } from '@vcomm/types';

const user: UserProfile = {
  id: '123456789',
  username: 'john_doe',
  discriminator: '0001',
  displayName: 'John Doe',
  createdAt: Date.now(),
};

const presence: UserPresence = {
  userId: user.id,
  status: 'online',
  statusMessage: 'Working on V-COMM',
};
```

### Channel Types

```typescript
import { VoiceChannel, TextChannel, ChannelType } from '@vcomm/types';

const voiceChannel: VoiceChannel = {
  id: '987654321',
  type: 'voice',
  name: 'General Voice',
  position: 0,
  bitrate: 64000,
  userLimit: 10,
  permissionOverwrites: [],
  connectedUsers: [],
  createdAt: Date.now(),
};
```

### Server Types

```typescript
import { Server, ServerMember, ServerRole } from '@vcomm/types';

const server: Server = {
  id: '111222333',
  name: 'My Server',
  ownerId: '123456789',
  afkTimeout: 300,
  verificationLevel: 'medium',
  defaultMessageNotifications: 'mentions',
  features: [],
  createdAt: Date.now(),
};
```

### Message Types

```typescript
import { Message, MessageAttachment, MessageEmbed } from '@vcomm/types';

const message: Message = {
  id: '444555666',
  channelId: '987654321',
  author: user,
  content: 'Hello, world!',
  timestamp: Date.now(),
  type: 'default',
  attachments: [],
  embeds: [],
  reactions: [],
  pinned: false,
  mentions: [],
  mentionRoles: [],
  mentionEveryone: false,
  tts: false,
};
```

### Voice Types

```typescript
import { VoiceState, VoiceConnectionOptions, AudioCodec } from '@vcomm/types';

const voiceOptions: VoiceConnectionOptions = {
  serverId: '111222333',
  channelId: '987654321',
  userId: '123456789',
  sessionId: 'session-abc',
  token: 'voice-token',
  endpoint: 'voice.vcomm.io',
  selfMute: false,
  selfDeaf: false,
};
```

### Permission Flags

```typescript
import { PermissionFlags, Permission } from '@vcomm/types';

// Check if has administrator permission
const hasAdmin = (permissions: bigint) => 
  (permissions & PermissionFlags.ADMINISTRATOR) === PermissionFlags.ADMINISTRATOR;

// Combine permissions
const moderatorPerms = PermissionFlags.KICK_MEMBERS | 
  PermissionFlags.BAN_MEMBERS | 
  PermissionFlags.MANAGE_MESSAGES;
```

### Event Types

```typescript
import { EventType, EventMap, BaseEvent } from '@vcomm/types';

function handleEvent<T extends EventType>(
  event: BaseEvent<T> & EventMap[T]
) {
  switch (event.type) {
    case EventType.MESSAGE_CREATE:
      console.log('New message:', (event as any).message.content);
      break;
    case EventType.VOICE_STATE_UPDATE:
      console.log('Voice state changed');
      break;
  }
}
```

### API Types

```typescript
import { APIResponse, PaginatedResponse, APIError } from '@vcomm/types';

async function fetchMessages(
  channelId: string
): Promise<APIResponse<PaginatedResponse<Message>>> {
  const response = await fetch(`/api/channels/${channelId}/messages`);
  return response.json();
}
```

### Utility Types

```typescript
import { DeepPartial, Nullable, Optional } from '@vcomm/types';

// Deep partial for updates
type UserUpdate = DeepPartial<UserProfile>;

// Nullable for optional null values
type OptionalChannel = Nullable<VoiceChannel>;

// Optional for undefined values
type MaybeMessage = Optional<Message>;
```

## Type Categories

### User Types
- `UserId`, `UserStatus`, `UserPresence`, `UserActivity`
- `UserProfile`, `UserSettings`

### Channel Types
- `ChannelId`, `ChannelType`, `Channel`
- `TextChannel`, `VoiceChannel`, `ConnectedUser`
- `PermissionOverwrite`

### Server Types
- `ServerId`, `VerificationLevel`, `NotificationSetting`
- `Server`, `ServerMember`, `ServerRole`
- `WelcomeScreen`, `WelcomeChannel`

### Message Types
- `MessageId`, `MessageType`, `Message`
- `MessageReference`, `MessageAttachment`, `MessageEmbed`
- `MessageReaction`, `Emoji`

### Voice Types
- `VoiceState`, `VoiceServerUpdate`, `VoiceConnectionState`
- `VoiceConnectionOptions`, `AudioSettings`
- `AudioCodec`, `VideoCodec`

### Permission Types
- `PermissionFlags` - All permission flags as bigint constants
- `Permission` - Permission name type

### Event Types
- `EventType` - Enum of all event types
- `BaseEvent`, `EventMap` - Event structures

### API Types
- `APIError`, `APIResponse`, `PaginatedResponse`
- `RateLimitInfo`

### Utility Types
- `DeepPartial`, `Nullable`, `Optional`
- `AsyncFunction`, `EventHandler`
- `Timeout`, `Interval`

## License

MIT