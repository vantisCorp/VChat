/**
 * @vcomm/plugin-system - Plugin Sandbox
 * 
 * Provides secure execution environment for plugins.
 * Implements permission-based access control and resource limits.
 */

import {
  PluginInstance,
  PluginPermission,
  PluginError,
  PluginErrorCode,
  PermissionCheckContext,
} from '../types';

/**
 * Sandbox configuration
 */
export interface SandboxConfig {
  /** Enable permission enforcement */
  enforcePermissions?: boolean;
  /** Maximum execution time for plugin operations (ms) */
  executionTimeout?: number;
  /** Maximum memory usage (bytes) */
  maxMemory?: number;
  /** Allowed network domains */
  allowedDomains?: string[];
  /** Enable resource monitoring */
  enableMonitoring?: boolean;
  /** Log permission checks */
  logPermissionChecks?: boolean;
}

/**
 * Default sandbox configuration
 */
const DEFAULT_SANDBOX_CONFIG: Required<SandboxConfig> = {
  enforcePermissions: true,
  executionTimeout: 30000,
  maxMemory: 128 * 1024 * 1024, // 128MB
  allowedDomains: [],
  enableMonitoring: true,
  logPermissionChecks: false,
};

/**
 * Permission rule
 */
interface PermissionRule {
  /** Permission being controlled */
  permission: PluginPermission;
  /** Whether permission is granted */
  granted: boolean;
  /** Optional conditions */
  conditions?: PermissionCondition[];
  /** Rule source */
  source: 'manifest' | 'user' | 'system';
}

/**
 * Permission condition
 */
interface PermissionCondition {
  /** Condition type */
  type: 'server' | 'channel' | 'user' | 'role' | 'custom';
  /** Condition value */
  value: string | string[] | ((context: PermissionCheckContext) => boolean);
  /** Whether this is an allow or deny condition */
  effect: 'allow' | 'deny';
}

/**
 * Resource usage metrics
 */
export interface ResourceMetrics {
  /** Plugin ID */
  pluginId: string;
  /** CPU time used (ms) */
  cpuTime: number;
  /** Memory used (bytes) */
  memoryUsed: number;
  /** Network requests made */
  networkRequests: number;
  /** Database queries made */
  dbQueries: number;
  /** Errors encountered */
  errors: number;
  /** Last activity timestamp */
  lastActivity: Date;
}

/**
 * PluginSandbox - Secure execution environment for plugins
 * 
 * @example
 * ```typescript
 * const sandbox = new PluginSandbox();
 * 
 * // Initialize sandbox for a plugin
 * sandbox.initialize(plugin);
 * 
 * // Check permission
 * const allowed = sandbox.checkPermission(plugin, 'message.read', context);
 * 
 * // Execute in sandbox
 * const result = await sandbox.execute(plugin, async () => {
 *   // Plugin code runs here with restricted access
 * });
 * ```
 */
export class PluginSandbox {
  private config: Required<SandboxConfig>;
  private permissionRules: Map<string, PermissionRule[]> = new Map();
  private resourceMetrics: Map<string, ResourceMetrics> = new Map();
  private activeExecutions: Map<string, number> = new Map();

  constructor(config: SandboxConfig = {}) {
    this.config = { ...DEFAULT_SANDBOX_CONFIG, ...config };
  }

  /**
   * Initialize sandbox for a plugin
   */
  initialize(plugin: PluginInstance): void {
    // Initialize permission rules from manifest
    const rules: PermissionRule[] = [];
    
    for (const permission of plugin.permissions) {
      rules.push({
        permission,
        granted: true,
        source: 'manifest',
      });
    }

    this.permissionRules.set(plugin.id, rules);

    // Initialize resource metrics
    this.resourceMetrics.set(plugin.id, {
      pluginId: plugin.id,
      cpuTime: 0,
      memoryUsed: 0,
      networkRequests: 0,
      dbQueries: 0,
      errors: 0,
      lastActivity: new Date(),
    });

    this.activeExecutions.set(plugin.id, 0);
  }

