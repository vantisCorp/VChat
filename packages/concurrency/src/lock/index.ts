/**
 * @fileoverview Distributed lock implementation using Redis
 * @module @vcomm/concurrency/lock
 */

import Redis from 'ioredis';
import {
  DistributedLockOptions,
  LockHandle,
  LockState,
  RedlockOptions,
  AcquireTimeoutError,
} from '../types';

/**
 * Lock acquisition result
 */
interface LockAcquireResult {
  success: boolean;
  token: string;
  ttl: number;
  acquiredAt: Date;
}

/**
 * Distributed lock for coordinating access across multiple processes/servers
 * 
 * Implements the Redlock algorithm for distributed locking with Redis
 * 
 * @example
 * ```typescript
 * const lock = new DistributedLock(redis, {
 *   key: 'my-resource',
 *   ttl: 10000,
 * });
 * 
 * const handle = await lock.acquire();
 * if (handle) {
 *   try {
 *     await doWork();
 *   } finally {
 *     await handle.release();
 *   }
 * }
 * ```
 */
export class DistributedLock {
  private redis: Redis;
  private key: string;
  private ttl: number;
  private retryDelay: number;
  private retryCount: number;
  private driftFactor: number;
  private clockSkew: number;
  
  private token: string | null = null;
  private acquiredAt: Date | null = null;
  private expirationTimer: NodeJS.Timeout | null = null;
  
  constructor(redis: Redis, options: DistributedLockOptions) {
    this.redis = redis;
    this.key = options.key;
    this.ttl = options.ttl ?? 10000;
    this.retryDelay = options.retryDelay ?? 200;
    this.retryCount = options.retryCount ?? 3;
    this.driftFactor = options.driftFactor ?? 0.01;
    this.clockSkew = options.clockSkew ?? 100;
  }
  
  /**
   * Acquire the lock
   * 
   * @returns Lock handle if successful, null otherwise
   */
  async acquire(): Promise<LockHandle | null> {
    const startTime = Date.now();
    this.token = this.generateToken();
    
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      const result = await this.tryAcquire();
      
      if (result.success) {
        // Calculate validity time accounting for drift
        const elapsed = Date.now() - startTime;
        const validity = result.ttl - elapsed - this.ttl * this.driftFactor;
        
        if (validity > 0) {
          this.acquiredAt = new Date();
          this.setupExpiration(validity);
          
          return this.createHandle();
        }
      }
      
      // Wait before retry
      if (attempt < this.retryCount - 1) {
        await this.delay(this.retryDelay + Math.random() * this.retryDelay * 0.1);
      }
    }
    
