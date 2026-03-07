/**
 * @vcomm/beta-release - Feature Flags System
 * 
 * Provides comprehensive feature flag management with targeting rules,
 * A/B testing variants, and percentage rollouts.
 */

import {
  FeatureFlagConfig,
  FeatureFlagStatus,
  FeatureFlagType,
  FeatureFlagResult,
  FeatureVariant,
  TargetingRule,
  TargetingCondition,
  TargetingOperator,
  EvaluationContext,
  BetaReleaseError,
  BetaReleaseErrorCode,
} from '../types';

/**
 * Feature flags manager configuration
 */
export interface FeatureFlagsConfig {
  /** Default evaluation result */
  defaultResult?: FeatureFlagResult;
  /** Enable caching */
  enableCache?: boolean;
  /** Cache TTL in seconds */
  cacheTtl?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Default feature flags configuration
 */
const DEFAULT_FEATURE_FLAGS_CONFIG: Required<FeatureFlagsConfig> = {
  defaultResult: { enabled: false },
  enableCache: true,
  cacheTtl: 60,
  debug: false,
};

/**
 * Cache entry
 */
interface CacheEntry {
  result: FeatureFlagResult;
  expiresAt: number;
}

/**
 * FeatureFlags - Manages feature flags with targeting and variants
 * 
 * @example
 * ```typescript
 * const flags = new FeatureFlags();
 * 
 * // Create a flag
 * flags.create({
 *   key: 'new-feature',
 *   name: 'New Feature',
 *   type: 'boolean',
 *   status: 'enabled',
 *   defaultValue: { enabled: false },
 *   rules: [],
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   createdBy: 'admin',
 * });
 * 
 * // Evaluate for a user
 * const result = flags.evaluate('new-feature', {
 *   userId: 'user123',
 *   email: 'user@example.com',
 * });
 * ```
 */
export class FeatureFlags {
  private flags: Map<string, FeatureFlagConfig> = new Map();
  private config: Required<FeatureFlagsConfig>;
  private cache: Map<string, CacheEntry> = new Map();
  private evaluationCount: Map<string, number> = new Map();

  constructor(config: FeatureFlagsConfig = {}) {
    this.config = { ...DEFAULT_FEATURE_FLAGS_CONFIG, ...config };
  }

  /**
   * Create a new feature flag
   */
  create(config: FeatureFlagConfig): FeatureFlagConfig {
    if (this.flags.has(config.key)) {
      throw new BetaReleaseError(
        `Feature flag ${config.key} already exists`,
        BetaReleaseErrorCode.FLAG_ALREADY_EXISTS
      );
    }

    this.validateFlagConfig(config);
    this.flags.set(config.key, config);
    this.invalidateCache(config.key);

    return config;
  }

  /**
   * Get a feature flag configuration
   */
  get(key: string): FeatureFlagConfig | undefined {
    return this.flags.get(key);
  }

  /**
   * Update a feature flag
   */
  update(key: string, updates: Partial<FeatureFlagConfig>): FeatureFlagConfig {
    const existing = this.flags.get(key);
    if (!existing) {
      throw new BetaReleaseError(
        `Feature flag ${key} not found`,
        BetaReleaseErrorCode.FLAG_NOT_FOUND
      );
    }

    const updated: FeatureFlagConfig = {
      ...existing,
      ...updates,
      key: existing.key, // Prevent key change
      updatedAt: new Date(),
    };

    this.validateFlagConfig(updated);
    this.flags.set(key, updated);
    this.invalidateCache(key);

    return updated;
  }

  /**
   * Delete a feature flag
   */
  delete(key: string): boolean {
    const result = this.flags.delete(key);
    if (result) {
      this.invalidateCache(key);
      this.evaluationCount.delete(key);
    }
    return result;
  }

