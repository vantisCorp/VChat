/**
 * @vcomm/plugin-system
 * 
 * A comprehensive plugin system for V-COMM applications.
 * Provides plugin lifecycle management, hooks, sandboxing, and marketplace integration.
 * 
 * @example
 * ```typescript
 * import { PluginSystem } from '@vcomm/plugin-system';
 * 
 * const pluginSystem = new PluginSystem({
 *   pluginDirs: ['./plugins'],
 *   enforcePermissions: true,
 * });
 * 
 * // Initialize
 * await pluginSystem.initialize();
 * 
 * // Install a plugin
 * const plugin = await pluginSystem.install('./plugins/my-plugin');
 * 
 * // Enable it
 * await pluginSystem.enable('com.example.my-plugin');
 * 
 * // Register hooks
 * pluginSystem.registerHook('message.before-send', async (context) => {
 *   // Process message
 *   return { success: true, data: context.data };
 * });
 * ```
 */

// Type exports
export {
  // Plugin Identity
  PluginStatus,
  PluginVisibility,
  PluginCategory,
  PluginAuthor,
  PluginVersion,
  PluginDependency,
  PluginManifest,
  PluginInstance,
  PluginError,
  PluginErrorCode,
  
  // Plugin Lifecycle
  PluginLifecycle,
  PluginLifecycleEvent,
  PluginLifecycleCallback,
  
  // Permissions
  PluginPermission,
  PermissionCheckContext,
  PermissionGrant,
  
  // Hooks
  HookType,
  HookHandler,
  HookContext,
  HookResult,
  HookRegistrationOptions,
  
  // Configuration
  PluginConfigSchema,
  PluginConfigField,
  PluginConfigValue,
  PluginUserSettings,
  
  // Marketplace
  MarketplacePlugin,
  MarketplaceVersion,
  MarketplaceReview,
  MarketplaceSearchQuery,
  MarketplaceSearchResult,
  
  // System
  PluginSystemConfig,
  PluginLoadResult,
  PluginValidationResult,
} from './types';

// Module exports
export { HookManager, HookConfig } from './hooks';
export { PluginRegistry, RegistryConfig, PluginConflict } from './registry';
export { PluginLoader, LoaderConfig, PluginSource } from './loader';
export { PluginSandbox, SandboxConfig, ResourceMetrics } from './sandbox';

import { HookManager } from './hooks';
import { PluginRegistry } from './registry';
import { PluginLoader } from './loader';
import { PluginSandbox } from './sandbox';
import {
  PluginManifest,
  PluginInstance,
  PluginStatus,
  HookType,
  HookHandler,
  HookContext,
  HookResult,
  PluginSystemConfig,
  PluginPermission,
  PermissionCheckContext,
  PluginError,
  PluginErrorCode,
} from './types';

/**
 * PluginSystem - Main entry point for the plugin system
 */
export class PluginSystem {
  private config: PluginSystemConfig;
  private registry: PluginRegistry;
  private loader: PluginLoader;
  private sandbox: PluginSandbox;
  private hookManager: HookManager;
  private initialized = false;

  constructor(config: PluginSystemConfig = {}) {
    this.config = {
      pluginDirs: config.pluginDirs || ['./plugins'],
      maxPlugins: config.maxPlugins || 100,
      enforcePermissions: config.enforcePermissions ?? true,
      enableSandbox: config.enableSandbox ?? true,
      enableMarketplace: config.enableMarketplace ?? false,
      executionTimeout: config.executionTimeout || 30000,
      debug: config.debug ?? false,
    };

    // Initialize components
    this.registry = new PluginRegistry({
      maxPlugins: this.config.maxPlugins,
      enableConflictDetection: true,
      autoResolveDependencies: true,
    });

    this.hookManager = new HookManager({
      executionTimeout: this.config.executionTimeout,
      continueOnError: true,
      debug: this.config.debug,
    });

    this.sandbox = new PluginSandbox({
      enforcePermissions: this.config.enforcePermissions,
      executionTimeout: this.config.executionTimeout,
      enableMonitoring: true,
    });

    this.loader = new PluginLoader(this.registry, {
      pluginDirs: this.config.pluginDirs,
      allowRemoteLoad: false,
      validateBeforeLoad: true,
      enableSandbox: this.config.enableSandbox,
    });
  }

