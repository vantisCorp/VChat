/**
 * @vcomm/access-portal - Session Management System
 */

import * as crypto from 'crypto';
import type { Session, SessionOptions } from './types';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private defaultDuration: number;
  private maxSessionsPerUser: number;
  private tokenSecret: string;

  constructor(options?: { defaultDuration?: number; maxSessionsPerUser?: number; tokenSecret?: string }) {
    this.defaultDuration = options?.defaultDuration ?? 7 * 24 * 60 * 60;
    this.maxSessionsPerUser = options?.maxSessionsPerUser ?? 10;
    this.tokenSecret = options?.tokenSecret ?? crypto.randomBytes(32).toString('hex');
  }

  createSession(userId: string, options?: SessionOptions): Session {
    const sessionId = this.generateSessionId();
    const token = this.generateToken(userId, sessionId);
    const duration = options?.duration ?? this.defaultDuration;
    const now = new Date();
    const session: Session = {
      id: sessionId,
      userId,
      tokenHash: this.hashToken(token),
      device: options?.device,
      isCurrent: true,
      createdAt: now,
      lastActivityAt: now,
      expiresAt: new Date(now.getTime() + duration * 1000),
    };
    this.sessions.set(sessionId, session);
    if (!this.userSessions.has(userId)) this.userSessions.set(userId, new Set());
    this.userSessions.get(userId)!.add(sessionId);
    this.enforceSessionLimit(userId);
    return session;
  }

  validateSession(token: string): Session | null {
    const tokenHash = this.hashToken(token);
    for (const session of this.sessions.values()) {
      if (session.tokenHash === tokenHash) {
        if (session.expiresAt < new Date()) { this.destroySession(session.id); return null; }
        session.lastActivityAt = new Date();
        return session;
      }
    }
    return null;
  }

  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session && session.expiresAt < new Date()) { this.destroySession(sessionId); return undefined; }
    return session;
  }

  getUserSessions(userId: string): Session[] {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return [];
    const sessions: Session[] = [];
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);
      if (session && session.expiresAt >= new Date()) sessions.push(session);
    }
    return sessions.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
  }

  destroySession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    this.sessions.delete(sessionId);
    const userSessionIds = this.userSessions.get(session.userId);
    if (userSessionIds) userSessionIds.delete(sessionId);
    return true;
  }

  destroyAllUserSessions(userId: string): number {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return 0;
    let destroyed = 0;
    for (const sessionId of sessionIds) { this.sessions.delete(sessionId); destroyed++; }
    this.userSessions.delete(userId);
    return destroyed;
  }

  cleanupExpired(): number {
    const now = new Date();
    let cleaned = 0;
    for (const [sessionId, session] of this.sessions) {
      if (session.expiresAt < now) { this.destroySession(sessionId); cleaned++; }
    }
    return cleaned;
  }

  getStatistics(): { totalSessions: number; activeUsers: number; sessionsByDeviceType: Record<string, number> } {
    const deviceCounts: Record<string, number> = {};
    for (const session of this.sessions.values()) {
      const deviceType = session.device?.type || 'unknown';
      deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
    }
    return { totalSessions: this.sessions.size, activeUsers: this.userSessions.size, sessionsByDeviceType: deviceCounts };
  }

  parseUserAgent(userAgent: string): Session['device'] {
    const ua = userAgent.toLowerCase();
    type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';
    let type: DeviceType = 'unknown';
    if (/mobile|android|iphone/.test(ua)) type = 'mobile';
    else if (/tablet|ipad/.test(ua)) type = 'tablet';
    else if (/windows|macintosh|linux/.test(ua)) type = 'desktop';
    let os: string | undefined;
    if (/windows/.test(ua)) os = 'Windows';
    else if (/mac/.test(ua)) os = 'macOS';
    else if (/linux/.test(ua)) os = 'Linux';
    else if (/android/.test(ua)) os = 'Android';
    else if (/iphone|ipad/.test(ua)) os = 'iOS';
    let browser: string | undefined;
    if (/firefox/.test(ua)) browser = 'Firefox';
    else if (/edg/.test(ua)) browser = 'Edge';
    else if (/chrome/.test(ua)) browser = 'Chrome';
    else if (/safari/.test(ua)) browser = 'Safari';
    return { type, os, browser };
  }

  private generateSessionId(): string { return crypto.randomBytes(32).toString('base64url'); }
  private generateToken(userId: string, sessionId: string): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(16).toString('base64url');
    const signature = crypto.createHmac('sha256', this.tokenSecret).update(`${userId}:${sessionId}:${timestamp}`).digest('base64url');
    return `${sessionId}.${userId}.${timestamp}.${random}.${signature}`;
  }
  private hashToken(token: string): string { return crypto.createHash('sha256').update(token).digest('hex'); }

  private enforceSessionLimit(userId: string): void {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds || sessionIds.size <= this.maxSessionsPerUser) return;
    const sessions = Array.from(sessionIds).map(id => this.sessions.get(id)).filter((s): s is Session => s !== undefined).sort((a, b) => a.lastActivityAt.getTime() - b.lastActivityAt.getTime());
    const toRemove = sessions.slice(0, sessions.length - this.maxSessionsPerUser);
    for (const session of toRemove) { this.sessions.delete(session.id); sessionIds.delete(session.id); }
  }
}

export function generateSecureToken(length: number = 32): string { return crypto.randomBytes(length).toString('base64url'); }
export function generateApiKey(prefix: string = 'vcomm'): string { return `${prefix}_${crypto.randomBytes(32).toString('base64url')}`; }
export function isValidTokenFormat(token: string): boolean { return token.split('.').length >= 4; }
