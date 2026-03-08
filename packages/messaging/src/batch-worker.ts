/**
 * Worker thread for offloading batch message sending
 * Prevents blocking the main thread for large batches
 */

import { parentPort, workerData } from 'worker_threads';
// msgpack is available for future binary encoding needs
// import * as msgpack from 'msgpack-lite';
import { WorkerMessage, WorkerResponse } from './types';

interface _WorkerData {
  workerId: number;
}

export function startBatchWorker(): void {
  if (!parentPort) {
    throw new Error('Worker must be created with parentPort');
  }

  const port = parentPort;

  port.on('message', async (data: WorkerMessage) => {
    if (data.type === 'SEND_BATCH') {
      try {
        const result = await handleSendBatch(data);
        port.postMessage(result);
      } catch (error) {
        port.postMessage({
          sent: 0,
          failed: data.recipients.length,
          duration: 0,
          recipients: data.recipients,
          errors: data.recipients.map((r) => ({
            recipient: r,
            error: (error as Error).message,
          })),
        });
      }
    }
  });

  console.log(`Worker ${workerData?.workerId || 0} started`);
}

async function handleSendBatch(data: WorkerMessage): Promise<WorkerResponse> {
  const startTime = Date.now();
  let sent = 0;
  let failed = 0;
  const errors: Array<{ recipient: string; error: string }> = [];

  // Process recipients in parallel with concurrency limit
  const concurrencyLimit = 100;
  const chunks = chunkArray(data.recipients, concurrencyLimit);

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (recipient) => {
        try {
          await sendToRecipient(recipient, data.message);
          sent++;
        } catch (error) {
          failed++;
          errors.push({
            recipient,
            error: (error as Error).message,
          });
        }
      })
    );
  }

  return {
    sent,
    failed,
    duration: Date.now() - startTime,
    recipients: data.recipients,
    errors,
  };
}

async function sendToRecipient(recipient: string, _message: any): Promise<void> {
  // TODO: Implement actual message sending logic
  // This could be WebSocket, gRPC, HTTP, or any transport
  // For now, simulate with a delay
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));

  // Simulate occasional failures
  if (Math.random() < 0.01) {
    // 1% failure rate
    throw new Error(`Failed to send to ${recipient}`);
  }
}

/**
 * Split array into chunks of specified size
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Start worker if this file is run directly
if (require.main === module) {
  startBatchWorker();
}