  /**
   * Evaluate a feature flag for a context
   */
  evaluate(key: string, context: EvaluationContext = {}): FeatureFlagResult {
    // Track evaluation count
    const count = this.evaluationCount.get(key) || 0;
    this.evaluationCount.set(key, count + 1);

    // Check cache
    if (this.config.enableCache) {
      const cached = this.getCachedResult(key, context);
      if (cached) {
        return cached;
      }
    }

    const flag = this.flags.get(key);
    if (!flag) {
      this.logDebug(`Flag ${key} not found, returning default`);
      return this.config.defaultResult;
    }

    let result: FeatureFlagResult;

    // Check flag status
    if (flag.status === 'disabled') {
      result = { ...flag.defaultValue, reason: 'flag_disabled' };
    } else if (flag.status === 'partial') {
      // Partial - check targeting rules
      result = this.evaluateRules(flag, context);
    } else {
      // Enabled - check rules or return enabled
      if (flag.rules.length > 0) {
        result = this.evaluateRules(flag, context);
      } else if (flag.rolloutPercentage !== undefined) {
        result = this.evaluatePercentage(flag, context);
      } else {
        result = { enabled: true, reason: 'flag_enabled' };
      }
    }

    // Handle variants
    if (result.enabled && flag.variants && flag.variants.length > 0) {
      const variant = this.selectVariant(flag, context);
      result.variant = variant?.key;
      result.config = variant?.config;
    }

    // Cache the result
    if (this.config.enableCache) {
      this.cacheResult(key, context, result);
    }

    this.logDebug(`Evaluated ${key}: enabled=${result.enabled}, reason=${result.reason}`);
    return result;
  }

  /**
   * Evaluate targeting rules
   */
  private evaluateRules(flag: FeatureFlagConfig, context: EvaluationContext): FeatureFlagResult {
    // Sort rules by priority
    const sortedRules = [...flag.rules]
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      if (this.matchesRule(rule, context)) {
        return {
          ...rule.result,
          reason: `rule:${rule.name}`,
        };
      }
    }

    // No rules matched, check percentage rollout
    if (flag.rolloutPercentage !== undefined) {
      return this.evaluatePercentage(flag, context);
    }

    // Return default value
    return { ...flag.defaultValue, reason: 'no_rules_matched' };
  }

  /**
   * Check if a rule matches the context
   */
  private matchesRule(rule: TargetingRule, context: EvaluationContext): boolean {
    if (rule.conditions.length === 0) {
      return true;
    }

    const results = rule.conditions.map(condition => 
      this.matchesCondition(condition, context)
    );

    return rule.matchAll 
      ? results.every(Boolean) 
      : results.some(Boolean);
  }

