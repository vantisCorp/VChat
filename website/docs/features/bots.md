---
sidebar_position: 5
title: Bots & Automation
description: Comprehensive guide to creating and using bots in V-COMM for automation and integrations
keywords: [bots, automation, integrations, webhooks, slash commands, api]
tags: [features, bots, automation]
---

# Bots & Automation

## Overview

V-COMM provides a powerful bot platform for automating workflows, integrating external services, and enhancing team productivity. Bots can interact with users, process commands, and respond to events in real-time.

## Bot Types

### Chat Bots

Interactive bots that respond to messages and commands:

| Feature | Description |
|---------|-------------|
| Slash Commands | Custom commands starting with `/` |
| Message Responses | Reply to specific messages or patterns |
| Direct Messages | Private conversations with users |
| Context Menus | Right-click actions on messages |

### Webhook Bots

Bots that send automated messages via webhooks:

| Feature | Description |
|---------|-------------|
| Incoming Webhooks | Send messages to channels |
| Rich Embeds | Formatted message cards |
| Attachments | Files and media |
| Custom Avatars | Customizable bot identity |

### Background Bots

Bots that process events without direct user interaction:

| Feature | Description |
|---------|-------------|
| Event Processing | React to workspace events |
| Scheduled Tasks | Cron-like scheduled operations |
| Background Jobs | Long-running processes |
| Webhook Handlers | Process external webhooks |

## Creating a Bot

### Bot Registration

```typescript
import { VComm } from '@vcomm/sdk';

const client = new VComm({ token });

const bot = await client.bots.create({
  name: 'Helper Bot',
  description: 'A helpful assistant for team workflows',
  avatarUrl: 'https://example.com/bot-avatar.png',
  
  // Bot capabilities
  capabilities: {
    commands: true,
    messages: true,
    webhooks: true,
    events: true
  },
  
  // Permissions
  permissions: [
    'messages:read',
    'messages:write',
    'channels:read',
    'users:read',
    'files:read'
  ],
  
  // Event subscriptions
  events: [
    'message_created',
    'message_updated',
    'message_deleted',
    'channel_joined',
    'user_mentioned'
  ]
});

console.log('Bot created:', bot.id);
console.log('Bot token:', bot.token);  // Store securely!
```

### Bot Credentials

```typescript
interface BotCredentials {
  botId: string;
  clientId: string;
  clientSecret: string;
  botToken: string;  // Used for API calls
  verifyToken: string;  // Used to verify webhooks
}
```

## Slash Commands

### Registering Commands

```typescript
// Create a slash command
const command = await client.bots.createCommand(bot.id, {
  name: 'weather',
  description: 'Get current weather for a location',
  
  // Command options
  options: [
    {
      name: 'location',
      description: 'City name or zip code',
      type: 'string',
      required: true
    },
    {
      name: 'units',
      description: 'Temperature units',
      type: 'string',
      required: false,
      choices: [
        { name: 'Celsius', value: 'celsius' },
        { name: 'Fahrenheit', value: 'fahrenheit' }
      ]
    }
  ],
  
  // Where the command can be used
  scope: 'global',  // or specific channel/space IDs
  
  // Response behavior
  response: {
    ephemeral: false,  // Visible only to user if true
    type: 'embed'  // text, embed, or modal
  }
});
```

### Handling Commands

```typescript
// Set up command handler
client.bots.onCommand('weather', async (context) => {
  const { location, units = 'celsius' } = context.options;
  
  try {
    // Fetch weather data
    const weather = await fetchWeather(location, units);
    
    // Respond with embed
    await context.respond({
      embeds: [{
        title: `Weather in ${weather.city}`,
        description: `${weather.temperature}° ${units === 'celsius' ? 'C' : 'F'}`,
        fields: [
          { name: 'Condition', value: weather.condition, inline: true },
          { name: 'Humidity', value: `${weather.humidity}%`, inline: true },
          { name: 'Wind', value: `${weather.wind} km/h`, inline: true }
        ],
        thumbnail: { url: weather.iconUrl },
        footer: { text: 'Powered by Weather API' }
      }]
    });
  } catch (error) {
    await context.respond({
      content: `Could not fetch weather for "${location}"`,
      ephemeral: true
    });
  }
});
```

### Command Types

