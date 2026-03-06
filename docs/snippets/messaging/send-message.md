```typescript
import { VCommClient } from '@vcomm/sdk';

const client = new VCommClient({
  apiKey: process.env.VCOMM_API_KEY
});

async function sendMessage(channelId: string, message: string) {
  try {
    const response = await client.messages.send({
      channelId,
      content: message,
      encrypted: true
    });
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}
```