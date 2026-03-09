/**
 * @vcomm/plugin-system - Type Definitions
 *
 * Comprehensive type definitions for the plugin system including
 * lifecycle management, hooks, permissions, and marketplace integration.
 */

// ============================================================================
// Plugin Identity & Metadata
// ============================================================================

/**
 * Plugin status in the lifecycle
 */
export type PluginStatus =
  | 'uninstalled'
  | 'installed'
  | 'enabled'
  | 'disabled'
  | 'error'
  | 'updating';

/**
 * Plugin visibility level
 */
export type PluginVisibility = 'public' | 'private' | 'unlisted';

/**
 * Plugin category for marketplace organization
 */
export type PluginCategory =
  | 'integration'
  | 'moderation'
  | 'automation'
  | 'entertainment'
  | 'productivity'
  | 'communication'
  | 'security'
  | 'analytics'
  | 'custom';

/**
 * Plugin author information
 */
export interface PluginAuthor {
  /** Author ID (user or organization) */
  id: string;
  /** Display name */
  name: string;
  /** Email address */
  email?: string;
  /** Website URL */
  url?: string;
  /** Avatar URL */
  avatar?: string;
  /** Whether the author is verified */
  verified?: boolean;
}

/**
 * Plugin version following semantic versioning
 */
export interface PluginVersion {
  /** Version string (e.g., '1.2.3') */
  version: string;
  /** Release notes */
  releaseNotes?: string;
  /** Minimum V-COMM version required */
  minCoreVersion?: string;
  /** Maximum V-COMM version supported */
  maxCoreVersion?: string;
  /** Breaking changes in this version */
  breakingChanges?: string[];
  /** Dependencies on other plugins */
  dependencies?: PluginDependency[];
  /** Published date */
  publishedAt: Date;
  /** Download count for this version */
  downloadCount?: number;
}

/**
 * Plugin dependency
 */
export interface PluginDependency {
  /** Dependency plugin ID */
  pluginId: string;
  /** Minimum version required */
  minVersion?: string;
  /** Maximum version supported */
  maxVersion?: string;
  /** Whether the dependency is optional */
  optional?: boolean;
}

/**
 * Plugin manifest (vcomm.json)
 */
export interface PluginManifest {
  /** Unique plugin identifier (e.g., 'com.example.my-plugin') */
  id: string;
  /** Plugin name */
  name: string;
  /** Plugin version */
  version: string;
  /** Plugin description */
  description: string;
  /** Author information */
  author: PluginAuthor;
  /** Contributors */
  contributors?: PluginAuthor[];
  /** Plugin homepage URL */
  homepage?: string;
  /** Repository URL */
  repository?: string;
  /** License (SPDX identifier) */
  license: string;
  /** Plugin keywords for search */
  keywords?: string[];
  /** Plugin tags */
  tags?: string[];
  /** Plugin category */
  category: PluginCategory;
  /** Visibility in marketplace */
  visibility?: PluginVisibility;
  /** Plugin icon URL */
  icon?: string;
  /** Plugin screenshots */
  screenshots?: string[];
  /** Minimum V-COMM version required */
  minCoreVersion?: string;
  /** Node.js compatibility */
  nodeVersion?: string;
  /** Dependencies on other plugins */
  dependencies?: PluginDependency[];
  /** Required permissions */
  permissions?: PluginPermission[];
  /** Extension points (hooks) */
  hooks?: HookDefinition[];
  /** Configuration schema */
  configSchema?: PluginConfigSchema;
  /** Entry points */
  main: string;
  /** Backend entry point */
  backend?: string;
  /** Frontend entry point */
  frontend?: string;
  /** Web-only entry point */
  web?: string;
}

// ============================================================================
// Plugin Instance & Lifecycle
// ============================================================================

/**
 * Plugin instance (runtime)
 */
