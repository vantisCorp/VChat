/**
 * @fileoverview Signaling protocols for V-COMM
 * @module @vcomm/protocols/signaling
 */

import {
  SignalingMessageType,
  SignalingMessage,
  SDPOffer,
  SDPAnswer,
  ICECandidateMessage,
  SignalingError,
} from '../types';

// ============================================================================
// SIGNALING MESSAGE BUILDER
// ============================================================================

/**
 * Signaling Message Builder
 * Factory for creating signaling messages
 */
export class SignalingMessageBuilder {
  private static callIdCounter = 0;

  /**
   * Generate unique call ID
   */
  static generateCallId(): string {
    return `call-${Date.now()}-${++this.callIdCounter}`;
  }

  /**
   * Create signaling message
   */
  private static createMessage(
    type: SignalingMessageType,
    from: string,
    to: string,
    callId: string,
    payload: any
  ): SignalingMessage {
    return {
      type,
      from,
      to,
      callId,
      payload,
      timestamp: Date.now(),
    };
  }

  /**
   * Build SDP offer message
   */
  static buildOffer(
    from: string,
    to: string,
    callId: string,
    sdp: string,
    mediaTypes: ('audio' | 'video')[] = ['audio']
  ): SignalingMessage {
    const offer: SDPOffer = { sdp, mediaTypes };
    return this.createMessage(
      SignalingMessageType.OFFER,
      from,
      to,
      callId,
      offer
    );
  }

  /**
   * Build SDP answer message
   */
  static buildAnswer(
    from: string,
    to: string,
    callId: string,
    sdp: string
  ): SignalingMessage {
    const answer: SDPAnswer = { sdp };
    return this.createMessage(
      SignalingMessageType.ANSWER,
      from,
      to,
      callId,
      answer
    );
  }

  /**
   * Build ICE candidate message
   */
  static buildICECandidate(
    from: string,
    to: string,
    callId: string,
    candidate: string,
    sdpMid: string | null,
    sdpMLineIndex: number | null
  ): SignalingMessage {
    const iceCandidate: ICECandidateMessage = {
      candidate,
      sdpMid,
      sdpMLineIndex,
    };
    return this.createMessage(
      SignalingMessageType.CANDIDATE,
      from,
      to,
      callId,
      iceCandidate
    );
  }

  /**
   * Build renegotiate message
   */
  static buildRenegotiate(
    from: string,
    to: string,
    callId: string,
    reason?: string
  ): SignalingMessage {
    return this.createMessage(
      SignalingMessageType.RENEGOTIATE,
      from,
      to,
      callId,
      { reason }
    );
  }

  /**
   * Build bye message
   */
  static buildBye(
    from: string,
    to: string,
    callId: string,
    reason?: string
  ): SignalingMessage {
    return this.createMessage(
      SignalingMessageType.BYE,
      from,
      to,
      callId,
      { reason }
    );
  }

  /**
   * Build error message
   */
  static buildError(
    from: string,
    to: string,
    callId: string,
    errorCode: number,
    errorMessage: string
  ): SignalingMessage {
    return this.createMessage(
      SignalingMessageType.ERROR,
      from,
      to,
      callId,
      { errorCode, errorMessage }
    );
  }
}

// ============================================================================
// SIGNALING MESSAGE PARSER
// ============================================================================

/**
 * Signaling Message Parser
 * Handles parsing and validation of signaling messages
 */
export class SignalingMessageParser {
  /**
   * Parse JSON string to SignalingMessage
   */
  static parse(data: string): SignalingMessage {
    try {
      const parsed = JSON.parse(data);

      if (!this.validate(parsed)) {
        throw new SignalingError('Invalid signaling message structure');
      }

      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new SignalingError('Invalid JSON format');
      }
      throw error;
    }
  }

  /**
   * Validate message structure
   */
  static validate(message: any): message is SignalingMessage {
    return (
      message !== null &&
      typeof message === 'object' &&
      Object.values(SignalingMessageType).includes(message.type) &&
      typeof message.from === 'string' &&
      typeof message.to === 'string' &&
      typeof message.callId === 'string' &&
      typeof message.timestamp === 'number' &&
      message.payload !== undefined
    );
  }

  /**
   * Convert SignalingMessage to JSON string
   */
  static stringify(message: SignalingMessage): string {
    return JSON.stringify(message);
  }

  /**
   * Parse SDP offer from message
   */
  static parseOffer(message: SignalingMessage): SDPOffer {
    if (message.type !== SignalingMessageType.OFFER) {
      throw new SignalingError('Message is not an offer');
    }

    if (
      typeof message.payload.sdp !== 'string' ||
      !Array.isArray(message.payload.mediaTypes)
    ) {
      throw new SignalingError('Invalid offer payload');
    }

    return message.payload;
  }

  /**
   * Parse SDP answer from message
   */
  static parseAnswer(message: SignalingMessage): SDPAnswer {
    if (message.type !== SignalingMessageType.ANSWER) {
      throw new SignalingError('Message is not an answer');
    }

    if (typeof message.payload.sdp !== 'string') {
      throw new SignalingError('Invalid answer payload');
    }

    return message.payload;
  }

  /**
   * Parse ICE candidate from message
   */
  static parseICECandidate(message: SignalingMessage): ICECandidateMessage {
    if (message.type !== SignalingMessageType.CANDIDATE) {
      throw new SignalingError('Message is not an ICE candidate');
    }

    return message.payload;
  }
}

