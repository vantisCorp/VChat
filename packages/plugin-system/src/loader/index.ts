/**
 * @vcomm/plugin-system - Plugin Loader
 * 
 * Handles plugin loading, validation, and lifecycle management.
 * Supports both local and remote plugin sources.
 */

import {
  PluginManifest,
  PluginInstance,
  PluginStatus,
  PluginError,
  PluginErrorCode,
  PluginLoadResult,
  PluginValidationResult,
} from '../types';
import { PluginRegistry } from '../registry';

/**
 * Loader configuration
 */
export interface LoaderConfig {
  /** Plugin source directories */
  pluginDirs?: string[];
  /** Allow loading plugins from URLs */
  allowRemoteLoad?: boolean;
  /** Maximum plugin size in bytes */
  maxPluginSize?: number;
  /** Validate plugins before loading */
  validateBeforeLoad?: boolean;
  /** Sandbox loaded plugins */
  enableSandbox?: boolean;
  /** Plugin file name pattern */
  manifestFileName?: string;
}

/**
 * Default loader configuration
 */
const DEFAULT_LOADER_CONFIG: Required<LoaderConfig> = {
  pluginDirs: ['./plugins'],
  allowRemoteLoad: false,
  maxPluginSize: 50 * 1024 * 1024, // 50MB
  validateBeforeLoad: true,
  enableSandbox: true,
  manifestFileName: 'vcomm.json',
};

/**
 * Plugin source location
 */
export interface PluginSource {
  /** Source type */
  type: 'local' | 'remote' | 'npm' | 'marketplace';
  /** Source location (path, URL, or package name) */
  location: string;
  /** Source version or tag */
  version?: string;
}

/**
 * PluginLoader - Manages plugin loading and initialization
 * 
 * @example
 * ```typescript
 * const loader = new PluginLoader(registry);
 * 
 * // Load from local directory
 * const instance = await loader.load('./plugins/my-plugin');
 * 
 * // Load from npm
 * const instance = await loader.loadFromNpm('@vcomm/plugin-example');
 * ```
 */
export class PluginLoader {
  private config: Required<LoaderConfig>;
  private registry: PluginRegistry;
  private loadingPlugins: Set<string> = new Set();

  constructor(registry: PluginRegistry, config: LoaderConfig = {}) {
    this.config = { ...DEFAULT_LOADER_CONFIG, ...config };
    this.registry = registry;
  }

  /**
   * Load a plugin from a source
   */
  async load(source: PluginSource | string): Promise<PluginInstance> {
    const pluginSource = typeof source === 'string' 
      ? this.detectSourceType(source) 
      : source;

    // Prevent circular loading
    const sourceKey = `${pluginSource.type}:${pluginSource.location}`;
    if (this.loadingPlugins.has(sourceKey)) {
      throw new PluginError(
        PluginErrorCode.LOAD_IN_PROGRESS,
        `Plugin is already being loaded: ${sourceKey}`
      );
    }

    this.loadingPlugins.add(sourceKey);

    try {
      // Get manifest based on source type
      const manifest = await this.fetchManifest(pluginSource);

      // Validate manifest
      if (this.config.validateBeforeLoad) {
        const validation = this.validateManifest(manifest);
        if (!validation.valid) {
          throw new PluginError(
            PluginErrorCode.INVALID_MANIFEST,
            `Invalid plugin manifest: ${validation.errors.map(e => e.message).join(', ')}`
          );
        }
      }

      // Check if already registered
      if (this.registry.has(manifest.id)) {
        throw new PluginError(
          PluginErrorCode.PLUGIN_ALREADY_EXISTS,
          `Plugin ${manifest.id} is already installed`
        );
      }

      // Load plugin code
      const pluginModule = await this.loadPluginModule(pluginSource, manifest);

      // Register with registry
      const instance = await this.registry.register(manifest);

      // Store plugin module reference
      (instance as any)._module = pluginModule;

      return instance;
    } finally {
      this.loadingPlugins.delete(sourceKey);
    }
  }

  /**
   * Unload a plugin
   */
  async unload(pluginId: string): Promise<boolean> {
    const instance = this.registry.get(pluginId);
    if (!instance) {
      return false;
    }

    // Check if plugin is enabled
    if (instance.status === 'enabled') {
      throw new PluginError(
        PluginErrorCode.PLUGIN_ENABLED,
        `Cannot unload enabled plugin ${pluginId}. Disable it first.`
      );
    }

    // Cleanup plugin resources
    await this.cleanupPlugin(instance);

    // Unregister from registry
    return this.registry.unregister(pluginId);
  }

