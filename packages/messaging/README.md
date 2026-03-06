# @vcomm/messaging

High-performance batch message passing system inspired by Discord's Manifold for optimal performance at scale.

## Features

- 🚀 **Batch Message Passing**: Send messages to thousands of recipients simultaneously
- 📦 **Binary Encoding**: Reduces payload size by ~50% using msgpack
- 🔀 **Worker Pool**: Offloads large batches to prevent blocking main thread
- 🌐 **Node Grouping**: Optimizes routing in distributed systems
- ⚡ **Consistent Hashing**: Distributes messages evenly across nodes
- 🔄 **Automatic Retry**: Configurable retry logic for failed messages
- 📊 **Performance Metrics**: Built-in statistics and monitoring

## Installation

```bash
pnpm add @vcomm/messaging
```

## Quick Start

```typescript
import { BatchMessageSender } from '@vcomm/messaging';

const sender = new BatchMessageSender(4);

// Send notification to all users
async function sendNotification(users: string[], notification: any) {
  const result = await sender.sendBatch({
    recipients: users,
    message: notification
  });
  
  console.log(`Sent: ${result.sent}, Failed: ${result.failed}`);
}

// Send large messages with binary encoding
async function sendLargeData(users: string[], largeData: any) {
  const result = await sender.sendBatch({
    recipients: users,
    message: largeData,
    options: {
      packMode: 'binary',  // Reduces payload size
      sendMode: 'offload'  // Offloads to worker pool
    }
  });
}

// Cleanup
process.on('SIGTERM', () => {
  sender.destroy();
});
```

## API Reference

### BatchMessageSender

#### Constructor

```typescript
constructor(maxWorkers: number = 4)
```

Creates a new batch message sender with specified worker pool size.

#### sendBatch

```typescript
async sendBatch(batch: MessageBatch): Promise<BatchResult>
```

Sends a batch of messages to multiple recipients.

**Parameters:**
- `batch`: MessageBatch object containing recipients, message, and options

**Returns:** Promise<BatchResult>

#### updateNodeMap

```typescript
updateNodeMap(nodeMap: Map<string, string[]>): void
```

Updates the node mapping for distributed systems.

#### destroy

```typescript
destroy(): void
```

Cleans up resources and terminates all workers.

### Types

#### MessageBatch

```typescript
interface MessageBatch {
  recipients: string[];  // User IDs or PIDs
  message: any;
  options?: BatchOptions;
}
```

#### BatchOptions

```typescript
interface BatchOptions {
  packMode?: 'etf' | 'binary' | 'json';
  sendMode?: 'direct' | 'offload';
  groupByNode?: boolean;
  maxRetries?: number;
  timeout?: number;
}
```

#### BatchResult

```typescript
interface BatchResult {
  sent: number;
  failed: number;
  duration: number;
  recipients: string[];
  errors?: Array<{ recipient: string; error: Error }>;
}
```

## Performance Optimizations

### 1. Binary Encoding

Using msgpack instead of JSON reduces payload size by ~50%:

```typescript
// JSON: ~100KB
// msgpack: ~50KB
const result = await sender.sendBatch({
  recipients: users,
  message: largeData,
  options: { packMode: 'binary' }
});
```

### 2. Worker Pool

Large batches are offloaded to worker pool to prevent blocking main thread:

```typescript
// For batches > 1000 recipients
const result = await sender.sendBatch({
  recipients: users,
  message: notification,
  options: { sendMode: 'offload' }
});
```

### 3. Node Grouping

Grouping by network nodes optimizes routing in distributed systems:

```typescript
// Groups recipients by their network node
const result = await sender.sendBatch({
  recipients: users,
  message: notification,
  options: { groupByNode: true }
});
```

## Best Practices

### 1. Use Binary Encoding for Large Messages

```typescript
// ✅ Good - Binary encoding for large messages
await sender.sendBatch({
  recipients: users,
  message: largeData,
  options: { packMode: 'binary' }
});

// ❌ Bad - JSON for large messages
await sender.sendBatch({
  recipients: users,
  message: largeData
});
```

### 2. Offload Large Batches

```typescript
// ✅ Good - Offload for large batches
if (users.length > 1000) {
  await sender.sendBatch({
    recipients: users,
    message: notification,
    options: { sendMode: 'offload' }
  });
}

// ❌ Bad - Direct sending for large batches
await sender.sendBatch({
  recipients: users,
  message: notification
});
```

### 3. Group by Node in Distributed Systems

```typescript
// ✅ Good - Group by node
await sender.sendBatch({
  recipients: users,
  message: notification,
  options: { groupByNode: true }
});

// ❌ Bad - No grouping
await sender.sendBatch({
  recipients: users,
  message: notification
});
```

## Performance Metrics

Based on Discord's Manifold benchmarks:

- **50% reduction** in packets/second
- **2x better** queue handling
- **Linear scaling** with recipient count

## Use Cases

1. **Push Notifications**: Send notifications to thousands of users
2. **Live Updates**: Broadcast real-time updates to connected clients
3. **System Announcements**: Send system-wide messages
4. **Data Synchronization**: Sync data across multiple services

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

AGPL-3.0