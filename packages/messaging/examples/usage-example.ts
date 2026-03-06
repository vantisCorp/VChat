/**
 * Example usage of @vcomm/messaging
 * Demonstrates various features and best practices
 */

import { BatchMessageSender } from '@vcomm/messaging';

// Create sender instance
const sender = new BatchMessageSender(4);

// Example 1: Basic batch sending
async function example1_basicSending() {
  console.log('Example 1: Basic batch sending');
  
  const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
  const notification = {
    type: 'NOTIFICATION',
    title: 'System Update',
    message: 'A new update is available',
    timestamp: Date.now()
  };

  const result = await sender.sendBatch({
    recipients: users,
    message: notification
  });

  console.log(`✅ Sent: ${result.sent}, Failed: ${result.failed}`);
  console.log(`⏱️ Duration: ${result.duration}ms`);
  console.log('');
}

// Example 2: Large batch with offloading
async function example2_largeBatch() {
  console.log('Example 2: Large batch with offloading');
  
  const users = Array(5000).fill(null).map((_, i) => `user${i}`);
  const notification = {
    type: 'ANNOUNCEMENT',
    message: 'Important system announcement',
    timestamp: Date.now()
  };

  const result = await sender.sendBatch({
    recipients: users,
    message: notification,
    options: {
      sendMode: 'offload',  // Offload to worker pool
      packMode: 'binary'     // Use binary encoding
    }
  });

  console.log(`✅ Sent: ${result.sent}, Failed: ${result.failed}`);
  console.log(`⏱️ Duration: ${result.duration}ms`);
  console.log(`📊 Success rate: ${((result.sent / users.length) * 100).toFixed(2)}%`);
  console.log('');
}

// Example 3: Node grouping for distributed systems
async function example3_nodeGrouping() {
  console.log('Example 3: Node grouping for distributed systems');
  
  const users = Array(200).fill(null).map((_, i) => `user${i}`);
  const message = {
    type: 'BROADCAST',
    content: 'Broadcast message to all nodes',
    timestamp: Date.now()
  };

  const result = await sender.sendBatch({
    recipients: users,
    message,
    options: {
      groupByNode: true,  // Group by network node
      sendMode: 'direct'
    }
  });

  console.log(`✅ Sent: ${result.sent}, Failed: ${result.failed}`);
  console.log(`⏱️ Duration: ${result.duration}ms`);
  
  const stats = sender.getStats();
  console.log(`📊 Stats: ${JSON.stringify(stats, null, 2)}`);
  console.log('');
}

// Example 4: Error handling and retries
async function example4_errorHandling() {
  console.log('Example 4: Error handling and retries');
  
  const users = ['user1', 'user2', 'user3', 'invalid-user', 'user5'];
  const notification = {
    type: 'NOTIFICATION',
    message: 'Test notification with error handling',
    timestamp: Date.now()
  };

  const result = await sender.sendBatch({
    recipients: users,
    message: notification,
    options: {
      maxRetries: 3,
      timeout: 5000
    }
  });

  console.log(`✅ Sent: ${result.sent}, Failed: ${result.failed}`);
  
  if (result.errors && result.errors.length > 0) {
    console.log(`❌ Errors:`);
    result.errors.forEach(error => {
      console.log(`   - ${error.recipient}: ${error.error.message}`);
    });
  }
  console.log('');
}

// Example 5: Real-time notification system
class NotificationSystem {
  private sender: BatchMessageSender;
  private userCache: Map<string, string>;  // userId -> lastNotification

  constructor() {
    this.sender = new BatchMessageSender(8);
    this.userCache = new Map();
  }

  async sendNotificationToAll(message: string): Promise<void> {
    // Simulate getting all online users
    const onlineUsers = await this.getOnlineUsers();
    
    const notification = {
      type: 'SYSTEM_NOTIFICATION',
      message,
      timestamp: Date.now()
    };

    const result = await this.sender.sendBatch({
      recipients: onlineUsers,
      message: notification,
      options: {
        sendMode: 'offload',
        packMode: 'binary'
      }
    });

    console.log(`📢 Notification sent to ${result.sent}/${onlineUsers.length} users`);
  }

  async sendPersonalizedNotifications(messages: Map<string, string>): Promise<void> {
    const results = await Promise.all(
      Array.from(messages.entries()).map(async ([userId, message]) => {
        return await this.sender.sendBatch({
          recipients: [userId],
          message: {
            type: 'PERSONALIZED_NOTIFICATION',
            message,
            timestamp: Date.now()
          }
        });
      })
    );

    const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
    console.log(`📨 Personalized notifications sent: ${totalSent}`);
  }

  private async getOnlineUsers(): Promise<string[]> {
    // Simulate database query
    return Array(1000).fill(null).map((_, i) => `user${i}`);
  }

  destroy() {
    this.sender.destroy();
  }
}

// Example 6: Using NotificationSystem
async function example5_notificationSystem() {
  console.log('Example 5: Real-time notification system');
  
  const notificationSystem = new NotificationSystem();

  await notificationSystem.sendNotificationToAll('Server maintenance in 1 hour');
  
  const personalizedMessages = new Map([
    ['user1', 'Welcome to V-COMM!'],
    ['user2', 'Your account is verified'],
    ['user3', 'New features available']
  ]);
  
  await notificationSystem.sendPersonalizedNotifications(personalizedMessages);
  
  notificationSystem.destroy();
  console.log('');
}

// Run all examples
async function runExamples() {
  console.log('🚀 @vcomm/messaging Examples\n');
  console.log('='.repeat(50));
  console.log('');

  try {
    await example1_basicSending();
    await example2_largeBatch();
    await example3_nodeGrouping();
    await example4_errorHandling();
    await example5_notificationSystem();

    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  } finally {
    sender.destroy();
  }
}

// Run if executed directly
if (require.main === module) {
  runExamples();
}

export {
  example1_basicSending,
  example2_largeBatch,
  example3_nodeGrouping,
  example4_errorHandling,
  example5_notificationSystem,
  NotificationSystem
};