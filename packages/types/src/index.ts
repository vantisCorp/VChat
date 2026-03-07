/**
 * @fileoverview Shared type definitions for V-COMM
 * @module @vcomm/types
 */

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User identifier
 */
export type UserId = string;

/**
 * User status
 */
export type UserStatus = 'online' | 'idle' | 'dnd' | 'invisible' | 'offline';

/**
 * User presence
 */
export interface UserPresence {
  /** User ID */
  userId: UserId;
  /** Current status */
  status: UserStatus;
  /** Status message */
  statusMessage?: string;
  /** Last seen timestamp */
  lastSeen?: number;
  /** Current activity */
  activity?: UserActivity;
}

/**
 * User activity
 */
export interface UserActivity {
  /** Activity type */
  type: 'playing' | 'streaming' | 'listening' | 'watching' | 'custom';
  /** Activity name */
  name: string;
  /** Activity details */
  details?: string;
  /** Activity state */
  state?: string;
  /** Activity timestamps */
  timestamps?: {
    start?: number;
    end?: number;
  };
}

/**
 * User profile
 */
export interface UserProfile {
  /** User ID */
  id: UserId;
  /** Username */
  username: string;
  /** Discriminator (tag) */
  discriminator: string;
  /** Display name */
  displayName?: string;
  /** Avatar hash */
  avatar?: string;
  /** Banner hash */
  banner?: string;
  /** Bio */
  bio?: string;
  /** Creation date */
  createdAt: number;
  /** Locale */
  locale?: string;
  /** Flags */
  flags?: number;
}

/**
 * User settings
 */
export interface UserSettings {
  /** Theme */
  theme: 'dark' | 'light';
  /** Locale */
  locale: string;
  /** Notifications enabled */
  notifications: boolean;
  /** Sound enabled */
  soundEnabled: boolean;
  /** Input device */
  inputDevice?: string;
  /** Output device */
  outputDevice?: string;
  /** Input volume */
  inputVolume: number;
  /** Output volume */
  outputVolume: number;
  /** Mute status */
  muted: boolean;
  /** Deafen status */
  deafened: boolean;
  /** Push to talk key */
  pushToTalkKey?: string;
  /** Noise suppression enabled */
  noiseSuppression: boolean;
  /** Echo cancellation enabled */
  echoCancellation: boolean;
  /** Automatic gain control */
  automaticGainControl: boolean;
}

// ============================================================================
// CHANNEL TYPES
// ============================================================================

/**
 * Channel identifier
 */
export type ChannelId = string;

/**
 * Channel type
 */
export type ChannelType = 'text' | 'voice' | 'video' | 'announcement' | 'stage';

/**
 * Channel permission overwrites
 */
export interface PermissionOverwrite {
  /** Role or user ID */
  id: string;
  /** Type: role or member */
  type: 'role' | 'member';
  /** Allowed permissions */
  allow: bigint;
  /** Denied permissions */
  deny: bigint;
}

/**
 * Channel base
 */
export interface ChannelBase {
  /** Channel ID */
  id: ChannelId;
  /** Channel type */
  type: ChannelType;
  /** Channel name */
  name: string;
  /** Channel topic */
  topic?: string;
  /** Position in list */
  position: number;
  /** Parent category ID */
  parentId?: string;
  /** Permission overwrites */
  permissionOverwrites: PermissionOverwrite[];
  /** NSFW flag */
  nsfw?: boolean;
  /** Created timestamp */
  createdAt: number;
}

/**
 * Text channel
 */
export interface TextChannel extends ChannelBase {
  type: 'text' | 'announcement';
  /** Slow mode delay in seconds */
  slowMode?: number;
  /** Last message ID */
  lastMessageId?: string;
}

/**
 * Voice channel
 */
export interface VoiceChannel extends ChannelBase {
  type: 'voice' | 'stage';
  /** Bitrate in bits per second */
  bitrate: number;
  /** User limit */
  userLimit: number;
  /** Region override */
  rtcRegion?: string;
  /** Video quality mode */
  videoQualityMode?: 'auto' | 'full';
  /** Currently connected users */
  connectedUsers: ConnectedUser[];
}

/**
 * Connected user in voice channel
 */