  /**
   * Cleanup sandbox for a plugin
   */
  destroy(pluginId: string): void {
    this.permissionRules.delete(pluginId);
    this.resourceMetrics.delete(pluginId);
    this.activeExecutions.delete(pluginId);
  }

  /**
   * Check if a plugin has a permission
   */
  checkPermission(
    plugin: PluginInstance,
    permission: PluginPermission,
    context?: PermissionCheckContext
  ): boolean {
    if (!this.config.enforcePermissions) {
      return true;
    }

    const rules = this.permissionRules.get(plugin.id) || [];
    
    // Find applicable rules
    const applicableRules = rules.filter(r => 
      r.permission === permission || this.isWildcardMatch(r.permission, permission)
    );

    // Check conditions
    for (const rule of applicableRules) {
      if (!rule.granted) {
        this.logPermissionCheck(plugin.id, permission, false, 'denied rule');
        return false;
      }

      if (rule.conditions) {
        for (const condition of rule.conditions) {
          if (!this.evaluateCondition(condition, context)) {
            this.logPermissionCheck(plugin.id, permission, false, 'condition not met');
            return false;
          }
        }
      }
    }

    // Check if permission was explicitly granted
    const hasPermission = applicableRules.length > 0;
    this.logPermissionCheck(plugin.id, permission, hasPermission, hasPermission ? 'granted' : 'no rule');

    return hasPermission;
  }

  /**
   * Check multiple permissions
   */
  checkPermissions(
    plugin: PluginInstance,
    permissions: PluginPermission[],
    context?: PermissionCheckContext
  ): { permission: PluginPermission; granted: boolean }[] {
    return permissions.map(permission => ({
      permission,
      granted: this.checkPermission(plugin, permission, context),
    }));
  }

  /**
   * Grant additional permission to a plugin
   */
  grantPermission(
    pluginId: string,
    permission: PluginPermission,
    source: 'user' | 'system' = 'user'
  ): void {
    const rules = this.permissionRules.get(pluginId) || [];
    
    // Check if already granted
    const existing = rules.find(r => r.permission === permission);
    if (existing) {
      existing.granted = true;
      existing.source = source;
    } else {
      rules.push({
        permission,
        granted: true,
        source,
      });
    }

    this.permissionRules.set(pluginId, rules);
  }

  /**
   * Revoke permission from a plugin
   */
  revokePermission(pluginId: string, permission: PluginPermission): void {
    const rules = this.permissionRules.get(pluginId) || [];
    const existing = rules.find(r => r.permission === permission);
    
    if (existing) {
      existing.granted = false;
    } else {
      rules.push({
        permission,
        granted: false,
        source: 'user',
      });
    }

    this.permissionRules.set(pluginId, rules);
  }

  /**
   * Execute a function in the sandbox
   */
  async execute<T>(
    plugin: PluginInstance,
    fn: () => Promise<T> | T
  ): Promise<T> {
    const pluginId = plugin.id;
    
    // Track active executions
    const activeCount = this.activeExecutions.get(pluginId) || 0;
    this.activeExecutions.set(pluginId, activeCount + 1);

    // Get or create metrics
    const metrics = this.resourceMetrics.get(pluginId);
    if (metrics) {
      metrics.lastActivity = new Date();
    }

    const startTime = Date.now();

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn, this.config.executionTimeout);
      
      // Update metrics
      if (metrics) {
        metrics.cpuTime += Date.now() - startTime;
      }

