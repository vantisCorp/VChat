---
title: Quickstart
description: Get up and running with V-COMM in 5 minutes
---

# Quickstart Guide

Get up and running with V-COMM development in just 5 minutes.

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/vantisCorp/VChat.git
cd VChat

# Install dependencies
pnpm install
```

## Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Required environment variables:

```env
VCOMM_API_KEY=your_api_key_here
VCOMM_ENCRYPTION_KEY=your_encryption_key
DATABASE_URL=postgresql://localhost/vcomm
REDIS_URL=redis://localhost:6379
```

## Step 3: Start Development Server

```bash
# Start all services in development mode
pnpm dev
```

This will start:
- Web client on `http://localhost:3000`
- API server on `http://localhost:8080`
- Database on `http://localhost:5432`
- Redis on `http://localhost:6379`

## Step 4: Test Your Setup

Create a simple test file `test.js`:

<CodeGroup>
```javascript test.js
import { VCommClient } from '@vcomm/sdk';

const client = new VCommClient({
  apiKey: process.env.VCOMM_API_KEY,
  endpoint: 'http://localhost:8080'
});

async function testConnection() {
  try {
    const health = await client.health.check();
    console.log('✅ V-COMM is running:', health.status);
    
    const user = await client.auth.login({
      email: 'test@example.com',
      password: 'test123'
    });
    
    console.log('✅ Authenticated as:', user.email);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
```

```typescript test.ts
import { VCommClient } from '@vcomm/sdk';

const client = new VCommClient({
  apiKey: process.env.VCOMM_API_KEY as string,
  endpoint: 'http://localhost:8080'
});

async function testConnection(): Promise<void> {
  try {
    const health = await client.health.check();
    console.log('✅ V-COMM is running:', health.status);
    
    const user = await client.auth.login({
      email: 'test@example.com',
      password: 'test123'
    });
    
    console.log('✅ Authenticated as:', user.email);
  } catch (error) {
    console.error('❌ Connection failed:', (error as Error).message);
  }
}

testConnection();
```
</CodeGroup>

Run the test:

```bash
node test.js
```

## Step 5: Send Your First Message

<CodeGroup>
```javascript send-message.js
import { VCommClient } from '@vcomm/sdk';

const client = new VCommClient({
  apiKey: process.env.VCOMM_API_KEY,
  endpoint: 'http://localhost:8080'
});

async function sendFirstMessage() {
  // Authenticate
  const user = await client.auth.login({
    email: 'test@example.com',
    password: 'test123'
  });
  
  // Send message
  const message = await client.messages.send({
    channelId: 'general',
    content: 'Hello from V-COMM! 🚀',
    encrypted: true
  });
  
  console.log('✅ Message sent:', message.id);
}

sendFirstMessage();
```
</CodeGroup>

## Next Steps

- 📚 Read the [Introduction](./introduction) for an overview
- 🏗️ Check the [Architecture](./architecture) for deep dive
- 🔐 Learn about [Authentication](./authentication)
- 📖 Explore [API Reference](./api-reference)

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Check connection
psql -U postgres -d vcomm
```

### Missing Dependencies

```bash
# Clear cache and reinstall
rm -rf node_modules
pnpm install
```

## Getting Help

- 📧 Email: support@vcomm.dev
- 🐛 [GitHub Issues](https://github.com/vantisCorp/VChat/issues)
- 💬 [Discord Community](https://discord.gg/vcomm)