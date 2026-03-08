/**
 * @fileoverview Rate limiter implementations for controlling request rates
 * @module @vcomm/concurrency/rate-limiter
 */

import {
  RateLimiterOptions,
  RateLimitResult,
  RateLimitAlgorithm,
  RateLimitExceededError,
} from '../types';

/**
 * Base rate limiter interface
 */
export interface IRateLimiter {
  acquire(key?: string): Promise<RateLimitResult>;
  tryAcquire(key?: string): RateLimitResult | null;
  getRemaining(key?: string): number;
  reset(key?: string): void;
}

/**
 * Token Bucket Rate Limiter
 * 
 * Allows bursts up to bucket capacity, then refills at a steady rate
 */
export class TokenBucketRateLimiter implements IRateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  
  private readonly maxRequests: number;
  private readonly refillRate: number;
  private readonly refillInterval: number;
  private readonly keyPrefix: string;
  
  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.refillRate = options.refillRate ?? 1;
    this.refillInterval = options.refillInterval ?? options.windowMs;
    this.keyPrefix = options.keyPrefix ?? 'rate-limit';
  }
  
  async acquire(key: string = 'default'): Promise<RateLimitResult> {
    const now = Date.now();
    const bucketKey = `${this.keyPrefix}:${key}`;
    
    let bucket = this.buckets.get(bucketKey);
    
    if (!bucket) {
      bucket = { tokens: this.maxRequests, lastRefill: now };
      this.buckets.set(bucketKey, bucket);
    }
    
    // Refill tokens based on time elapsed
    this.refillTokens(bucket, now);
    
    if (bucket.tokens >= 1) {
      bucket.tokens--;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetAt: new Date(now + this.refillInterval),
        retryAfter: 0,
      };
    }
    
    // Calculate when next token will be available
    const tokensNeeded = 1 - bucket.tokens;
    const waitTime = Math.ceil((tokensNeeded / this.refillRate) * this.refillInterval);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(now + waitTime),
      retryAfter: waitTime,
    };
  }
  
  tryAcquire(key: string = 'default'): RateLimitResult | null {
    const now = Date.now();
    const bucketKey = `${this.keyPrefix}:${key}`;
    
    let bucket = this.buckets.get(bucketKey);
    
    if (!bucket) {
      bucket = { tokens: this.maxRequests, lastRefill: now };
      this.buckets.set(bucketKey, bucket);
    }
    
    this.refillTokens(bucket, now);
    
    if (bucket.tokens >= 1) {
      bucket.tokens--;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetAt: new Date(now + this.refillInterval),
        retryAfter: 0,
      };
    }
    
    return null;
  }
  
  getRemaining(key: string = 'default'): number {
    const bucketKey = `${this.keyPrefix}:${key}`;
    const bucket = this.buckets.get(bucketKey);
    
    if (!bucket) return this.maxRequests;
    
    this.refillTokens(bucket, Date.now());
    return Math.floor(bucket.tokens);
  }
  
  reset(key: string = 'default'): void {
    const bucketKey = `${this.keyPrefix}:${key}`;
    this.buckets.delete(bucketKey);
  }
  
  private refillTokens(bucket: { tokens: number; lastRefill: number }, now: number): void {
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsed / this.refillInterval) * this.refillRate;
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.maxRequests, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }
}

/**
 * Sliding Window Rate Limiter
 * 
 * More accurate than fixed window, prevents boundary issues
 */
