/**
 * @fileoverview Concurrency control utilities for V-COMM
 * @module @vcomm/concurrency
 * 
 * Provides production-ready concurrency control patterns including:
 * - Semaphore: Control concurrent access to resources
 * - Rate Limiter: Limit request rates with various algorithms
 * - Circuit Breaker: Protect against cascading failures
 * - Distributed Lock: Coordinate access across processes/servers
 * - Resource Pool: Manage reusable resources efficiently
 */

// ============================================================================
// TYPES
// ============================================================================

export * from './types';

// ============================================================================
// SEMAPHORE
// ============================================================================

export {
  Semaphore,
  BinarySemaphore,
  PrioritySemaphore,
} from './semaphore';

// ============================================================================
// RATE LIMITER
// ============================================================================

export {
  TokenBucketRateLimiter,
  SlidingWindowRateLimiter,
  FixedWindowRateLimiter,
  LeakyBucketRateLimiter,
  createRateLimiter,
  rateLimit,
  type IRateLimiter,
} from './rate-limiter';

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export {
  CircuitBreaker,
  CircuitBreakerManager,
  createCircuitBreaker,
  type CircuitBreakerEvent,
} from './circuit-breaker';

// ============================================================================
// DISTRIBUTED LOCK
// ============================================================================

export {
  DistributedLock,
  Redlock,
  LockManager,
} from './lock';

// ============================================================================
// RESOURCE POOL
// ============================================================================

export {
  ResourcePool,
  ConnectionPool,
  createPool,
  type ResourceFactory,
} from './pool';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Create a semaphore with the given number of permits
 */
import { Semaphore } from './semaphore';
export const createSemaphore = (permits: number, name?: string): Semaphore => {
  return new Semaphore({ permits, name });
};

/**
 * Create a binary semaphore (mutex)
 */
import { BinarySemaphore } from './semaphore';
export const createMutex = (name?: string): BinarySemaphore => {
  return new BinarySemaphore(name);
};

/**
 * Create a distributed lock manager
 */
import Redis from 'ioredis';
import { LockManager } from './lock';
export const createLockManager = (
  redis: Redis,
  defaultTtl: number = 10000
): LockManager => {
  return new LockManager(redis, { ttl: defaultTtl });
};

/**
 * Create a circuit breaker with common defaults
 */
import { CircuitBreaker as CB } from './circuit-breaker';
export const createBreaker = (options: {
  failureThreshold?: number;
  resetTimeout?: number;
} = {}): CB => {
  return new CB({
    failureThreshold: options.failureThreshold ?? 5,
    resetTimeout: options.resetTimeout ?? 30000,
  });
};

// Default export
import { Semaphore as DefaultSemaphore } from './semaphore';
export default DefaultSemaphore;