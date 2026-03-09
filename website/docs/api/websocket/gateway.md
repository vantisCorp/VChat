---
sidebar_position: 3
title: WebSocket Gateway
description:
  Advanced WebSocket Gateway features including sharding, compression, and
  optimization
keywords: [websocket, gateway, sharding, optimization, performance]
tags: [api, websocket, gateway]
---

# WebSocket Gateway

Advanced features for optimizing WebSocket Gateway connections including
sharding, compression, and performance tuning.

## Sharding

Sharding splits gateway connections across multiple WebSocket connections for
high-scale applications.

### When to Shard

Shard your connection when:

- **Bot membership**: Connected to spaces with 1000+ total members
- **Event volume**: Handling 100+ events per second
- **Multiple spaces**: Connected to 50+ spaces

**Formula**:

```
num_shards = ceil(total_space_members / 1000)
```

### Shard Implementation

```javascript
class ShardManager {
  constructor(token, numShards) {
    this.token = token;
    this.numShards = numShards;
    this.shards = new Map();
    this.shardId = 0;
  }

  start() {
    for (let i = 0; i < this.numShards; i++) {
      this.spawnShard(i);
    }
  }

  spawnShard(shardId) {
    const shard = new Shard(this.token, shardId, this.numShards);
    this.shards.set(shardId, shard);
    shard.connect();

    // Stagger connections
    setTimeout(() => {
      this.nextShard();
    }, 5000);
  }

  nextShard() {
    if (this.shardId < this.numShards - 1) {
      this.shardId++;
      this.spawnShard(this.shardId);
    }
  }
}
```

### Shard Identification

Each shard identifies with its shard ID:

```json
{
  "op": 2,
  "d": {
    "token": "your_token",
    "shard": [0, 4],
    "intents": 513
  }
}
```

`[shard_id, total_shards]` format.

### Space-to-Shard Mapping

```javascript
function getShardId(spaceId, numShards) {
  const snowflake = parseInt(spaceId.split('_')[1], 36);
  return (snowflake >> 22) % numShards;
}

// Example
const spaceId = 'sp_xyz789';
const numShards = 4;
const shardId = getShardId(spaceId, numShards); // Returns 0-3
```

### Shard Health Monitoring

```javascript
class ShardHealthMonitor {
  constructor(shardManager) {
    this.shardManager = shardManager;
    this.healthStatus = new Map();
    this.startMonitoring();
  }

  startMonitoring() {
    setInterval(() => {
      this.checkAllShards();
    }, 30000); // Every 30 seconds
  }

  checkAllShards() {
    this.shardManager.shards.forEach((shard, id) => {
      const health = {
        id: id,
        connected: shard.isConnected(),
        ping: shard.getPing(),
        lastHeartbeat: shard.getLastHeartbeat(),
        eventsReceived: shard.getEventCount(),
      };

      this.healthStatus.set(id, health);

      // Auto-reconnect unhealthy shards
      if (!health.connected || health.ping > 5000) {
        console.log(`Reconnecting shard ${id}`);
        shard.reconnect();
      }
    });
  }
}
```

---

## Compression

### Payload Compression

Compress large payloads to reduce bandwidth:

```json
{
  "op": 2,
  "d": {
    "token": "your_token",
    "compress": true
  }
}
```

**Threshold**: Payloads > 16KB are compressed.

### Transport-Level Compression

Enable WebSocket compression:

```javascript
const ws = new WebSocket('wss://gateway.vcomm.io?compress=true');
```

**Compression Algorithm**: zlib

**Performance Impact**:

- Bandwidth: 60-80% reduction
- CPU: 10-15% increase
- Latency: `<5ms` overhead

---

## Event Queuing

### Outbound Event Queue

Queue outgoing events to respect rate limits:

```javascript
class EventQueue {
  constructor(limit = 120, window = 60000) {
    this.queue = [];
    this.sentCount = 0;
    this.limit = limit;
    this.window = window;
    this.startTime = Date.now();
  }

  async send(event) {
    // Wait if rate limited
    while (this.sentCount >= this.limit) {
      const elapsed = Date.now() - this.startTime;
      if (elapsed >= this.window) {
        this.sentCount = 0;
        this.startTime = Date.now();
      } else {
        await this.sleep(100);
      }
    }

    // Send event
    await this.sendToGateway(event);
    this.sentCount++;
  }

  async sendToGateway(event) {
    // Send via WebSocket
    ws.send(JSON.stringify(event));
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### Inbound Event Processing

Process events efficiently:

```javascript
class EventProcessor {
  constructor(handlers) {
    this.handlers = handlers;
    this.queue = [];
    this.processing = false;
  }

