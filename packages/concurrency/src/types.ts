/**
 * @fileoverview Type definitions for concurrency control package
 * @module @vcomm/concurrency/types
 */

// ============================================================================
// SEMAPHORE TYPES
// ============================================================================

/**
 * Semaphore options
 */
export interface SemaphoreOptions {
  /** Maximum number of concurrent permits */
  permits: number;
  
  /** Timeout in milliseconds for acquiring a permit */
  timeout?: number;
  
  /** Name for debugging/logging */
  name?: string;
  
  /** Enable fair ordering (FIFO) */
  fair?: boolean;
}

/**
 * Semaphore state
 */
export interface SemaphoreState {
  /** Available permits */
  available: number;
  
  /** Total permits */
  total: number;
  
  /** Number of waiting acquires */
  waiting: number;
  
  /** Number of currently acquired permits */
  acquired: number;
}

/**
 * Permit handle returned when acquiring a semaphore
 */
export interface Permit {
  /** Release the permit back to the semaphore */
  release: () => void;
  
  /** Permit ID for tracking */
  id: string;
  
  /** Timestamp when acquired */
  acquiredAt: Date;
}

// ============================================================================
// RATE LIMITER TYPES
// ============================================================================

/**
 * Rate limiting algorithm
 */
export type RateLimitAlgorithm = 
  | 'token-bucket'      // Classic token bucket
  | 'leaky-bucket'      // Leaky bucket
  | 'sliding-window'    // Sliding window log
  | 'fixed-window';     // Fixed window counter

/**
 * Rate limiter options
 */
export interface RateLimiterOptions {
  /** Maximum number of requests in the window */
  maxRequests: number;
  
  /** Window size in milliseconds */
  windowMs: number;
  
  /** Rate limiting algorithm */
  algorithm?: RateLimitAlgorithm;
  
  /** Key prefix for distributed rate limiting */
  keyPrefix?: string;
  
  /** Enable burst handling */
  burst?: number;
  
  /** Tokens to add per interval (for token bucket) */
  refillRate?: number;
  
  /** Refill interval in milliseconds */
  refillInterval?: number;
}

/**
 * Rate limiter result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  
  /** Number of remaining requests in the window */
  remaining: number;
  
  /** Time until the limit resets in milliseconds */
  resetTime?: number;
  
  /** Time when the limit resets (timestamp or Date) */
  resetAt?: number | Date;
  
  /** Total limit */
  limit?: number;
  
  /** Retry after time in milliseconds (if not allowed) */
  retryAfter?: number;
}

/**
 * Rate limiter state
 */
export interface RateLimiterState {
  /** Current count in the window */
  current: number;
  
  /** Maximum allowed */
  max: number;
  
  /** Window start time */
  windowStart: Date;
  
  /** Window end time */
  windowEnd: Date;
}

// ============================================================================
// CIRCUIT BREAKER TYPES
// ============================================================================

/**
 * Circuit breaker state
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening */
  failureThreshold?: number;
  
  /** Number of successes in half-open to close */
  successThreshold?: number;
  
  /** Time in ms before attempting to close from open state */
  timeout?: number;
  
  /** Alias for timeout - time before attempting reset */
  resetTimeout?: number;
  
  /** Volume threshold for calculating failure rate */
  volumeThreshold?: number;
  
  /** Sampling period for statistics */
  samplingPeriod?: number;
  
  /** Time window for counting failures */
  rollingCountWindow?: number;
  
  /** Minimum requests before calculating failure rate */
  minimumNumberOfCalls?: number;
  
  /** Failure rate threshold (0-1) to open circuit */
  failureRateThreshold?: number;
  
  /** Custom failure detector */
  shouldTrip?: (failures: number, successes: number) => boolean;
  
  /** Enable half-open state */
  enableHalfOpen?: boolean;
  
  /** Name for logging */
  name?: string;
  
  /** Callback when state changes */
  onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  /** Total calls made */
  totalCalls: number;
  
  /** Successful calls */
  successfulCalls: number;
  
  /** Failed calls */
  failedCalls: number;
  
  /** Timeout count */
  timeouts: number;
  
  /** Last failure time */
  lastFailureTime: Date | null;
  
  /** Last success time */
  lastSuccessTime: Date | null;
  
  /** Consecutive failures */
  consecutiveFailures: number;
  
  /** Consecutive successes */
  consecutiveSuccesses: number;
}

