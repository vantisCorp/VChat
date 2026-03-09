/**
 * @vcomm/access-portal - Main Entry Point
 */

// Export types
export type {
  Permission,
  PermissionAction,
  ResourceType,
  PermissionCondition,
  Role,
  SystemRoleType,
  UserRoleAssignment,
  PermissionCheckRequest,
  PermissionCheckResult,
  UserIdentity,
  UserStatus,
  AccountType,
  OAuthProviderType,
  OAuthProviderConfig,
  OAuthProvider,
  OAuthCallbackResult,
  AuditLogEntry,
  AuditEventType,
  AuditSeverity,
  AuditLogQuery,
  Session,
  SessionOptions,
  AccessPortalConfig,
  AccessPortalOptions,
} from './types';

// Export modules
export {
  RBACManager,
  DEFAULT_PERMISSIONS,
  DEFAULT_SYSTEM_ROLES,
  parsePermission,
  createPermissionId,
} from './rbac';
export { OAuthManager, getProviderDisplayName } from './oauth';
export { AuditLogger, getEventDescription, formatAuditEntry } from './audit';
export { SessionManager, generateSecureToken, generateApiKey, isValidTokenFormat } from './session';

import { RBACManager } from './rbac';
import { OAuthManager } from './oauth';
import { AuditLogger } from './audit';
import { SessionManager } from './session';
import type { AccessPortalOptions } from './types';

/**
 * Access Portal - Main class
 */
export class AccessPortal {
  public readonly rbac: RBACManager;
  public readonly oauth: OAuthManager;
  public readonly audit: AuditLogger;
  public readonly sessions: SessionManager;

  constructor(options: AccessPortalOptions) {
    this.rbac = new RBACManager();
    this.oauth = new OAuthManager(options.jwtSecret);
    if (options.oauthProviders) this.oauth.registerProviders(options.oauthProviders);
    this.audit = new AuditLogger({
      retentionDays: options.audit?.retentionDays,
      logIpAddresses: options.audit?.logIpAddresses,
      logPermissionChecks: options.audit?.logPermissionChecks,
    });
    this.sessions = new SessionManager({
      defaultDuration: options.session?.defaultDuration,
      maxSessionsPerUser: options.session?.maxSessionsPerUser,
      tokenSecret: options.jwtSecret,
    });
  }

  hasPermission(userId: string, permission: string, scopeId?: string): boolean {
    return this.rbac.checkPermission({ userId, permission, scopeId }).granted;
  }

  assignRole(
    userId: string,
    roleId: string,
    scopeId: string,
    assignedBy: string,
    expiresAt?: Date
  ): void {
    this.rbac.assignRole(userId, roleId, scopeId, assignedBy, expiresAt);
    this.audit.logRoleEvent('role.assigned', assignedBy, roleId, userId, undefined, scopeId);
  }

  revokeRole(userId: string, roleId: string, scopeId: string, revokedBy: string): boolean {
    const result = this.rbac.revokeRole(userId, roleId, scopeId);
    if (result)
      this.audit.logRoleEvent('role.revoked', revokedBy, roleId, userId, undefined, scopeId);
    return result;
  }

  getUserSessions(userId: string) {
    return this.sessions.getUserSessions(userId);
  }
  terminateAllSessions(userId: string): number {
    return this.sessions.destroyAllUserSessions(userId);
  }
  getRecentAuditLogs(count: number = 50) {
    return this.audit.getRecent(count);
  }
  cleanup(): { sessions: number; auditLogs: number } {
    return { sessions: this.sessions.cleanupExpired(), auditLogs: this.audit.cleanupExpired() };
  }
}

export function createAccessPortal(options: AccessPortalOptions): AccessPortal {
  return new AccessPortal(options);
}