  enqueue(event) {
    this.queue.push(event);
    this.processQueue();
  }

  async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift();
      await this.handleEvent(event);
    }

    this.processing = false;
  }

  async handleEvent(event) {
    const handler = this.handlers[event.t];
    if (handler) {
      await handler(event.d);
    }
  }
}
```

---

## Connection Pooling

### Multiple Connection Pool

Pool connections for different purposes:

```javascript
class ConnectionPool {
  constructor(token, options = {}) {
    this.pools = {
      primary: null,
      events: null,
      voice: null,
    };
    this.token = token;
    this.options = options;
  }

  connect() {
    // Primary connection for core features
    this.pools.primary = new GatewayConnection(this.token, {
      intents: 513,
      compress: true,
    });
    this.pools.primary.connect();

    // Events-only connection (no message content)
    if (this.options.enableEventsConnection) {
      this.pools.events = new GatewayConnection(this.token, {
        intents: 1, // Events only
        compress: false,
      });
      this.pools.events.connect();
    }

    // Voice connection
    if (this.options.enableVoice) {
      this.pools.voice = new VoiceConnection(this.token);
      this.pools.voice.connect();
    }
  }

  getConnection(type = 'primary') {
    return this.pools[type];
  }
}
```

---

## Reconnection Strategies

### Exponential Backoff

Implement exponential backoff for reconnections:

```javascript
class ReconnectionStrategy {
  constructor() {
    this.attempt = 0;
    this.maxAttempts = 10;
    this.baseDelay = 1000; // 1 second
    this.maxDelay = 60000; // 1 minute
  }

  async reconnect(connection) {
    while (this.attempt < this.maxAttempts) {
      const delay = this.calculateDelay();
      console.log(`Reconnecting in ${delay}ms (attempt ${this.attempt + 1})`);

      await this.sleep(delay);

      try {
        await connection.connect();
        this.attempt = 0;
        return true;
      } catch (error) {
        this.attempt++;
        console.error(`Reconnection failed: ${error}`);
      }
    }

    return false;
  }

