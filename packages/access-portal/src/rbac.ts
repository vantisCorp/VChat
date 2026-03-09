/**
 * @vcomm/access-portal - Role-Based Access Control (RBAC) System
 */

import type {
  Role,
  Permission,
  PermissionAction,
  ResourceType,
  UserRoleAssignment,
  PermissionCheckRequest,
  PermissionCheckResult,
  SystemRoleType,
} from './types';

// Default Permissions
export const DEFAULT_PERMISSIONS: Permission[] = [
  { id: 'server:create', action: 'create', resource: 'server', description: 'Create new servers' },
  {
    id: 'server:read',
    action: 'read',
    resource: 'server',
    description: 'View server information',
    isDefault: true,
  },
  {
    id: 'server:update',
    action: 'update',
    resource: 'server',
    description: 'Modify server settings',
  },
  { id: 'server:delete', action: 'delete', resource: 'server', description: 'Delete servers' },
  {
    id: 'server:manage',
    action: 'manage',
    resource: 'server',
    description: 'Manage server members',
  },
  {
    id: 'server:admin',
    action: 'admin',
    resource: 'server',
    description: 'Full server administration',
  },
  { id: 'channel:create', action: 'create', resource: 'channel', description: 'Create channels' },
  {
    id: 'channel:read',
    action: 'read',
    resource: 'channel',
    description: 'View channels',
    isDefault: true,
  },
  { id: 'channel:manage', action: 'manage', resource: 'channel', description: 'Manage channels' },
  {
    id: 'message:create',
    action: 'create',
    resource: 'message',
    description: 'Send messages',
    isDefault: true,
  },
  {
    id: 'message:read',
    action: 'read',
    resource: 'message',
    description: 'Read messages',
    isDefault: true,
  },
  { id: 'message:manage', action: 'manage', resource: 'message', description: 'Manage messages' },
  {
    id: 'user:read',
    action: 'read',
    resource: 'user',
    description: 'View user profiles',
    isDefault: true,
  },
  { id: 'user:manage', action: 'manage', resource: 'user', description: 'Manage users' },
  { id: 'user:admin', action: 'admin', resource: 'user', description: 'Full user administration' },
  { id: 'role:create', action: 'create', resource: 'role', description: 'Create roles' },
  { id: 'role:read', action: 'read', resource: 'role', description: 'View roles', isDefault: true },
  { id: 'role:manage', action: 'manage', resource: 'role', description: 'Manage roles' },
  {
    id: 'file:create',
    action: 'create',
    resource: 'file',
    description: 'Upload files',
    isDefault: true,
  },
  {
    id: 'file:read',
    action: 'read',
    resource: 'file',
    description: 'Download files',
    isDefault: true,
  },
  { id: 'audit_log:read', action: 'read', resource: 'audit_log', description: 'View audit logs' },
];

// Default System Roles
export const DEFAULT_SYSTEM_ROLES: Record<
  SystemRoleType,
  Omit<Role, 'id' | 'createdAt' | 'updatedAt'>
> = {
  owner: {
    name: 'Owner',
    color: '#FFD700',
    position: 1000,
    isSystem: true,
    mentionable: true,
    permissions: DEFAULT_PERMISSIONS,
  },
  admin: {
    name: 'Administrator',
    color: '#E74C3C',
    position: 900,
    isSystem: true,
    mentionable: true,
    permissions: DEFAULT_PERMISSIONS.filter(
      (p) => !p.id.includes(':admin') && p.id !== 'server:delete'
    ),
  },
  moderator: {
    name: 'Moderator',
    color: '#3498DB',
    position: 800,
    isSystem: true,
    mentionable: true,
    permissions: DEFAULT_PERMISSIONS.filter((p) =>
      [
        'channel:read',
        'channel:manage',
        'message:read',
        'message:manage',
        'user:read',
        'user:manage',
      ].includes(p.id)
    ),
  },
  member: {
    name: 'Member',
    color: '#95A5A6',
    position: 100,
    isSystem: true,
    mentionable: false,
    permissions: DEFAULT_PERMISSIONS.filter((p) => p.isDefault),
  },
  guest: {
    name: 'Guest',
    color: '#7F8C8D',
    position: 50,
    isSystem: true,
    mentionable: false,
    permissions: DEFAULT_PERMISSIONS.filter(
      (p) => p.isDefault && !['message:create', 'file:create'].includes(p.id)
    ),
  },
  bot: {
    name: 'Bot',
    color: '#9B59B6',
    position: 200,
    isSystem: true,
    mentionable: false,
    permissions: DEFAULT_PERMISSIONS.filter((p) =>
      ['message:create', 'message:read', 'channel:read', 'user:read'].includes(p.id)
    ),
  },
};

/**
 * RBAC Manager Class
 */
export class RBACManager {
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, UserRoleAssignment[]> = new Map();
  private permissionCache: Map<string, Map<string, boolean>> = new Map();

  constructor() {
    this.initializeSystemRoles();
  }

  private initializeSystemRoles(): void {
    const now = new Date();
    for (const [type, roleData] of Object.entries(DEFAULT_SYSTEM_ROLES)) {
      const role: Role = { id: `system:${type}`, ...roleData, createdAt: now, updatedAt: now };
      this.roles.set(role.id, role);
    }
  }