export interface PluginInstance {
  /** Plugin ID */
  id: string;
  /** Manifest */
  manifest: PluginManifest;
  /** Current status */
  status: PluginStatus;
  /** Installation path */
  installPath?: string;
  /** Installed version */
  installedVersion?: string;
  /** Configuration */
  config?: Record<string, unknown>;
  /** Installation date */
  installedAt: Date;
  /** Last update date */
  updatedAt: Date;
  /** Error message if status is 'error' */
  error?: string;
  /** Enabled for scopes (servers/spaces) */
  enabledScopes?: string[];
  /** Statistics */
  stats?: PluginStats;
  /** Whether the plugin is enabled */
  enabled?: boolean;
  /** Plugin settings */
  settings?: Record<string, unknown>;
  /** Plugin permissions */
  permissions?: PluginPermission[];
}

/**
 * Plugin statistics
 */
export interface PluginStats {
  /** Total activations */
  activations?: number;
  /** Total deactivations */
  deactivations?: number;
  /** Errors count */
  errors?: number;
  /** Average execution time (ms) */
  avgExecutionTime?: number;
  /** Last execution time */
  lastExecutionAt?: Date;
  /** Memory usage (bytes) */
  memoryUsage?: number;
  /** Hook calls count */
  hookCalls?: number;
  /** Last error */
  lastError?: Error;
  /** Last active at */
  lastActiveAt?: Date;
}

// ============================================================================
// Plugin Permissions
// ============================================================================

/**
 * Plugin permission type
 */
export type PluginPermissionType =
  // Network permissions
  | 'network:fetch'
  | 'network:websocket'
  | 'network:http-server'
  // File system permissions
  | 'fs:read'
  | 'fs:write'
  | 'fs:delete'
  // User data permissions
  | 'user:read'
  | 'user:write'
  // Message permissions
  | 'message:read'
  | 'message:write'
  | 'message:delete'
  // Server permissions
  | 'server:read'
  | 'server:config'
  | 'server:manage'
  // Channel permissions
  | 'channel:read'
  | 'channel:create'
  | 'channel:delete'
  // System permissions
  | 'system:storage'
  | 'system:notifications'
  | 'system:clipboard'
  // Plugin permissions
  | 'plugin:install'
  | 'plugin:configure';

/**
 * Plugin permission definition
 */
export interface PluginPermission {
  /** Permission type */
  type: PluginPermissionType;
  /** Optional reason for the permission */
  reason?: string;
  /** Permission scope (all, current-server, own-messages) */
  scope?: 'all' | 'server' | 'channel' | 'user';
}

/**
 * Permission check context
 */