export interface ConnectedUser {
  /** User ID */
  userId: UserId;
  /** Session ID */
  sessionId: string;
  /** Mute status */
  mute: boolean;
  /** Deafen status */
  deaf: boolean;
  /** Self mute */
  selfMute: boolean;
  /** Self deaf */
  selfDeaf: boolean;
  /** Video enabled */
  video: boolean;
  /** Streaming */
  streaming: boolean;
  /** Speaking */
  speaking: boolean;
  /** Join timestamp */
  joinedAt: number;
}

/**
 * Any channel type
 */
export type Channel = TextChannel | VoiceChannel;

// ============================================================================
// SERVER TYPES
// ============================================================================

/**
 * Server identifier
 */
export type ServerId = string;

/**
 * Server verification level
 */
export type VerificationLevel = 'none' | 'low' | 'medium' | 'high' | 'very_high';

/**
 * Server notification setting
 */
export type NotificationSetting = 'all' | 'mentions' | 'none';

/**
 * Server features
 */
export type ServerFeature =
  | 'animated_banner'
  | 'animated_icon'
  | 'banner'
  | 'discovery'
  | 'invite_splash'
  | 'member_verification'
  | 'news'
  | 'partner'
  | 'preview'
  | 'vanity_url'
  | 'verified'
  | 'vip_regions'
  | 'welcome_screen';

/**
 * Server
 */
export interface Server {
  /** Server ID */
  id: ServerId;
  /** Server name */
  name: string;
  /** Icon hash */
  icon?: string;
  /** Banner hash */
  banner?: string;
  /** Owner ID */
  ownerId: UserId;
  /** Description */
  description?: string;
  /** Region */
  region?: string;
  /** AFK channel ID */
  afkChannelId?: ChannelId;
  /** AFK timeout */
  afkTimeout: number;
  /** Verification level */
  verificationLevel: VerificationLevel;
  /** Default notification setting */
  defaultMessageNotifications: NotificationSetting;
  /** Features */
  features: ServerFeature[];
  /** System channel ID */
  systemChannelId?: ChannelId;
  /** Rules channel ID */
  rulesChannelId?: ChannelId;
  /** Maximum members */
  maxMembers?: number;
  /** Maximum presences */
  maxPresences?: number;
  /** Vanity URL code */
  vanityUrlCode?: string;
  /** Approximate member count */
  approximateMemberCount?: number;
  /** Approximate presence count */
  approximatePresenceCount?: number;
  /** Created timestamp */
  createdAt: number;
  /** Welcome screen */
  welcomeScreen?: WelcomeScreen;
}

/**
 * Welcome screen
 */
export interface WelcomeScreen {
  /** Enabled */
  enabled: boolean;
  /** Welcome channels */
  welcomeChannels: WelcomeChannel[];
  /** Description */
  description?: string;
}

/**
 * Welcome channel
 */
export interface WelcomeChannel {
  /** Channel ID */
  channelId: ChannelId;
  /** Description */
  description: string;
  /** Emoji ID */
  emojiId?: string;
  /** Emoji name */
  emojiName?: string;
}

/**
 * Server member
 */
export interface ServerMember {
  /** Server ID */
  serverId: ServerId;
  /** User */
  user: UserProfile;
  /** Nickname */
  nick?: string;
  /** Avatar hash */
  avatar?: string;
  /** Roles */
  roles: string[];
  /** Join timestamp */
  joinedAt: number;
  /** Boost timestamp */
  premiumSince?: number;
  /** Deafened */
  deaf: boolean;
  /** Muted */
  mute: boolean;
  /** Pending verification */
  pending?: boolean;
  /** Communication disabled until */
  communicationDisabledUntil?: number;
}

/**
 * Server role
 */