  createRole(data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Role {
    const id = `custom:${Date.now()}:${Math.random().toString(36).substring(7)}`;
    const now = new Date();
    const role: Role = { id, ...data, createdAt: now, updatedAt: now };
    this.roles.set(id, role);
    return role;
  }

  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  updateRole(roleId: string, data: Partial<Omit<Role, 'id' | 'createdAt'>>): Role | null {
    const role = this.roles.get(roleId);
    if (!role) return null;
    const updated: Role = { ...role, ...data, updatedAt: new Date() };
    this.roles.set(roleId, updated);
    this.invalidateCacheForRole(roleId);
    return updated;
  }

  deleteRole(roleId: string): boolean {
    if (roleId.startsWith('system:')) throw new Error('Cannot delete system roles');
    const deleted = this.roles.delete(roleId);
    if (deleted) this.invalidateCacheForRole(roleId);
    return deleted;
  }

  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  assignRole(
    userId: string,
    roleId: string,
    scopeId: string,
    assignedBy: string,
    expiresAt?: Date
  ): UserRoleAssignment {
    const assignment: UserRoleAssignment = {
      userId,
      roleId,
      scopeId,
      assignedBy,
      assignedAt: new Date(),
      expiresAt,
    };
    const userAssignments = this.userRoles.get(userId) || [];
    userAssignments.push(assignment);
    this.userRoles.set(userId, userAssignments);
    this.permissionCache.delete(userId);
    return assignment;
  }

  revokeRole(userId: string, roleId: string, scopeId: string): boolean {
    const assignments = this.userRoles.get(userId);
    if (!assignments) return false;
    const index = assignments.findIndex((a) => a.roleId === roleId && a.scopeId === scopeId);
    if (index === -1) return false;
    assignments.splice(index, 1);
    this.permissionCache.delete(userId);
    return true;
  }

  getUserRoles(userId: string, scopeId?: string): UserRoleAssignment[] {
    const assignments = this.userRoles.get(userId) || [];
    return scopeId ? assignments.filter((a) => a.scopeId === scopeId) : assignments;
  }

  checkPermission(request: PermissionCheckRequest): PermissionCheckResult {
    const { userId, permission, scopeId } = request;
    const userPermissions = this.computeUserPermissions(userId, scopeId);
    const granted = userPermissions.has(permission);
    return {
      granted,
      permissionId: permission,
      grantedBy: granted ? ['role'] : [],
      denialReason: granted ? undefined : 'Permission not granted',
    };
  }

  checkPermissions(
    userId: string,
    permissions: string[],
    scopeId?: string
  ): Map<string, PermissionCheckResult> {
    const results = new Map<string, PermissionCheckResult>();
    for (const permission of permissions) {
      results.set(permission, this.checkPermission({ userId, permission, scopeId }));
    }
    return results;
  }

  hasAnyPermission(userId: string, permissions: string[], scopeId?: string): boolean {
    for (const permission of permissions) {
      if (this.checkPermission({ userId, permission, scopeId }).granted) return true;
    }
    return false;
  }

  private computeUserPermissions(userId: string, scopeId?: string): Map<string, boolean> {
    const cacheKey = `${userId}:${scopeId || 'global'}`;
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    const permissions = new Map<string, boolean>();
    const assignments = this.getUserRoles(userId, scopeId);
    const sortedAssignments = [...assignments].sort((a, b) => {
      const roleA = this.roles.get(a.roleId);
      const roleB = this.roles.get(b.roleId);
      return (roleB?.position || 0) - (roleA?.position || 0);
    });

    for (const assignment of sortedAssignments) {
      if (assignment.expiresAt && assignment.expiresAt < new Date()) continue;
      const role = this.roles.get(assignment.roleId);
      if (!role) continue;
      for (const permission of role.permissions) {
        if (!permissions.has(permission.id)) {
          permissions.set(permission.id, true);
        }
      }
    }

    this.permissionCache.set(cacheKey, permissions);
    return permissions;
  }

  private invalidateCacheForRole(roleId: string): void {
    for (const [userId, assignments] of this.userRoles) {
      if (assignments.some((a) => a.roleId === roleId)) {
        for (const key of this.permissionCache.keys()) {
          if (key.startsWith(userId)) this.permissionCache.delete(key);
        }
      }
    }
  }

  clearCache(): void {
    this.permissionCache.clear();
  }
}

export function parsePermission(
  permissionId: string
): { action: PermissionAction; resource: ResourceType } | null {
  const [resource, action] = permissionId.split(':');
  if (!resource || !action) return null;
  const validActions: PermissionAction[] = [
    'create',
    'read',
    'update',
    'delete',
    'manage',
    'admin',
  ];
  const validResources: ResourceType[] = [
    'server',
    'channel',
    'message',
    'user',
    'role',
    'file',
    'space',
    'ticket',
    'forum',
    'bot',
    'webhook',
    'audit_log',
    'settings',
    'api_key',
  ];
  if (!validActions.includes(action as PermissionAction)) return null;
  if (!validResources.includes(resource as ResourceType)) return null;
  return { action: action as PermissionAction, resource: resource as ResourceType };
}

export function createPermissionId(action: PermissionAction, resource: ResourceType): string {
  return `${resource}:${action}`;
}
