/**
 * @vcomm/access-portal - Audit Logging System
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AuditLogEntry,
  AuditEventType,
  AuditSeverity,
  AuditLogQuery,
  AuditLogResult,
  ResourceType,
} from './types';

interface AuditEventConfig {
  severity: AuditSeverity;
  description: string;
  category: string;
}

const AUDIT_EVENT_CONFIGS: Record<AuditEventType, AuditEventConfig> = {
  'auth.login': { severity: 'low', description: 'User logged in', category: 'authentication' },
  'auth.logout': { severity: 'low', description: 'User logged out', category: 'authentication' },
  'auth.login_failed': {
    severity: 'medium',
    description: 'Failed login attempt',
    category: 'authentication',
  },
  'user.created': {
    severity: 'low',
    description: 'User account created',
    category: 'user_management',
  },
  'user.updated': {
    severity: 'low',
    description: 'User account updated',
    category: 'user_management',
  },
  'user.deleted': {
    severity: 'high',
    description: 'User account deleted',
    category: 'user_management',
  },
  'user.suspended': {
    severity: 'high',
    description: 'User account suspended',
    category: 'user_management',
  },
  'user.banned': { severity: 'high', description: 'User banned', category: 'user_management' },
  'role.created': { severity: 'medium', description: 'Role created', category: 'role_management' },
  'role.updated': { severity: 'medium', description: 'Role updated', category: 'role_management' },
  'role.deleted': { severity: 'high', description: 'Role deleted', category: 'role_management' },
  'role.assigned': {
    severity: 'medium',
    description: 'Role assigned to user',
    category: 'role_management',
  },
  'role.revoked': {
    severity: 'medium',
    description: 'Role revoked from user',
    category: 'role_management',
  },
  'permission.granted': {
    severity: 'medium',
    description: 'Permission granted',
    category: 'permission',
  },
  'permission.revoked': {
    severity: 'medium',
    description: 'Permission revoked',
    category: 'permission',
  },
  'server.created': { severity: 'low', description: 'Server created', category: 'server' },
  'server.deleted': { severity: 'high', description: 'Server deleted', category: 'server' },
  'security.suspicious_activity': {
    severity: 'high',
    description: 'Suspicious activity detected',
    category: 'security',
  },
  'security.ip_blocked': {
    severity: 'high',
    description: 'IP address blocked',
    category: 'security',
  },
  'security.rate_limited': {
    severity: 'medium',
    description: 'Rate limit exceeded',
    category: 'security',
  },
};

export class AuditLogger {
  private entries: Map<string, AuditLogEntry> = new Map();
  private retentionDays: number;
  private logIpAddress: boolean;
  private logPermissionChecks: boolean;
  private maxEntries: number;

  constructor(options?: {
    retentionDays?: number;
    logIpAddresses?: boolean;
    logPermissionChecks?: boolean;
    maxEntries?: number;
  }) {
    this.retentionDays = options?.retentionDays ?? 90;
    this.logIpAddress = options?.logIpAddresses ?? true;
    this.logPermissionChecks = options?.logPermissionChecks ?? false;
    this.maxEntries = options?.maxEntries ?? 100000;
  }

  log(options: {
    eventType: AuditEventType;
    actor: { id: string; type: 'user' | 'bot' | 'system'; ipAddress?: string; userAgent?: string };
    target: { type: ResourceType | 'user' | 'role' | 'oauth'; id: string };
    changes?: { before?: unknown; after?: unknown };
    metadata?: Record<string, unknown>;
    scopeId?: string;
    severity?: AuditSeverity;
  }): AuditLogEntry {
    const config = AUDIT_EVENT_CONFIGS[options.eventType];
    const entry: AuditLogEntry = {
      id: uuidv4(),
      eventType: options.eventType,
      severity: options.severity || config.severity,
      actor: {
        id: options.actor.id,
        type: options.actor.type,
        ipAddress: this.logIpAddress ? options.actor.ipAddress : undefined,
        userAgent: options.actor.userAgent,
      },
      target: options.target,
      changes: options.changes,
      metadata: options.metadata,
      scopeId: options.scopeId,
      timestamp: new Date(),
    };
    this.entries.set(entry.id, entry);
    this.enforceMaxEntries();
    return entry;
  }

  logAuthEvent(
    eventType: AuditEventType,
    userId: string,
    metadata?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): AuditLogEntry {
    return this.log({
      eventType,
      actor: { id: userId, type: 'user', ipAddress, userAgent },
      target: { type: 'user', id: userId },
      metadata,
    });
  }

  logUserEvent(
    eventType: AuditEventType,
    actorId: string,
    targetUserId: string,
    changes?: { before?: unknown; after?: unknown },
    metadata?: Record<string, unknown>
  ): AuditLogEntry {
    return this.log({
      eventType,
      actor: { id: actorId, type: 'user' },
      target: { type: 'user', id: targetUserId },
      changes,
      metadata,
    });
  }

  logRoleEvent(
    eventType: AuditEventType,
    actorId: string,
    roleId: string,
    targetUserId?: string,
    changes?: { before?: unknown; after?: unknown },
    scopeId?: string
  ): AuditLogEntry {
    return this.log({
      eventType,
      actor: { id: actorId, type: 'user' },
      target: { type: 'role', id: targetUserId ? `${roleId}:${targetUserId}` : roleId },
      changes,
      scopeId,
    });
  }

  logSecurityEvent(
    eventType: AuditEventType,
    actorId: string,
    description: string,
    metadata?: Record<string, unknown>,
    severity?: AuditSeverity
  ): AuditLogEntry {
    return this.log({
      eventType,
      severity: severity || AUDIT_EVENT_CONFIGS[eventType].severity,
      actor: { id: actorId, type: 'user' },
      target: { type: 'user', id: actorId },
      metadata: { description, ...metadata },
    });
  }

  query(options: AuditLogQuery): AuditLogResult {
    let entries = Array.from(this.entries.values());
    if (options.eventTypes && options.eventTypes.length > 0)
      entries = entries.filter((e) => options.eventTypes!.includes(e.eventType));
    if (options.actorId) entries = entries.filter((e) => e.actor.id === options.actorId);
    if (options.targetId) entries = entries.filter((e) => e.target.id === options.targetId);
    if (options.scopeId) entries = entries.filter((e) => e.scopeId === options.scopeId);
    if (options.minSeverity) {
      const severityOrder: AuditSeverity[] = ['low', 'medium', 'high', 'critical'];
      const minIndex = severityOrder.indexOf(options.minSeverity);
      entries = entries.filter((e) => severityOrder.indexOf(e.severity) >= minIndex);
    }
    if (options.startDate) entries = entries.filter((e) => e.timestamp >= options.startDate!);
    if (options.endDate) entries = entries.filter((e) => e.timestamp <= options.endDate!);

    const sortOrder = options.sortOrder || 'desc';
    entries.sort((a, b) =>
      sortOrder === 'desc'
        ? b.timestamp.getTime() - a.timestamp.getTime()
        : a.timestamp.getTime() - b.timestamp.getTime()
    );

    const total = entries.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    entries = entries.slice(offset, offset + limit);
    return { entries, total, hasMore: offset + entries.length < total };
  }

  getRecent(count: number = 50): AuditLogEntry[] {
    return this.query({ limit: count, sortOrder: 'desc' }).entries;
  }
  getByUser(userId: string, limit: number = 50): AuditLogEntry[] {
    return this.query({ actorId: userId, limit, sortOrder: 'desc' }).entries;
  }
  getEntry(id: string): AuditLogEntry | undefined {
    return this.entries.get(id);
  }

  cleanupExpired(): number {
    const cutoffDate = new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000);
    let cleaned = 0;
    for (const [id, entry] of this.entries) {
      if (entry.timestamp < cutoffDate) {
        this.entries.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }

  private enforceMaxEntries(): void {
    if (this.entries.size <= this.maxEntries) return;
    const sorted = Array.from(this.entries.values()).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const toRemove = sorted.slice(0, sorted.length - this.maxEntries);
    for (const entry of toRemove) this.entries.delete(entry.id);
  }

  getStatistics(): { totalEntries: number; bySeverity: Record<AuditSeverity, number> } {
    const bySeverity: Record<AuditSeverity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const entry of this.entries.values()) bySeverity[entry.severity]++;
    return { totalEntries: this.entries.size, bySeverity };
  }
}

export function getEventDescription(eventType: AuditEventType): string {
  return AUDIT_EVENT_CONFIGS[eventType]?.description || eventType;
}
export function formatAuditEntry(entry: AuditLogEntry): string {
  return `[${entry.timestamp.toISOString()}] [${entry.severity.toUpperCase()}] ${entry.actor.id} -> ${entry.eventType} -> ${entry.target.id}`;
}