export interface PermissionCheckContext {
  /** Plugin ID requesting permission */
  pluginId: string;
  /** Permission type to check */
  permission: PluginPermissionType;
  /** Resource being accessed */
  resource?: string;
  /** Additional context for the check */
  context?: Record<string, unknown>;
  /** Server ID */
  serverId?: string;
  /** Channel ID */
  channelId?: string;
  /** User ID */
  userId?: string;
  /** User roles */
  userRoles?: string[];
  /** Timestamp */
  timestamp?: Date;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Hooks System
// ============================================================================

/**
 * Hook types that plugins can register for
 */
export type HookType =
  // Lifecycle hooks
  | 'plugin:install'
  | 'plugin:uninstall'
  | 'plugin:enable'
  | 'plugin:disable'
  | 'plugin:update'
  | 'plugin:config'
  // Message hooks
  | 'message:pre-send'
  | 'message:post-send'
  | 'message:receive'
  | 'message:edit'
  | 'message:delete'
  | 'message:reaction'
  // User hooks
  | 'user:join'
  | 'user:leave'
  | 'user:update'
  | 'user:ban'
  | 'user:kick'
  // Server hooks
  | 'server:create'
  | 'server:delete'
  | 'server:update'
  | 'server:member-join'
  | 'server:member-leave'
  // Channel hooks
  | 'channel:create'
  | 'channel:delete'
  | 'channel:update'
  // Command hooks
  | 'command:register'
  | 'command:execute'
  | 'command:autocomplete'
  // API hooks
  | 'api:request'
  | 'api:response'
  // Custom hooks
  | string;

/**
 * Hook definition in manifest
 */
export interface HookDefinition {
  /** Hook type */
  type: HookType;
  /** Priority (higher = executed first) */
  priority?: number;
  /** Whether the hook can modify the data */
  mutable?: boolean;
  /** Whether the hook is async */
  async?: boolean;
}

/**
 * Hook handler function
 */
export type HookHandler<T = unknown, R = unknown> = (context: HookContext<T>) => R | Promise<R>;

/**
 * Hook execution context
 */
export interface HookContext<T = unknown> {
  /** Hook type */
  type: HookType;
  /** Plugin ID that registered the hook */
  pluginId: string;
  /** Event data */
  data: T;
  /** Server/space ID where the event occurred */
  scopeId?: string;
  /** User who triggered the event */
  userId?: string;
  /** Timestamp */
  timestamp: Date;
  /** Whether the event can be modified */
  mutable: boolean;
  /** Stop propagation flag */
  stopped: boolean;
  /** Modified data */
  modifiedData?: T;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Hook execution result
 */
export interface HookResult<T = unknown> {
  /** Whether the hook executed successfully */
  success: boolean;
  /** Result data */
  data?: T;
  /** Error if failed */
  error?: Error;
  /** All errors that occurred during execution */
  errors?: Error[];
  /** Whether propagation was stopped */
  stopped?: boolean;
  /** Execution duration in ms */
  duration?: number;
}

/**
 * Hook registration
 */
export interface HookRegistration {
  /** Registration ID */
  id: string;
  /** Plugin ID */
  pluginId: string;
  /** Hook type */
  type: HookType;
  /** Handler function */
  handler: HookHandler<unknown, unknown>;
  /** Priority */
  priority: number;
  /** Whether hook can mutate data */
  mutable: boolean;
  /** Whether hook is async */
  async: boolean;
  /** Registration date */
  registeredAt: Date;
}

// ============================================================================
// Plugin Configuration
// ============================================================================

/**
 * Plugin configuration schema
 */
export interface PluginConfigSchema {
  /** JSON Schema for validation */
  type: 'object';
  /** Configuration properties */
  properties: Record<string, PluginConfigProperty>;
  /** Required properties */
  required?: string[];
  /** Default values */
  default?: Record<string, unknown>;
}

/**
 * Plugin configuration property
 */
export interface PluginConfigProperty {
  /** Property type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Property title */
  title?: string;
  /** Property description */
  description?: string;
  /** Default value */
  default?: unknown;
  /** Enum values (for string type) */
  enum?: string[];
  /** Minimum value (for number type) */
  minimum?: number;
  /** Maximum value (for number type) */
  maximum?: number;
  /** Minimum length (for string type) */
  minLength?: number;
  /** Maximum length (for string type) */
  maxLength?: number;
  /** Pattern (for string type) */
  pattern?: string;
  /** Items schema (for array type) */
  items?: PluginConfigProperty;
  /** Nested properties (for object type) */
  properties?: Record<string, PluginConfigProperty>;
}

/**
 * Plugin configuration update
 */
export interface PluginConfigUpdate {
  /** Plugin ID */
  pluginId: string;
  /** Scope ID (server/space) */
  scopeId?: string;
  /** Configuration values */
  config: Record<string, unknown>;
  /** User who made the change */
  changedBy: string;
}

// ============================================================================
// Marketplace Types
// ============================================================================

/**
 * Marketplace plugin listing
 */
export interface MarketplacePlugin {
  /** Plugin ID */
  id: string;
  /** Plugin name */
  name: string;
  /** Short description */
  shortDescription: string;
  /** Full description (markdown) */
  description: string;
  /** Author */
  author: PluginAuthor;
  /** Latest version */
  latestVersion: string;
  /** All available versions */
  versions: PluginVersion[];
  /** Category */
  category: PluginCategory;
  /** Icon URL */
  icon?: string;
  /** Screenshots */
  screenshots?: string[];
  /** Keywords */
  keywords: string[];
  /** Total downloads */
  downloads: number;
  /** Average rating */
  rating?: number;
  /** Review count */
  reviewCount?: number;
  /** Featured status */
  featured?: boolean;
  /** Created date */
  createdAt: Date;
  /** Last updated date */
  updatedAt: Date;
  /** Repository URL */
  repository?: string;
  /** Homepage URL */
  homepage?: string;
  /** License */
  license: string;
  /** Required permissions */
  permissions: PluginPermission[];
}

/**
 * Marketplace search query
 */
export interface MarketplaceSearchQuery {
  /** Search term */
  query?: string;
  /** Filter by category */
  category?: PluginCategory;
  /** Filter by author */
  authorId?: string;
  /** Sort by */
  sortBy?: 'relevance' | 'downloads' | 'rating' | 'updated' | 'created';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Pagination offset */
  offset?: number;
  /** Pagination limit */
  limit?: number;
}

/**
 * Marketplace search result
 */
export interface MarketplaceSearchResult {
  /** Matching plugins */
  plugins: MarketplacePlugin[];
  /** Total count */
  total: number;
  /** Whether there are more results */
  hasMore: boolean;
}

// ============================================================================
// Plugin API Types
// ============================================================================

/**
 * Plugin API context
 */
export interface PluginAPIContext {
  /** Plugin ID */
  pluginId: string;
  /** Scope ID */
  scopeId?: string;
  /** Logger */
  logger: PluginLogger;
  /** Storage */
  storage: PluginStorage;
  /** HTTP client */
  fetch: typeof fetch;
}

/**
 * Plugin logger
 */
export interface PluginLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Plugin storage interface
 */
export interface PluginStorage {
  /** Get a value */
  get<T = unknown>(key: string): Promise<T | undefined>;
  /** Set a value */
  set<T>(key: string, value: T): Promise<void>;
  /** Delete a value */
  delete(key: string): Promise<void>;
  /** Clear all values */
  clear(): Promise<void>;
  /** Get all keys */
  keys(): Promise<string[]>;
}

// ============================================================================
// Plugin System Configuration
// ============================================================================

/**
 * Plugin system configuration
 */
export interface PluginSystemConfig {
  /** Plugins directory */
  pluginsDir?: string;
  /** Plugin directories (alias) */
  pluginDirs?: string[];
  /** Maximum plugins per server */
  maxPluginsPerServer?: number;
  /** Maximum plugins total */
  maxPlugins?: number;
  /** Enable sandbox */
  enableSandbox?: boolean;
  /** Sandbox memory limit (MB) */
  sandboxMemoryLimit?: number;
  /** Sandbox execution timeout (ms) */
  sandboxTimeout?: number;
  /** Execution timeout (alias) */
  executionTimeout?: number;
  /** Marketplace URL */
  marketplaceUrl?: string;
  /** Enable marketplace */
  enableMarketplace?: boolean;
  /** Allowed plugin categories (empty = all) */
  allowedCategories?: PluginCategory[];
  /** Require approval for plugins */
  requireApproval?: boolean;
  /** Plugin audit logging */
  enableAuditLog?: boolean;
  /** Enforce permissions */
  enforcePermissions?: boolean;
  /** Debug mode */
  debug?: boolean;
}

/**
 * Plugin system options
 */
export interface PluginSystemOptions extends PluginSystemConfig {
  /** Database connection string */
  databaseUrl?: string;
  /** Redis connection for caching */
  redisUrl?: string;
}

// ============================================================================
// Plugin Error Codes
// ============================================================================

// ============================================================================
// Plugin Events
// ============================================================================

/**
 * Plugin event type
 */
export type PluginEventType =
  | 'plugin:installed'
  | 'plugin:uninstalled'
  | 'plugin:enabled'
  | 'plugin:disabled'
  | 'plugin:updated'
  | 'plugin:error'
  | 'plugin:config-changed';

/**
 * Plugin event
 */
export interface PluginEvent {
  /** Event type */
  type: PluginEventType;
  /** Plugin ID */
  pluginId: string;
  /** Timestamp */
  timestamp: Date;
  /** Event data */
  data?: unknown;
  /** Error (if applicable) */
  error?: Error;
}

/**
 * Plugin event handler
 */
export type PluginEventHandler = (event: PluginEvent) => void | Promise<void>;

// ============================================================================
// Plugin Errors
// ============================================================================

/**
 * Plugin error codes
 */
export enum PluginErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_INSTALLED = 'ALREADY_INSTALLED',
  ALREADY_INITIALIZED = 'ALREADY_INITIALIZED',
  PLUGIN_ALREADY_EXISTS = 'PLUGIN_ALREADY_EXISTS',
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  DEPENDENCY_MISSING = 'DEPENDENCY_MISSING',
  DEPENDENCY_CONFLICT = 'DEPENDENCY_CONFLICT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SANDBOX_VIOLATION = 'SANDBOX_VIOLATION',
  INSTALLATION_FAILED = 'INSTALLATION_FAILED',
  LOAD_FAILED = 'LOAD_FAILED',
  ENABLE_FAILED = 'ENABLE_FAILED',
  DISABLE_FAILED = 'DISABLE_FAILED',
  UNINSTALL_FAILED = 'UNINSTALL_FAILED',
  CONFIG_ERROR = 'CONFIG_ERROR',
  HOOK_ERROR = 'HOOK_ERROR',
  MANIFEST_INVALID = 'MANIFEST_INVALID',
  INVALID_MANIFEST = 'INVALID_MANIFEST',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  EXECUTION_TIMEOUT = 'EXECUTION_TIMEOUT',
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  UNKNOWN = 'UNKNOWN',
  PLUGIN_ENABLED = 'PLUGIN_ENABLED',
  INVALID_SOURCE = 'INVALID_SOURCE',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  REMOTE_LOAD_DISABLED = 'REMOTE_LOAD_DISABLED',
  FETCH_FAILED = 'FETCH_FAILED',
  LOAD_IN_PROGRESS = 'LOAD_IN_PROGRESS',
}

/**
 * Plugin error class
 */
export class PluginError extends Error {
  constructor(
    public code: PluginErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

// ============================================================================
// Additional Plugin Types
// ============================================================================

/**
 * Plugin lifecycle
 */
export type PluginLifecycle = 'install' | 'enable' | 'disable' | 'uninstall' | 'update';

/**
 * Plugin lifecycle event
 */
export interface PluginLifecycleEvent {
  pluginId: string;
  lifecycle: PluginLifecycle;
  timestamp: Date;
  success: boolean;
  error?: Error;
}

/**
 * Plugin lifecycle callback
 */
export type PluginLifecycleCallback = (event: PluginLifecycleEvent) => void | Promise<void>;

/**
 * Permission grant
 */
export interface PermissionGrant {
  pluginId: string;
  permission: PluginPermissionType;
  granted: boolean;
  grantedAt: Date;
  grantedBy?: string;
}

/**
 * Hook registration options
 */
export interface HookRegistrationOptions {
  priority?: number;
  once?: boolean;
  async?: boolean;
}

/**
 * Plugin config field
 */
export interface PluginConfigField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  label: string;
  description?: string;
  default?: PluginConfigValue;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: PluginConfigValue[];
  };
}

/**
 * Plugin config value
 */
export type PluginConfigValue =
  | string
  | number
  | boolean
  | PluginConfigValueArray
  | PluginConfigValueRecord;

/**
 * Plugin config value array
 */
export interface PluginConfigValueArray extends Array<PluginConfigValue> {}

/**
 * Plugin config value record
 */
export interface PluginConfigValueRecord extends Record<string, PluginConfigValue> {}

/**
 * Plugin user settings
 */
export interface PluginUserSettings {
  pluginId: string;
  userId: string;
  settings: Record<string, PluginConfigValue>;
  updatedAt: Date;
}

/**
 * Marketplace version
 */
export interface MarketplaceVersion {
  version: string;
  publishedAt: Date;
  changelog?: string;
  minAppVersion?: string;
  maxAppVersion?: string;
}

/**
 * Plugin load result
 */
export interface PluginLoadResult {
  success: boolean;
  plugin?: PluginInstance;
  error?: Error;
  warnings?: string[];
}