export class SlidingWindowRateLimiter implements IRateLimiter {
  private windows: Map<string, number[]> = new Map();
  
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly keyPrefix: string;
  
  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.keyPrefix = options.keyPrefix ?? 'rate-limit';
  }
  
  async acquire(key: string = 'default'): Promise<RateLimitResult> {
    const now = Date.now();
    const windowKey = `${this.keyPrefix}:${key}`;
    
    let timestamps = this.windows.get(windowKey) ?? [];
    
    // Remove expired timestamps
    const cutoff = now - this.windowMs;
    timestamps = timestamps.filter(t => t > cutoff);
    
    if (timestamps.length < this.maxRequests) {
      timestamps.push(now);
      this.windows.set(windowKey, timestamps);
      
      return {
        allowed: true,
        remaining: this.maxRequests - timestamps.length,
        resetAt: new Date(cutoff + this.windowMs),
        retryAfter: 0,
      };
    }
    
    // Calculate when oldest request will expire
    const oldestInWindow = timestamps[0];
    const retryAfter = oldestInWindow - cutoff + 1;
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(oldestInWindow + this.windowMs),
      retryAfter,
    };
  }
  
  tryAcquire(key: string = 'default'): RateLimitResult | null {
    const now = Date.now();
    const windowKey = `${this.keyPrefix}:${key}`;
    
    let timestamps = this.windows.get(windowKey) ?? [];
    
    const cutoff = now - this.windowMs;
    timestamps = timestamps.filter(t => t > cutoff);
    
    if (timestamps.length < this.maxRequests) {
      timestamps.push(now);
      this.windows.set(windowKey, timestamps);
      
      return {
        allowed: true,
        remaining: this.maxRequests - timestamps.length,
        resetAt: new Date(cutoff + this.windowMs),
        retryAfter: 0,
      };
    }
    
    return null;
  }
  
  getRemaining(key: string = 'default'): number {
    const now = Date.now();
    const windowKey = `${this.keyPrefix}:${key}`;
    
    let timestamps = this.windows.get(windowKey) ?? [];
    
    const cutoff = now - this.windowMs;
    timestamps = timestamps.filter(t => t > cutoff);
    
    return Math.max(0, this.maxRequests - timestamps.length);
  }
  
  reset(key: string = 'default'): void {
    const windowKey = `${this.keyPrefix}:${key}`;
    this.windows.delete(windowKey);
  }
}

/**
 * Fixed Window Rate Limiter
 * 
 * Simple and efficient, but can have boundary issues
 */
export class FixedWindowRateLimiter implements IRateLimiter {
  private windows: Map<string, { count: number; windowStart: number }> = new Map();
  
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly keyPrefix: string;
  
  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.keyPrefix = options.keyPrefix ?? 'rate-limit';
  }
  
  async acquire(key: string = 'default'): Promise<RateLimitResult> {
    const now = Date.now();
    const windowKey = `${this.keyPrefix}:${key}`;
    
    let window = this.windows.get(windowKey);
    
    // Check if we need a new window
    if (!window || now - window.windowStart >= this.windowMs) {
      window = { count: 0, windowStart: now };
      this.windows.set(windowKey, window);
    }
    
    if (window.count < this.maxRequests) {
      window.count++;
      
      return {
        allowed: true,
        remaining: this.maxRequests - window.count,
        resetAt: new Date(window.windowStart + this.windowMs),
        retryAfter: 0,
      };
    }
    
    const retryAfter = window.windowStart + this.windowMs - now;
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(window.windowStart + this.windowMs),
      retryAfter,
    };
  }
  
  tryAcquire(key: string = 'default'): RateLimitResult | null {
    const now = Date.now();
    const windowKey = `${this.keyPrefix}:${key}`;
    
    let window = this.windows.get(windowKey);
    
    if (!window || now - window.windowStart >= this.windowMs) {
      window = { count: 0, windowStart: now };
      this.windows.set(windowKey, window);
    }
    
    if (window.count < this.maxRequests) {
      window.count++;
      
      return {
        allowed: true,
        remaining: this.maxRequests - window.count,
        resetAt: new Date(window.windowStart + this.windowMs),
        retryAfter: 0,
      };
    }
    
    return null;
  }
  
  getRemaining(key: string = 'default'): number {
    const now = Date.now();
    const windowKey = `${this.keyPrefix}:${key}`;
    
    const window = this.windows.get(windowKey);
    
    if (!window || now - window.windowStart >= this.windowMs) {
      return this.maxRequests;
    }
    
    return Math.max(0, this.maxRequests - window.count);
  }
  
  reset(key: string = 'default'): void {
    const windowKey = `${this.keyPrefix}:${key}`;
    this.windows.delete(windowKey);
  }
}

/**
 * Leaky Bucket Rate Limiter
 * 
 * Smooths out bursts by processing requests at a constant rate
 */