// ============================================================================
// CALL SESSION
// ============================================================================

/**
 * Call Session State
 */
export type CallState = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended';

/**
 * Call Session
 * Manages state for a signaling session
 */
export class CallSession {
  private state: CallState = 'idle';
  private startTime: number | null = null;
  private endTime: number | null = null;
  private remoteSDP: string | null = null;
  private localSDP: string | null = null;
  private iceCandidates: ICECandidateMessage[] = [];

  constructor(
    public readonly callId: string,
    public readonly localUserId: string,
    public readonly remoteUserId: string
  ) {}

  /**
   * Get current state
   */
  getState(): CallState {
    return this.state;
  }

  /**
   * Set state
   */
  setState(state: CallState): void {
    const now = Date.now();

    if (state === 'connecting' && this.state !== 'connecting') {
      this.startTime = now;
    } else if (state === 'ended' && this.state !== 'ended') {
      this.endTime = now;
    }

    this.state = state;
  }

  /**
   * Set remote SDP
   */
  setRemoteSDP(sdp: string): void {
    this.remoteSDP = sdp;
  }

  /**
   * Get remote SDP
   */
  getRemoteSDP(): string | null {
    return this.remoteSDP;
  }

  /**
   * Set local SDP
   */
  setLocalSDP(sdp: string): void {
    this.localSDP = sdp;
  }

  /**
   * Get local SDP
   */
  getLocalSDP(): string | null {
    return this.localSDP;
  }

  /**
   * Add ICE candidate
   */
  addICECandidate(candidate: ICECandidateMessage): void {
    this.iceCandidates.push(candidate);
  }

  /**
   * Get all ICE candidates
   */
  getICECandidates(): ICECandidateMessage[] {
    return [...this.iceCandidates];
  }

  /**
   * Clear ICE candidates
   */
  clearICECandidates(): void {
    this.iceCandidates = [];
  }

  /**
   * Get call duration in milliseconds
   */
  getDuration(): number {
    if (!this.startTime) return 0;
    const end = this.endTime || Date.now();
    return end - this.startTime;
  }

  /**
   * Check if call is active
   */
  isActive(): boolean {
    return this.state === 'connecting' || this.state === 'connected';
  }

  /**
   * End call
   */
  end(): void {
    this.setState('ended');
  }

  /**
   * Reset session
   */
  reset(): void {
    this.state = 'idle';
    this.startTime = null;
    this.endTime = null;
    this.remoteSDP = null;
    this.localSDP = null;
    this.iceCandidates = [];
  }
}

// ============================================================================
// SIGNALING SESSION MANAGER
// ============================================================================

/**
 * Signaling Session Manager
 * Manages multiple signaling sessions
 */
export class SignalingSessionManager {
  private sessions: Map<string, CallSession> = new Map();
  private readonly maxSessions: number;

  constructor(maxSessions: number = 100) {
    this.maxSessions = maxSessions;
  }

  /**
   * Create new session
   */
  createSession(callId: string, localUserId: string, remoteUserId: string): CallSession {
    // Cleanup old sessions if at max
    if (this.sessions.size >= this.maxSessions) {
      this.cleanup();
    }

    const session = new CallSession(callId, localUserId, remoteUserId);
    this.sessions.set(callId, session);
    return session;
  }

  /**
   * Get session
   */
  getSession(callId: string): CallSession | undefined {
    return this.sessions.get(callId);
  }

  /**
   * Has session
   */
  hasSession(callId: string): boolean {
    return this.sessions.has(callId);
  }

  /**
   * Remove session
   */
  removeSession(callId: string): boolean {
    return this.sessions.delete(callId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): CallSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.isActive());
  }

  /**
   * Get sessions by user
   */
  getSessionsByUser(userId: string): CallSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.localUserId === userId || s.remoteUserId === userId
    );
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Cleanup ended sessions
   */
  cleanup(): void {
    for (const [callId, session] of this.sessions) {
      if (session.getState() === 'ended') {
        this.sessions.delete(callId);
      }
    }
  }

  /**
   * Clear all sessions
   */
  clear(): void {
    this.sessions.clear();
  }
}

// ============================================================================
// SIGNALING STATE MACHINE
// ============================================================================

/**
 * Signaling State Machine
 * Manages signaling state transitions
 */
export class SignalingStateMachine {
  private static readonly validTransitions: Record<CallState, CallState[]> = {
    idle: ['ringing', 'connecting'],
    ringing: ['connecting', 'ended'],
    connecting: ['connected', 'ended'],
    connected: ['ended'],
    ended: ['idle'],
  };

