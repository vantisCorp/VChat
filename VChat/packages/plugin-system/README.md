# @vcomm/plugin-system

A comprehensive, secure plugin system for V-COMM applications. Provides complete plugin lifecycle management, powerful hooks system, security sandboxing, and marketplace integration.

## Features

- **Plugin Lifecycle Management** - Install, enable, disable, uninstall, and reload plugins
- **Powerful Hooks System** - 30+ hook types for extensibility
- **Security Sandboxing** - Permission-based access control with resource limits
- **Dependency Management** - Automatic dependency resolution and conflict detection
- **Marketplace Integration** - Browse, search, and install plugins from marketplace
- **Type-Safe** - Full TypeScript support with comprehensive types

## Installation

```bash
npm install @vcomm/plugin-system
```

## Quick Start

```typescript
import { PluginSystem } from '@vcomm/plugin-system';

// Create plugin system instance
const pluginSystem = new PluginSystem({
  pluginDirs: ['./plugins'],
  enforcePermissions: true,
  debug: true,
});

// Initialize
await pluginSystem.initialize();

// Install a plugin
const plugin = await pluginSystem.install('./plugins/my-plugin');

// Enable it
await pluginSystem.enable('com.example.my-plugin');

// Use hooks
await pluginSystem.executeHook('message.before-send', {
  pluginId: 'core',
  data: { content: 'Hello!' },
  timestamp: new Date(),
});
```

## Plugin Manifest (vcomm.json)

Every plugin must have a `vcomm.json` manifest file:

```json
{
  "id": "com.example.my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A sample plugin",
  "author": {
    "id": "developer",
    "name": "Developer Name",
    "email": "dev@example.com"
  },
  "main": "dist/index.js",
  "permissions": [
    "message.read",
    "message.write"
  ],
  "dependencies": [
    {
      "pluginId": "com.example.utils",
      "minVersion": "1.0.0",
      "optional": false
    }
  ],
  "tags": ["utility", "messaging"],
  "homepage": "https://example.com/plugin",
  "repository": "https://github.com/example/plugin"
}
```

## Hook System

### Available Hooks

#### Lifecycle Hooks
- `plugin.before-install` / `plugin.after-install`
- `plugin.before-enable` / `plugin.after-enable`
- `plugin.before-disable` / `plugin.after-disable`
- `plugin.before-uninstall` / `plugin.after-uninstall`
- `plugin.before-update` / `plugin.after-update`

#### Message Hooks
- `message.before-send` / `message.after-send`
- `message.before-edit` / `message.after-edit`
- `message.before-delete` / `message.after-delete`
- `message.received` / `message.read`

#### Channel Hooks
- `channel.before-create` / `channel.after-create`
- `channel.before-delete` / `channel.after-delete`
- `channel.before-update` / `channel.after-update`

#### User Hooks
- `user.before-join` / `user.after-join`
- `user.before-leave` / `user.after-leave`
- `user.before-ban` / `user.after-ban`
- `user.before-kick` / `user.after-kick`
- `user.profile-update`

#### Server Hooks
- `server.before-create` / `server.after-create`
- `server.before-delete` / `server.after-delete`
- `server.settings-update`

#### Voice Hooks
- `voice.before-join` / `voice.after-join`
- `voice.before-leave` / `voice.after-leave`
- `voice.mute` / `voice.deafen` / `voice.move`

### Registering Hooks

```typescript
// Register a hook handler
const handlerId = pluginSystem.registerHook(
  'message.before-send',
  'com.example.my-plugin',
  async (context) => {
    // Modify message
    context.data.content = context.data.content.toUpperCase();
    return { success: true, data: context.data };
  },
  { priority: 10 }  // Lower priority = executed first
);

// Unregister when done
pluginSystem.unregisterHook(handlerId);
```

## Permissions

### Available Permissions

| Permission | Description |
|------------|-------------|
| `message.read` | Read messages |
| `message.write` | Send messages |
| `message.delete.own` | Delete own messages |
| `message.delete.any` | Delete any message |
| `channel.read` | Read channels |
| `channel.write` | Create channels |
| `channel.manage` | Manage channels |
| `user.read` | Read user info |
| `user.write` | Modify users |
| `user.ban` | Ban users |
| `user.kick` | Kick users |
| `server.read` | Read server info |
| `server.write` | Modify server |
| `server.manage` | Manage server settings |
| `voice.read` | Read voice state |
| `voice.write` | Join voice channels |
| `voice.manage` | Manage voice channels |
| `permissions.read` | Read permissions |
| `permissions.write` | Modify permissions |
| `permissions.manage` | Manage permission roles |

### Checking Permissions