/**
 * Circuit breaker state info
 */
export interface CircuitBreakerState {
  /** Current state */
  state: CircuitState;
  
  /** Number of failures in the current window */
  failures?: number;
  
  /** Number of successes in the current window */
  successes?: number;
  
  /** Failure count alias */
  failureCount?: number;
  
  /** Success count alias */
  successCount?: number;
  
  /** When the circuit was opened */
  openedAt?: Date | null;
  
  /** Last failure time */
  lastFailureTime?: Date | null;
  
  /** Last state change time */
  lastStateChange?: Date | null;
  
  /** Total requests made */
  totalRequests?: number;
  
  /** Total failures */
  totalFailures?: number;
  
  /** Total successes */
  totalSuccesses?: number;
  
  /** Statistics */
  stats?: CircuitBreakerStats;
}

/**
 * Circuit breaker result wrapper
 */
export interface CircuitBreakerResult<T> {
  /** Whether the call was successful */
  success: boolean;
  
  /** The result value (if successful) */
  value?: T;
  
  /** Error (if failed) */
  error?: Error;
  
  /** Time taken in milliseconds */
  duration: number;
  
  /** Whether the result came from fallback */
  fromFallback: boolean;
}

// ============================================================================
// DISTRIBUTED LOCK TYPES
// ============================================================================

/**
 * Distributed lock options
 */
export interface DistributedLockOptions {
  /** Lock key */
  key?: string;
  
  /** Lock timeout in milliseconds */
  ttl?: number;
  
  /** Maximum time to wait for lock acquisition */
  waitTimeout?: number;
  
  /** Time between retry attempts in milliseconds */
  retryDelay?: number;
  
  /** Number of retry attempts */
  retryCount?: number;
  
  /** Drift factor for clock skew calculation */
  driftFactor?: number;
  
  /** Clock skew in milliseconds */
  clockSkew?: number;
  
  /** Key prefix for the lock */
  keyPrefix?: string;
  
  /** Enable automatic lock extension */
  autoExtend?: boolean;
  
  /** Interval for auto-extension in milliseconds */
  autoExtendInterval?: number;
}

/**
 * Lock handle returned when acquiring a lock
 */
export interface LockHandle {
  /** Lock identifier */
  id?: string;
  
  /** Lock key */
  key?: string;
  
  /** Lock value/token */
  value?: string;
  
  /** Token for lock identification */
  token?: string;
  
  /** Time when lock expires */
  expiresAt?: Date;
  
  /** Time when lock was acquired */
  acquiredAt?: Date;
  
  /** Whether the lock is held (alias) */
  isHeld?: boolean | (() => boolean) | (() => Promise<boolean>);
  
  /** Release the lock */
  release?: () => Promise<boolean>;
  
  /** Extend the lock TTL */
  extend?: (ttl?: number) => Promise<boolean>;
  
  /** Check if lock is still held */
  isValid?: () => Promise<boolean>;
  
  /** Get remaining TTL in milliseconds */
  getRemainingTtl?: number | (() => number) | (() => Promise<number>);
}

/**
 * Lock state
 */
export interface LockState {
  /** Whether the lock is currently held */
  locked?: boolean;
  
  /** Whether the lock is held (alias) */
  isHeld?: boolean;
  
  /** Lock key */
  key?: string;
  
  /** Lock holder ID */
  holder?: string;
  
  /** Token for lock identification */
  token?: string;
  
  /** Expiration time */
  expiresAt?: Date;
  
  /** TTL in milliseconds */
  ttl?: number;
  
  /** Time when lock was acquired */
  acquiredAt?: Date;
}

