/**
 * @vcomm/metrics - Comprehensive monitoring and metrics system
 * Inspired by Discord Instruments for real-time monitoring and alerting
 */

export { VCommMetrics, getMetrics } from './metrics';
export { SentryIntegration, getSentry } from './sentry';
export { MonitoringSystem, createMonitoring } from './monitoring';

export type {
  MetricConfig,
  MessageMetrics,
  SystemMetrics,
  PerformanceMetrics,
  MetricsConfig,
  AlertRule,
  MonitoringStats,
} from './types';

// Convenience exports
export * from './metrics';
export * from './sentry';
export * from './monitoring';
export * from './types';
