/**
 * Unit tests for BatchMessageSender
 */

import { BatchMessageSender } from './batch-sender';
import { MessageBatch, BatchResult } from './types';

describe('BatchMessageSender', () => {
  let sender: BatchMessageSender;

  beforeEach(() => {
    sender = new BatchMessageSender(2);
  });

  afterEach(() => {
    sender.destroy();
  });

  describe('sendBatch', () => {
    test('should send batch messages successfully', async () => {
      const batch: MessageBatch = {
        recipients: ['user1', 'user2', 'user3'],
        message: { text: 'Hello' },
      };

      const result: BatchResult = await sender.sendBatch(batch);

      expect(result.sent).toBeGreaterThan(0);
      expect(result.recipients).toEqual(['user1', 'user2', 'user3']);
    });

    test('should handle failed messages', async () => {
      const batch: MessageBatch = {
        recipients: ['user1', 'user2', 'user3', 'user4', 'user5'],
        message: { text: 'Hello' },
      };

      const result: BatchResult = await sender.sendBatch(batch);

      expect(result.sent + result.failed).toBe(batch.recipients.length);
    });

    test('should pack messages with binary mode', async () => {
      const largeMessage = { data: 'x'.repeat(1000000) };

      const batch: MessageBatch = {
        recipients: ['user1'],
        message: largeMessage,
        options: { packMode: 'binary' },
      };

      const result: BatchResult = await sender.sendBatch(batch);

      expect(result.sent).toBeGreaterThan(0);
    });

    test('should group recipients by node', async () => {
      const batch: MessageBatch = {
        recipients: Array(150)
          .fill(null)
          .map((_, i) => `user${i}`),
        message: { text: 'Hello' },
        options: { groupByNode: true },
      };

      const result: BatchResult = await sender.sendBatch(batch);

      expect(result.sent).toBeGreaterThan(0);
      expect(result.recipients.length).toBe(150);
    });
  });

  describe('updateNodeMap', () => {
    test('should update node mapping', () => {
      const nodeMap = new Map([
        ['node-0', ['user1', 'user2']],
        ['node-1', ['user3', 'user4']],
      ]);

      sender.updateNodeMap(nodeMap);

      const stats = sender.getStats();
      expect(stats.nodesCount).toBe(2);
    });
  });

  describe('addRecipientToNode', () => {
    test('should add recipient to node', () => {
      sender.addRecipientToNode('user1', 'node-0');

      const stats = sender.getStats();
      expect(stats.nodesCount).toBe(1);
    });
  });

  describe('getStats', () => {
    test('should return correct statistics', () => {
      const stats = sender.getStats();

      expect(stats.workersCount).toBe(0);
      expect(stats.nodesCount).toBe(0);
      expect(stats.maxWorkers).toBe(2);
    });
  });

  describe('destroy', () => {
    test('should clean up resources', () => {
      sender.destroy();

      const stats = sender.getStats();
      expect(stats.workersCount).toBe(0);
    });
  });
});