  /**
   * Initialize the plugin system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Scan for plugins
    const discovered = await this.loader.scanForPlugins();
    
    if (this.config.debug) {
      console.log(`[PluginSystem] Discovered ${discovered.length} plugins`);
    }

    this.initialized = true;
  }

  /**
   * Install a plugin
   */
  async install(source: string): Promise<PluginInstance> {
    this.ensureInitialized();
    
    const instance = await this.loader.load(source);
    
    // Initialize sandbox for the plugin
    this.sandbox.initialize(instance);

    // Fire installation hooks
    await this.hookManager.execute('plugin.after-install', {
      type: 'plugin:install' as const,
      pluginId: instance.id,
      data: instance,
      timestamp: new Date(),
      mutable: false,
      stopped: false,
    });

    return instance;
  }

  /**
   * Uninstall a plugin
   */
  async uninstall(pluginId: string): Promise<boolean> {
    this.ensureInitialized();

    const instance = this.registry.get(pluginId);
    if (!instance) {
      throw new PluginError(
        PluginErrorCode.NOT_FOUND,
        `Plugin ${pluginId} not found`
      );
    }

    // Disable first if enabled
    if (instance.status === 'enabled') {
      await this.disable(pluginId);
    }

    // Fire uninstallation hooks
    await this.hookManager.execute('plugin.before-uninstall', {
      type: 'plugin:uninstall' as const,
      pluginId,
      data: instance,
      timestamp: new Date(),
      mutable: false,
      stopped: false,
    });

    // Cleanup sandbox
    this.sandbox.destroy(pluginId);

    // Unregister hooks
    this.hookManager.unregisterPluginHandlers(pluginId);

    // Unload
    const result = await this.loader.unload(pluginId);

    if (result) {
      await this.hookManager.execute('plugin.after-uninstall', {
        type: 'plugin:uninstall' as const,
        pluginId,
        data: { id: pluginId },
        timestamp: new Date(),
        mutable: false,
        stopped: false,
      });
    }

    return result;
  }

  /**
   * Enable a plugin
   */
  async enable(pluginId: string): Promise<boolean> {
    this.ensureInitialized();

    const instance = this.registry.get(pluginId);
    if (!instance) {
      throw new PluginError(
        PluginErrorCode.NOT_FOUND,
        `Plugin ${pluginId} not found`
      );
    }

    // Check dependencies
    const manifest = this.registry.getManifest(pluginId);
    if (manifest?.dependencies) {
      for (const dep of manifest.dependencies) {
        const depPlugin = this.registry.get(dep.pluginId);
        if (!depPlugin || depPlugin.status !== 'enabled') {
          if (!dep.optional) {
            throw new PluginError(
              PluginErrorCode.DEPENDENCY_MISSING,
              `Required dependency ${dep.pluginId} is not enabled`
            );
          }
        }
      }
    }

    // Fire before-enable hooks
    await this.hookManager.execute('plugin.before-enable', {
      type: 'plugin:enable' as const,
      pluginId,
      data: instance,
      timestamp: new Date(),
      mutable: false,
      stopped: false,
    });

    // Update status
    this.registry.setStatus(pluginId, 'enabled');

    // Fire after-enable hooks
    await this.hookManager.execute('plugin.after-enable', {
      type: 'plugin:enable' as const,
      pluginId,
      data: instance,
      timestamp: new Date(),
      mutable: false,
      stopped: false,
    });

    return true;
  }

  /**
   * Disable a plugin
   */
  async disable(pluginId: string): Promise<boolean> {
    this.ensureInitialized();

    const instance = this.registry.get(pluginId);
    if (!instance) {
      throw new PluginError(
        PluginErrorCode.NOT_FOUND,
        `Plugin ${pluginId} not found`
      );
    }

    // Check dependents
    const dependents = this.registry.getDependents(pluginId);
    const enabledDependents = dependents.filter(id => {
      const dep = this.registry.get(id);
      return dep?.status === 'enabled';
    });

    if (enabledDependents.length > 0) {
      throw new PluginError(
        PluginErrorCode.DEPENDENCY_CONFLICT,
        `Cannot disable: plugins [${enabledDependents.join(', ')}] depend on this plugin`
      );
    }

    // Fire before-disable hooks
    await this.hookManager.execute('plugin.before-disable', {
      type: 'plugin:disable' as const,
      pluginId,
      data: instance,
      timestamp: new Date(),
      mutable: false,
      stopped: false,
    });

    // Update status
    this.registry.setStatus(pluginId, 'disabled');

    // Fire after-disable hooks
    await this.hookManager.execute('plugin.after-disable', {
      type: 'plugin:disable' as const,
      pluginId,
      data: instance,
      timestamp: new Date(),
      mutable: false,
      stopped: false,
    });

    return true;
  }