export class LeakyBucketRateLimiter implements IRateLimiter {
  private buckets: Map<string, { queue: number[]; lastLeak: number }> = new Map();
  
  private readonly capacity: number;
  private readonly leakRate: number; // Requests per second
  private readonly keyPrefix: string;
  
  constructor(options: RateLimiterOptions) {
    this.capacity = options.maxRequests;
    this.leakRate = options.refillRate ?? 10; // Default 10 req/s
    this.keyPrefix = options.keyPrefix ?? 'rate-limit';
  }
  
  async acquire(key: string = 'default'): Promise<RateLimitResult> {
    const now = Date.now();
    const bucketKey = `${this.keyPrefix}:${key}`;
    
    let bucket = this.buckets.get(bucketKey);
    
    if (!bucket) {
      bucket = { queue: [], lastLeak: now };
      this.buckets.set(bucketKey, bucket);
    }
    
    // Leak requests from the bucket
    this.leak(bucket, now);
    
    if (bucket.queue.length < this.capacity) {
      bucket.queue.push(now);
      
      return {
        allowed: true,
        remaining: this.capacity - bucket.queue.length,
        resetAt: new Date(now + (bucket.queue.length * 1000) / this.leakRate),
        retryAfter: 0,
      };
    }
    
    const retryAfter = Math.ceil((1 / this.leakRate) * 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(now + retryAfter),
      retryAfter,
    };
  }
  
  tryAcquire(key: string = 'default'): RateLimitResult | null {
    const now = Date.now();
    const bucketKey = `${this.keyPrefix}:${key}`;
    
    let bucket = this.buckets.get(bucketKey);
    
    if (!bucket) {
      bucket = { queue: [], lastLeak: now };
      this.buckets.set(bucketKey, bucket);
    }
    
    this.leak(bucket, now);
    
    if (bucket.queue.length < this.capacity) {
      bucket.queue.push(now);
      
      return {
        allowed: true,
        remaining: this.capacity - bucket.queue.length,
        resetAt: new Date(now + (bucket.queue.length * 1000) / this.leakRate),
        retryAfter: 0,
      };
    }
    
    return null;
  }
  
  getRemaining(key: string = 'default'): number {
    const now = Date.now();
    const bucketKey = `${this.keyPrefix}:${key}`;
    
    const bucket = this.buckets.get(bucketKey);
    
    if (!bucket) return this.capacity;
    
    this.leak(bucket, now);
    return Math.max(0, this.capacity - bucket.queue.length);
  }
  
  reset(key: string = 'default'): void {
    const bucketKey = `${this.keyPrefix}:${key}`;
    this.buckets.delete(bucketKey);
  }
  
  private leak(bucket: { queue: number[]; lastLeak: number }, now: number): void {
    const elapsed = (now - bucket.lastLeak) / 1000; // Convert to seconds
    const leaks = Math.floor(elapsed * this.leakRate);
    
    if (leaks > 0 && bucket.queue.length > 0) {
      bucket.queue = bucket.queue.slice(Math.min(leaks, bucket.queue.length));
      bucket.lastLeak = now;
    }
  }
}

/**
 * Create a rate limiter based on algorithm type
 */
export function createRateLimiter(
  options: RateLimiterOptions & { algorithm?: RateLimitAlgorithm }
): IRateLimiter {
  const algorithm = options.algorithm ?? 'sliding-window';
  
  switch (algorithm) {
    case 'token-bucket':
      return new TokenBucketRateLimiter(options);
    case 'leaky-bucket':
      return new LeakyBucketRateLimiter(options);
    case 'fixed-window':
      return new FixedWindowRateLimiter(options);
    case 'sliding-window':
    default:
      return new SlidingWindowRateLimiter(options);
  }
}

/**
 * Rate limiter that wraps a function
 */
export function rateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RateLimiterOptions
): T {
  const limiter = createRateLimiter(options);
  
  return (async (...args: Parameters<T>) => {
    const result = await limiter.acquire();
    
    if (!result.allowed) {
      throw new RateLimitExceededError(
        result.limit ?? options.maxRequests,
        result.resetTime ?? 0,
        result.retryAfter ?? 0
      );
    }
    
    return fn(...args);
  }) as T;
}

// Default export
export default createRateLimiter;