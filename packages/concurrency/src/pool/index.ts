/**
 * @fileoverview Resource pool implementation for managing reusable resources
 * @module @vcomm/concurrency/pool
 */

import { ResourcePoolOptions, PooledResource, PoolState, AcquireTimeoutError } from '../types';

/**
 * Factory for creating resources
 */
export interface ResourceFactory<T> {
  create(): Promise<T>;
  destroy(resource: T): Promise<void>;
  validate?(resource: T): Promise<boolean>;
}

/**
 * Internal pooled resource wrapper
 */
interface InternalPooledResource<T> {
  resource: T;
  id: string;
  createdAt: Date;
  lastUsedAt: Date;
  isValid: boolean;
  inUse: boolean;
  useCount: number;
}

/**
 * Wait queue entry
 */
interface WaitQueueEntry<T> {
  resolve: (resource: PooledResource<T>) => void;
  reject: (error: Error) => void;
  timestamp: Date;
}

/**
 * Generic resource pool for managing reusable resources
 *
 * @example
 * ```typescript
 * const pool = new ResourcePool({
 *   factory: {
 *     create: () => createConnection(),
 *     destroy: (conn) => conn.close(),
 *   },
 *   min: 2,
 *   max: 10,
 * });
 *
 * const resource = await pool.acquire();
 * try {
 *   await resource.data.query('SELECT * FROM users');
 * } finally {
 *   resource.release();
 * }
 * ```
 */
export class ResourcePool<T> {
  private factory: ResourceFactory<T>;
  private resources: Map<string, InternalPooledResource<T>> = new Map();
  private waitQueue: WaitQueueEntry<T>[] = [];

  private readonly minResources: number;
  private readonly maxResources: number;
  private readonly acquireTimeout: number;
  private readonly idleTimeout: number;
  private readonly validationInterval: number;
  private readonly maxUses: number;

