/**
 * @fileoverview Semaphore implementation for concurrency control
 * @module @vcomm/concurrency/semaphore
 */

import {
  SemaphoreOptions,
  SemaphoreState,
  Permit,
  AcquireTimeoutError,
} from '../types';

/**
 * Wait queue entry for fair semaphores
 */
interface WaitQueueEntry {
  resolve: (permit: Permit) => void;
  reject: (error: Error) => void;
  id: string;
  timestamp: Date;
}

/**
 * Semaphore for controlling concurrent access to resources
 * 
 * @example
 * ```typescript
 * const semaphore = new Semaphore({ permits: 3 });
 * 
 * async function processItem(item: any) {
 *   const permit = await semaphore.acquire();
 *   try {
 *     await doWork(item);
 *   } finally {
 *     permit.release();
 *   }
 * }
 * ```
 */
export class Semaphore {
  private available: number;
  private readonly total: number;
  private readonly timeout: number;
  private readonly name: string;
  private readonly fair: boolean;
  
  private waitQueue: WaitQueueEntry[] = [];
  private acquiredPermits: Map<string, Date> = new Map();
  private permitCounter = 0;
  
  constructor(options: SemaphoreOptions) {
    if (options.permits <= 0) {
      throw new Error('Permits must be greater than 0');
    }
    
    this.total = options.permits;
    this.available = options.permits;
    this.timeout = options.timeout ?? 30000;
    this.name = options.name ?? 'semaphore';
    this.fair = options.fair ?? false;
  }
  
  /**
   * Acquire a permit from the semaphore
   * Blocks if no permits are available until one is released
   * 
   * @throws AcquireTimeoutError if timeout is reached
   */
  async acquire(): Promise<Permit> {
    // If permits available, acquire immediately
    if (this.available > 0 && this.waitQueue.length === 0) {
      return this.issuePermit();
    }
    
    // Otherwise, wait in queue
    return this.waitForPermit();
  }
  
  /**
   * Try to acquire a permit without waiting
   * Returns null if no permits are available
   */
  tryAcquire(): Permit | null {
    if (this.available > 0 && this.waitQueue.length === 0) {
      return this.issuePermit();
    }
    return null;
  }
  
  /**
   * Acquire multiple permits at once
   * 
   * @param count Number of permits to acquire
   * @throws Error if count exceeds total permits
   */
  async acquireMultiple(count: number): Promise<Permit[]> {
    if (count > this.total) {
      throw new Error(`Cannot acquire ${count} permits from semaphore with ${this.total} total`);
    }
    
    const permits: Permit[] = [];
    for (let i = 0; i < count; i++) {
      permits.push(await this.acquire());
    }
    return permits;
  }
  
  /**
   * Get current semaphore state
   */
  getState(): SemaphoreState {
    return {
      available: this.available,
      total: this.total,
      waiting: this.waitQueue.length,
      acquired: this.acquiredPermits.size,
    };
  }
  
  /**
   * Check if semaphore has available permits
   */
  isAvailable(): boolean {
    return this.available > 0;
  }
  
  /**
   * Get number of waiting acquires
   */
  getWaitingCount(): number {
    return this.waitQueue.length;
  }
  
  /**
   * Drain all permits from the semaphore
   * Useful for exclusive access scenarios
   */
  async drain(): Promise<Permit[]> {
    const permits: Permit[] = [];
    for (let i = 0; i < this.total; i++) {
      permits.push(await this.acquire());
    }
    return permits;
  }
  
  /**
   * Execute a function with a permit automatically acquired and released
   */
  async withPermit<T>(fn: () => Promise<T>): Promise<T> {
    const permit = await this.acquire();
    try {
      return await fn();
    } finally {
      permit.release();
    }
  }
  
  /**
   * Execute a function with multiple permits
   */
  async withPermits<T>(count: number, fn: () => Promise<T>): Promise<T> {
    const permits = await this.acquireMultiple(count);
    try {
      return await fn();
    } finally {
      permits.forEach(p => p.release());
    }
  }
  
  /**
   * Issue a permit and track it
   */
  private issuePermit(): Permit {
    this.available--;
    const id = `${this.name}-${++this.permitCounter}`;
    const acquiredAt = new Date();
    
    this.acquiredPermits.set(id, acquiredAt);
    
    const permit: Permit = {
      id,
      acquiredAt,
      release: () => this.releasePermit(id),
    };
    
    return permit;
  }
  
  /**
   * Release a permit back to the semaphore
   */
  private releasePermit(id: string): void {
    if (!this.acquiredPermits.has(id)) {
      return; // Already released or invalid
    }
    
    this.acquiredPermits.delete(id);
    this.available++;
    
    // If there are waiters, notify the next one
    if (this.waitQueue.length > 0) {
      const next = this.fair ? this.waitQueue.shift()! : this.waitQueue.shift()!;
      const permit = this.issuePermit();
      next.resolve(permit);
    }
  }
  
  /**
   * Wait for a permit to become available
   */
  private waitForPermit(): Promise<Permit> {
    return new Promise((resolve, reject) => {
      const id = `${this.name}-wait-${++this.permitCounter}`;
      const timestamp = new Date();
      
      const entry: WaitQueueEntry = {
        resolve,
        reject,
        id,
        timestamp,
      };
      
      this.waitQueue.push(entry);
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        const index = this.waitQueue.findIndex(e => e.id === id);
        if (index !== -1) {
          this.waitQueue.splice(index, 1);
          reject(new AcquireTimeoutError(
            `Timeout acquiring permit from ${this.name} after ${this.timeout}ms`
          ));
        }
      }, this.timeout);
      
      // Clear timeout when resolved
      const originalResolve = resolve;
      entry.resolve = (permit: Permit) => {
        clearTimeout(timeoutId);
        originalResolve(permit);
      };
    });
  }
  
  /**
   * Create a semaphore with default options
   */
  static create(permits: number, name?: string): Semaphore {
    return new Semaphore({ permits, name });
  }
}

/**
 * Binary semaphore (mutex-like behavior)
 */
export class BinarySemaphore extends Semaphore {
  constructor(name?: string) {
    super({ permits: 1, name: name ?? 'binary-semaphore', fair: true });
  }
}

/**
 * Counting semaphore with priority support
 */
export class PrioritySemaphore extends Semaphore {
  private priorityQueue: Map<number, WaitQueueEntry[]> = new Map();
  
  constructor(options: SemaphoreOptions) {
    super(options);
  }
  
  /**
   * Acquire with priority (lower number = higher priority)
   */
  async acquireWithPriority(priority: number = 0): Promise<Permit> {
    // For simplicity, delegate to base acquire
    // In production, would implement priority queue
    return this.acquire();
  }
}

// Default export
export default Semaphore;