  calculateDelay() {
    const delay = this.baseDelay * Math.pow(2, this.attempt);
    const jitter = Math.random() * 0.3 * delay;
    return Math.min(delay + jitter, this.maxDelay);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### Session Resume

Resume instead of full reconnection:

```javascript
class SessionManager {
  constructor() {
    this.sessionId = null;
    this.lastSeq = null;
  }

  saveSession(sessionId, lastSeq) {
    this.sessionId = sessionId;
    this.lastSeq = lastSeq;

    // Persist to storage
    localStorage.setItem(
      'vcomm_session',
      JSON.stringify({
        sessionId,
        lastSeq,
        timestamp: Date.now(),
      })
    );
  }

  loadSession() {
    const stored = localStorage.getItem('vcomm_session');
    if (stored) {
      const data = JSON.parse(stored);

      // Session valid for 1 hour
      if (Date.now() - data.timestamp < 3600000) {
        this.sessionId = data.sessionId;
        this.lastSeq = data.lastSeq;
        return true;
      }
    }

    return false;
  }

  canResume() {
    return this.sessionId !== null && this.lastSeq !== null;
  }

  getResumePayload(token) {
    return {
      op: 6,
      d: {
        token: token,
        session_id: this.sessionId,
        seq: this.lastSeq,
      },
    };
  }
}
```

---

## Performance Optimization

### Heartbeat Optimization

Optimize heartbeat timing:

```javascript
class OptimizedHeartbeat {
  constructor(interval) {
    this.interval = interval;
    this.lastAck = null;
    this.lastSend = null;
    this.rtt = 0; // Round-trip time
    this.jitter = interval * 0.1; // 10% jitter
  }

  sendHeartbeat() {
    this.lastSend = Date.now();
    return { op: 1, d: this.lastSeq };
  }

  onAck() {
    this.lastAck = Date.now();
    if (this.lastSend) {
      this.rtt = this.lastAck - this.lastSend;
    }
  }

  getNextHeartbeatTime() {
    // Adjust timing based on RTT
    const adjustedInterval = this.interval + this.rtt;
    const jitter = Math.random() * this.jitter;
    return adjustedInterval + jitter;
  }

  getConnectionQuality() {
    if (this.rtt < 100) return 'excellent';
    if (this.rtt < 300) return 'good';
    if (this.rtt < 500) return 'fair';
    return 'poor';
  }
}
```

### Memory Management

Manage memory for large event history:

```javascript
class EventHistoryManager {
  constructor(maxSize = 1000) {
    this.events = new Map();
    this.maxSize = maxSize;
    this.accessOrder = [];
  }

  add(event) {
    const { id } = event;

    // Remove oldest if at capacity
    if (this.events.size >= this.maxSize) {
      const oldestId = this.accessOrder.shift();
      this.events.delete(oldestId);
    }

    this.events.set(id, event);
    this.accessOrder.push(id);
  }

  get(id) {
    const event = this.events.get(id);
    if (event) {
      // Update access order
      const index = this.accessOrder.indexOf(id);
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(id);
    }
    return event;
  }

  clear() {
    this.events.clear();
    this.accessOrder = [];
  }

  getMemoryUsage() {
    return {
      size: this.events.size,
      maxSize: this.maxSize,
      utilization: (this.events.size / this.maxSize) * 100,
    };
  }
}
```

---

## Debugging and Monitoring

### Gateway Inspector

Inspect gateway traffic:

```javascript
class GatewayInspector {
  constructor(connection) {
    this.connection = connection;
    this.inboundEvents = [];
    this.outboundEvents = [];
    this.enableInspection();
  }

  enableInspection() {
    // Intercept outbound
    const originalSend = this.connection.send.bind(this.connection);
    this.connection.send = (data) => {
      const payload = JSON.parse(data);
      this.outboundEvents.push({
        timestamp: Date.now(),
        payload: payload,
      });
      originalSend(data);
    };

    // Intercept inbound
    this.connection.on('message', (data) => {
      const payload = JSON.parse(data);
      this.inboundEvents.push({
        timestamp: Date.now(),
        payload: payload,
      });
    });
  }

  getStats() {
    return {
      outbound: {
        total: this.outboundEvents.length,
        byType: this.groupByType(this.outboundEvents),
      },
      inbound: {
        total: this.inboundEvents.length,
        byType: this.groupByType(this.inboundEvents),
      },
    };
  }

  groupByType(events) {
    const grouped = {};
    events.forEach((event) => {
      const type = event.payload.t || 'OP_' + event.payload.op;
      grouped[type] = (grouped[type] || 0) + 1;
    });
    return grouped;
  }

  exportLogs() {
    return {
      outbound: this.outboundEvents,
      inbound: this.inboundEvents,
      stats: this.getStats(),
    };
  }
}
```

### Performance Metrics

Track gateway performance:

```javascript
class GatewayMetrics {
  constructor() {
    this.metrics = {
      connectionTime: null,
      firstReady: null,
      heartbeatRtt: [],
      eventLatency: [],
      errorCount: 0,
      reconnectCount: 0,
    };
  }

  recordConnectionStart() {
    this.metrics.connectionTime = Date.now();
  }

  recordReady() {
    if (!this.metrics.firstReady) {
      this.metrics.firstReady = Date.now() - this.metrics.connectionTime;
    }
  }

  recordHeartbeatRtt(rtt) {
    this.metrics.heartbeatRtt.push(rtt);
    if (this.metrics.heartbeatRtt.length > 100) {
      this.metrics.heartbeatRtt.shift();
    }
  }

  recordEventLatency(latency) {
    this.metrics.eventLatency.push(latency);
    if (this.metrics.eventLatency.length > 100) {
      this.metrics.eventLatency.shift();
    }
  }

  recordError() {
    this.metrics.errorCount++;
  }

  recordReconnect() {
    this.metrics.reconnectCount++;
  }

  getReport() {
    const avgRtt = this.average(this.metrics.heartbeatRtt);
    const avgLatency = this.average(this.metrics.eventLatency);

    return {
      connectionTime: this.metrics.connectionTime,
      timeToReady: this.metrics.firstReady,
      heartbeatRtt: {
        average: avgRtt,
        min: Math.min(...this.metrics.heartbeatRtt),
        max: Math.max(...this.metrics.heartbeatRtt),
      },
      eventLatency: {
        average: avgLatency,
        min: Math.min(...this.metrics.eventLatency),
        max: Math.max(...this.metrics.eventLatency),
      },
      errorCount: this.metrics.errorCount,
      reconnectCount: this.metrics.reconnectCount,
    };
  }

  average(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
}
```

---

## Best Practices

1. **Shard judiciously**: Only shard when necessary (1000+ members)
2. **Use compression**: Enable compression for bandwidth savings
3. **Implement backoff**: Use exponential backoff for reconnections
4. **Queue events**: Respect rate limits with proper queuing
5. **Monitor health**: Track connection health and auto-reconnect
6. **Resume sessions**: Use resume instead of full reconnect when possible
7. **Handle errors**: Gracefully handle all error codes
8. **Limit history**: Manage memory with size-limited event history

---

## Related Documentation

- [WebSocket Connection](./connection) - Connection basics
- [WebSocket Events](./events) - Event reference
- [Channels API](../rest/channels) - REST API