  private resourceIdCounter = 0;
  private isInitialized = false;
  private validationTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: ResourcePoolOptions<T>) {
    // Normalize factory to ResourceFactory interface
    if (typeof options.factory === 'function') {
      // It's a simple create function
      this.factory = {
        create: options.factory,
        destroy: options.destroy ?? (async () => {}),
        validate: options.validate,
      };
    } else if (options.factory) {
      // It's already a ResourceFactory
      this.factory = options.factory;
    } else if (options.create) {
      // Use create property
      this.factory = {
        create: options.create,
        destroy: options.destroy ?? (async () => {}),
        validate: options.validate,
      };
    } else {
      throw new Error('Either factory or create must be provided');
    }
    this.minResources = options.min ?? 0;
    this.maxResources = options.max ?? 10;
    this.acquireTimeout = options.acquireTimeout ?? 30000;
    this.idleTimeout = options.idleTimeout ?? 300000; // 5 minutes
    this.validationInterval = options.validationInterval ?? 60000;
    this.maxUses = options.maxUses ?? 0; // 0 = unlimited
  }

  /**
   * Initialize the pool with minimum resources
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Create minimum resources
    for (let i = 0; i < this.minResources; i++) {
      await this.createResource();
    }

    // Start validation and cleanup timers
    this.startValidation();
    this.startCleanup();

    this.isInitialized = true;
  }

  /**
   * Acquire a resource from the pool
   */
  async acquire(): Promise<PooledResource<T>> {
    // Ensure pool is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Try to get an available resource
    const available = this.findAvailableResource();

    if (available) {
      return this.wrapResource(available);
    }

    // Create new resource if under max
    if (this.getTotalCount() < this.maxResources) {
      const newResource = await this.createResource();
      if (newResource) {
        return this.wrapResource(newResource);
      }
    }

    // Wait for a resource to become available
    return this.waitForResource();
  }

  /**
   * Try to acquire without waiting
   */
  tryAcquire(): PooledResource<T> | null {
    if (!this.isInitialized) {
      return null;
    }

    const available = this.findAvailableResource();

    if (available) {
      return this.wrapResource(available);
    }

    return null;
  }

  /**
   * Release a resource back to the pool
   */
  async release(id: string): Promise<void> {
    const pooled = this.resources.get(id);

    if (!pooled) {
      return;
    }

    pooled.inUse = false;
    pooled.lastUsedAt = new Date();
    pooled.useCount++;

    // Check if resource has exceeded max uses
    if (this.maxUses > 0 && pooled.useCount >= this.maxUses) {
      await this.destroyResource(id);
      return;
    }

    // Notify waiters
    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift()!;
      waiter.resolve(this.wrapResource(pooled));
    }
  }

  /**
   * Destroy a specific resource
   */
  async destroy(id: string): Promise<void> {
    await this.destroyResource(id);

    // Maintain minimum resources
    if (this.isInitialized && this.getTotalCount() < this.minResources) {
      await this.createResource();
    }
  }

  /**
   * Get pool state
   */
  getState(): PoolState {
    const resources = Array.from(this.resources.values());

    return {
      total: resources.length,
      available: resources.filter((r) => !r.inUse).length,
      inUse: resources.filter((r) => r.inUse).length,
      waiting: this.waitQueue.length,
      min: this.minResources,
      max: this.maxResources,
    };
  }

  /**
   * Get total resource count
   */
  getTotalCount(): number {
    return this.resources.size;
  }

  /**
   * Get available resource count
   */
  getAvailableCount(): number {
    return Array.from(this.resources.values()).filter((r) => !r.inUse).length;
  }

  /**
   * Get in-use resource count
   */
  getInUseCount(): number {
    return Array.from(this.resources.values()).filter((r) => r.inUse).length;
  }

  /**
   * Check if pool is empty
   */
  isEmpty(): boolean {
    return this.resources.size === 0;
  }

  /**
   * Check if pool is full
   */
  isFull(): boolean {
    return this.resources.size >= this.maxResources;
  }

  /**
   * Drain the pool - destroy all resources
   */
  async drain(): Promise<void> {
    // Stop timers
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Reject all waiters
    this.waitQueue.forEach((entry) => {
      entry.reject(new Error('Pool is being drained'));
    });
    this.waitQueue = [];

    // Destroy all resources
    const destroyPromises = Array.from(this.resources.keys()).map((id) => this.destroyResource(id));

    await Promise.all(destroyPromises);
    this.isInitialized = false;
  }

  /**
   * Execute a function with a resource
   */
  async withResource<R>(fn: (resource: T) => Promise<R>): Promise<R> {
    const pooled = await this.acquire();

    try {
      return await fn(pooled.data);
    } finally {
      pooled.release();
    }
  }

  /**
   * Execute with multiple resources
   */
  async withResources<R>(count: number, fn: (resources: T[]) => Promise<R>): Promise<R> {
    const pooled = await Promise.all(Array.from({ length: count }, () => this.acquire()));

    try {
      return await fn(pooled.map((p) => p.data));
    } finally {
      pooled.forEach((p) => p.release());
    }
  }

  /**
   * Find an available resource
   */
  private findAvailableResource(): InternalPooledResource<T> | null {
    for (const resource of this.resources.values()) {
      if (!resource.inUse && resource.isValid) {
        return resource;
      }
    }
    return null;
  }

  /**
   * Create a new resource
   */
  private async createResource(): Promise<InternalPooledResource<T> | null> {
    try {
      const resource = await this.factory.create();
      const id = `resource-${++this.resourceIdCounter}`;

      const pooled: InternalPooledResource<T> = {
        resource,
        id,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isValid: true,
        inUse: false,
        useCount: 0,
      };

      this.resources.set(id, pooled);
      return pooled;
    } catch (error) {
      console.error('Failed to create resource:', error);
      return null;
    }
  }

  /**
   * Destroy a resource
   */
  private async destroyResource(id: string): Promise<void> {
    const pooled = this.resources.get(id);

    if (!pooled) {
      return;
    }

    try {
      await this.factory.destroy(pooled.resource);
    } catch (error) {
      console.error('Failed to destroy resource:', error);
    }

    this.resources.delete(id);
  }

  /**
   * Wrap resource for external use
   */
  private wrapResource(pooled: InternalPooledResource<T>): PooledResource<T> {
    pooled.inUse = true;
    pooled.lastUsedAt = new Date();

    const self = this;

    return {
      id: pooled.id,
      data: pooled.resource,
      createdAt: pooled.createdAt,
      lastUsedAt: pooled.lastUsedAt,
      useCount: pooled.useCount,
      release: () => self.release(pooled.id),
      destroy: () => self.destroy(pooled.id),
    };
  }

  /**
   * Wait for a resource to become available
   */
  private waitForResource(): Promise<PooledResource<T>> {
    return new Promise((resolve, reject) => {
      const entry: WaitQueueEntry<T> = {
        resolve,
        reject,
        timestamp: new Date(),
      };

      this.waitQueue.push(entry);

      // Set timeout
      const timeoutId = setTimeout(() => {
        const index = this.waitQueue.indexOf(entry);
        if (index !== -1) {
          this.waitQueue.splice(index, 1);
          reject(new AcquireTimeoutError(this.acquireTimeout, 'resource-pool'));
        }
      }, this.acquireTimeout);

      // Clear timeout when resolved
      const originalResolve = resolve;
      entry.resolve = (resource: PooledResource<T>) => {
        clearTimeout(timeoutId);
        originalResolve(resource);
      };
    });
  }

  /**
   * Start validation timer
   */
  private startValidation(): void {
    if (!this.factory.validate) {
      return;
    }

    this.validationTimer = setInterval(() => {
      this.validateResources();
    }, this.validationInterval);
  }

  /**
   * Validate all resources
   */
  private async validateResources(): Promise<void> {
    if (!this.factory.validate) {
      return;
    }

    const validationPromises = Array.from(this.resources.entries())
      .filter(([, pooled]) => !pooled.inUse)
      .map(async ([id, pooled]) => {
        try {
          const isValid = await this.factory.validate!(pooled.resource);
          pooled.isValid = isValid;

          if (!isValid) {
            await this.destroyResource(id);
          }
        } catch {
          pooled.isValid = false;
          await this.destroyResource(id);
        }
      });

    await Promise.all(validationPromises);

    // Maintain minimum resources
    while (this.getTotalCount() < this.minResources) {
      await this.createResource();
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleResources();
    }, this.idleTimeout / 2);
  }

  /**
   * Clean up idle resources
   */
  private async cleanupIdleResources(): Promise<void> {
    const now = Date.now();
    const toDestroy: string[] = [];

    for (const [id, pooled] of this.resources.entries()) {
      if (
        !pooled.inUse &&
        this.getTotalCount() - toDestroy.length > this.minResources &&
        now - pooled.lastUsedAt.getTime() > this.idleTimeout
      ) {
        toDestroy.push(id);
      }
    }

    for (const id of toDestroy) {
      await this.destroyResource(id);
    }
  }
}

/**
 * Connection pool specialized for database connections
 */
export class ConnectionPool<T> extends ResourcePool<T> {
  constructor(factory: ResourceFactory<T>, options: Partial<ResourcePoolOptions<T>> = {}) {
    super({
      factory,
      min: options.min ?? 2,
      max: options.max ?? 20,
      acquireTimeout: options.acquireTimeout ?? 10000,
      idleTimeout: options.idleTimeout ?? 60000,
      validationInterval: options.validationInterval ?? 30000,
      ...options,
    });
  }
}

/**
 * Create a resource pool
 */
export function createPool<T>(
  factory: ResourceFactory<T>,
  options: Partial<ResourcePoolOptions<T>> = {}
): ResourcePool<T> {
  return new ResourcePool({ factory, ...options });
}

// Default export
export default ResourcePool;
