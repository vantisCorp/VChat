/**
 * @vcomm/access-portal - Type Definitions
 */

// Permission Types
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'admin';
export type ResourceType = 'server' | 'channel' | 'message' | 'user' | 'role' | 'file' | 'space' | 'ticket' | 'forum' | 'bot' | 'webhook' | 'audit_log' | 'settings' | 'api_key';

export interface Permission {
  id: string;
  action: PermissionAction;
  resource: ResourceType;
  conditions?: PermissionCondition[];
  description?: string;
  isDefault?: boolean;
}

export interface PermissionCondition {
  type: 'owner' | 'channel_type' | 'server_role' | 'custom';
  value: unknown;
  inverted?: boolean;
}

export interface Role {
  id: string;
  name: string;
  color?: string;
  position: number;
  permissions: Permission[];
  inherits?: string[];
  isSystem?: boolean;
  mentionable?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SystemRoleType = 'owner' | 'admin' | 'moderator' | 'member' | 'guest' | 'bot';

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  scopeId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
}

// User Types
export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending' | 'deleted';
export type AccountType = 'user' | 'bot' | 'system';

export interface UserIdentity {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  accountType: AccountType;
  status: UserStatus;
  twoFactorEnabled: boolean;
  oauthProviders?: OAuthProvider[];
  createdAt: Date;
  lastLoginAt?: Date;
}

// OAuth Types
export type OAuthProviderType = 'google' | 'github' | 'discord' | 'twitter' | 'microsoft' | 'apple';

export interface OAuthProviderConfig {
  provider: OAuthProviderType;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  enabled: boolean;
  options?: Record<string, unknown>;
}

export interface OAuthProvider {
  provider: OAuthProviderType;
  providerUserId: string;
  providerUsername?: string;
  connectedAt: Date;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface OAuthCallbackResult {
  success: boolean;
  user?: UserIdentity;
  error?: string;
  isNewUser?: boolean;
  token?: string;
}

// Audit Types
export type AuditEventType =
  | 'auth.login' | 'auth.logout' | 'auth.login_failed'
  | 'user.created' | 'user.updated' | 'user.deleted' | 'user.suspended' | 'user.banned'
  | 'role.created' | 'role.updated' | 'role.deleted' | 'role.assigned' | 'role.revoked'
  | 'permission.granted' | 'permission.revoked'
  | 'server.created' | 'server.deleted'
  | 'security.suspicious_activity' | 'security.ip_blocked' | 'security.rate_limited';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  actor: { id: string; type: 'user' | 'bot' | 'system'; ipAddress?: string; userAgent?: string };
  target: { type: ResourceType | 'user' | 'role' | 'oauth'; id: string };
  changes?: { before?: unknown; after?: unknown };
  metadata?: Record<string, unknown>;
  scopeId?: string;
  timestamp: Date;
}

export interface AuditLogQuery {
  eventTypes?: AuditEventType[];
  actorId?: string;
  targetId?: string;
  scopeId?: string;
  minSeverity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  offset?: number;
  limit?: number;
}

// Session Types
export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  device?: { name?: string; type?: 'desktop' | 'mobile' | 'tablet' | 'unknown'; os?: string; browser?: string };
  ipAddress?: string;
  userAgent?: string;
  isCurrent: boolean;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}

export interface SessionOptions {
  duration?: number;
  device?: Session['device'];
  rememberMe?: boolean;
}

// Permission Check Types
export interface PermissionCheckRequest {
  userId: string;
  permission: string;
  resource?: ResourceType;
  resourceId?: string;
  scopeId?: string;
  context?: Record<string, unknown>;
}

export interface PermissionCheckResult {
  granted: boolean;
  permissionId: string;
  grantedBy: string[];
  denialReason?: string;
}

// Config Types
export interface AccessPortalConfig {
  jwtSecret: string;
  jwtExpiresIn?: string;
  oauthProviders?: OAuthProviderConfig[];
  session?: { defaultDuration?: number; maxSessionsPerUser?: number };
  audit?: { logPermissionChecks?: boolean; retentionDays?: number; logIpAddresses?: boolean };
}

export interface AccessPortalOptions extends AccessPortalConfig {
  databaseUrl?: string;
  redisUrl?: string;
  enableMetrics?: boolean;
}
