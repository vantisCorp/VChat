/**
 * @fileoverview WebSocket message protocols for V-COMM
 * @module @vcomm/protocols/websocket
 */

import {
  WSMessageType,
  WSMessage,
  WSMessageHeader,
  WSAuthPayload,
  WSVoiceDataPayload,
  WSTextMessagePayload,
  WSUserPresence,
  WSError,
} from '../types';

// ============================================================================
// MESSAGE BUILDER
// ============================================================================

/**
 * WebSocket Message Builder
 * Factory for creating WebSocket messages
 */
export class WSMessageBuilder {
  private static messageIdCounter = 0;

  /**
   * Generate unique message ID
   */
  private static generateId(): string {
    return `${Date.now()}-${++this.messageIdCounter}`;
  }

  /**
   * Create message header
   */
  private static createHeader(type: WSMessageType, sequence?: number): WSMessageHeader {
    return {
      type,
      id: this.generateId(),
      timestamp: Date.now(),
      sequence,
    };
  }

  /**
   * Build auth message
   */
  static buildAuth(token: string, version: string = '1.0.0'): WSMessage<WSAuthPayload> {
    return {
      header: this.createHeader(WSMessageType.AUTH),
      payload: { token, version },
    };
  }

  /**
   * Build auth response
   */
  static buildAuthResponse(
    success: boolean,
    userId?: string,
    error?: string
  ): WSMessage<{ success: boolean; userId?: string; error?: string }> {
    return {
      header: this.createHeader(WSMessageType.AUTH_RESPONSE),
      payload: { success, userId, error },
    };
  }

  /**
   * Build join channel message
   */
  static buildJoin(
    channelId: string,
    userId: string
  ): WSMessage<{ channelId: string; userId: string }> {
    return {
      header: this.createHeader(WSMessageType.JOIN),
      payload: { channelId, userId },
    };
  }

  /**
   * Build leave channel message
   */
  static buildLeave(
    channelId: string,
    userId: string
  ): WSMessage<{ channelId: string; userId: string }> {
    return {
      header: this.createHeader(WSMessageType.LEAVE),
      payload: { channelId, userId },
    };
  }

  /**
   * Build user list message
   */
  static buildUserList(
    channelId: string,
    users: Array<{ userId: string; username: string }>
  ): WSMessage<{ channelId: string; users: Array<{ userId: string; username: string }> }> {
    return {
      header: this.createHeader(WSMessageType.USER_LIST),
      payload: { channelId, users },
    };
  }

  /**
   * Build voice data message
   */
  static buildVoiceData(
    channelId: string,
    userId: string,
    data: Uint8Array,
    sequence: number,
    timestamp: number = Date.now()
  ): WSMessage<WSVoiceDataPayload> {
    return {
      header: this.createHeader(WSMessageType.VOICE_DATA, sequence),
      payload: {
        channelId,
        userId,
        data,
        sequence,
        timestamp,
      },
    };
  }

  /**
   * Build text message
   */
  static buildTextMessage(
    channelId: string,
    userId: string,
    content: string,
    replyTo?: string
  ): WSMessage<WSTextMessagePayload> {
    return {
      header: this.createHeader(WSMessageType.TEXT_MESSAGE),
      payload: { channelId, userId, content, replyTo },
    };
  }

  /**
   * Build typing indicator
   */
  static buildTyping(
    channelId: string,
    userId: string,
    isTyping: boolean
  ): WSMessage<{ channelId: string; userId: string; isTyping: boolean }> {
    return {
      header: this.createHeader(WSMessageType.TYPING),
      payload: { channelId, userId, isTyping },
    };
  }

  /**
   * Build presence update
   */
  static buildPresence(presence: WSUserPresence): WSMessage<WSUserPresence> {
    return {
      header: this.createHeader(WSMessageType.PRESENCE),
      payload: presence,
    };
  }

  /**
   * Build error message
   */
  static buildError(
    code: number,
    message: string,
    details?: any
  ): WSMessage<{ code: number; message: string; details?: any }> {
    return {
      header: this.createHeader(WSMessageType.ERROR),
      payload: { code, message, details },
    };
  }

  /**
   * Build ping message
   */
  static buildPing(): WSMessage<void> {
    return {
      header: this.createHeader(WSMessageType.PING),
      payload: undefined as unknown as void,
    };
  }