export interface ServerRole {
  /** Role ID */
  id: string;
  /** Role name */
  name: string;
  /** Color */
  color: number;
  /** Hoist flag */
  hoist: boolean;
  /** Position */
  position: number;
  /** Permissions */
  permissions: bigint;
  /** Managed flag */
  managed: boolean;
  /** Mentionable */
  mentionable: boolean;
  /** Icon hash */
  icon?: string;
  /** Unicode emoji */
  unicodeEmoji?: string;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * Message identifier
 */
export type MessageId = string;

/**
 * Message type
 */
export type MessageType =
  | 'default'
  | 'reply'
  | 'system'
  | 'join'
  | 'leave'
  | 'pin'
  | 'boost'
  | 'announcement';

/**
 * Message reference
 */
export interface MessageReference {
  /** Message ID */
  messageId?: MessageId;
  /** Channel ID */
  channelId?: ChannelId;
  /** Server ID */
  serverId?: ServerId;
}

/**
 * Message attachment
 */
export interface MessageAttachment {
  /** Attachment ID */
  id: string;
  /** Filename */
  filename: string;
  /** Description */
  description?: string;
  /** Content type */
  contentType?: string;
  /** Size in bytes */
  size: number;
  /** URL */
  url: string;
  /** Proxy URL */
  proxyUrl: string;
  /** Height (for images) */
  height?: number;
  /** Width (for images) */
  width?: number;
  /** Whether spoiler */
  spoiler?: boolean;
}

/**
 * Message embed
 */
export interface MessageEmbed {
  /** Title */
  title?: string;
  /** Type */
  type?: 'rich' | 'image' | 'video' | 'gifv' | 'article' | 'link';
  /** Description */
  description?: string;
  /** URL */
  url?: string;
  /** Timestamp */
  timestamp?: number;
  /** Color */
  color?: number;
  /** Footer */
  footer?: { text: string; iconUrl?: string; proxyIconUrl?: string };
  /** Image */
  image?: { url: string; proxyUrl?: string; height?: number; width?: number };
  /** Thumbnail */
  thumbnail?: { url: string; proxyUrl?: string; height?: number; width?: number };
  /** Video */
  video?: { url?: string; proxyUrl?: string; height?: number; width?: number };
  /** Provider */
  provider?: { name?: string; url?: string };
  /** Author */
  author?: {
    name?: string;
    url?: string;
    iconUrl?: string;
    proxyIconUrl?: string;
  };
  /** Fields */
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

/**
 * Message reaction
 */
export interface MessageReaction {
  /** Emoji */
  emoji: Emoji;
  /** Count */
  count: number;
  /** Whether user reacted */
  me: boolean;
}

/**
 * Emoji
 */
export interface Emoji {
  /** Emoji ID */
  id?: string;
  /** Emoji name */
  name?: string;
  /** Roles */
  roles?: string[];
  /** User who created */
  user?: UserProfile;
  /** Whether colons required */
  requireColons?: boolean;
  /** Whether managed */
  managed?: boolean;
  /** Whether animated */
  animated?: boolean;
  /** Whether available */
  available?: boolean;
}

/**
 * Message
 */
export interface Message {
  /** Message ID */
  id: MessageId;
  /** Channel ID */
  channelId: ChannelId;
  /** Server ID */
  serverId?: ServerId;
  /** Author */
  author: UserProfile;
  /** Content */
  content: string;
  /** Timestamp */
  timestamp: number;
  /** Edited timestamp */
  editedTimestamp?: number;
  /** Type */
  type: MessageType;
  /** Reference */
  reference?: MessageReference;
  /** Attachments */
  attachments: MessageAttachment[];
  /** Embeds */
  embeds: MessageEmbed[];
  /** Reactions */
  reactions: MessageReaction[];
  /** Pinned */
  pinned: boolean;
  /** Mentioned users */
  mentions: UserId[];
  /** Mentioned roles */
  mentionRoles: string[];
  /** Mentioned everyone */
  mentionEveryone: boolean;
  /** TTS */
  tts: boolean;
}

// ============================================================================
// VOICE TYPES
// ============================================================================

/**
 * Voice state
 */
export interface VoiceState {
  /** Server ID */
  serverId?: ServerId;
  /** Channel ID */
  channelId: ChannelId | null;
  /** User ID */
  userId: UserId;
  /** Member */
  member?: ServerMember;
  /** Session ID */
  sessionId: string;
  /** Deafened */
  deaf: boolean;
  /** Muted */
  mute: boolean;
  /** Self deafened */
  selfDeaf: boolean;
  /** Self muted */
  selfMute: boolean;
  /** Streaming */
  selfStream?: boolean;
  /** Video enabled */
  selfVideo: boolean;
  /** Suppress */
  suppress: boolean;
  /** Request to speak timestamp */
  requestToSpeakTimestamp?: number;
}

/**
 * Voice server update
 */
export interface VoiceServerUpdate {
  /** Token */
  token: string;
  /** Server ID */
  serverId: ServerId;
  /** Endpoint */
  endpoint: string;
}

/**
 * Voice connection state
 */
export type VoiceConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'errored';

/**
 * Voice connection options
 */
export interface VoiceConnectionOptions {
  /** Server ID */
  serverId: ServerId;
  /** Channel ID */
  channelId: ChannelId;
  /** User ID */
  userId: UserId;
  /** Session ID */
  sessionId: string;
  /** Voice token */
  token: string;
  /** Endpoint */
  endpoint: string;
  /** Self mute */
  selfMute?: boolean;
  /** Self deaf */
  selfDeaf?: boolean;
}

/**
 * Audio settings
 */
export interface AudioSettings {
  /** Sample rate */
  sampleRate: number;
  /** Channels */
  channels: number;
  /** Frame size */
  frameSize: number;
  /** Bitrate */
  bitrate: number;
  /** Codec */
  codec: AudioCodec;
}

/**
 * Audio codec
 */
export type AudioCodec = 'opus' | 'pcm' | 'aac' | 'mp3';

/**
 * Video codec
 */
export type VideoCodec = 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1';

// ============================================================================
// PERMISSION TYPES
// ============================================================================

/**
 * Permission flags
 */
export const PermissionFlags = {
  CREATE_INSTANT_INVITE: 1n << 0n,
  KICK_MEMBERS: 1n << 1n,
  BAN_MEMBERS: 1n << 2n,
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_SERVER: 1n << 5n,
  ADD_REACTIONS: 1n << 6n,
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  SEND_TTS_MESSAGES: 1n << 12n,
  MANAGE_MESSAGES: 1n << 13n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  MENTION_EVERYONE: 1n << 17n,
  USE_EXTERNAL_EMOJIS: 1n << 18n,
  VIEW_SERVER_INSIGHTS: 1n << 19n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  STREAM: 1n << 22n,
  MUTE_MEMBERS: 1n << 23n,
  DEAFEN_MEMBERS: 1n << 24n,
  MOVE_MEMBERS: 1n << 25n,
  USE_VAD: 1n << 26n,
  CHANGE_NICKNAME: 1n << 27n,
  MANAGE_NICKNAMES: 1n << 28n,
  MANAGE_ROLES: 1n << 29n,
  MANAGE_WEBHOOKS: 1n << 30n,
  MANAGE_EMOJIS: 1n << 31n,
  USE_APPLICATION_COMMANDS: 1n << 32n,
  REQUEST_TO_SPEAK: 1n << 33n,
  MANAGE_EVENTS: 1n << 34n,
  MANAGE_THREADS: 1n << 35n,
  CREATE_PUBLIC_THREADS: 1n << 36n,
  CREATE_PRIVATE_THREADS: 1n << 37n,
  USE_EXTERNAL_STICKERS: 1n << 38n,
  SEND_MESSAGES_IN_THREADS: 1n << 39n,
  USE_EMBEDDED_ACTIVITIES: 1n << 40n,
  MODERATE_MEMBERS: 1n << 41n,
} as const;

/**
 * Permission type
 */
export type Permission = keyof typeof PermissionFlags;

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Event types
 */
export enum EventType {
  // User events
  USER_UPDATE = 'user_update',
  USER_SETTINGS_UPDATE = 'user_settings_update',
  PRESENCE_UPDATE = 'presence_update',