```typescript
// Subcommands
const projectCommand = await client.bots.createCommand(bot.id, {
  name: 'project',
  description: 'Manage projects',
  options: [
    {
      name: 'create',
      description: 'Create a new project',
      type: 'subcommand',
      options: [
        { name: 'name', type: 'string', required: true },
        { name: 'description', type: 'string', required: false }
      ]
    },
    {
      name: 'list',
      description: 'List all projects',
      type: 'subcommand'
    },
    {
      name: 'archive',
      description: 'Archive a project',
      type: 'subcommand',
      options: [
        { name: 'project_id', type: 'string', required: true }
      ]
    }
  ]
});
```

## Message Handling

### Responding to Messages

```typescript
// Listen for messages
client.bots.onMessage(async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Check for trigger words
  const triggers = ['help', 'support', 'issue'];
  const hasTrigger = triggers.some(t => 
    message.content.toLowerCase().includes(t)
  );
  
  if (hasTrigger) {
    await client.messages.reply(message.id, {
      content: 'I can help! Use `/help` to see available commands.',
      mentions: [message.author.id]
    });
  }
});

// Pattern matching
client.bots.onMessagePattern(/ticket-(\d+)/, async (message, match) => {
  const ticketId = match[1];
  const ticket = await fetchTicket(ticketId);
  
  await client.messages.reply(message.id, {
    embeds: [{
      title: `Ticket #${ticketId}`,
      fields: [
        { name: 'Status', value: ticket.status },
        { name: 'Priority', value: ticket.priority },
        { name: 'Assignee', value: ticket.assignee }
      ]
    }]
  });
});
```

### Mention Handling

```typescript
// Handle bot mentions
client.bots.onMention(async (message) => {
  // Extract question
  const question = message.content
    .replace(/<@!\w+>/g, '')  // Remove mention
    .trim();
  
  // Process question (e.g., with AI)
  const answer = await processQuestion(question);
  
  await client.messages.reply(message.id, {
    content: answer
  });
});
```

## Webhooks

### Incoming Webhooks

```typescript
// Create incoming webhook
const webhook = await client.bots.createWebhook(bot.id, {
  name: 'CI/CD Notifications',
  channelId: 'channel_123',
  description: 'Deployment status notifications'
});

console.log('Webhook URL:', webhook.url);

// Send message via webhook
await fetch(webhook.url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Deployment completed successfully!',
    username: 'CI Bot',
    avatar_url: 'https://example.com/ci-bot.png',
    embeds: [{
      title: 'Build #1234',
      color: 'green',
      fields: [
        { name: 'Branch', value: 'main' },
        { name: 'Commit', value: 'abc123' }
      ]
    }]
  })
});
```

### Outgoing Webhooks

```typescript
// Create outgoing webhook
const outgoing = await client.bots.createOutgoingWebhook(bot.id, {
  name: 'Event Forwarder',
  url: 'https://your-server.com/webhook',
  events: ['message_created', 'user_joined'],
  secret: 'your-webhook-secret'
});

// Verify webhook signature (on your server)
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Interactive Components

### Buttons

```typescript
// Message with buttons
await client.messages.send(channelId, {
  content: 'Choose an action:',
  components: [{
    type: 'actions',
    elements: [
      {
        type: 'button',
        style: 'primary',
        label: 'Approve',
        customId: 'approve'
      },
      {
        type: 'button',
        style: 'danger',
        label: 'Reject',
        customId: 'reject'
      }
    ]
  }]
});

// Handle button clicks
client.bots.onButton('approve', async (interaction) => {
  await interaction.respond({
    content: 'Approved!',
    ephemeral: true
  });
});
```

### Select Menus

```typescript
// Message with select menu
await client.messages.send(channelId, {
  content: 'Select a team:',
  components: [{
    type: 'actions',
    elements: [{
      type: 'select',
      customId: 'team_select',
      placeholder: 'Choose a team...',
      options: [
        { label: 'Engineering', value: 'eng' },
        { label: 'Product', value: 'product' },
        { label: 'Design', value: 'design' }
      ]
    }]
  }]
});

// Handle selection
client.bots.onSelect('team_select', async (interaction) => {
  const selected = interaction.values[0];
  await interaction.respond({
    content: `You selected: ${selected}`,
    ephemeral: true
  });
});
```

### Modals