/**
 * Redlock options (distributed lock with quorum)
 */
export interface RedlockOptions extends DistributedLockOptions {
  /** Lock timeout in milliseconds */
  ttl?: number;
  
  /** Number of replicas required for quorum */
  quorum?: number;
  
  /** Number of retry attempts */
  retryCount?: number;
  
  /** Maximum jitter for retries */
  retryJitter?: number;
  
  /** Key for the lock */
  key?: string;
  
  /** Wait timeout for lock acquisition */
  waitTimeout?: number;
  
  /** Clock skew tolerance */
  clockSkew?: number;
}

// ============================================================================
// RESOURCE POOL TYPES
// ============================================================================

/**
 * Resource factory interface
 */
export interface ResourceFactory<T> {
  create: () => Promise<T>;
  destroy: (resource: T) => Promise<void>;
  validate?: (resource: T) => Promise<boolean>;
}

/**
 * Resource pool options
 */
export interface ResourcePoolOptions<T> {
  /** Factory function to create new resources */
  create?: () => Promise<T>;
  
  /** Factory function alias */
  factory?: ResourceFactory<T> | (() => Promise<T>);
  
  /** Function to destroy resources */
  destroy?: (resource: T) => Promise<void>;
  
  /** Function to validate resources before use */
  validate?: (resource: T) => Promise<boolean>;
  
  /** Maximum number of resources */
  max?: number;
  
  /** Minimum number of resources to maintain */
  min?: number;
  
  /** Maximum time a resource can be idle before eviction */
  idleTimeout?: number;
  
  /** Interval for eviction checks */
  evictionInterval?: number;
  
  /** Validation interval alias */
  validationInterval?: number;
  
  /** Maximum uses per resource */
  maxUses?: number;
  
  /** Maximum time to wait for acquiring a resource */
  acquireTimeout?: number;
  
  /** Function to reset resource state */
  reset?: (resource: T) => Promise<void>;
}

/**
 * Resource wrapper in the pool
 */
export interface PooledResource<T> {
  /** The actual resource */
  resource?: T;
  
  /** Resource data alias */
  data?: T;
  
  /** Release function */
  release?: () => void | Promise<void>;
  
  /** Destroy function */
  destroy?: () => Promise<void>;
  
  /** Resource ID */
  id: string;
  
  /** When the resource was created */
  createdAt: Date;
  
  /** When the resource was last used */
  lastUsedAt: Date;
  
  /** Whether the resource is currently in use */
  inUse?: boolean;
  
  /** Number of times the resource has been used */
  useCount: number;
}

/**
 * Pool state
 */
export interface PoolState {
  /** Total resources in the pool */
  total?: number;
  
  /** Maximum resources allowed */
  max?: number;
  
  /** Number of available resources */
  available?: number;
  
  /** Number of resources in use */
  inUse?: number;
  
  /** Number of pending acquire requests */
  pending?: number;
  
  /** Number of waiting acquire requests */
  waiting?: number;
  
  /** Minimum resources to maintain */
  min?: number;
  
  /** Number of resources being created */
  creating?: number;
  
  /** Number of resources being destroyed */
  destroying?: number;
}

/**
 * Acquired resource handle
 */
export interface AcquiredResource<T> {
  /** The resource */
  resource: T;
  
  /** Release the resource back to the pool */
  release: () => void;
  
  /** Resource ID */
  id: string;
}

// ============================================================================
// BACKPRESSURE TYPES
// ============================================================================

/**
 * Backpressure strategy
 */
export type BackpressureStrategy = 
  | 'drop'           // Drop new items
  | 'block'          // Block producers
  | 'buffer'         // Buffer items
  | 'sample';        // Sample/decimate items

/**
 * Backpressure options
 */
export interface BackpressureOptions {
  /** Strategy to use */
  strategy: BackpressureStrategy;
  
  /** Maximum buffer size */
  bufferSize?: number;
  
  /** High water mark (percentage) */
  highWaterMark?: number;
  