    this.token = null;
    return null;
  }
  
  /**
   * Try to acquire lock without retries
   */
  async tryAcquire(): Promise<LockAcquireResult> {
    if (!this.token) {
      this.token = this.generateToken();
    }
    
    const _now = Date.now();
    
    try {
      // Use SET NX PX for atomic lock acquisition
      const result = await this.redis.set(
        this.key,
        this.token,
        'PX',
        this.ttl,
        'NX'
      );
      
      if (result === 'OK') {
        return {
          success: true,
          token: this.token,
          ttl: this.ttl,
          acquiredAt: new Date(),
        };
      }
      
      return {
        success: false,
        token: this.token,
        ttl: 0,
        acquiredAt: new Date(),
      };
    } catch {
      return {
        success: false,
        token: this.token,
        ttl: 0,
        acquiredAt: new Date(),
      };
    }
  }
  
  /**
   * Release the lock
   * Uses Lua script for atomic release
   */
  async release(): Promise<boolean> {
    if (!this.token) {
      return false;
    }
    
    // Clear expiration timer
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
    
    // Lua script ensures we only release our own lock
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    try {
      const result = await this.redis.eval(script, 1, this.key, this.token);
      this.token = null;
      this.acquiredAt = null;
      
      return result === 1;
    } catch {
      this.token = null;
      this.acquiredAt = null;
      return false;
    }
  }
  
  /**
   * Extend the lock TTL
   */
  async extend(ttl?: number): Promise<boolean> {
    if (!this.token) {
      return false;
    }
    
    const newTtl = ttl ?? this.ttl;
    
    // Lua script to extend lock only if we own it
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("pexpire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
    
    try {
      const result = await this.redis.eval(script, 1, this.key, this.token, newTtl);
      
      if (result === 1) {
        this.ttl = newTtl;
        this.setupExpiration(newTtl);
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }
  
  /**
   * Check if lock is currently held
   */
  async isHeld(): Promise<boolean> {
    if (!this.token) {
      return false;
    }
    
    try {
      const value = await this.redis.get(this.key);
      return value === this.token;
    } catch {
      return false;
    }
  }
  
  /**
   * Get remaining TTL
   */
  async getRemainingTtl(): Promise<number> {
    try {
      return await this.redis.pttl(this.key);
    } catch {
      return -1;
    }
  }
  
  /**
   * Get lock state
   */
  getState(): LockState {
    return {
      key: this.key,
      token: this.token,
      ttl: this.ttl,
      acquiredAt: this.acquiredAt,
      isHeld: this.token !== null,
    };
  }
  
  /**
   * Execute a function while holding the lock
   */
  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const handle = await this.acquire();
    
    if (!handle) {
      throw new AcquireTimeoutError(this.ttl, this.key);
    }
    
    try {
      return await fn();
    } finally {
      await handle.release();
    }
  }
  
  /**
   * Create lock handle
   */
  private createHandle(): LockHandle {
    const self = this;
    
    return {
      id: self.key,
      token: self.token!,
      acquiredAt: self.acquiredAt!,
      release: () => self.release(),
      extend: (ttl?: number) => self.extend(ttl),
      isHeld: () => self.isHeld(),
      getRemainingTtl: () => self.getRemainingTtl(),
    };
  }
  
  /**
   * Generate unique lock token
   */
  private generateToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
  
  /**
   * Setup expiration timer
   */
  private setupExpiration(ttl: number): void {
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
    }
    
    this.expirationTimer = setTimeout(() => {
      this.token = null;
      this.acquiredAt = null;
    }, ttl);
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Redlock implementation for multiple Redis instances
 */
export class Redlock {
  private servers: Redis[];
  private options: Required<RedlockOptions>;
  
  constructor(servers: Redis[], options: RedlockOptions = {}) {
    this.servers = servers;
    this.options = {
      ttl: options.ttl ?? 10000,
      retryDelay: options.retryDelay ?? 200,
      retryCount: options.retryCount ?? 3,
      driftFactor: options.driftFactor ?? 0.01,
      quorum: options.quorum ?? Math.floor(servers.length / 2) + 1,
      retryJitter: options.retryJitter ?? 100,
      key: options.key ?? '',
      waitTimeout: options.waitTimeout ?? 5000,
      clockSkew: options.clockSkew ?? 100,
      keyPrefix: options.keyPrefix ?? '',
      autoExtend: options.autoExtend ?? false,
      autoExtendInterval: options.autoExtendInterval ?? 5000,
    };
  }
  
  /**
   * Acquire lock on majority of servers
   */
  async acquire(key: string): Promise<LockHandle | null> {
    const token = this.generateToken();
    const startTime = Date.now();
    
    for (let attempt = 0; attempt < this.options.retryCount; attempt++) {
      const successes = await this.acquireFromServers(key, token);
      
      const elapsed = Date.now() - startTime;
      const validity = this.options.ttl - elapsed - this.options.ttl * this.options.driftFactor;
      
      if (successes >= this.options.quorum && validity > 0) {
        return this.createHandle(key, token, validity);
      }
      
      // Release locks on servers where we acquired
      await this.releaseFromServers(key, token);
      
      // Wait before retry
      if (attempt < this.options.retryCount - 1) {
        await this.delay(this.options.retryDelay);
      }
    }
    
    return null;
  }
  
  /**
   * Try to acquire lock from all servers
   */
  private async acquireFromServers(key: string, token: string): Promise<number> {
    const promises = this.servers.map(async (redis) => {
      try {
        const result = await redis.set(key, token, 'PX', this.options.ttl, 'NX');
        return result === 'OK' ? 1 : 0;
      } catch {
        return 0;
      }
    });
    
    const results = await Promise.all(promises);
    return results.reduce((sum, r) => sum + r, 0);
  }
  
  /**
   * Release lock from all servers
   */
  private async releaseFromServers(key: string, token: string): Promise<void> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    await Promise.all(
      this.servers.map(redis => 
        redis.eval(script, 1, key, token).catch(() => {})
      )
    );
  }
  
  /**
   * Create handle for Redlock
   */
  private createHandle(key: string, token: string, validity: number): LockHandle {
    const self = this;
    let released = false;
    
    return {
      id: key,
      token,
      acquiredAt: new Date(),
      release: async () => {
        if (released) return false;
        released = true;
        await self.releaseFromServers(key, token);
        return true;
      },
      extend: async (_ttl?: number) => {
        // Extension logic for Redlock
        return false;
      },
      isHeld: async () => !released,
      getRemainingTtl: async () => validity,
    };
  }
  
  /**
   * Generate unique token
   */
  private generateToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Lock manager for managing multiple locks
 */
export class LockManager {
  private redis: Redis;
  private locks: Map<string, DistributedLock> = new Map();
  private defaultOptions: Omit<DistributedLockOptions, 'key'>;
  
  constructor(redis: Redis, defaultOptions: Omit<DistributedLockOptions, 'key'> = {}) {
    this.redis = redis;
    this.defaultOptions = defaultOptions;
  }
  
  /**
   * Get or create a lock for a key
   */
  getLock(key: string, options?: Partial<DistributedLockOptions>): DistributedLock {
    let lock = this.locks.get(key);
    
    if (!lock) {
      lock = new DistributedLock(this.redis, {
        key,
        ...this.defaultOptions,
        ...options,
      });
      this.locks.set(key, lock);
    }
    
    return lock;
  }
  
  /**
   * Acquire multiple locks atomically
   */
  async acquireMultiple(
    keys: string[],
    options?: Partial<DistributedLockOptions>
  ): Promise<LockHandle[]> {
    // Sort keys to prevent deadlocks
    const sortedKeys = [...keys].sort();
    const handles: LockHandle[] = [];
    
    for (const key of sortedKeys) {
      const lock = this.getLock(key, options);
      const handle = await lock.acquire();
      
      if (!handle) {
        // Release all acquired locks
        await Promise.all(handles.map(h => h.release()));
        throw new AcquireTimeoutError(options?.ttl ?? this.defaultOptions.ttl ?? 10000, key);
      }
      
      handles.push(handle);
    }
    
    return handles;
  }
  
  /**
   * Get all lock states
   */
  getStates(): Record<string, LockState> {
    const states: Record<string, LockState> = {};
    
    this.locks.forEach((lock, key) => {
      states[key] = lock.getState();
    });
    
    return states;
  }
  
  /**
   * Clear all locks
   */
  clear(): void {
    this.locks.clear();
  }
}

// Default exports
export default DistributedLock;