  /**
   * Check if transition is valid
   */
  static isValidTransition(from: CallState, to: CallState): boolean {
    return this.validTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Get valid next states
   */
  static getValidTransitions(state: CallState): CallState[] {
    return this.validTransitions[state] || [];
  }

  /**
   * Transition state with validation
   */
  static transition(session: CallSession, newState: CallState): boolean {
    const currentState = session.getState();

    if (!this.isValidTransition(currentState, newState)) {
      return false;
    }

    session.setState(newState);
    return true;
  }
}

// ============================================================================
// SIGNALING HEARTBEAT
// ============================================================================

/**
 * Signaling Heartbeat
 * Manages heartbeat for active sessions
 */
export class SignalingHeartbeat {
  private lastReceived: Map<string, number> = new Map();
  private interval: NodeJS.Timeout | null = null;
  private readonly timeoutMs: number;
  private readonly checkIntervalMs: number;

  constructor(timeoutMs: number = 30000, checkIntervalMs: number = 5000) {
    this.timeoutMs = timeoutMs;
    this.checkIntervalMs = checkIntervalMs;
  }

  /**
   * Start heartbeat monitoring
   */
  start(
    onTimeout: (callId: string) => void,
    sendHeartbeat: () => void
  ): void {
    this.stop();

    this.interval = setInterval(() => {
      const now = Date.now();

      // Check for timeouts
      for (const [callId, lastTime] of this.lastReceived) {
        if (now - lastTime > this.timeoutMs) {
          this.lastReceived.delete(callId);
          onTimeout(callId);
        }
      }

      // Send heartbeat
      sendHeartbeat();
    }, this.checkIntervalMs);
  }

  /**
   * Stop heartbeat monitoring
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Record heartbeat received
   */
  recordHeartbeat(callId: string): void {
    this.lastReceived.set(callId, Date.now());
  }

  /**
   * Remove call from monitoring
   */
  removeCall(callId: string): void {
    this.lastReceived.delete(callId);
  }

  /**
   * Get last heartbeat time
   */
  getLastHeartbeat(callId: string): number | undefined {
    return this.lastReceived.get(callId);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.stop();
    this.lastReceived.clear();
  }
}

// ============================================================================
// SIGNALING NEGOTIATOR
// ============================================================================

/**
 * Signaling Negotiator
 * Handles SDP negotiation logic
 */
export class SignalingNegotiator {
  private pendingOffer: SignalingMessage | null = null;
  private isInitiator: boolean = false;
  private needsRenegotiation: boolean = false;

  /**
   * Set as initiator
   */
  setInitiator(value: boolean): void {
    this.isInitiator = value;
  }

  /**
   * Check if initiator
   */
  isInitiatorOfCall(): boolean {
    return this.isInitiator;
  }

  /**
   * Store pending offer
   */
  setPendingOffer(offer: SignalingMessage): void {
    this.pendingOffer = offer;
  }

  /**
   * Get pending offer
   */
  getPendingOffer(): SignalingMessage | null {
    return this.pendingOffer;
  }

  /**
   * Clear pending offer
   */
  clearPendingOffer(): void {
    this.pendingOffer = null;
  }

  /**
   * Check if has pending offer
   */
  hasPendingOffer(): boolean {
    return this.pendingOffer !== null;
  }

  /**
   * Request renegotiation
   */
  requestRenegotiation(): void {
    this.needsRenegotiation = true;
  }

  /**
   * Check if needs renegotiation
   */
  isRenegotiationNeeded(): boolean {
    return this.needsRenegotiation;
  }

  /**
   * Clear renegotiation flag
   */
  clearRenegotiation(): void {
    this.needsRenegotiation = false;
  }

  /**
   * Reset negotiator
   */
  reset(): void {
    this.pendingOffer = null;
    this.isInitiator = false;
    this.needsRenegotiation = false;
  }
}

// ============================================================================
// SIGNALING UTILITIES
// ============================================================================

/**
 * Signaling Utilities
 * Helper functions for signaling operations
 */
export class SignalingUtils {
  /**
   * Generate unique user ID
   */
  static generateUserId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  static generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if SDP is offer
   */
  static isOffer(sdp: string): boolean {
    return sdp.includes('a=setup:actpass') || sdp.includes('a=setup:active');
  }

  /**
   * Check if SDP is answer
   */
  static isAnswer(sdp: string): boolean {
    return sdp.includes('a=setup:passive');
  }

  /**
   * Extract media types from SDP
   */
  static extractMediaTypes(sdp: string): ('audio' | 'video')[] {
    const types: ('audio' | 'video')[] = [];
    if (sdp.includes('m=audio')) types.push('audio');
    if (sdp.includes('m=video')) types.push('video');
    return types;
  }

  /**
   * Check if callId is valid format
   */
  static isValidCallId(callId: string): boolean {
    return /^call-\d+-\d+$/.test(callId);
  }

  /**
   * Calculate round trip time from offer/answer
   */
  static calculateRTT(offer: SignalingMessage, answer: SignalingMessage): number {
    return answer.timestamp - offer.timestamp;
  }

  /**
   * Format signaling message for logging
   */
  static formatMessage(message: SignalingMessage): string {
    return `[${message.type}] ${message.from} -> ${message.to} (call: ${message.callId})`;
  }
}

