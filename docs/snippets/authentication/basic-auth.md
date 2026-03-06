```typescript
import { VCommClient } from '@vcomm/sdk';

const client = new VCommClient({
  apiKey: process.env.VCOMM_API_KEY
});

async function authenticate() {
  try {
    const session = await client.auth.basic({
      username: 'user@example.com',
      password: 'secure-password'
    });
    return session;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}
```