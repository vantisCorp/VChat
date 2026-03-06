/**
 * Main monitoring system that integrates metrics and error tracking
 */

import { VCommMetrics } from './metrics';
import { SentryIntegration } from './sentry';
import { MetricsConfig, MonitoringStats } from './types';

export class MonitoringSystem {
  private metrics: VCommMetrics;
  private sentry: SentryIntegration;
  private config: MetricsConfig;
  private startTime: number;

  constructor(config: MetricsConfig) {
    this.config = config;
    this.startTime = Date.now();
    this.metrics = new VCommMetrics();
    this.sentry = new SentryIntegration();

    if (config.enableSentry) {
      this.sentry.init(config);
    }
  }

  /**
   * Get metrics instance
   */
  getMetrics(): VCommMetrics {
    return this.metrics;
  }

  /**
   * Get sentry instance
   */
  getSentry(): SentryIntegration {
    return this.sentry;
  }

  /**
   * Get Prometheus metrics endpoint handler
   */
  async getMetricsEndpoint(): Promise<{ contentType: string; data: string }> {
    return {
      contentType: this.metrics.getContentType(),
      data: await this.metrics.getMetrics()
    };
  }

  /**
   * Measure execution time of an async function
   */
  async measureTime<T>(
    operation: string,
    fn: () => Promise<T>,
    labels?: Record<string, string>
  ): Promise<T> {
    const processingTime = this.metrics.getMessageMetrics().processingTime;
    const endTimer = processingTime.startTimer({
      operation,
      ...labels
    });

    try {
      const result = await fn();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      this.metrics.getMessageMetrics().errors.inc({
        type: 'processing',
        severity: 'error',
        component: operation
      });
      throw error;
    }
  }

  /**
   * Track HTTP request
   */
  trackRequest(
    method: string,
    route: string,
    status: number,
    duration: number,
    responseSize?: number
  ): void {
    const performance = this.metrics.getPerformanceMetrics();

    // Track duration
    performance.requestDuration.observe(
      { method, route, status: status.toString() },
      duration / 1000 // Convert to seconds
    );

    // Track throughput
    performance.throughput.inc({ method, route });

    // Track response size
    if (responseSize) {
      performance.responseSize.observe(
        { route, status: status.toString() },
        responseSize
      );
    }

    // Track errors
    if (status >= 400) {
      performance.errorRate.inc({
        type: status >= 500 ? 'server_error' : 'client_error',
        route,
        status: status.toString()
      });
    }
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics(stats: {
    activeConnections?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    diskUsage?: number;
    networkIO?: { inbound: number; outbound: number };
  }): void {
    const system = this.metrics.getSystemMetrics();

    if (stats.activeConnections !== undefined) {
      system.activeConnections.set({ type: 'websocket' }, stats.activeConnections);
    }

    if (stats.memoryUsage !== undefined) {
      system.memoryUsage.set({ type: 'heap' }, stats.memoryUsage);
      system.memoryUsage.set({ type: 'rss' }, process.memoryUsage().rss);
    }

    if (stats.cpuUsage !== undefined) {
      system.cpuUsage.set({ core: 'all' }, stats.cpuUsage);
    }

    if (stats.diskUsage !== undefined) {
      system.diskUsage.set({ mount_point: '/' }, stats.diskUsage);
    }

    if (stats.networkIO !== undefined) {
      system.networkIO.set({ direction: 'inbound', interface: 'eth0' }, stats.networkIO.inbound);
      system.networkIO.set({ direction: 'outbound', interface: 'eth0' }, stats.networkIO.outbound);
    }
  }

  /**
   * Track message
   */
  trackMessage(
    type: 'sent' | 'received',
    channel: string,
    status?: string,
    messageType?: string
  ): void {
    const messageMetrics = this.metrics.getMessageMetrics();

    if (type === 'sent') {
      messageMetrics.messagesSent.inc({
        channel,
        status: status || 'success',
        type: messageType || 'text'
      });
    } else {
      messageMetrics.messagesReceived.inc({
        channel,
        type: messageType || 'text'
      });
    }
  }

  /**
   * Track queue size
   */
  trackQueueSize(queueType: string, size: number, node?: string): void {
    this.metrics.getMessageMetrics().queueSize.set(
      { queue_type: queueType, node: node || 'default' },
      size
    );
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): MonitoringStats {
    return {
      uptime: Date.now() - this.startTime,
      requestCount: 0, // This would be tracked internally
      errorCount: 0, // This would be tracked internally
      averageResponseTime: 0, // This would be calculated
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: 0 // This would be calculated
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    uptime: number;
    memory: NodeJS.MemoryUsage;
    metrics: boolean;
    sentry: boolean;
  }> {
    return {
      status: 'healthy',
      uptime: Date.now() - this.startTime,
      memory: process.memoryUsage(),
      metrics: true,
      sentry: this.sentry.isInitialized()
    };
  }

  /**
   * Shutdown monitoring system
   */
  async shutdown(): Promise<void> {
    await this.metrics.clearMetrics();
    await this.sentry.close();
  }
}

export function createMonitoring(config: MetricsConfig): MonitoringSystem {
  return new MonitoringSystem(config);
}