  /** Low water mark (percentage) */
  lowWaterMark?: number;
  
  /** Callback when high water mark is reached */
  onHighWaterMark?: () => void;
  
  /** Callback when low water mark is reached */
  onLowWaterMark?: () => void;
}

/**
 * Backpressure state
 */
export interface BackpressureState {
  /** Current buffer size */
  currentSize: number;
  
  /** Maximum buffer size */
  maxSize: number;
  
  /** Whether at high water mark */
  atHighWaterMark: boolean;
  
  /** Percentage full */
  percentage: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Concurrency error codes
 */
export enum ConcurrencyErrorCode {
  ACQUIRE_TIMEOUT = 'ACQUIRE_TIMEOUT',
  LOCK_NOT_HELD = 'LOCK_NOT_HELD',
  LOCK_EXPIRED = 'LOCK_EXPIRED',
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  RATE_LIMITED = 'RATE_LIMITED',
  POOL_EXHAUSTED = 'POOL_EXHAUSTED',
  RESOURCE_INVALID = 'RESOURCE_INVALID',
  ALREADY_RELEASED = 'ALREADY_RELEASED',
  QUORUM_NOT_MET = 'QUORUM_NOT_MET',
}

/**
 * Base concurrency error class
 */
export class ConcurrencyError extends Error {
  constructor(
    message: string,
    public code: ConcurrencyErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ConcurrencyError';
  }
}

/**
 * Semaphore acquire timeout error
 */
export class AcquireTimeoutError extends ConcurrencyError {
  constructor(timeout: number, resource: string) {
    super(
      `Failed to acquire ${resource} within ${timeout}ms`,
      ConcurrencyErrorCode.ACQUIRE_TIMEOUT,
      { timeout, resource }
    );
    this.name = 'AcquireTimeoutError';
  }
}

/**
 * Circuit breaker open error
 */
export class CircuitOpenError extends ConcurrencyError {
  constructor(circuitName: string, retryAfter?: number) {
    super(
      `Circuit breaker '${circuitName}' is open`,
      ConcurrencyErrorCode.CIRCUIT_OPEN,
      { circuitName, retryAfter }
    );
    this.name = 'CircuitOpenError';
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitExceededError extends ConcurrencyError {
  constructor(
    public readonly limit: number,
    public readonly resetTime: number,
    public readonly retryAfter: number
  ) {
    super(
      `Rate limit exceeded. Retry after ${retryAfter}ms`,
      ConcurrencyErrorCode.RATE_LIMITED,
      { limit, resetTime, retryAfter }
    );
    this.name = 'RateLimitExceededError';
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Async function type
 */
export type AsyncFunction<T = unknown, Args extends unknown[] = unknown[]> = 
  (...args: Args) => Promise<T>;

/**
 * Throttle options
 */
export interface ThrottleOptions {
  /** Maximum calls per interval */
  limit: number;
  
  /** Interval in milliseconds */
  interval: number;
  
  /** Whether to drop calls when limit is reached */
  drop?: boolean;
}

/**
 * Debounce options
 */
export interface DebounceOptions {
  /** Wait time in milliseconds */
  wait: number;
  
  /** Execute on leading edge */
  leading?: boolean;
  
  /** Execute on trailing edge */
  trailing?: boolean;
  
  /** Maximum wait time */
  maxWait?: number;
}

/**
 * Queue options
 */
export interface QueueOptions<T> {
  /** Maximum queue size */
  maxSize?: number;
  
  /** Concurrency limit */
  concurrency?: number;
  
  /** Process function */
  process: (item: T) => Promise<void>;
  
  /** Called when item fails */
  onFailed?: (item: T, error: Error) => void;
  
  /** Called when queue is drained */
  onDrained?: () => void;
}

/**
 * Queue state
 */
export interface QueueState {
  /** Number of pending items */
  pending: number;
  
  /** Number of items being processed */
  processing: number;
  
  /** Whether the queue is paused */
  paused: boolean;
  
  /** Whether the queue is idle */
  idle: boolean;
}