/**
 * @vcomm/messaging - High-performance batch message passing system
 * Inspired by Discord's Manifold for optimal performance at scale
 */

export { BatchMessageSender } from './batch-sender';
export { startBatchWorker } from './batch-worker';
export type {
  MessageBatch,
  BatchOptions,
  BatchResult,
  MessageRecipient,
  NodeMap,
  WorkerMessage,
  WorkerResponse,
} from './types';

// Convenience exports
export * from './batch-sender';
export * from './batch-worker';
export * from './types';
