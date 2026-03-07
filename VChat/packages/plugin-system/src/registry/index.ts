/**
 * @vcomm/plugin-system - Plugin Registry
 * 
 * Manages plugin registration, discovery, and state.
 * Provides a central repository for all installed plugins.
 */

import {
  PluginManifest,
  PluginInstance,
  PluginStatus,
  PluginPermission,
  PluginDependency,
  PluginVersion,
  PluginError,
  PluginErrorCode,
} from '../types';

/**
 * Registry configuration
 */
export interface RegistryConfig {
  /** Maximum plugins allowed */
  maxPlugins?: number;
  /** Enable plugin conflict detection */
  enableConflictDetection?: boolean;
  /** Auto-resolve dependencies */
  autoResolveDependencies?: boolean;
  /** Plugin storage path */
  storagePath?: string;
}

/**
 * Default registry configuration
 */
const DEFAULT_REGISTRY_CONFIG: Required<RegistryConfig> = {
  maxPlugins: 100,
  enableConflictDetection: true,
  autoResolveDependencies: true,
  storagePath: './plugins',
};

/**
 * Plugin conflict information
 */
export interface PluginConflict {
  /** Plugins in conflict */
  plugins: string[];
  /** Conflict type */
  type: 'dependency' | 'permission' | 'hook' | 'resource';
  /** Conflict description */
  description: string;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Plugin dependency tree node
 */
interface DependencyNode {
  pluginId: string;
  version: string;
  dependencies: DependencyNode[];
  resolved: boolean;
}

/**
 * PluginRegistry - Central repository for plugin management
 * 
 * @example
 * ```typescript
 * const registry = new PluginRegistry();
 * 
 * // Register a plugin
 * await registry.register(manifest);
 * 
 * // Get plugin instance
 * const plugin = registry.get('com.example.my-plugin');
 * 
 * // Update status
 * registry.setStatus('com.example.my-plugin', 'enabled');
 * ```
 */
export class PluginRegistry {
  private plugins: Map<string, PluginInstance> = new Map();
  private manifests: Map<string, PluginManifest> = new Map();
  private config: Required<RegistryConfig>;
  private conflictCache: PluginConflict[] = [];

  constructor(config: RegistryConfig = {}) {
    this.config = { ...DEFAULT_REGISTRY_CONFIG, ...config };
  }

  /**
   * Register a plugin in the registry
   */
  async register(manifest: PluginManifest): Promise<PluginInstance> {
    // Validate manifest
    this.validateManifest(manifest);

    // Check if already registered
    if (this.plugins.has(manifest.id)) {
      throw new PluginError(
        `Plugin ${manifest.id} is already registered`,
        PluginErrorCode.PLUGIN_ALREADY_EXISTS
      );
    }

    // Check max plugins limit
    if (this.plugins.size >= this.config.maxPlugins) {
      throw new PluginError(
        `Maximum plugins limit (${this.config.maxPlugins}) reached`,
        PluginErrorCode.LIMIT_EXCEEDED
      );
    }

    // Check dependencies
    if (this.config.enableConflictDetection) {
      const missingDeps = this.checkDependencies(manifest);
      if (missingDeps.length > 0 && !this.config.autoResolveDependencies) {
        throw new PluginError(
          `Missing dependencies: ${missingDeps.map(d => d.pluginId).join(', ')}`,
          PluginErrorCode.DEPENDENCY_MISSING
        );
      }
    }

    // Create plugin instance
    const instance: PluginInstance = {
      id: manifest.id,
      manifest,
      status: 'installed',
      installedAt: new Date(),
      updatedAt: new Date(),
      enabled: false,
      permissions: manifest.permissions || [],
      settings: {},
      stats: {
        hookCalls: 0,
        errors: 0,
        lastError: undefined,
        lastActiveAt: undefined,
      },
    };

    // Store in registry
    this.plugins.set(manifest.id, instance);
    this.manifests.set(manifest.id, manifest);

    // Invalidate conflict cache
    this.conflictCache = [];

    return instance;
  }

  /**
   * Unregister a plugin from the registry
   */
  async unregister(pluginId: string): Promise<boolean> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      return false;
    }

    // Check if other plugins depend on this one
    const dependents = this.getDependents(pluginId);
    if (dependents.length > 0) {
      throw new PluginError(
        `Cannot unregister: plugins [${dependents.join(', ')}] depend on ${pluginId}`,
        PluginErrorCode.DEPENDENCY_CONFLICT
      );
    }