```typescript
// Open modal from button click
client.bots.onButton('create_issue', async (interaction) => {
  await interaction.showModal({
    title: 'Create Issue',
    customId: 'issue_modal',
    components: [{
      type: 'text',
      customId: 'title',
      label: 'Issue Title',
      required: true
    }, {
      type: 'textarea',
      customId: 'description',
      label: 'Description',
      required: false
    }, {
      type: 'select',
      customId: 'priority',
      label: 'Priority',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' }
      ]
    }]
  });
});

// Handle modal submission
client.bots.onModal('issue_modal', async (interaction) => {
  const { title, description, priority } = interaction.values;
  
  // Create issue
  const issue = await createIssue({ title, description, priority });
  
  await interaction.respond({
    content: `Issue #${issue.id} created!`,
    ephemeral: true
  });
});
```

## Bot Permissions

### Permission Types

```typescript
enum BotPermission {
  // Messages
  MESSAGES_READ = 'messages:read',
  MESSAGES_WRITE = 'messages:write',
  MESSAGES_DELETE = 'messages:delete',
  
  // Channels
  CHANNELS_READ = 'channels:read',
  CHANNELS_MANAGE = 'channels:manage',
  
  // Users
  USERS_READ = 'users:read',
  USERS_MENTION = 'users:mention',
  
  // Files
  FILES_READ = 'files:read',
  FILES_WRITE = 'files:write',
  
  // Administration
  ADMIN_KICK = 'admin:kick',
  ADMIN_BAN = 'admin:ban',
  ADMIN_MANAGE = 'admin:manage'
}

// Request additional permissions
await client.bots.requestPermission(bot.id, {
  permissions: [BotPermission.FILES_READ, BotPermission.FILES_WRITE],
  reason: 'Needed to process file attachments'
});
```

### OAuth Flow

```typescript
// Generate OAuth URL
const authUrl = client.bots.getOAuthUrl(bot.id, {
  redirect_uri: 'https://your-app.com/oauth/callback',
  scope: ['messages:read', 'messages:write', 'channels:read'],
  state: 'random-state-string'
});

// Handle OAuth callback
app.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // Exchange code for tokens
  const tokens = await client.bots.exchangeCode(code, {
    redirect_uri: 'https://your-app.com/oauth/callback'
  });
  
  // Store tokens securely
  await storeTokens(tokens);
  
  res.send('Bot authorized successfully!');
});
```

## Rate Limits

### Bot Rate Limits

```typescript
// Bot-specific rate limits
const botRateLimits = {
  messages: {
    perSecond: 20,
    perMinute: 100,
    perHour: 5000
  },
  commands: {
    perMinute: 60
  },
  reactions: {
    perMinute: 100
  }
};

// Handle rate limit errors
client.on('rateLimit', (data) => {
  console.log(`Rate limited. Reset in ${data.resetAfter}ms`);
});

// Automatic retry with backoff
client.setRetryConfig({
  maxRetries: 3,
  backoffStrategy: 'exponential',
  initialDelay: 1000
});
```

## Bot Hosting

### Webhook Mode

```typescript
// Configure bot for webhook mode
const bot = await client.bots.configure(botId, {
  mode: 'webhook',
  endpoint: 'https://your-server.com/bot/webhook',
  verifyToken: 'your-verify-token'
});
```

### WebSocket Mode

```typescript
// Connect via WebSocket
const ws = new WebSocket('wss://gateway.vcomm.io');

ws.on('message', async (data) => {
  const payload = JSON.parse(data);
  
  // Handle events
  switch (payload.t) {
    case 'MESSAGE_CREATE':
      await handleMessage(payload.d);
      break;
    case 'INTERACTION_CREATE':
      await handleInteraction(payload.d);
      break;
  }
});

// Heartbeat
setInterval(() => {
  ws.send(JSON.stringify({ op: 1, d: null }));
}, 45000);
```

## Best Practices

### Security

1. **Never expose bot tokens** in client-side code
2. **Verify webhook signatures** on all incoming requests
3. **Use minimal permissions** required for functionality
4. **Log all actions** for audit purposes

### Performance

1. **Use webhooks** for high-volume bots
2. **Cache frequently accessed data**
3. **Implement rate limiting** for external API calls
4. **Handle errors gracefully** with user-friendly messages

### User Experience

1. **Respond quickly** to commands (under 3 seconds)
2. **Use ephemeral messages** for private responses
3. **Provide clear error messages**
4. **Include help text** for all commands

## See Also

- [API Reference](../api/index)
- [Channels](./channels)
- [Webhooks](../api/rest/webhooks)
- [Getting Started](../getting-started/quick-start)