  /**
   * Reload a plugin
   */
  async reload(pluginId: string): Promise<PluginInstance> {
    const instance = this.registry.get(pluginId);
    if (!instance) {
      throw new PluginError(
        PluginErrorCode.NOT_FOUND,
        `Plugin ${pluginId} is not installed`
      );
    }

    // Get source information (stored during load)
    const source: PluginSource = (instance as any)._source || {
      type: 'local',
      location: pluginId,
    };

    // Unload
    await this.unload(pluginId);

    // Reload
    return this.load(source);
  }

  /**
   * Detect source type from a string
   */
  private detectSourceType(source: string): PluginSource {
    // URL
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return { type: 'remote', location: source };
    }

    // NPM package
    if (source.startsWith('@') || source.startsWith('vcomm-plugin-')) {
      return { type: 'npm', location: source };
    }

    // Marketplace
    if (source.includes('/marketplace/')) {
      return { type: 'marketplace', location: source };
    }

    // Default to local
    return { type: 'local', location: source };
  }

  /**
   * Fetch plugin manifest from source
   */
  private async fetchManifest(source: PluginSource): Promise<PluginManifest> {
    switch (source.type) {
      case 'local':
        return this.fetchLocalManifest(source.location);
      case 'remote':
        return this.fetchRemoteManifest(source.location);
      case 'npm':
        return this.fetchNpmManifest(source.location, source.version);
      case 'marketplace':
        return this.fetchMarketplaceManifest(source.location);
      default:
        throw new PluginError(
          PluginErrorCode.INVALID_SOURCE,
          `Unknown source type: ${(source as any).type}`
        );
    }
  }

  /**
   * Fetch manifest from local filesystem
   */
  private async fetchLocalManifest(path: string): Promise<PluginManifest> {
    // In a real implementation, this would read from filesystem
    // For now, we simulate it with a mock
    const manifestPath = `${path}/${this.config.manifestFileName}`;
    
    // Simulated filesystem read
    // In production: const content = await fs.readFile(manifestPath, 'utf-8');
    
    throw new PluginError(
      PluginErrorCode.NOT_IMPLEMENTED,
      `Local plugin loading not implemented in this environment`
    );
  }

  /**
   * Fetch manifest from remote URL
   */
  private async fetchRemoteManifest(url: string): Promise<PluginManifest> {
    if (!this.config.allowRemoteLoad) {
      throw new PluginError(
        PluginErrorCode.REMOTE_LOAD_DISABLED,
        'Remote plugin loading is disabled'
      );
    }

    try {
      const response = await fetch(`${url}/${this.config.manifestFileName}`);
      if (!response.ok) {
        throw new PluginError(
          PluginErrorCode.FETCH_FAILED,
          `Failed to fetch manifest: ${response.statusText}`
        );
      }

      return (await response.json()) as PluginManifest;
    } catch (error) {
      if (error instanceof PluginError) throw error;
      throw new PluginError(
        PluginErrorCode.FETCH_FAILED,
        `Failed to fetch remote manifest: ${error}`
      );
    }
  }

  /**
   * Fetch manifest from NPM
   */
  private async fetchNpmManifest(packageName: string, version?: string): Promise<PluginManifest> {
    // In production, this would use npm registry API
    throw new PluginError(
      PluginErrorCode.NOT_IMPLEMENTED,
      'NPM plugin loading not implemented'
    );
  }

  /**
   * Fetch manifest from marketplace
   */
  private async fetchMarketplaceManifest(pluginId: string): Promise<PluginManifest> {
    // In production, this would query the marketplace API
    throw new PluginError(
      PluginErrorCode.NOT_IMPLEMENTED,
      'Marketplace loading not implemented'
    );
  }

  /**
   * Load the plugin module
   */
  private async loadPluginModule(
    source: PluginSource,
    manifest: PluginManifest
  ): Promise<unknown> {
    // In production, this would dynamically load the plugin code
    // with proper sandboxing and security measures
    
    // For now, return a mock module
    return {
      id: manifest.id,
      version: manifest.version,
      initialize: async () => console.log(`Plugin ${manifest.id} initialized`),
      destroy: async () => console.log(`Plugin ${manifest.id} destroyed`),
    };
  }

  /**
   * Validate a plugin manifest
   */
  validateManifest(manifest: PluginManifest): PluginValidationResult {
    const errors: { field: string; message: string }[] = [];
    const warnings: { field: string; message: string }[] = [];

    // Required fields
    if (!manifest.id) {
      errors.push({ field: 'id', message: 'Plugin ID is required' });
    }

    if (!manifest.name) {
      errors.push({ field: 'name', message: 'Plugin name is required' });
    }

    if (!manifest.version) {
      errors.push({ field: 'version', message: 'Plugin version is required' });
    }

    // ID format validation
    if (manifest.id) {
      const idPattern = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
      if (!idPattern.test(manifest.id) && !manifest.id.startsWith('local/')) {
        warnings.push({
          field: 'id',
          message: 'Plugin ID should follow format: publisher/plugin-name',
        });
      }
    }

    // Version format validation
    if (manifest.version) {
      const versionPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/;
      if (!versionPattern.test(manifest.version)) {
        errors.push({
          field: 'version',
          message: 'Version must follow semantic versioning (e.g., 1.0.0)',
        });
      }
    }

    // Permission validation
    if (manifest.permissions) {
      const validPermissions = [
        'message.read', 'message.write', 'message.delete.own', 'message.delete.any',
        'channel.read', 'channel.write', 'channel.manage',
        'user.read', 'user.write', 'user.ban', 'user.kick',
        'server.read', 'server.write', 'server.manage',
        'voice.read', 'voice.write', 'voice.manage',
        'permissions.read', 'permissions.write', 'permissions.manage',
        'webhook.read', 'webhook.write', 'webhook.manage',
        'emoji.read', 'emoji.write', 'emoji.manage',
        'settings.read', 'settings.write',
      ];

      for (const perm of manifest.permissions) {
        if (!validPermissions.includes(perm.type)) {
          warnings.push({
            field: 'permissions',
            message: `Unknown permission: ${perm.type}`,
          });
        }
      }
    }

    // Dependency validation
    if (manifest.dependencies) {
      for (const dep of manifest.dependencies) {
        if (!dep.pluginId) {
          errors.push({
            field: 'dependencies',
            message: 'Dependency must have a pluginId',
          });
        }
      }
    }

    // Check for deprecated fields
    if ((manifest as any).main) {
      warnings.push({
        field: 'main',
        message: 'The "main" field is deprecated, use "entry" instead',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Cleanup plugin resources
   */
  private async cleanupPlugin(instance: PluginInstance): Promise<void> {
    // Call plugin destroy method if available
    const pluginModule = (instance as any)._module;
    if (pluginModule && typeof pluginModule.destroy === 'function') {
      try {
        await pluginModule.destroy();
      } catch (error) {
        console.warn(`Error cleaning up plugin ${instance.id}:`, error);
      }
    }
  }

  /**
   * Scan plugin directories for available plugins
   */
  async scanForPlugins(): Promise<PluginManifest[]> {
    const manifests: PluginManifest[] = [];

    for (const dir of this.config.pluginDirs) {
      try {
        // In production, this would scan the filesystem
        // for directories containing vcomm.json files
        console.log(`Scanning plugin directory: ${dir}`);
      } catch (error) {
        console.warn(`Failed to scan plugin directory ${dir}:`, error);
      }
    }

    return manifests;
  }

  /**
   * Check if a plugin can be loaded
   */
  async canLoad(source: PluginSource | string): Promise<{
    canLoad: boolean;
    reason?: string;
  }> {
    try {
      const pluginSource = typeof source === 'string' 
        ? this.detectSourceType(source) 
        : source;

      const manifest = await this.fetchManifest(pluginSource);
      const validation = this.validateManifest(manifest);

      if (!validation.valid) {
        return {
          canLoad: false,
          reason: `Invalid manifest: ${validation.errors.map(e => e.message).join(', ')}`,
        };
      }

      if (this.registry.has(manifest.id)) {
        return {
          canLoad: false,
          reason: `Plugin ${manifest.id} is already installed`,
        };
      }

      return { canLoad: true };
    } catch (error) {
      return {
        canLoad: false,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get loading status
   */
  isLoading(pluginId: string): boolean {
    return this.loadingPlugins.has(pluginId);
  }

  /**
   * Get currently loading plugins
   */
  getLoadingPlugins(): string[] {
    return Array.from(this.loadingPlugins);
  }
}

export default PluginLoader;