  /**
   * Reload a plugin
   */
  async reload(pluginId: string): Promise<PluginInstance> {
    this.ensureInitialized();

    const wasEnabled = this.registry.get(pluginId)?.status === 'enabled';
    
    if (wasEnabled) {
      await this.disable(pluginId);
    }

    const instance = await this.loader.reload(pluginId);

    if (wasEnabled) {
      await this.enable(pluginId);
    }

    return instance;
  }

  /**
   * Get a plugin instance
   */
  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.registry.get(pluginId);
  }

  /**
   * Get all plugins
   */
  getPlugins(): PluginInstance[] {
    return this.registry.getAll();
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): PluginInstance[] {
    return this.registry.getEnabled();
  }

  /**
   * Check if a plugin is installed
   */
  isInstalled(pluginId: string): boolean {
    return this.registry.has(pluginId);
  }

  /**
   * Check if a plugin is enabled
   */
  isEnabled(pluginId: string): boolean {
    const plugin = this.registry.get(pluginId);
    return plugin?.status === 'enabled';
  }

  /**
   * Register a hook handler
   */
  registerHook<T = unknown, R = unknown>(
    hookType: HookType,
    pluginId: string,
    handler: HookHandler<T, R>,
    options?: { priority?: number }
  ): string {
    return this.hookManager.registerHandler(hookType, pluginId, handler, options);
  }

  /**
   * Unregister a hook handler
   */
  unregisterHook(handlerId: string): boolean {
    return this.hookManager.unregisterHandler(handlerId);
  }

  /**
   * Execute a hook
   */
  async executeHook<T = unknown, R = unknown>(
    hookType: HookType,
    context: HookContext<T>
  ): Promise<HookResult<R>> {
    return this.hookManager.execute<T, R>(hookType, context);
  }

  /**
   * Check if a plugin has a permission
   */
  checkPermission(
    pluginId: string,
    permission: string,
    context?: PermissionCheckContext
  ): boolean {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      return false;
    }
    return this.sandbox.checkPermission(plugin, permission, context);
  }

  /**
   * Execute code in plugin sandbox
   */
  async executeInSandbox<T>(
    pluginId: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      throw new PluginError(
        PluginErrorCode.NOT_FOUND,
        `Plugin ${pluginId} not found`
      );
    }
    return this.sandbox.execute(plugin, fn);
  }

  /**
   * Get plugin resource metrics
   */
  getPluginMetrics(pluginId: string) {
    return this.sandbox.getMetrics(pluginId);
  }

  /**
   * Get all plugin metrics
   */
  getAllMetrics() {
    return this.sandbox.getAllMetrics();
  }

  /**
   * Detect plugin conflicts
   */
  detectConflicts() {
    return this.registry.detectConflicts();
  }

  /**
   * Search plugins
   */
  searchPlugins(query: {
    name?: string;
    author?: string;
    tag?: string;
    status?: PluginStatus;
  }): PluginInstance[] {
    return this.registry.search(query);
  }

  /**
   * Update plugin settings
   */
  updatePluginSettings(
    pluginId: string,
    settings: Record<string, unknown>
  ): boolean {
    return this.registry.updateSettings(pluginId, settings);
  }

  /**
   * Export plugin system state
   */
  exportState(): {
    plugins: PluginInstance[];
    hooks: Record<string, { pluginId: string; priority: number; active: boolean }[]>;
    metrics: ReturnType<PluginSandbox['getAllMetrics']>;
  } {
    return {
      plugins: this.registry.getAll(),
      hooks: this.hookManager.exportRegistry(),
      metrics: this.sandbox.getAllMetrics(),
    };
  }

  /**
   * Shutdown the plugin system
   */
  async shutdown(): Promise<void> {
    // Disable all enabled plugins
    const enabled = this.registry.getEnabled();
    for (const plugin of enabled) {
      try {
        await this.disable(plugin.id);
      } catch (error) {
        console.warn(`Failed to disable plugin ${plugin.id}:`, error);
      }
    }

    // Clear all data
    this.registry.clear();
    this.hookManager.clearAll();
    this.initialized = false;
  }

  /**
   * Ensure system is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new PluginError(
        PluginErrorCode.NOT_INITIALIZED,
        'Plugin system not initialized. Call initialize() first.'
      );
    }
  }
}

// Default export
export default PluginSystem;
