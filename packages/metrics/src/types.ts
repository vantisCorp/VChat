/**
 * Types for metrics and monitoring system
 */

import { Counter, Histogram, Gauge } from 'prom-client';

export interface MetricConfig {
  name: string;
  help: string;
  labelNames?: string[];
  buckets?: number[];
}

export interface MessageMetrics {
  messagesSent: Counter<string>;
  messagesReceived: Counter<string>;
  queueSize: Gauge<string>;
  processingTime: Histogram<string>;
  errors: Counter<string>;
}

export interface SystemMetrics {
  activeConnections: Gauge<string>;
  memoryUsage: Gauge<string>;
  cpuUsage: Gauge<string>;
  diskUsage: Gauge<string>;
  networkIO: Gauge<string>;
}

export interface PerformanceMetrics {
  requestDuration: Histogram<string>;
  responseSize: Histogram<string>;
  errorRate: Counter<string>;
  throughput: Counter<string>;
}

export interface MetricsConfig {
  enablePrometheus: boolean;
  enableSentry: boolean;
  sentryDsn?: string;
  environment: string;
  sampleRate?: number;
}

export interface AlertRule {
  name: string;
  condition: string;
  duration: string;
  severity: 'info' | 'warning' | 'critical';
  annotations: {
    summary: string;
    description: string;
  };
}

export interface MonitoringStats {
  uptime: number;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
}
