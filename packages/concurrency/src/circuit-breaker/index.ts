/**
 * @fileoverview Circuit breaker implementation for fault tolerance
 * @module @vcomm/concurrency/circuit-breaker
 */

import {
  CircuitBreakerOptions,
  CircuitBreakerState,
  CircuitState,
  CircuitOpenError,
  ConcurrencyError,
  ConcurrencyErrorCode,
} from '../types';

/**
 * Circuit breaker events
 */
export type CircuitBreakerEvent =
  | 'open'
  | 'close'
  | 'half-open'
  | 'success'
  | 'failure'
  | 'timeout';

/**
 * Event listener type
 */
type EventListener = (data?: any) => void;

/**
 * Circuit breaker statistics
 */
interface CircuitBreakerStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  timeouts: number;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
}

/**
 * Circuit breaker for protecting against cascading failures
 *
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 30000,
 * });
 *
 * const result = await breaker.execute(() => fetchExternalAPI());
 * ```
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: Date | null = null;
  private openedAt: Date | null = null;

  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly resetTimeout: number;
  private readonly timeout: number;
  private readonly volumeThreshold: number;
  private readonly samplingPeriod: number;

  private stats: CircuitBreakerStats = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    timeouts: 0,
    lastFailureTime: null,
    lastSuccessTime: null,
    consecutiveFailures: 0,
    consecutiveSuccesses: 0,
  };

  private events: Map<CircuitBreakerEvent, EventListener[]> = new Map();
  private recentCalls: Array<{ time: number; success: boolean }> = [];

  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.successThreshold = options.successThreshold ?? 3;
    this.resetTimeout = options.resetTimeout ?? 30000;
    this.timeout = options.timeout ?? 10000;
    this.volumeThreshold = options.volumeThreshold ?? 10;
    this.samplingPeriod = options.samplingPeriod ?? 60000;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from open to half-open
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.transitionTo('half-open');
      } else {
        throw new CircuitOpenError(`Circuit is open. Retry after ${this.getRemainingTimeout()}ms`);
      }
    }

    // Execute with timeout
    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Execute function with optional fallback
   */
  async executeWithFallback<T>(
    fn: () => Promise<T>,
    fallback: (error: Error) => Promise<T>
  ): Promise<T> {
    try {
      return await this.execute(fn);
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        return fallback(error);
      }
      throw error;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitBreakerState {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      openedAt: this.openedAt,
      stats: { ...this.stats },
    };
  }

  /**
   * Check if circuit is open
   */
  isOpen(): boolean {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Check if circuit is closed
   */
  isClosed(): boolean {
    return this.state === 'closed';
  }

  /**
   * Check if circuit is half-open
   */
  isHalfOpen(): boolean {
    return this.state === 'half-open';
  }

  /**
   * Manually open the circuit
   */
  open(): void {
    this.transitionTo('open');
  }

  /**
   * Manually close the circuit
   */
  close(): void {
    this.transitionTo('closed');
  }

  /**
   * Reset circuit breaker state
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.openedAt = null;
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      timeouts: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
    };
    this.recentCalls = [];
    this.emit('close');
  }

  /**
   * Subscribe to circuit breaker events
   */
  on(event: CircuitBreakerEvent, listener: EventListener): void {
    const listeners = this.events.get(event) ?? [];
    listeners.push(listener);
    this.events.set(event, listeners);
  }

  /**
   * Unsubscribe from circuit breaker events
   */
  off(event: CircuitBreakerEvent, listener: EventListener): void {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(): CircuitBreakerStats {
    return { ...this.stats };
  }

  /**
   * Get failure rate over sampling period
   */
  getFailureRate(): number {
    this.pruneRecentCalls();

    if (this.recentCalls.length < this.volumeThreshold) {
      return 0;
    }

    const failures = this.recentCalls.filter((c) => !c.success).length;
    return (failures / this.recentCalls.length) * 100;
  }

  /**
   * Execute with timeout protection
   */
  private executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new ConcurrencyError(
            `Operation timed out after ${this.timeout}ms`,
            ConcurrencyErrorCode.ACQUIRE_TIMEOUT
          )
        );
      }, this.timeout);

      fn()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.stats.totalCalls++;
    this.stats.successfulCalls++;
    this.stats.lastSuccessTime = new Date();
    this.stats.consecutiveSuccesses++;
    this.stats.consecutiveFailures = 0;

    this.recordCall(true);
    this.emit('success');

    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.transitionTo('closed');
      }
    } else {
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error): void {
    this.stats.totalCalls++;
    this.stats.failedCalls++;
    this.stats.lastFailureTime = new Date();
    this.stats.consecutiveFailures++;
    this.stats.consecutiveSuccesses = 0;

    this.recordCall(false);
    this.emit('failure', error);

    if (error instanceof ConcurrencyError && error.message.includes('timed out')) {
      this.stats.timeouts++;
      this.emit('timeout');
    }

    if (this.state === 'half-open') {
      this.transitionTo('open');
    } else if (this.state === 'closed') {
      this.failureCount++;
      this.lastFailureTime = new Date();

      if (this.shouldOpen()) {
        this.transitionTo('open');
      }
    }
  }

  /**
   * Check if circuit should open based on failures
   */
  private shouldOpen(): boolean {
    // Check if volume threshold is met
    if (this.recentCalls.length < this.volumeThreshold) {
      return false;
    }

    // Check consecutive failures
    if (this.stats.consecutiveFailures >= this.failureThreshold) {
      return true;
    }

    // Check failure rate
    const failureRate = this.getFailureRate();
    return failureRate >= 50; // Open at 50% failure rate
  }

  /**
   * Check if circuit should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.openedAt) return false;
    return Date.now() - this.openedAt.getTime() >= this.resetTimeout;
  }

  /**
   * Get remaining time until reset can be attempted
   */
  private getRemainingTimeout(): number {
    if (!this.openedAt) return 0;
    return Math.max(0, this.resetTimeout - (Date.now() - this.openedAt.getTime()));
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const _oldState = this.state;
    this.state = newState;

    switch (newState) {
      case 'open':
        this.openedAt = new Date();
        this.successCount = 0;
        this.emit('open');
        break;

      case 'closed':
        this.failureCount = 0;
        this.successCount = 0;
        this.openedAt = null;
        this.emit('close');
        break;

      case 'half-open':
        this.successCount = 0;
        this.emit('half-open');
        break;
    }
  }

  /**
   * Record a call for statistics
   */
  private recordCall(success: boolean): void {
    this.recentCalls.push({
      time: Date.now(),
      success,
    });
    this.pruneRecentCalls();
  }

  /**
   * Remove old calls from recent calls
   */
  private pruneRecentCalls(): void {
    const cutoff = Date.now() - this.samplingPeriod;
    this.recentCalls = this.recentCalls.filter((c) => c.time > cutoff);
  }

  /**
   * Emit an event
   */
  private emit(event: CircuitBreakerEvent, data?: any): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(data));
    }
  }
}

/**
 * Circuit breaker manager for multiple services
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultOptions: CircuitBreakerOptions;

  constructor(defaultOptions: CircuitBreakerOptions = {}) {
    this.defaultOptions = defaultOptions;
  }

  /**
   * Get or create a circuit breaker for a service
   */
  getBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    let breaker = this.breakers.get(name);

    if (!breaker) {
      breaker = new CircuitBreaker({
        ...this.defaultOptions,
        ...options,
      });
      this.breakers.set(name, breaker);
    }

    return breaker;
  }

  /**
   * Get all circuit breakers
   */
  getAllBreakers(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get all breaker states
   */
  getAllStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};

    this.breakers.forEach((breaker, name) => {
      states[name] = breaker.getState();
    });

    return states;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach((breaker) => breaker.reset());
  }

  /**
   * Remove a circuit breaker
   */
  remove(name: string): boolean {
    return this.breakers.delete(name);
  }
}

/**
 * Create a circuit breaker with default options
 */
export function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
  return new CircuitBreaker(options);
}

// Default export
export default CircuitBreaker;