```typescript
const allowed = pluginSystem.checkPermission(
  'com.example.my-plugin',
  'message.read',
  {
    pluginId: 'com.example.my-plugin',
    userId: 'user123',
    serverId: 'server456',
    channelId: 'channel789',
    userRoles: ['member', 'moderator'],
    timestamp: new Date(),
  }
);
```

## Security Sandbox

The sandbox provides secure execution for plugin code:

```typescript
// Execute code in sandbox
const result = await pluginSystem.executeInSandbox(
  'com.example.my-plugin',
  async () => {
    // This code runs with enforced permissions
    // and resource limits
    return someOperation();
  }
);

// Get resource metrics
const metrics = pluginSystem.getPluginMetrics('com.example.my-plugin');
console.log(`CPU time: ${metrics.cpuTime}ms`);
console.log(`Memory: ${metrics.memoryUsed} bytes`);
console.log(`Errors: ${metrics.errors}`);
```

## Dependency Management

Plugins can declare dependencies:

```json
{
  "dependencies": [
    {
      "pluginId": "com.example.utils",
      "minVersion": "1.0.0",
      "maxVersion": "2.0.0",
      "optional": false
    }
  ]
}
```

Detect conflicts:

```typescript
const conflicts = pluginSystem.detectConflicts();
// Returns array of conflicts with severity levels
```

## Plugin Instance Structure

```typescript
interface PluginInstance {
  id: string;                    // Unique plugin ID
  manifest: PluginManifest;      // Full manifest
  status: PluginStatus;          // Current status
  installedAt: Date;             // Installation date
  updatedAt: Date;               // Last update date
  enabled: boolean;              // Is enabled
  permissions: PluginPermission[]; // Granted permissions
  settings: Record<string, unknown>; // User settings
  stats: {
    hookCalls: number;           // Total hook invocations
    errors: number;              // Error count
    lastError?: Error;           // Last error
    lastActiveAt?: Date;         // Last activity
  };
}
```

## API Reference

### PluginSystem

Main class for managing plugins.

#### Methods

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize the plugin system |
| `install(source)` | Install a plugin |
| `uninstall(pluginId)` | Uninstall a plugin |
| `enable(pluginId)` | Enable a plugin |
| `disable(pluginId)` | Disable a plugin |
| `reload(pluginId)` | Reload a plugin |
| `getPlugin(pluginId)` | Get plugin instance |
| `getPlugins()` | Get all plugins |
| `getEnabledPlugins()` | Get enabled plugins |
| `isInstalled(pluginId)` | Check if installed |
| `isEnabled(pluginId)` | Check if enabled |
| `registerHook(...)` | Register hook handler |
| `unregisterHook(handlerId)` | Unregister hook |
| `executeHook(...)` | Execute hook |
| `checkPermission(...)` | Check permission |
| `executeInSandbox(...)` | Execute in sandbox |
| `getPluginMetrics(pluginId)` | Get resource metrics |
| `detectConflicts()` | Detect plugin conflicts |
| `searchPlugins(query)` | Search plugins |
| `updatePluginSettings(...)` | Update settings |
| `exportState()` | Export system state |
| `shutdown()` | Shutdown system |

## Configuration

```typescript
interface PluginSystemConfig {
  // Directories to scan for plugins
  pluginDirs?: string[];
  
  // Maximum number of plugins allowed
  maxPlugins?: number;
  
  // Enforce permission checks
  enforcePermissions?: boolean;
  
  // Enable sandboxing
  enableSandbox?: boolean;
  
  // Enable marketplace features
  enableMarketplace?: boolean;
  
  // Execution timeout (ms)
  executionTimeout?: number;
  
  // Enable debug logging
  debug?: boolean;
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `NOT_FOUND` | Plugin not found |
| `PLUGIN_ALREADY_EXISTS` | Plugin already installed |
| `PLUGIN_ENABLED` | Plugin is enabled |
| `INVALID_MANIFEST` | Invalid manifest format |
| `INVALID_SOURCE` | Invalid plugin source |
| `DEPENDENCY_MISSING` | Required dependency missing |
| `DEPENDENCY_CONFLICT` | Dependency conflict |
| `PERMISSION_DENIED` | Permission not granted |
| `EXECUTION_TIMEOUT` | Execution timed out |
| `LOAD_IN_PROGRESS` | Plugin is being loaded |
| `LIMIT_EXCEEDED` | Plugin limit reached |
| `NOT_INITIALIZED` | System not initialized |
| `NOT_IMPLEMENTED` | Feature not implemented |
| `REMOTE_LOAD_DISABLED` | Remote loading disabled |
| `FETCH_FAILED` | Failed to fetch plugin |

## License

MIT
