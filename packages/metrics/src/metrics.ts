/**
 * Core metrics implementation using Prometheus client
 */

import { Counter, Histogram, Gauge, register } from 'prom-client';
import { MessageMetrics, SystemMetrics, PerformanceMetrics, MetricConfig } from './types';

export class VCommMetrics {
  private messageMetrics: MessageMetrics;
  private systemMetrics: SystemMetrics;
  private performanceMetrics: PerformanceMetrics;

  constructor() {
    this.messageMetrics = this.initMessageMetrics();
    this.systemMetrics = this.initSystemMetrics();
    this.performanceMetrics = this.initPerformanceMetrics();
  }

  /**
   * Initialize message-related metrics
   */
  private initMessageMetrics(): MessageMetrics {
    return {
      messagesSent: new Counter({
        name: 'vcomm_messages_sent_total',
        help: 'Total number of messages sent',
        labelNames: ['channel', 'status', 'type'],
      }),

      messagesReceived: new Counter({
        name: 'vcomm_messages_received_total',
        help: 'Total number of messages received',
        labelNames: ['channel', 'type'],
      }),

      queueSize: new Gauge({
        name: 'vcomm_queue_size',
        help: 'Current queue size',
        labelNames: ['queue_type', 'node'],
      }),

      processingTime: new Histogram({
        name: 'vcomm_processing_time_seconds',
        help: 'Message processing time in seconds',
        labelNames: ['operation', 'channel'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      }),

      errors: new Counter({
        name: 'vcomm_errors_total',
        help: 'Total number of errors',
        labelNames: ['type', 'severity', 'component'],
      }),
    };
  }

  /**
   * Initialize system-related metrics
   */
  private initSystemMetrics(): SystemMetrics {
    return {
      activeConnections: new Gauge({
        name: 'vcomm_active_connections',
        help: 'Current number of active connections',
        labelNames: ['type'],
      }),

      memoryUsage: new Gauge({
        name: 'vcomm_memory_usage_bytes',
        help: 'Memory usage in bytes',
        labelNames: ['type'],
      }),

      cpuUsage: new Gauge({
        name: 'vcomm_cpu_usage_percent',
        help: 'CPU usage in percent',
        labelNames: ['core'],
      }),

      diskUsage: new Gauge({
        name: 'vcomm_disk_usage_bytes',
        help: 'Disk usage in bytes',
        labelNames: ['mount_point'],
      }),

      networkIO: new Gauge({
        name: 'vcomm_network_io_bytes',
        help: 'Network I/O in bytes',
        labelNames: ['direction', 'interface'],
      }),
    };
  }

  /**
   * Initialize performance-related metrics
   */
  private initPerformanceMetrics(): PerformanceMetrics {
    return {
      requestDuration: new Histogram({
        name: 'vcomm_request_duration_seconds',
        help: 'Request duration in seconds',
        labelNames: ['method', 'route', 'status'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
      }),

      responseSize: new Histogram({
        name: 'vcomm_response_size_bytes',
        help: 'Response size in bytes',
        labelNames: ['route', 'status'],
        buckets: [100, 500, 1000, 5000, 10000, 50000, 100000],
      }),

      errorRate: new Counter({
        name: 'vcomm_error_rate_total',
        help: 'Total number of errors',
        labelNames: ['type', 'route', 'status'],
      }),

      throughput: new Counter({
        name: 'vcomm_throughput_total',
        help: 'Total number of requests processed',
        labelNames: ['method', 'route'],
      }),
    };
  }

  /**
   * Get all metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Get metrics content type
   */
  getContentType(): string {
    return register.contentType;
  }

  /**
   * Reset all metrics
   */
  async resetMetrics(): Promise<void> {
    await register.resetMetrics();
  }

  /**
   * Clear all metrics
   */
  async clearMetrics(): Promise<void> {
    await register.clear();
  }

  /**
   * Get message metrics
   */
  getMessageMetrics(): MessageMetrics {
    return this.messageMetrics;
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    return this.systemMetrics;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMetrics;
  }

  /**
   * Create a custom metric
   */
  createCounter(config: MetricConfig): Counter<string> {
    return new Counter({
      name: config.name,
      help: config.help,
      ...(config.labelNames ? { labelNames: config.labelNames } : {}),
    });
  }

  createHistogram(config: MetricConfig): Histogram<string> {
    return new Histogram({
      name: config.name,
      help: config.help,
      ...(config.labelNames ? { labelNames: config.labelNames } : {}),
      ...(config.buckets ? { buckets: config.buckets } : {}),
    });
  }

  createGauge(config: MetricConfig): Gauge<string> {
    return new Gauge({
      name: config.name,
      help: config.help,
      ...(config.labelNames ? { labelNames: config.labelNames } : {}),
    });
  }
}

// Singleton instance
let metricsInstance: VCommMetrics | null = null;

export function getMetrics(): VCommMetrics {
  if (!metricsInstance) {
    metricsInstance = new VCommMetrics();
  }
  return metricsInstance;
}
