# @vcomm/concurrency

Production-ready concurrency control utilities for V-COMM. Provides battle-tested patterns for managing concurrent access, rate limiting, fault tolerance, and resource pooling.

## Installation

```bash
npm install @vcomm/concurrency
```

## Features

- **Semaphore**: Control concurrent access to resources with permit-based synchronization
- **Rate Limiter**: Limit request rates with multiple algorithms (Token Bucket, Sliding Window, Fixed Window, Leaky Bucket)
- **Circuit Breaker**: Protect against cascading failures with automatic state management
- **Distributed Lock**: Coordinate access across processes/servers using Redis
- **Resource Pool**: Manage reusable resources efficiently with automatic validation and cleanup

## Quick Start

### Semaphore

```typescript
import { Semaphore } from '@vcomm/concurrency';

// Create a semaphore with 3 permits
const semaphore = new Semaphore({ permits: 3 });

async function processItem(item: any) {
  const permit = await semaphore.acquire();
  try {
    await doExpensiveWork(item);
  } finally {
    permit.release();
  }
}

// Or use withPermit for automatic release
async function processItemSafe(item: any) {
  return semaphore.withPermit(async () => {
    return await doExpensiveWork(item);
  });
}
```

### Rate Limiter

```typescript
import { createRateLimiter, SlidingWindowRateLimiter } from '@vcomm/concurrency';

// Create a rate limiter
const limiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  algorithm: 'sliding-window',
});

// Check if request is allowed
const result = await limiter.acquire('user-123');
if (result.allowed) {
  // Process request
} else {
  // Return 429 with retry-after header
  res.setHeader('Retry-After', result.retryAfter);
  res.status(429).json({ error: 'Rate limit exceeded' });
}

// Wrap a function with rate limiting
import { rateLimit } from '@vcomm/concurrency';

const limitedApi = rateLimit(
  async (data) => callExternalApi(data),
  { maxRequests: 10, windowMs: 1000 }
);
```

### Circuit Breaker

```typescript
import { CircuitBreaker } from '@vcomm/concurrency';

const breaker = new CircuitBreaker({
  failureThreshold: 5,   // Open after 5 failures
  successThreshold: 3,   // Close after 3 successes in half-open
  resetTimeout: 30000,   // Try reset after 30 seconds
  timeout: 10000,        // Request timeout
});

// Execute with protection
try {
  const result = await breaker.execute(() => fetchExternalAPI());
} catch (error) {
  if (error instanceof CircuitOpenError) {
    // Circuit is open, use fallback
    return fallbackResponse();
  }
  throw error;
}

// With fallback
const result = await breaker.executeWithFallback(
  () => fetchExternalAPI(),
  (error) => fallbackResponse()
);

// Monitor state changes
breaker.on('open', () => console.log('Circuit opened'));
breaker.on('close', () => console.log('Circuit closed'));
breaker.on('half-open', () => console.log('Circuit half-open'));
```

### Distributed Lock

```typescript
import Redis from 'ioredis';
import { DistributedLock, LockManager } from '@vcomm/concurrency';

const redis = new Redis('redis://localhost:6379');

// Single lock
const lock = new DistributedLock(redis, {
  key: 'resource:123',
  ttl: 10000, // 10 seconds
});

const handle = await lock.acquire();
if (handle) {
  try {
    await doWork();
  } finally {
    await handle.release();
  }
}

// With automatic release
await lock.withLock(async () => {
  await doWork();
});

// Lock manager for multiple resources
const manager = new LockManager(redis, { ttl: 10000 });
const handle1 = await manager.getLock('resource:1').acquire();
const handle2 = await manager.getLock('resource:2').acquire();

// Acquire multiple locks atomically (sorted to prevent deadlocks)
const handles = await manager.acquireMultiple(['resource:1', 'resource:2']);
```

### Resource Pool

```typescript
import { ResourcePool, createPool } from '@vcomm/concurrency';

// Define resource factory
const factory = {
  create: async () => {
    return await createDatabaseConnection();
  },
  destroy: async (conn) => {
    await conn.close();
  },
  validate: async (conn) => {
    try {
      await conn.ping();
      return true;
    } catch {
      return false;
    }
  },
};

// Create pool
const pool = createPool(factory, {
  min: 2,          // Minimum connections
  max: 20,         // Maximum connections
  idleTimeout: 60000,    // 1 minute idle timeout
  acquireTimeout: 10000, // 10 second acquire timeout
});

await pool.initialize();

// Acquire resource
const resource = await pool.acquire();
try {
  await resource.data.query('SELECT * FROM users');
} finally {
  resource.release();
}

// With automatic release
await pool.withResource(async (conn) => {
  return await conn.query('SELECT * FROM users');
});

// Drain pool on shutdown
await pool.drain();
```

## API Reference

### Semaphore

```typescript
interface SemaphoreOptions {
  permits: number;      // Maximum concurrent permits
  timeout?: number;     // Acquire timeout (default: 30000)
  name?: string;        // Name for debugging
  fair?: boolean;       // Enable FIFO ordering
}

class Semaphore {
  acquire(): Promise<Permit>;
  tryAcquire(): Permit | null;
  acquireMultiple(count: number): Promise<Permit[]>;
  withPermit<T>(fn: () => Promise<T>): Promise<T>;
  getState(): SemaphoreState;
  isAvailable(): boolean;
  drain(): Promise<Permit[]>;
}
```