  /**
   * Build pong message
   */
  static buildPong(): WSMessage<void> {
    return {
      header: this.createHeader(WSMessageType.PONG),
      payload: undefined as unknown as void,
    };
  }

  /**
   * Build channel create message
   */
  static buildChannelCreate(channel: {
    id: string;
    name: string;
    type: 'voice' | 'text';
    serverId: string;
  }): WSMessage<typeof channel> {
    return {
      header: this.createHeader(WSMessageType.CHANNEL_CREATE),
      payload: channel,
    };
  }

  /**
   * Build channel delete message
   */
  static buildChannelDelete(
    channelId: string,
    serverId: string
  ): WSMessage<{ channelId: string; serverId: string }> {
    return {
      header: this.createHeader(WSMessageType.CHANNEL_DELETE),
      payload: { channelId, serverId },
    };
  }

  /**
   * Build channel update message
   */
  static buildChannelUpdate(channel: {
    id: string;
    name?: string;
    type?: 'voice' | 'text';
    serverId: string;
  }): WSMessage<typeof channel> {
    return {
      header: this.createHeader(WSMessageType.CHANNEL_UPDATE),
      payload: channel,
    };
  }

  /**
   * Build user update message
   */
  static buildUserUpdate(user: {
    userId: string;
    username?: string;
    avatar?: string;
    status?: string;
  }): WSMessage<typeof user> {
    return {
      header: this.createHeader(WSMessageType.USER_UPDATE),
      payload: user,
    };
  }

  /**
   * Build server update message
   */
  static buildServerUpdate(server: {
    serverId: string;
    name?: string;
    icon?: string;
  }): WSMessage<typeof server> {
    return {
      header: this.createHeader(WSMessageType.SERVER_UPDATE),
      payload: server,
    };
  }
}

// ============================================================================
// MESSAGE PARSER
// ============================================================================

/**
 * WebSocket Message Parser
 * Handles parsing and validation of WebSocket messages
 */