    this.plugins.delete(pluginId);
    this.manifests.delete(pluginId);
    this.conflictCache = [];

    return true;
  }

  /**
   * Get a plugin instance
   */
  get(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get a plugin manifest
   */
  getManifest(pluginId: string): PluginManifest | undefined {
    return this.manifests.get(pluginId);
  }

  /**
   * Update plugin status
   */
  setStatus(pluginId: string, status: PluginStatus): boolean {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      return false;
    }

    instance.status = status;
    instance.enabled = status === 'enabled';
    instance.updatedAt = new Date();

    return true;
  }

  /**
   * Update plugin settings
   */
  updateSettings(pluginId: string, settings: Record<string, unknown>): boolean {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      return false;
    }

    instance.settings = { ...instance.settings, ...settings };
    instance.updatedAt = new Date();

    return true;
  }

  /**
   * Get all plugins
   */
  getAll(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins by status
   */
  getByStatus(status: PluginStatus): PluginInstance[] {
    return this.getAll().filter(p => p.status === status);
  }

  /**
   * Get enabled plugins
   */
  getEnabled(): PluginInstance[] {
    return this.getByStatus('enabled');
  }

  /**
   * Check if a plugin is registered
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Get plugin count
   */
  get count(): number {
    return this.plugins.size;
  }

  /**
   * Validate a plugin manifest
   */
  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.id) {
      throw new PluginError(
        'Plugin manifest must have an id',
        PluginErrorCode.INVALID_MANIFEST
      );
    }

    if (!manifest.name) {
      throw new PluginError(
        'Plugin manifest must have a name',
        PluginErrorCode.INVALID_MANIFEST
      );
    }

    if (!manifest.version) {
      throw new PluginError(
        'Plugin manifest must have a version',
        PluginErrorCode.INVALID_MANIFEST
      );
    }

    // Validate ID format (reverse domain notation)
    const idPattern = /^[a-z0-9]+(?:\.[a-z0-9]+)*\/[a-z0-9-]+$/;
    if (!idPattern.test(manifest.id) && !manifest.id.startsWith('local/')) {
      console.warn(`Plugin ID "${manifest.id}" does not follow recommended format (e.g., com.example/my-plugin)`);
    }

    // Validate version format
    const versionPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
    if (!versionPattern.test(manifest.version)) {
      throw new PluginError(
        `Invalid version format: ${manifest.version}. Expected semantic versioning (e.g., 1.0.0)`,
        PluginErrorCode.INVALID_MANIFEST
      );
    }
  }

  /**
   * Check dependencies for a manifest
   */
  private checkDependencies(manifest: PluginManifest): PluginDependency[] {
    const missing: PluginDependency[] = [];

    if (!manifest.dependencies) {
      return missing;
    }

    for (const dep of manifest.dependencies) {
      const installed = this.plugins.get(dep.pluginId);
      if (!installed) {
        missing.push(dep);
        continue;
      }

      // Check version constraints
      if (dep.minVersion && !this.isVersionGreaterOrEqual(installed.manifest.version, dep.minVersion)) {
        missing.push(dep);
      }
    }

    return missing;
  }

  /**
   * Compare versions
   */
  private isVersionGreaterOrEqual(version: string, minVersion: string): boolean {
    const v1Parts = version.split('.').map(Number);
    const v2Parts = minVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1 = v1Parts[i] || 0;
      const v2 = v2Parts[i] || 0;

      if (v1 > v2) return true;
      if (v1 < v2) return false;
    }

    return true;
  }

  /**
   * Get plugins that depend on a given plugin
   */
  getDependents(pluginId: string): string[] {
    const dependents: string[] = [];

    for (const [id, manifest] of this.manifests) {
      if (manifest.dependencies?.some(d => d.pluginId === pluginId)) {
        dependents.push(id);
      }
    }

    return dependents;
  }

  /**
   * Build dependency tree for a plugin
   */
  buildDependencyTree(pluginId: string): DependencyNode {
    const manifest = this.manifests.get(pluginId);
    if (!manifest) {
      return {
        pluginId,
        version: 'unknown',
        dependencies: [],
        resolved: false,
      };
    }

    return this.buildDependencyNode(manifest);
  }

  /**
   * Recursively build dependency nodes
   */
  private buildDependencyNode(manifest: PluginManifest): DependencyNode {
    const node: DependencyNode = {
      pluginId: manifest.id,
      version: manifest.version,
      dependencies: [],
      resolved: true,
    };

    if (manifest.dependencies) {
      for (const dep of manifest.dependencies) {
        const depManifest = this.manifests.get(dep.pluginId);
        if (depManifest) {
          node.dependencies.push(this.buildDependencyNode(depManifest));
        } else {
          node.dependencies.push({
            pluginId: dep.pluginId,
            version: dep.minVersion || 'unknown',
            dependencies: [],
            resolved: false,
          });
          node.resolved = false;
        }
      }
    }

    return node;
  }

  /**
   * Detect conflicts between plugins
   */
  detectConflicts(): PluginConflict[] {
    if (this.conflictCache.length > 0) {
      return this.conflictCache;
    }

    const conflicts: PluginConflict[] = [];
    const plugins = this.getAll();

    // Check for dependency conflicts
    for (const plugin of plugins) {
      const manifest = plugin.manifest;
      if (!manifest.dependencies) continue;

      for (const dep of manifest.dependencies) {
        const depPlugin = this.plugins.get(dep.pluginId);
        if (depPlugin && dep.minVersion) {
          if (!this.isVersionGreaterOrEqual(depPlugin.manifest.version, dep.minVersion)) {
            conflicts.push({
              plugins: [plugin.id, dep.pluginId],
              type: 'dependency',
              description: `${plugin.id} requires ${dep.pluginId} >= ${dep.minVersion}, but ${depPlugin.manifest.version} is installed`,
              severity: 'high',
            });
          }
        }
      }
    }

    // Check for permission conflicts (plugins requesting same sensitive permissions)
    const permissionMap = new Map<PluginPermission, string[]>();
    for (const plugin of plugins) {
      for (const perm of plugin.permissions) {
        const existing = permissionMap.get(perm) || [];
        existing.push(plugin.id);
        permissionMap.set(perm, existing);
      }
    }

    const sensitivePermissions: PluginPermission[] = [
      'server.manage',
      'user.ban',
      'user.kick',
      'message.delete.any',
      'channel.manage',
      'permissions.manage',
    ];

    for (const [perm, pluginIds] of permissionMap) {
      if (pluginIds.length > 1 && sensitivePermissions.includes(perm)) {
        conflicts.push({
          plugins: pluginIds,
          type: 'permission',
          description: `Multiple plugins (${pluginIds.join(', ')}) request sensitive permission: ${perm}`,
          severity: 'medium',
        });
      }
    }

    this.conflictCache = conflicts;
    return conflicts;
  }

  /**
   * Search plugins by various criteria
   */
  search(query: {
    name?: string;
    author?: string;
    tag?: string;
    status?: PluginStatus;
  }): PluginInstance[] {
    return this.getAll().filter(plugin => {
      const manifest = plugin.manifest;

      if (query.name && !manifest.name.toLowerCase().includes(query.name.toLowerCase())) {
        return false;
      }

      if (query.author && !manifest.author?.name.toLowerCase().includes(query.author.toLowerCase())) {
        return false;
      }

      if (query.tag && !manifest.tags?.includes(query.tag)) {
        return false;
      }

      if (query.status && plugin.status !== query.status) {
        return false;
      }

      return true;
    });
  }

  /**
   * Export registry state (for backup/restore)
   */
  export(): { plugins: PluginInstance[]; manifests: PluginManifest[] } {
    return {
      plugins: this.getAll(),
      manifests: this.getAll().map(p => p.manifest),
    };
  }

  /**
   * Import registry state
   */
  async import(data: { plugins: PluginInstance[]; manifests: PluginManifest[] }): Promise<number> {
    let imported = 0;

    for (const manifest of data.manifests) {
      try {
        await this.register(manifest);
        imported++;
      } catch (error) {
        console.warn(`Failed to import plugin ${manifest.id}:`, error);
      }
    }

    // Restore plugin states
    for (const plugin of data.plugins) {
      const instance = this.plugins.get(plugin.id);
      if (instance) {
        instance.status = plugin.status;
        instance.enabled = plugin.enabled;
        instance.settings = plugin.settings;
      }
    }

    return imported;
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.plugins.clear();
    this.manifests.clear();
    this.conflictCache = [];
  }
}

export default PluginRegistry;
