/**
 * @vcomm/plugin-system - Hooks System
 * 
 * Provides a powerful hook system for plugin extensibility.
 * Plugins can register handlers for various lifecycle events and hooks.
 */

import {
  HookType,
  HookHandler,
  HookContext,
  HookResult,
  PluginInstance,
  PluginError,
} from '../types';

/**
 * Handler registration entry
 */
interface HandlerEntry {
  /** Unique handler ID */
  id: string;
  /** Plugin ID that registered this handler */
  pluginId: string;
  /** The handler function */
  handler: HookHandler;
  /** Priority (lower = higher priority) */
  priority: number;
  /** Whether this handler can be async */
  async: boolean;
  /** Whether this handler is active */
  active: boolean;
  /** Registration timestamp */
  registeredAt: Date;
}

/**
 * Hook configuration
 */
export interface HookConfig {
  /** Maximum handlers per hook type */
  maxHandlersPerHook?: number;
  /** Hook execution timeout in ms */
  executionTimeout?: number;
  /** Whether to continue on error */
  continueOnError?: boolean;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Default hook configuration
 */
const DEFAULT_HOOK_CONFIG: Required<HookConfig> = {
  maxHandlersPerHook: 100,
  executionTimeout: 5000,
  continueOnError: true,
  debug: false,
};

/**
 * HookManager - Manages plugin hooks and their execution
 * 
 * @example
 * ```typescript
 * const hookManager = new HookManager();
 * 
 * // Register a handler
 * hookManager.registerHandler(
 *   'message.before-send',
 *   'my-plugin',
 *   async (context) => {
 *     // Modify message before sending
 *     context.data.content = context.data.content.toUpperCase();
 *     return { success: true, data: context.data };
 *   },
 *   { priority: 10 }
 * );
 * 
 * // Execute hooks
 * const result = await hookManager.execute('message.before-send', context);
 * ```
 */
export class HookManager {
  private handlers: Map<HookType, HandlerEntry[]> = new Map();
  private config: Required<HookConfig>;
  private handlerIdCounter = 0;
  private executionStats: Map<HookType, { count: number; avgDuration: number; errors: number }> = new Map();

  constructor(config: HookConfig = {}) {
    this.config = { ...DEFAULT_HOOK_CONFIG, ...config };
    this.initializeStats();
  }

  /**
   * Initialize execution statistics for all hook types
   */
  private initializeStats(): void {
    const hookTypes: HookType[] = [
      // Lifecycle hooks
      'plugin.before-install',
      'plugin.after-install',
      'plugin.before-enable',
      'plugin.after-enable',
      'plugin.before-disable',
      'plugin.after-disable',
      'plugin.before-uninstall',
      'plugin.after-uninstall',
      'plugin.before-update',
      'plugin.after-update',
      
      // Message hooks
      'message.before-send',
      'message.after-send',
      'message.before-edit',
      'message.after-edit',
      'message.before-delete',
      'message.after-delete',
      'message.received',
      'message.read',
      
      // Channel hooks
      'channel.before-create',
      'channel.after-create',
      'channel.before-delete',
      'channel.after-delete',
      'channel.before-update',
      'channel.after-update',
      
      // User hooks
      'user.before-join',
      'user.after-join',
      'user.before-leave',
      'user.after-leave',
      'user.before-ban',
      'user.after-ban',
      'user.before-kick',
      'user.after-kick',
      'user.profile-update',
      
      // Server hooks
      'server.before-create',
      'server.after-create',
      'server.before-delete',
      'server.after-delete',
      'server.settings-update',
      
      // Voice hooks
      'voice.before-join',
      'voice.after-join',
      'voice.before-leave',
      'voice.after-leave',
      'voice.mute',
      'voice.deafen',
      'voice.move',
      
      // Custom hooks
      'custom',
    ];

    hookTypes.forEach(type => {
      this.handlers.set(type, []);
      this.executionStats.set(type, { count: 0, avgDuration: 0, errors: 0 });
    });
  }

  /**
   * Generate a unique handler ID
   */
  private generateHandlerId(): string {
    return `handler_${++this.handlerIdCounter}_${Date.now()}`;
  }

  /**
   * Register a handler for a hook type
   */
  registerHandler(
    hookType: HookType,
    pluginId: string,
    handler: HookHandler,
    options: {
      priority?: number;
      async?: boolean;
    } = {}
  ): string {
    const { priority = 50, async = true } = options;
    
    // Check max handlers limit
    const handlers = this.handlers.get(hookType) || [];
    if (handlers.length >= this.config.maxHandlersPerHook) {
      throw new Error(`Maximum handlers (${this.config.maxHandlersPerHook}) reached for hook: ${hookType}`);
    }

    const handlerId = this.generateHandlerId();
    const entry: HandlerEntry = {
      id: handlerId,
      pluginId,
      handler,
      priority,
      async,
      active: true,
      registeredAt: new Date(),
    };

    // Insert in priority order
    const insertIndex = handlers.findIndex(h => h.priority > priority);
    if (insertIndex === -1) {
      handlers.push(entry);
    } else {
      handlers.splice(insertIndex, 0, entry);
    }

    this.handlers.set(hookType, handlers);

    if (this.config.debug) {
      console.log(`[HookManager] Registered handler ${handlerId} for ${hookType} (plugin: ${pluginId}, priority: ${priority})`);
    }

    return handlerId;
  }

  /**
   * Unregister a handler
   */
  unregisterHandler(handlerId: string): boolean {
    for (const [hookType, handlers] of this.handlers) {
      const index = handlers.findIndex(h => h.id === handlerId);
      if (index !== -1) {
        handlers.splice(index, 1);
        
        if (this.config.debug) {
          console.log(`[HookManager] Unregistered handler ${handlerId} from ${hookType}`);
        }
        
        return true;
      }
    }
    return false;
  }

