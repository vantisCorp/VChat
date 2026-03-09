/**
 * High-performance batch message sender inspired by Discord Manifold
 * Optimized for sending messages to thousands of recipients simultaneously
 */

import { Worker } from 'worker_threads';
import * as msgpack from 'msgpack-lite';
import {
  MessageBatch,
  BatchOptions,
  BatchResult,
  NodeMap,
  WorkerMessage,
  WorkerResponse
} from './types';

export class BatchMessageSender {
  private workers: Worker[];
  private maxWorkers: number;
  private nodeMap: Map<string, string[]>;
  private workerIndex: number = 0;

  constructor(maxWorkers: number = 4) {
    this.maxWorkers = maxWorkers;
    this.workers = [];
    this.nodeMap = new Map();
  }

  /**
   * Main entry point for batch message sending
   */
  async sendBatch(batch: MessageBatch): Promise<BatchResult> {
    // 1. Group by node if requested (optimization for distributed systems)
    if (batch.options?.groupByNode && batch.recipients.length > 100) {
      const grouped = this.groupByNode(batch.recipients);
      return await this.sendToNodes(batch.message, grouped, batch.options);
    }

    // 2. Choose sending mode
    if (batch.options?.sendMode === 'offload' || batch.recipients.length > 1000) {
      return await this.sendOffloaded(batch);
    }

    // 3. Direct sending for smaller batches
    return await this.sendDirect(batch);
  }

  /**
   * Group recipients by network nodes for optimized routing
   * Similar to Discord's Manifold node-based distribution
   */
  private groupByNode(recipients: string[]): NodeMap {
    const grouped: NodeMap = {};

    for (const recipient of recipients) {
      const node = this.getNodeForRecipient(recipient);
      if (!grouped[node]) {
        grouped[node] = [];
      }
      grouped[node].push(recipient);
    }

    return grouped;
  }

  /**
   * Send messages to specific nodes
   */
  private async sendToNodes(
    message: any,
    nodeMap: NodeMap,
    options?: BatchOptions
  ): Promise<BatchResult> {
    const results: BatchResult[] = [];

    for (const [_node, recipients] of Object.entries(nodeMap)) {
      const batch: MessageBatch = {
        recipients,
        message: options?.packMode === 'binary' ? this.packMessage(message) : message,
        options: { ...options, sendMode: 'direct' } as BatchOptions
      };

      const result = await this.sendDirect(batch);
      results.push(result);
    }

    return this.mergeResults(results);
  }

  /**
   * Offload sending to worker pool
   * Prevents blocking the main thread for large batches
   */
  private async sendOffloaded(batch: MessageBatch): Promise<BatchResult> {
    return new Promise((resolve, reject) => {
      const worker = this.getAvailableWorker();

      const workerMessage: WorkerMessage = {
        type: 'SEND_BATCH',
        recipients: batch.recipients,
        message: batch.options?.packMode === 'binary' ? this.packMessage(batch.message) : batch.message,
        ...(batch.options ? { options: batch.options } : {})
      };

      worker.postMessage(workerMessage);

      worker.once('message', (response: WorkerResponse) => {
        resolve({
          sent: response.sent,
          failed: response.failed,
          duration: response.duration,
          recipients: response.recipients,
          errors: response.errors?.map(e => ({
            recipient: e.recipient,
            error: new Error(e.error)
          })) ?? []
        });
      });

      worker.once('error', (error) => {
        reject(error);
      });

      worker.once('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  /**
   * Direct sending for smaller batches
   * Uses Promise.all for parallel processing
   */
  private async sendDirect(batch: MessageBatch): Promise<BatchResult> {
    let sent = 0;
    let failed = 0;
    const errors: Array<{ recipient: string; error: Error }> = [];

    const promises = batch.recipients.map(async (recipient) => {
      try {
        await this.sendMessage(recipient, batch.message);
        sent++;
      } catch (error) {
        failed++;
        errors.push({ recipient, error: error as Error });
      }
    });

    await Promise.all(promises);

    return {
      sent,
      failed,
      duration: Date.now() - Date.now(), // Will be calculated by caller
      recipients: batch.recipients,
      errors
    };
  }

  /**
   * Pack message using msgpack for binary encoding
   * Reduces payload size by ~50% compared to JSON
   */
  private packMessage(message: any): Buffer {
    return Buffer.from(msgpack.encode(message));
  }

  /**
   * Get or create a worker from the pool
   */
  private getAvailableWorker(): Worker {
    if (this.workers.length < this.maxWorkers) {
      const worker = new Worker('./batch-worker.ts', {
        workerData: { workerId: this.workers.length }
      });
      this.workers.push(worker);
      return worker;
    }

    // Round-robin selection
    const index = this.workerIndex % this.workers.length;
    this.workerIndex++;
    return this.workers[index]!;
  }

  /**
   * Get network node for a recipient
   * Uses consistent hashing for distribution
   */
  private getNodeForRecipient(recipient: string): string {
    // Simple hash-based node assignment
    const hash = this.hashCode(recipient);
    const nodeIndex = hash % Math.max(this.maxWorkers, 2);
    return `node-${nodeIndex}`;
  }

  /**
   * Simple string hash function for consistent hashing
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Merge multiple batch results
   */
  private mergeResults(results: BatchResult[]): BatchResult {
    return results.reduce((acc, result) => ({
      sent: acc.sent + result.sent,
      failed: acc.failed + result.failed,
      duration: acc.duration + result.duration,
      recipients: [...acc.recipients, ...result.recipients],
      errors: [...(acc.errors || []), ...(result.errors || [])]
    }), {
      sent: 0,
      failed: 0,
      duration: 0,
      recipients: [],
      errors: []
    });
  }

  /**
   * Send message to a single recipient
   * This should be overridden with actual implementation
   */
  private async sendMessage(recipient: string, _message: any): Promise<void> {
    // TODO: Implement actual message sending logic
    // This could be WebSocket, gRPC, HTTP, or any transport
    // For now, simulate with a delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));

    // Simulate occasional failures
    if (Math.random() < 0.01) { // 1% failure rate
      throw new Error(`Failed to send to ${recipient}`);
    }
  }

  /**
   * Update node mapping
   * Call this when node topology changes
   */
  updateNodeMap(nodeMap: Map<string, string[]>): void {
    this.nodeMap = nodeMap;
  }

  /**
   * Add recipient to node mapping
   */
  addRecipientToNode(recipient: string, node: string): void {
    if (!this.nodeMap.has(node)) {
      this.nodeMap.set(node, []);
    }
    this.nodeMap.get(node)!.push(recipient);
  }

  /**
   * Get statistics about the sender
   */
  getStats(): {
    workersCount: number;
    nodesCount: number;
    maxWorkers: number;
  } {
    return {
      workersCount: this.workers.length,
      nodesCount: this.nodeMap.size,
      maxWorkers: this.maxWorkers
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.workers.forEach(worker => {
      worker.terminate();
    });
    this.workers = [];
  }
}