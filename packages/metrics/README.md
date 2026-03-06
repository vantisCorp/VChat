# @vcomm/metrics

Comprehensive monitoring and metrics system inspired by Discord Instruments for real-time monitoring, alerting, and performance tracking.

## Features

- 📊 **Prometheus Integration**: Industry-standard metrics collection
- 🎯 **Real-time Monitoring**: Track system health and performance
- 🚨 **Proactive Alerts**: Configurable alert rules with severity levels
- 📈 **Grafana Dashboards**: Beautiful visualizations
- 🐛 **Sentry Integration**: Error tracking and performance monitoring
- 📉 **Performance Metrics**: Request duration, throughput, error rates
- 💾 **System Metrics**: CPU, memory, disk, network I/O
- 📨 **Message Metrics**: Queue size, processing time, message counts

## Installation

```bash
pnpm add @vcomm/metrics
```

## Quick Start

```typescript
import { createMonitoring } from '@vcomm/metrics';

// Initialize monitoring
const monitoring = createMonitoring({
  enablePrometheus: true,
  enableSentry: true,
  sentryDsn: process.env.SENTRY_DSN,
  environment: 'production',
  sampleRate: 1.0
});

// Track HTTP request
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    monitoring.trackRequest(
      req.method,
      req.path,
      res.statusCode,
      Date.now() - start,
      res.get('Content-Length')
    );
  });
  
  next();
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  const { contentType, data } = await monitoring.getMetricsEndpoint();
  res.set('Content-Type', contentType);
  res.send(data);
});
```

## API Reference

### createMonitoring

```typescript
function createMonitoring(config: MetricsConfig): MonitoringSystem
```

Creates a new monitoring system instance.

**Parameters:**
- `config`: MetricsConfig object

**Returns:** MonitoringSystem instance

### MonitoringSystem

#### getMetrics

```typescript
getMetrics(): VCommMetrics
```

Returns the Prometheus metrics instance.

#### getSentry

```typescript
getSentry(): SentryIntegration
```

Returns the Sentry integration instance.

#### measureTime

```typescript
async measureTime<T>(
  operation: string,
  fn: () => Promise<T>,
  labels?: Record<string, string>
): Promise<T>
```

Measures execution time of an async function.

#### trackRequest

```typescript
trackRequest(
  method: string,
  route: string,
  status: number,
  duration: number,
  responseSize?: number
): void
```

Tracks an HTTP request.

#### updateSystemMetrics

```typescript
updateSystemMetrics(stats: {
  activeConnections?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  diskUsage?: number;
  networkIO?: { inbound: number; outbound: number };
}): void
```

Updates system metrics.

#### trackMessage

```typescript
trackMessage(
  type: 'sent' | 'received',
  channel: string,
  status?: string,
  messageType?: string
): void
```

Tracks a message.

#### trackQueueSize

```typescript
trackQueueSize(queueType: string, size: number, node?: string): void
```

Tracks queue size.

#### healthCheck

```typescript
async healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  uptime: number;
  memory: NodeJS.MemoryUsage;
  metrics: boolean;
  sentry: boolean;
}>
```

Performs a health check.

## Metrics

### Message Metrics

- `vcomm_messages_sent_total` - Total messages sent
- `vcomm_messages_received_total` - Total messages received
- `vcomm_queue_size` - Current queue size
- `vcomm_processing_time_seconds` - Message processing time
- `vcomm_errors_total` - Total errors

### System Metrics

- `vcomm_active_connections` - Active connections
- `vcomm_memory_usage_bytes` - Memory usage
- `vcomm_cpu_usage_percent` - CPU usage
- `vcomm_disk_usage_bytes` - Disk usage
- `vcomm_network_io_bytes` - Network I/O

### Performance Metrics

- `vcomm_request_duration_seconds` - Request duration
- `vcomm_response_size_bytes` - Response size
- `vcomm_error_rate_total` - Error rate
- `vcomm_throughput_total` - Throughput

## Docker Setup

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
```

## Alerting

Configure alerts in Prometheus:

```yaml
groups:
  - name: vcomm_alerts
    rules:
      - alert: HighQueueSize
        expr: vcomm_queue_size > 10000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High queue size detected"
          description: "Queue size is {{ $value }}"

      - alert: HighErrorRate
        expr: rate(vcomm_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}"
```

## Best Practices

1. **Always measure execution time** for critical operations
2. **Track all HTTP requests** with method, route, and status
3. **Monitor system resources** (CPU, memory, disk, network)
4. **Set up alerts** for critical metrics
5. **Use labels** for granular tracking
6. **Review dashboards** regularly

## Use Cases

1. **Performance Monitoring**: Track request durations and throughput
2. **Error Tracking**: Monitor error rates and capture exceptions
3. **Resource Monitoring**: Track CPU, memory, disk, network usage
4. **Business Metrics**: Track messages sent/received, queue sizes
5. **Health Checks**: Monitor system health and uptime

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

AGPL-3.0