  // Server events
  SERVER_CREATE = 'server_create',
  SERVER_UPDATE = 'server_update',
  SERVER_DELETE = 'server_delete',
  SERVER_MEMBER_JOIN = 'server_member_join',
  SERVER_MEMBER_LEAVE = 'server_member_leave',
  SERVER_MEMBER_UPDATE = 'server_member_update',
  SERVER_ROLE_CREATE = 'server_role_create',
  SERVER_ROLE_UPDATE = 'server_role_update',
  SERVER_ROLE_DELETE = 'server_role_delete',

  // Channel events
  CHANNEL_CREATE = 'channel_create',
  CHANNEL_UPDATE = 'channel_update',
  CHANNEL_DELETE = 'channel_delete',
  CHANNEL_PINS_UPDATE = 'channel_pins_update',

  // Message events
  MESSAGE_CREATE = 'message_create',
  MESSAGE_UPDATE = 'message_update',
  MESSAGE_DELETE = 'message_delete',
  MESSAGE_REACTION_ADD = 'message_reaction_add',
  MESSAGE_REACTION_REMOVE = 'message_reaction_remove',
  MESSAGE_REACTION_REMOVE_ALL = 'message_reaction_remove_all',

  // Voice events
  VOICE_STATE_UPDATE = 'voice_state_update',
  VOICE_SERVER_UPDATE = 'voice_server_update',

