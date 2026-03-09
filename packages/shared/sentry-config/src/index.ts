/**
 * @vcomm/sentry-config
 *
 * Centralized Sentry configuration for V-COMM applications.
 * Provides unified error tracking, performance monitoring, and release management.
 */

import * as Sentry from '@sentry/node';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  release?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  enableProfiling?: boolean;
  enableSessionReplay?: boolean;
  debug?: boolean;
}

export interface UserContext {
  id: string;
  username?: string;
  email?: string;
  roles?: string[];
}

export interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: UserContext;
  fingerprint?: string[];
}

// ============================================================================
// Environment Detection
// ============================================================================

const getEnvironment = (): 'development' | 'staging' | 'production' => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') return 'production';
  if (env === 'staging' || env === 'test') return 'staging';
  return 'development';
};

const getRelease = (): string => {
  return process.env.SENTRY_RELEASE || process.env.npm_package_version || '0.0.1-dev';
};

// ============================================================================
// Default Configuration
// ============================================================================

const defaultConfig: SentryConfig = {
  dsn: process.env.SENTRY_DSN || '',
  environment: getEnvironment(),
  release: getRelease(),
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  enableProfiling: true,
  enableSessionReplay: false,
  debug: process.env.NODE_ENV === 'development',
};

// ============================================================================
// Sentry Initialization
// ============================================================================

let isInitialized = false;

/**
 * Initialize Sentry with V-COMM configuration
 */
export function initSentry(config: Partial<SentryConfig> = {}): void {
  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.dsn) {
    console.warn('⚠️ Sentry DSN not provided. Telemetry disabled.');
    return;
  }

  if (isInitialized) {
    console.warn('⚠️ Sentry already initialized. Skipping.');
    return;
  }

  Sentry.init({
    dsn: finalConfig.dsn,
    environment: finalConfig.environment,
    release: finalConfig.release,

    // Performance
    tracesSampleRate: finalConfig.tracesSampleRate,

    // Debug
    debug: finalConfig.debug,

    // Error handling
    attachStacktrace: true,
    autoSessionTracking: true,

    // Before send hook for filtering
    beforeSend(event, _hint) {
      // Filter out sensitive information
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }

      // Don't send events in development unless explicitly enabled
      if (finalConfig.environment === 'development' && !finalConfig.debug) {
        return null;
      }

      return event;
    },

    // Before send transaction for performance filtering
    beforeSendTransaction(event) {
      // Filter health checks
      if (event.transaction?.includes('/health') || event.transaction?.includes('/metrics')) {
        return null;
      }
      return event;
    },
  });

  isInitialized = true;
  console.log(`✅ Sentry initialized for ${finalConfig.environment} environment`);
}

// ============================================================================
// Error Reporting
// ============================================================================

/**
 * Capture an exception with optional context
 */
export function captureException(error: Error | unknown, context?: ErrorContext): string {
  if (context?.user) {
    Sentry.setUser({
      id: context.user.id,
      username: context.user.username,
      email: context.user.email,
    });
  }

  if (context?.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  }

  if (context?.extra) {
    Object.entries(context.extra).forEach(([key, value]) => {
      Sentry.setExtra(key, value);
    });
  }

  return Sentry.captureException(error, {
    fingerprint: context?.fingerprint,
  });
}

/**
 * Capture a message with severity level
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: ErrorContext
): string {
  if (context?.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  }

  return Sentry.captureMessage(message, level);
}

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string,
  data?: Record<string, unknown>
): ReturnType<typeof Sentry.startTransaction> {
  return Sentry.startTransaction({
    name,
    op,
    data,
  });
}

/**
 * Create a child span for nested operations
 */
export function startSpan(
  transaction: ReturnType<typeof Sentry.startTransaction>,
  op: string,
  description: string
): ReturnType<ReturnType<typeof Sentry.startTransaction>['startChild']> {
  return transaction.startChild({
    op,
    description,
  });
}

// ============================================================================
// User Context Management
// ============================================================================

/**
 * Set the current user context
 */
export function setUser(user: UserContext | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    if (user.roles) {
      Sentry.setExtra('user.roles', user.roles);
    }
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Set tags for categorizing events
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Set extra context data
 */
export function setExtra(key: string, value: unknown): void {
  Sentry.setExtra(key, value);
}

// ============================================================================
// Breadcrumbs
// ============================================================================

/**
 * Add a breadcrumb for event context
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    category: category || 'custom',
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

// ============================================================================
// Express Middleware
// ============================================================================

/**
 * Express middleware for Sentry request handling
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sentryRequestHandler(): any {
  return Sentry.Handlers.requestHandler({
    ip: true,
    user: true,
    transaction: 'methodPath',
  });
}

/**
 * Express middleware for Sentry error handling
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sentryErrorHandler(): any {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Only capture 4xx and 5xx errors
      const status = ((error as unknown as Record<string, unknown>).status as number) || 500;
      return status >= 400;
    },
  });
}

// ============================================================================
// Shutdown
// ============================================================================

/**
 * Close Sentry client gracefully
 */
export async function closeSentry(timeout = 2000): Promise<void> {
  await Sentry.close(timeout);
  isInitialized = false;
}

// ============================================================================
// Export Everything
// ============================================================================

export { Sentry };
export default {
  init: initSentry,
  captureException,
  captureMessage,
  startTransaction,
  startSpan,
  setUser,
  setTag,
  setExtra,
  addBreadcrumb,
  sentryRequestHandler,
  sentryErrorHandler,
  close: closeSentry,
};