### Rate Limiter

```typescript
interface RateLimiterOptions {
  maxRequests: number;           // Max requests in window
  windowMs: number;              // Window size in ms
  algorithm?: RateLimitAlgorithm;
  keyPrefix?: string;
  burst?: number;                // Burst capacity (token bucket)
  refillRate?: number;           // Tokens per interval
  refillInterval?: number;       // Refill interval in ms
}

type RateLimitAlgorithm = 
  | 'token-bucket'
  | 'leaky-bucket'
  | 'sliding-window'
  | 'fixed-window';

interface IRateLimiter {
  acquire(key?: string): Promise<RateLimitResult>;
  tryAcquire(key?: string): RateLimitResult | null;
  getRemaining(key?: string): number;
  reset(key?: string): void;
}
```

### Circuit Breaker

```typescript
interface CircuitBreakerOptions {
  failureThreshold?: number;   // Failures before opening (default: 5)
  successThreshold?: number;   // Successes to close from half-open (default: 3)
  resetTimeout?: number;       // Time before attempting reset (default: 30000)
  timeout?: number;            // Request timeout (default: 10000)
  volumeThreshold?: number;    // Min calls before evaluating failure rate
  samplingPeriod?: number;     // Period for failure rate calculation
}

class CircuitBreaker {
  execute<T>(fn: () => Promise<T>): Promise<T>;
  executeWithFallback<T>(fn: () => Promise<T>, fallback: (error: Error) => Promise<T>): Promise<T>;
  getState(): CircuitBreakerState;
  isOpen(): boolean;
  isClosed(): boolean;
  isHalfOpen(): boolean;
  open(): void;
  close(): void;
  reset(): void;
  on(event: CircuitBreakerEvent, listener: (data?: any) => void): void;
  off(event: CircuitBreakerEvent, listener: (data?: any) => void): void;
}
```

### Distributed Lock

```typescript
interface DistributedLockOptions {
  key: string;              // Lock key
  ttl?: number;             // Lock TTL in ms (default: 10000)
  retryDelay?: number;      // Delay between retries
  retryCount?: number;      // Number of retries
  driftFactor?: number;     // Clock drift factor
  clockSkew?: number;       // Expected clock skew
}

interface LockHandle {
  id: string;
  token: string;
  acquiredAt: Date;
  release(): Promise<boolean>;
  extend(ttl?: number): Promise<boolean>;
  isHeld(): Promise<boolean>;
  getRemainingTtl(): Promise<number>;
}

class DistributedLock {
  acquire(): Promise<LockHandle | null>;
  tryAcquire(): Promise<LockAcquireResult>;
  release(): Promise<boolean>;
  extend(ttl?: number): Promise<boolean>;
  isHeld(): Promise<boolean>;
  withLock<T>(fn: () => Promise<T>): Promise<T>;
}
```

### Resource Pool

```typescript
interface ResourcePoolOptions<T> {
  factory: ResourceFactory<T>;
  min?: number;                 // Min resources (default: 0)
  max?: number;                 // Max resources (default: 10)
  acquireTimeout?: number;      // Acquire timeout (default: 30000)
  idleTimeout?: number;         // Idle timeout (default: 300000)
  validationInterval?: number;  // Validation interval (default: 60000)
  maxUses?: number;             // Max uses before refresh (0 = unlimited)
}

interface ResourceFactory<T> {
  create(): Promise<T>;
  destroy(resource: T): Promise<void>;
  validate?(resource: T): Promise<boolean>;
}

class ResourcePool<T> {
  initialize(): Promise<void>;
  acquire(): Promise<PooledResource<T>>;
  tryAcquire(): PooledResource<T> | null;
  release(id: string): Promise<void>;
  destroy(id: string): Promise<void>;
  getState(): PoolState;
  withResource<R>(fn: (resource: T) => Promise<R>): Promise<R>;
  drain(): Promise<void>;
}
```

## Error Classes

```typescript
class ConcurrencyError extends Error {}
class AcquireTimeoutError extends ConcurrencyError {}
class CircuitOpenError extends ConcurrencyError {}
class RateLimitExceededError extends ConcurrencyError {}
```

## Best Practices

### Semaphore
- Always release permits in a `finally` block
- Use `withPermit()` for automatic resource management
- Consider using `BinarySemaphore` for simple mutual exclusion

### Rate Limiter
- Use `sliding-window` for accurate rate limiting
- Set appropriate `Retry-After` headers for rejected requests
- Use different keys for different rate limit contexts

### Circuit Breaker
- Set appropriate timeouts based on your service's expected latency
- Use fallback functions for degraded functionality
- Monitor circuit state changes for alerting

### Distributed Lock
- Always use a reasonable TTL to prevent deadlocks
- Use `withLock()` for automatic release
- Consider Redlock for high-availability scenarios

### Resource Pool
- Implement validation to detect broken resources
- Set appropriate min/max based on expected load
- Always drain pools gracefully on shutdown

## License

MIT