  /**
   * Check if a condition matches the context
   */
  private matchesCondition(condition: TargetingCondition, context: EvaluationContext): boolean {
    const value = this.getContextValue(condition.property, context);
    
    if (value === undefined || value === null) {
      return condition.operator === 'is_not_set';
    }

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      
      case 'not_equals':
        return value !== condition.value;
      
      case 'contains':
        return String(value).includes(String(condition.value));
      
      case 'not_contains':
        return !String(value).includes(String(condition.value));
      
      case 'starts_with':
        return String(value).startsWith(String(condition.value));
      
      case 'ends_with':
        return String(value).endsWith(String(condition.value));
      
      case 'greater_than':
        return Number(value) > Number(condition.value);
      
      case 'less_than':
        return Number(value) < Number(condition.value);
      
      case 'greater_or_equal':
        return Number(value) >= Number(condition.value);
      
      case 'less_or_equal':
        return Number(value) <= Number(condition.value);
      
      case 'in':
        if (Array.isArray(condition.value)) {
          return condition.value.includes(value as string);
        }
        return false;
      
      case 'not_in':
        if (Array.isArray(condition.value)) {
          return !condition.value.includes(value as string);
        }
        return true;
      
      case 'matches_regex':
        try {
          return new RegExp(String(condition.value)).test(String(value));
        } catch {
          return false;
        }
      
      case 'is_set':
        return value !== undefined && value !== null;
      
      case 'is_not_set':
        return value === undefined || value === null;
      
      default:
        return false;
    }
  }

  /**
   * Get a value from the context
   */
  private getContextValue(property: string, context: EvaluationContext): unknown {
    // Handle nested properties
    const parts = property.split('.');
    let value: unknown = context;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Evaluate percentage rollout
   */
  private evaluatePercentage(flag: FeatureFlagConfig, context: EvaluationContext): FeatureFlagResult {
    const percentage = flag.rolloutPercentage || 0;
    
    if (percentage >= 100) {
      return { enabled: true, reason: 'rollout_100' };
    }
    
    if (percentage <= 0) {
      return { enabled: false, reason: 'rollout_0' };
    }

    // Hash user ID for consistent rollout
    const hashKey = context.userId || context.deviceId || context.sessionId || 'anonymous';
    const hash = this.hashString(`${flag.key}:${hashKey}`);
    const bucket = (hash % 100) + 1; // 1-100

    return {
      enabled: bucket <= percentage,
      reason: `rollout:${percentage}%`,
    };
  }

  /**
   * Select a variant based on context
   */
  private selectVariant(flag: FeatureFlagConfig, context: EvaluationContext): FeatureVariant | undefined {
    if (!flag.variants || flag.variants.length === 0) {
      return undefined;
    }

    // Calculate cumulative weights
    const totalWeight = flag.variants.reduce((sum, v) => sum + v.weight, 0);
    const hashKey = context.userId || context.deviceId || 'anonymous';
    const hash = this.hashString(`${flag.key}:variant:${hashKey}`);
    const bucket = (hash % totalWeight) + 1;

    let cumulative = 0;
    for (const variant of flag.variants) {
      cumulative += variant.weight;
      if (bucket <= cumulative) {
        return variant;
      }
    }

    return flag.variants[0];
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Validate flag configuration
   */
  private validateFlagConfig(config: FeatureFlagConfig): void {
    if (!config.key) {
      throw new BetaReleaseError(
        'Feature flag key is required',
        BetaReleaseErrorCode.INVALID_FLAG_CONFIG
      );
    }

    if (!config.name) {
      throw new BetaReleaseError(
        'Feature flag name is required',
        BetaReleaseErrorCode.INVALID_FLAG_CONFIG
      );
    }

    // Validate rollout percentage
    if (config.rolloutPercentage !== undefined) {
      if (config.rolloutPercentage < 0 || config.rolloutPercentage > 100) {
        throw new BetaReleaseError(
          'Rollout percentage must be between 0 and 100',
          BetaReleaseErrorCode.INVALID_FLAG_CONFIG
        );
      }
    }

    // Validate variants
    if (config.variants) {
      const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
      if (totalWeight <= 0) {
        throw new BetaReleaseError(
          'Variant weights must sum to a positive number',
          BetaReleaseErrorCode.INVALID_FLAG_CONFIG
        );
      }
    }
  }

  /**
   * Get cache key
   */
  private getCacheKey(flagKey: string, context: EvaluationContext): string {
    const contextKey = JSON.stringify({
      userId: context.userId,
      deviceId: context.deviceId,
      segments: context.segments?.sort(),
    });
    return `${flagKey}:${this.hashString(contextKey)}`;
  }

  /**
   * Get cached result
   */
  private getCachedResult(flagKey: string, context: EvaluationContext): FeatureFlagResult | null {
    const cacheKey = this.getCacheKey(flagKey, context);
    const entry = this.cache.get(cacheKey);
    
    if (entry && entry.expiresAt > Date.now()) {
      return entry.result;
    }
    
    return null;
  }

  /**
   * Cache a result
   */
  private cacheResult(flagKey: string, context: EvaluationContext, result: FeatureFlagResult): void {
    const cacheKey = this.getCacheKey(flagKey, context);
    this.cache.set(cacheKey, {
      result,
      expiresAt: Date.now() + (this.config.cacheTtl * 1000),
    });
  }

  /**
   * Invalidate cache for a flag
   */
  private invalidateCache(flagKey: string): void {
    for (const [key] of this.cache) {
      if (key.startsWith(flagKey + ':')) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Debug logging
   */
  private logDebug(message: string): void {
    if (this.config.debug) {
      console.log(`[FeatureFlags] ${message}`);
    }
  }

  /**
   * Get all flags
   */
  getAll(): FeatureFlagConfig[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get flags by status
   */
  getByStatus(status: FeatureFlagStatus): FeatureFlagConfig[] {
    return this.getAll().filter(f => f.status === status);
  }

  /**
   * Get flags by tag
   */
  getByTag(tag: string): FeatureFlagConfig[] {
    return this.getAll().filter(f => f.tags?.includes(tag));
  }

  /**
   * Get evaluation count for a flag
   */
  getEvaluationCount(key: string): number {
    return this.evaluationCount.get(key) || 0;
  }

  /**
   * Check if a flag exists
   */
  has(key: string): boolean {
    return this.flags.has(key);
  }

  /**
   * Clear all flags
   */
  clear(): void {
    this.flags.clear();
    this.cache.clear();
    this.evaluationCount.clear();
  }

  /**
   * Export flags configuration
   */
  export(): FeatureFlagConfig[] {
    return this.getAll();
  }

  /**
   * Import flags configuration
   */
  import(flags: FeatureFlagConfig[]): number {
    let imported = 0;
    for (const flag of flags) {
      try {
        if (this.flags.has(flag.key)) {
          this.update(flag.key, flag);
        } else {
          this.create(flag);
        }
        imported++;
      } catch (error) {
        this.logDebug(`Failed to import flag ${flag.key}: ${error}`);
      }
    }
    return imported;
  }
}

export default FeatureFlags;