export class WSMessageParser {
  /**
   * Parse JSON string to WSMessage
   */
  static parse<T = any>(data: string): WSMessage<T> {
    try {
      const parsed = JSON.parse(data);

      if (!this.validate(parsed)) {
        throw new WSError('Invalid message structure', 400);
      }

      // Convert data array back to Uint8Array for voice messages
      if (parsed.header.type === WSMessageType.VOICE_DATA && parsed.payload.data) {
        parsed.payload.data = new Uint8Array(parsed.payload.data);
      }

      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new WSError('Invalid JSON format', 400);
      }
      throw error;
    }
  }

  /**
   * Validate message structure
   */
  static validate(message: any): message is WSMessage {
    return (
      message !== null &&
      typeof message === 'object' &&
      typeof message.header === 'object' &&
      typeof message.header.type === 'string' &&
      typeof message.header.id === 'string' &&
      typeof message.header.timestamp === 'number'
    );
  }

  /**
   * Convert WSMessage to JSON string
   */
  static stringify<T>(message: WSMessage<T>): string {
    // Convert Uint8Array to array for JSON serialization
    if (message.header.type === WSMessageType.VOICE_DATA && message.payload) {
      const payload = message.payload as unknown as WSVoiceDataPayload;
      if (payload.data instanceof Uint8Array) {
        return JSON.stringify({
          ...message,
          payload: {
            ...payload,
            data: Array.from(payload.data),
          },
        });
      }
    }
    return JSON.stringify(message);
  }

  /**
   * Parse binary message
   */
  static parseBinary(data: ArrayBuffer): WSMessage {
    const view = new DataView(data);

    // Binary format:
    // 0-1: Message type (uint16)
    // 2-5: Sequence number (uint32)
    // 6-13: Timestamp (uint64)
    // 14+: Payload

    const type = view.getUint16(0, false);
    const sequence = view.getUint32(2, false);
    const timestamp = Number(view.getBigUint64(6, false));

    const messageType = this.binaryTypeToString(type);
    const payload = new Uint8Array(data, 14);

    return {
      header: {
        type: messageType,
        id: `binary-${timestamp}-${sequence}`,
        timestamp,
        sequence,
      },
      payload,
    };
  }

  /**
   * Convert message to binary format
   */
  static toBinary(message: WSMessage<Uint8Array>): ArrayBuffer {
    const type = this.stringTypeToBinary(message.header.type);
    const payload = message.payload;

    const buffer = new ArrayBuffer(14 + payload.length);
    const view = new DataView(buffer);

    view.setUint16(0, type, false);
    view.setUint32(2, message.header.sequence || 0, false);
    view.setBigUint64(6, BigInt(message.header.timestamp), false);

    new Uint8Array(buffer, 14).set(payload);

    return buffer;
  }

  /**
   * Convert binary type to string
   */
  private static binaryTypeToString(type: number): WSMessageType {
    const typeMap: Record<number, WSMessageType> = {
      1: WSMessageType.AUTH,
      2: WSMessageType.AUTH_RESPONSE,
      3: WSMessageType.JOIN,
      4: WSMessageType.LEAVE,
      5: WSMessageType.USER_LIST,
      6: WSMessageType.VOICE_DATA,
      7: WSMessageType.TEXT_MESSAGE,
      8: WSMessageType.TYPING,
      9: WSMessageType.PRESENCE,
      10: WSMessageType.ERROR,
      11: WSMessageType.PING,
      12: WSMessageType.PONG,
      13: WSMessageType.CHANNEL_CREATE,
      14: WSMessageType.CHANNEL_DELETE,
      15: WSMessageType.CHANNEL_UPDATE,
      16: WSMessageType.USER_UPDATE,
      17: WSMessageType.SERVER_UPDATE,
    };
    return typeMap[type] || WSMessageType.ERROR;
  }

  /**
   * Convert string type to binary
   */
  private static stringTypeToBinary(type: WSMessageType): number {
    const typeMap: Record<WSMessageType, number> = {
      [WSMessageType.AUTH]: 1,
      [WSMessageType.AUTH_RESPONSE]: 2,
      [WSMessageType.JOIN]: 3,
      [WSMessageType.LEAVE]: 4,
      [WSMessageType.USER_LIST]: 5,
      [WSMessageType.VOICE_DATA]: 6,
      [WSMessageType.TEXT_MESSAGE]: 7,
      [WSMessageType.TYPING]: 8,
      [WSMessageType.PRESENCE]: 9,
      [WSMessageType.ERROR]: 10,
      [WSMessageType.PING]: 11,
      [WSMessageType.PONG]: 12,
      [WSMessageType.CHANNEL_CREATE]: 13,
      [WSMessageType.CHANNEL_DELETE]: 14,
      [WSMessageType.CHANNEL_UPDATE]: 15,
      [WSMessageType.USER_UPDATE]: 16,
      [WSMessageType.SERVER_UPDATE]: 17,
    };
    return typeMap[type] || 10;
  }
}

// ============================================================================
// MESSAGE VALIDATOR
// ============================================================================

/**
 * WebSocket Message Validator
 * Validates message payloads
 */
export class WSMessageValidator {
  /**
   * Validate auth payload
   */
  static validateAuth(payload: any): payload is WSAuthPayload {
    return (
      typeof payload === 'object' &&
      typeof payload.token === 'string' &&
      typeof payload.version === 'string'
    );
  }

  /**
   * Validate voice data payload
   */
  static validateVoiceData(payload: any): payload is WSVoiceDataPayload {
    return (
      typeof payload === 'object' &&
      typeof payload.channelId === 'string' &&
      typeof payload.userId === 'string' &&
      payload.data instanceof Uint8Array &&
      typeof payload.sequence === 'number' &&
      typeof payload.timestamp === 'number'
    );
  }

  /**
   * Validate text message payload
   */
  static validateTextMessage(payload: any): payload is WSTextMessagePayload {
    return (
      typeof payload === 'object' &&
      typeof payload.channelId === 'string' &&
      typeof payload.userId === 'string' &&
      typeof payload.content === 'string' &&
      (payload.replyTo === undefined || typeof payload.replyTo === 'string')
    );
  }

  /**
   * Validate presence payload
   */
  static validatePresence(payload: any): payload is WSUserPresence {
    return (
      typeof payload === 'object' &&
      typeof payload.userId === 'string' &&
      typeof payload.online === 'boolean'
    );
  }

  /**
   * Validate any message by type
   */
  static validate(message: WSMessage): boolean {
    const { type } = message.header;

    switch (type) {
      case WSMessageType.AUTH:
        return this.validateAuth(message.payload);
      case WSMessageType.VOICE_DATA:
        return this.validateVoiceData(message.payload);
      case WSMessageType.TEXT_MESSAGE:
        return this.validateTextMessage(message.payload);
      case WSMessageType.PRESENCE:
        return this.validatePresence(message.payload);
      default:
        return true; // Other types have basic validation in parser
    }
  }
}

