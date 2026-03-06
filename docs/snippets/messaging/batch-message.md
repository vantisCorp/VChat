```typescript
import { BatchMessageSender } from '@vcomm/messaging';

const sender = new BatchMessageSender(4);

async function sendNotificationToAllUsers(users: string[], notification: any) {
  const result = await sender.sendBatch({
    recipients: users,
    message: notification,
    options: {
      packMode: 'binary',
      sendMode: 'offload'
    }
  });
  
  console.log(`Sent ${result.sent}, failed: ${result.failed}`);
  return result;
}

// Cleanup
process.on('SIGTERM', () => {
  sender.destroy();
});
```