  // Connection events
  READY = 'ready',
  RESUMED = 'resumed',
  ERROR = 'error',
  WARN = 'warn',
  DEBUG = 'debug',
}

/**
 * Base event
 */
export interface BaseEvent<T extends EventType> {
  /** Event type */
  type: T;
  /** Timestamp */
  timestamp: number;
}

/**
 * Event map
 */
export interface EventMap {
  [EventType.USER_UPDATE]: { user: UserProfile };
  [EventType.USER_SETTINGS_UPDATE]: { settings: UserSettings };
  [EventType.PRESENCE_UPDATE]: { presence: UserPresence };
  [EventType.SERVER_CREATE]: { server: Server };
  [EventType.SERVER_UPDATE]: { server: Server; oldServer?: Partial<Server> };
  [EventType.SERVER_DELETE]: { server: Server };
  [EventType.SERVER_MEMBER_JOIN]: { member: ServerMember };
  [EventType.SERVER_MEMBER_LEAVE]: { member: ServerMember };
  [EventType.SERVER_MEMBER_UPDATE]: { member: ServerMember; oldMember?: Partial<ServerMember> };
  [EventType.SERVER_ROLE_CREATE]: { serverId: ServerId; role: ServerRole };
  [EventType.SERVER_ROLE_UPDATE]: { serverId: ServerId; role: ServerRole; oldRole?: Partial<ServerRole> };
  [EventType.SERVER_ROLE_DELETE]: { serverId: ServerId; role: ServerRole };
  [EventType.CHANNEL_CREATE]: { channel: Channel };
  [EventType.CHANNEL_UPDATE]: { channel: Channel; oldChannel?: Partial<Channel> };
  [EventType.CHANNEL_DELETE]: { channel: Channel };
  [EventType.CHANNEL_PINS_UPDATE]: { channelId: ChannelId; lastPinTimestamp?: number };
  [EventType.MESSAGE_CREATE]: { message: Message };
  [EventType.MESSAGE_UPDATE]: { message: Partial<Message>; oldMessage?: Message };
  [EventType.MESSAGE_DELETE]: { messageId: MessageId; channelId: ChannelId };
  [EventType.MESSAGE_REACTION_ADD]: { messageId: MessageId; channelId: ChannelId; reaction: MessageReaction; userId: UserId };
  [EventType.MESSAGE_REACTION_REMOVE]: { messageId: MessageId; channelId: ChannelId; reaction: MessageReaction; userId: UserId };
  [EventType.MESSAGE_REACTION_REMOVE_ALL]: { messageId: MessageId; channelId: ChannelId };
  [EventType.VOICE_STATE_UPDATE]: { state: VoiceState; oldState?: VoiceState };
  [EventType.VOICE_SERVER_UPDATE]: { update: VoiceServerUpdate };
  [EventType.READY]: { user: UserProfile; servers: Server[] };
  [EventType.RESUMED]: {};
  [EventType.ERROR]: { error: Error };
  [EventType.WARN]: { message: string };
  [EventType.DEBUG]: { message: string };
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * API error
 */
export interface APIError {
  /** Error code */
  code: number;
  /** Error message */
  message: string;
  /** Error details */
  errors?: Record<string, { _errors: Array<{ code: string; message: string }> }>;
}

/**
 * API response wrapper
 */
export interface APIResponse<T> {
  /** Success */
  success: boolean;
  /** Data */
  data?: T;
  /** Error */
  error?: APIError;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  /** Items */
  items: T[];
  /** Total count */
  total: number;
  /** Has more */
  hasMore: boolean;
  /** Next cursor */
  nextCursor?: string;
}

/**
 * Rate limit info
 */
export interface RateLimitInfo {
  /** Limit */
  limit: number;
  /** Remaining */
  remaining: number;
  /** Reset timestamp */
  reset: number;
  /** Reset after in ms */
  resetAfter: number;
  /** Bucket */
  bucket: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Deep partial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Nullable
 */
export type Nullable<T> = T | null;

/**
 * Optional
 */
export type Optional<T> = T | undefined;

/**
 * Async function
 */
export type AsyncFunction<T = void> = () => Promise<T>;

/**
 * Event handler
 */
export type EventHandler<T = any> = (data: T) => void | Promise<void>;

/**
 * Timeout
 */
export type Timeout = ReturnType<typeof setTimeout>;

/**
 * Interval
 */
export type Interval = ReturnType<typeof setInterval>;