// ============================================================================
// HEARTBEAT MANAGER
// ============================================================================

/**
 * WebSocket Heartbeat Manager
 * Manages ping/pong heartbeat mechanism
 */
export class WSHeartbeatManager {
  private lastPing: number = 0;
  private lastPong: number = 0;
  private missedPongs: number = 0;
  private interval: NodeJS.Timeout | null = null;
  private readonly maxMissedPongs: number;
  private readonly intervalMs: number;

  constructor(intervalMs: number = 30000, maxMissedPongs: number = 3) {
    this.intervalMs = intervalMs;
    this.maxMissedPongs = maxMissedPongs;
  }

  /**
   * Start heartbeat
   */
  start(sendPing: () => void, onTimeout: () => void): void {
    this.stop();
    this.missedPongs = 0;

    this.interval = setInterval(() => {
      this.lastPing = Date.now();
      sendPing();
      this.missedPongs++;

      if (this.missedPongs > this.maxMissedPongs) {
        this.stop();
        onTimeout();
      }
    }, this.intervalMs);
  }

  /**
   * Stop heartbeat
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Record pong received
   */
  recordPong(): void {
    this.lastPong = Date.now();
    this.missedPongs = 0;
  }

  /**
   * Get latency
   */
  getLatency(): number {
    if (this.lastPong === 0 || this.lastPing === 0) return 0;
    return this.lastPong - this.lastPing;
  }

  /**
   * Get status
   */
  getStatus(): {
    lastPing: number;
    lastPong: number;
    missedPongs: number;
    latency: number;
  } {
    return {
      lastPing: this.lastPing,
      lastPong: this.lastPong,
      missedPongs: this.missedPongs,
      latency: this.getLatency(),
    };
  }
}

// ============================================================================
// RECONNECT MANAGER
// ============================================================================

/**
 * WebSocket Reconnect Manager
 * Handles automatic reconnection with backoff
 */
export class WSReconnectManager {
  private attempts: number = 0;
  private timeout: NodeJS.Timeout | null = null;
  private readonly maxAttempts: number;
  private readonly baseDelay: number;
  private readonly maxDelay: number;

  constructor(maxAttempts: number = 10, baseDelay: number = 1000, maxDelay: number = 30000) {
    this.maxAttempts = maxAttempts;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  /**
   * Schedule reconnect
   */
  schedule(connect: () => void): boolean {
    if (this.attempts >= this.maxAttempts) {
      return false;
    }

    const delay = this.calculateDelay();
    this.attempts++;

    this.timeout = setTimeout(() => {
      connect();
    }, delay);

    return true;
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(): number {
    const delay = this.baseDelay * Math.pow(2, this.attempts);
    return Math.min(delay, this.maxDelay);
  }

  /**
   * Reset attempts
   */
  reset(): void {
    this.attempts = 0;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  /**
   * Get current attempt
   */
  getAttempt(): number {
    return this.attempts;
  }

  /**
   * Check if max attempts reached
   */
  isExhausted(): boolean {
    return this.attempts >= this.maxAttempts;
  }
}

// ============================================================================
// MESSAGE QUEUE
// ============================================================================

/**
 * WebSocket Message Queue
 * Queues messages during disconnection
 */
export class WSMessageQueue {
  private queue: Array<{ message: WSMessage; timestamp: number }> = [];
  private readonly maxSize: number;
  private readonly maxAge: number;

  constructor(maxSize: number = 100, maxAge: number = 60000) {
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  /**
   * Add message to queue
   */
  enqueue(message: WSMessage): boolean {
    // Remove old messages
    this.prune();

    if (this.queue.length >= this.maxSize) {
      return false;
    }

    this.queue.push({
      message,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Get all queued messages
   */
  dequeue(): WSMessage[] {
    this.prune();
    const messages = this.queue.map((item) => item.message);
    this.queue = [];
    return messages;
  }

  /**
   * Remove old messages
   */
  private prune(): void {
    const cutoff = Date.now() - this.maxAge;
    this.queue = this.queue.filter((item) => item.timestamp > cutoff);
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================
// All classes are already exported at their declaration
