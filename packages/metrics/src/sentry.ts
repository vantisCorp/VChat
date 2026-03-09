/**
 * Sentry integration for error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import { MetricsConfig } from './types';

export class SentryIntegration {
  private initialized: boolean = false;

  /**
   * Initialize Sentry for error tracking
   */
  init(config: MetricsConfig): void {
    if (!config.enableSentry || !config.sentryDsn) {
      console.log('⚠️  Sentry disabled - missing DSN or not enabled');
      return;
    }

    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.environment,
      tracesSampleRate: config.sampleRate || 1.0,
      integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
      beforeSend(event) {
        // Add custom context
        event.tags = {
          ...event.tags,
          service: 'vcomm-api',
          version: process.env['APP_VERSION'] || 'unknown',
        };

        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers['authorization'];
          }
        }

        return event;
      },
    });

    this.initialized = true;
    console.log('✅ Sentry initialized');
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: Record<string, unknown>): void {
    if (!this.initialized) {
      console.error('Error:', error.message);
      return;
    }

    Sentry.captureException(error, {
      extra: context ?? {},
    });
  }

  /**
   * Capture a message
   */
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: Record<string, unknown>
  ): void {
    if (!this.initialized) {
      console.log(`[${level.toUpperCase()}] ${message}`);
      return;
    }

    Sentry.captureMessage(message, {
      level,
      extra: context ?? {},
    });
  }

  /**
   * Start a performance transaction
   */
  startTransaction(name: string, op: string): Sentry.Span | undefined {
    if (!this.initialized) {
      return undefined;
    }

    return Sentry.startInactiveSpan({
      name,
      op,
    });
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.initialized) {
      return;
    }

    Sentry.setUser(user);
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.initialized) {
      return;
    }

    Sentry.setUser(null);
  }

  /**
   * Set tags
   */
  setTags(tags: Record<string, string>): void {
    if (!this.initialized) {
      return;
    }

    Object.entries(tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'info' | 'warning' | 'error';
    data?: Record<string, any>;
  }): void {
    if (!this.initialized) {
      return;
    }

    Sentry.addBreadcrumb({
      type: 'default',
      ...breadcrumb,
    });
  }

  /**
   * Check if Sentry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Close Sentry connection
   */
  async close(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    await Sentry.close();
    this.initialized = false;
  }
}

// Singleton instance
let sentryInstance: SentryIntegration | null = null;

export function getSentry(): SentryIntegration {
  if (!sentryInstance) {
    sentryInstance = new SentryIntegration();
  }
  return sentryInstance;
}