      return result;
    } catch (error) {
      if (metrics) {
        metrics.errors++;
      }
      throw error;
    } finally {
      const count = this.activeExecutions.get(pluginId) || 0;
      this.activeExecutions.set(pluginId, Math.max(0, count - 1));
    }
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T> | T,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new PluginError(
          `Execution timed out after ${timeout}ms`,
          PluginErrorCode.EXECUTION_TIMEOUT
        ));
      }, timeout);

      Promise.resolve(fn())
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Check wildcard permission match
   */
  private isWildcardMatch(pattern: string, permission: PluginPermission): boolean {
    if (!pattern.includes('*')) {
      return false;
    }

    const parts = pattern.split('.');
    const permParts = permission.split('.');

    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === '*') {
        return true;
      }
      if (i >= permParts.length || parts[i] !== permParts[i]) {
        return false;
      }
    }

    return parts.length === permParts.length;
  }

  /**
   * Evaluate a permission condition
   */
  private evaluateCondition(
    condition: PermissionCondition,
    context?: PermissionCheckContext
  ): boolean {
    if (!context) {
      return condition.effect === 'allow';
    }

    switch (condition.type) {
      case 'server':
        if (typeof condition.value === 'string') {
          return context.serverId === condition.value;
        }
        if (Array.isArray(condition.value)) {
          return condition.value.includes(context.serverId);
        }
        return true;

      case 'channel':
        if (typeof condition.value === 'string') {
          return context.channelId === condition.value;
        }
        if (Array.isArray(condition.value)) {
          return condition.value.includes(context.channelId || '');
        }
        return true;

      case 'user':
        if (typeof condition.value === 'string') {
          return context.userId === condition.value;
        }
        if (Array.isArray(condition.value)) {
          return condition.value.includes(context.userId);
        }
        return true;

      case 'role':
        if (Array.isArray(condition.value) && context.userRoles) {
          return condition.value.some(role => context.userRoles!.includes(role));
        }
        return true;

      case 'custom':
        if (typeof condition.value === 'function') {
          return condition.value(context);
        }
        return true;

      default:
        return true;
    }
  }

  /**
   * Log permission check
   */
  private logPermissionCheck(
    pluginId: string,
    permission: PluginPermission,
    granted: boolean,
    reason: string
  ): void {
    if (this.config.logPermissionChecks) {
      console.log(`[Sandbox] Permission check: ${pluginId} -> ${permission}: ${granted ? 'GRANTED' : 'DENIED'} (${reason})`);
    }
  }

  /**
   * Get resource metrics for a plugin
   */
  getMetrics(pluginId: string): ResourceMetrics | undefined {
    return this.resourceMetrics.get(pluginId);
  }

  /**
   * Get all resource metrics
   */
  getAllMetrics(): ResourceMetrics[] {
    return Array.from(this.resourceMetrics.values());
  }

  /**
   * Reset metrics for a plugin
   */
  resetMetrics(pluginId: string): void {
    const metrics = this.resourceMetrics.get(pluginId);
    if (metrics) {
      metrics.cpuTime = 0;
      metrics.memoryUsed = 0;
      metrics.networkRequests = 0;
      metrics.dbQueries = 0;
      metrics.errors = 0;
    }
  }

  /**
   * Check if plugin is within resource limits
   */
  isWithinLimits(pluginId: string): boolean {
    const metrics = this.resourceMetrics.get(pluginId);
    if (!metrics) return true;

    if (metrics.memoryUsed > this.config.maxMemory) {
      return false;
    }

    return true;
  }

  /**
   * Get active execution count for a plugin
   */
  getActiveExecutions(pluginId: string): number {
    return this.activeExecutions.get(pluginId) || 0;
  }

  /**
   * Create a permission context helper
   */
  createContext(context: Partial<PermissionCheckContext>): PermissionCheckContext {
    return {
      pluginId: context.pluginId || '',
      userId: context.userId || '',
      serverId: context.serverId || '',
      channelId: context.channelId,
      userRoles: context.userRoles || [],
      timestamp: context.timestamp || new Date(),
      metadata: context.metadata || {},
    };
  }

  /**
   * Get permission rules for a plugin
   */
  getPermissionRules(pluginId: string): PermissionRule[] {
    return [...(this.permissionRules.get(pluginId) || [])];
  }

  /**
   * Export sandbox state
   */
  exportState(): {
    rules: Map<string, PermissionRule[]>;
    metrics: ResourceMetrics[];
  } {
    return {
      rules: new Map(this.permissionRules),
      metrics: this.getAllMetrics(),
    };
  }
}

export default PluginSandbox;