  /**
   * Unregister all handlers for a plugin
   */
  unregisterPluginHandlers(pluginId: string): number {
    let count = 0;
    
    for (const [hookType, handlers] of this.handlers) {
      const initialLength = handlers.length;
      const remaining = handlers.filter(h => h.pluginId !== pluginId);
      this.handlers.set(hookType, remaining);
      count += initialLength - remaining.length;
    }

    if (this.config.debug && count > 0) {
      console.log(`[HookManager] Unregistered ${count} handlers for plugin ${pluginId}`);
    }

    return count;
  }

  /**
   * Enable/disable a handler
   */
  setHandlerActive(handlerId: string, active: boolean): boolean {
    for (const handlers of this.handlers.values()) {
      const handler = handlers.find(h => h.id === handlerId);
      if (handler) {
        handler.active = active;
        return true;
      }
    }
    return false;
  }

  /**
   * Execute all handlers for a hook type
   */
  async execute<T = unknown, R = unknown>(
    hookType: HookType,
    context: HookContext<T>
  ): Promise<HookResult<R>> {
    const handlers = this.handlers.get(hookType) || [];
    const stats = this.executionStats.get(hookType)!;
    
    const startTime = Date.now();
    let lastResult: HookResult<R> = { success: true, data: context.data as unknown as R };
    const errors: Error[] = [];

    for (const entry of handlers) {
      if (!entry.active) continue;

      const handlerStart = Date.now();
      
      try {
        // Create handler context with timeout
        const result = await this.executeWithTimeout(
          entry.handler,
          context,
          this.config.executionTimeout
        );

        if (result.success) {
          // Update context data for next handler
          if (result.data !== undefined) {
            context.data = result.data as T;
            lastResult = result as HookResult<R>;
          }
        } else if (result.error) {
          errors.push(result.error);
          stats.errors++;
          
          if (!this.config.continueOnError) {
            return {
              success: false,
              error: result.error,
              errors,
            };
          }
        }

        if (this.config.debug) {
          const duration = Date.now() - handlerStart;
          console.log(`[HookManager] Handler ${entry.id} executed in ${duration}ms`);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(err);
        stats.errors++;

        if (!this.config.continueOnError) {
          return {
            success: false,
            error: err,
            errors,
          };
        }
      }
    }

    // Update stats
    const duration = Date.now() - startTime;
    stats.count++;
    stats.avgDuration = (stats.avgDuration * (stats.count - 1) + duration) / stats.count;

    if (errors.length > 0) {
      lastResult.errors = errors;
    }

    return lastResult;
  }

  /**
   * Execute handler with timeout
   */
  private async executeWithTimeout<T, R>(
    handler: HookHandler<T, R>,
    context: HookContext<T>,
    timeout: number
  ): Promise<HookResult<R>> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({
          success: false,
          error: new Error(`Handler execution timed out after ${timeout}ms`),
        });
      }, timeout);

      Promise.resolve(handler(context))
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          resolve({
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        });
    });
  }

  /**
   * Execute handlers synchronously (for critical hooks)
   */
  executeSync<T = unknown, R = unknown>(
    hookType: HookType,
    context: HookContext<T>
  ): HookResult<R> {
    const handlers = this.handlers.get(hookType) || [];
    let lastResult: HookResult<R> = { success: true, data: context.data as unknown as R };

    for (const entry of handlers) {
      if (!entry.active || entry.async) continue;

      try {
        const result = entry.handler(context) as HookResult<R>;
        
        if (result.success && result.data !== undefined) {
          context.data = result.data as T;
          lastResult = result;
        }
      } catch (error) {
        if (!this.config.continueOnError) {
          return {
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      }
    }

    return lastResult;
  }

  /**
   * Get all handlers for a hook type
   */
  getHandlers(hookType: HookType): HandlerEntry[] {
    return [...(this.handlers.get(hookType) || [])];
  }

  /**
   * Get handler by ID
   */
  getHandler(handlerId: string): HandlerEntry | undefined {
    for (const handlers of this.handlers.values()) {
      const handler = handlers.find(h => h.id === handlerId);
      if (handler) return handler;
    }
    return undefined;
  }

  /**
   * Get execution statistics
   */
  getStats(hookType?: HookType): Map<HookType, { count: number; avgDuration: number; errors: number }> | { count: number; avgDuration: number; errors: number } | undefined {
    if (hookType) {
      return this.executionStats.get(hookType);
    }
    return new Map(this.executionStats);
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.initializeStats();
  }

  /**
   * Check if a hook type has any handlers
   */
  hasHandlers(hookType: HookType): boolean {
    const handlers = this.handlers.get(hookType);
    return handlers !== undefined && handlers.length > 0;
  }

  /**
   * Get handler count for a hook type
   */
  getHandlerCount(hookType: HookType): number {
    return this.handlers.get(hookType)?.length || 0;
  }

  /**
   * Clear all handlers
   */
  clearAll(): void {
    this.handlers.forEach((_, key) => {
      this.handlers.set(key, []);
    });
  }

  /**
   * Export hook registry (for debugging)
   */
  exportRegistry(): Record<string, { pluginId: string; priority: number; active: boolean }[]> {
    const result: Record<string, { pluginId: string; priority: number; active: boolean }[]> = {};
    
    this.handlers.forEach((handlers, hookType) => {
      result[hookType] = handlers.map(h => ({
        pluginId: h.pluginId,
        priority: h.priority,
        active: h.active,
      }));
    });

    return result;
  }
}

export default HookManager;
