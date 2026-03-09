/**
 * @vcomm/beta-release
 * 
 * Comprehensive beta release strategy for V-COMM applications.
 * Provides feature flags, gradual rollout, feedback collection, and analytics.
 * 
 * @example
 * ```typescript
 * import { BetaRelease } from '@vcomm/beta-release';
 * 
 * const beta = new BetaRelease({
 *   debug: true,
 * });
 * 
 * // Create a feature flag
 * beta.createFlag({
 *   key: 'new-feature',
 *   name: 'New Feature',
 *   type: 'boolean',
 *   status: 'partial',
 *   rolloutPercentage: 25,
 * });
 * 
 * // Check if feature is enabled
 * const result = beta.evaluate('new-feature', { userId: 'user123' });
 * 
 * // Start a rollout
 * beta.createRollout({
 *   featureKey: 'new-feature',
 *   name: 'New Feature Rollout',
 *   strategy: 'staged',
 *   stages: [
 *     { name: 'Canary', targetPercentage: 5, durationHours: 24 },
 *     { name: 'General', targetPercentage: 100, durationHours: 0 },
 *   ],
 * });
 * ```
 */

// Type exports
export {
  // Feature Flags
  FeatureFlagStatus,
  FeatureFlagType,
  FeatureFlagConfig,
  FeatureFlagResult,
  FeatureVariant,
  TargetingRule,
  TargetingCondition,
  TargetingOperator,
  EvaluationContext,
  
  // Rollout
  RolloutStrategyType,
  RolloutStatus,
  RolloutStage,
  RolloutMetric,
  RolloutConfig,
  RollbackPlan,
  RollbackTrigger,
  RolloutNotifications,
  
  // Feedback
  FeedbackType,
  FeedbackStatus,
  FeedbackPriority,
  FeedbackEntry,
  FeedbackAttachment,
  FeedbackSurvey,
  SurveyQuestion,
  SurveyResponse,
  SurveyTargetAudience,
  
  // Analytics
  MetricType,
  MetricAggregation,
  BetaMetric,
  MetricDataPoint,
  MetricQuery,
  MetricQueryResult,
  FeatureUsageStats,
  BetaProgramStats,
  BetaUser,
  BetaProgramConfig,
  
  // Errors
  BetaReleaseError,
  BetaReleaseErrorCode,
} from './types';

// Module exports
export { FeatureFlags, FeatureFlagsConfig } from './flags';
export { RolloutManager, RolloutManagerConfig, RolloutEvent } from './rollout';
export { FeedbackManager, FeedbackManagerConfig, FeedbackQuery } from './feedback';
export { Analytics, AnalyticsConfig } from './analytics';

import { FeatureFlags } from './flags';
import { RolloutManager, RolloutEvent } from './rollout';
import { FeedbackManager } from './feedback';
import { Analytics } from './analytics';
import {
  FeatureFlagConfig,
  FeatureFlagResult,
  EvaluationContext,
  RolloutConfig,
  FeedbackEntry,
  FeedbackType,
  FeedbackSurvey,
  SurveyResponse,
  MetricQuery,
  MetricQueryResult,
  FeatureUsageStats,
  BetaProgramStats,
  BetaUser,
  BetaProgramConfig,
  _BetaReleaseError,
  _BetaReleaseErrorCode,
} from './types';

/**
 * BetaRelease main configuration
 */
export interface BetaReleaseConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** Enable caching for feature flags */
  enableCache?: boolean;
  /** Cache TTL in seconds */
  cacheTtl?: number;
  /** Enable auto-advance for rollouts */
  enableAutoAdvance?: boolean;
  /** Auto-acknowledge feedback */
  autoAcknowledgeFeedback?: boolean;
  /** Enable analytics collection */
  enableAnalytics?: boolean;
}

/**
 * BetaRelease - Main entry point for beta release management
 */
export class BetaRelease {
  private featureFlags: FeatureFlags;
  private rolloutManager: RolloutManager;
  private feedbackManager: FeedbackManager;
  private analytics: Analytics;
  private config: Required<BetaReleaseConfig>;

  constructor(config: BetaReleaseConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      enableCache: config.enableCache ?? true,
      cacheTtl: config.cacheTtl ?? 60,
      enableAutoAdvance: config.enableAutoAdvance ?? true,
      autoAcknowledgeFeedback: config.autoAcknowledgeFeedback ?? true,
      enableAnalytics: config.enableAnalytics ?? true,
    };

    // Initialize components
    this.featureFlags = new FeatureFlags({
      enableCache: this.config.enableCache,
      cacheTtl: this.config.cacheTtl,
      debug: this.config.debug,
    });

    this.feedbackManager = new FeedbackManager({
      autoAcknowledge: this.config.autoAcknowledgeFeedback,
      debug: this.config.debug,
    });

    this.analytics = new Analytics({
      enableCollection: this.config.enableAnalytics,
      debug: this.config.debug,
    });

    this.rolloutManager = new RolloutManager(this.featureFlags, {
      enableAutoAdvance: this.config.enableAutoAdvance,
      onNotification: (event: RolloutEvent) => {
        this.handleRolloutNotification(event);
      },
      debug: this.config.debug,
    });
  }

  // Feature Flag Methods

  /**
   * Create a feature flag
   */
  createFlag(config: FeatureFlagConfig): FeatureFlagConfig {
    return this.featureFlags.create(config);
  }

  /**
   * Get a feature flag
   */
  getFlag(key: string): FeatureFlagConfig | undefined {
    return this.featureFlags.get(key);
  }

  /**
   * Update a feature flag
   */
  updateFlag(key: string, updates: Partial<FeatureFlagConfig>): FeatureFlagConfig {
    return this.featureFlags.update(key, updates);
  }

  /**
   * Delete a feature flag
   */
  deleteFlag(key: string): boolean {
    return this.featureFlags.delete(key);
  }

  /**
   * Evaluate a feature flag
   */
  evaluate(key: string, context?: EvaluationContext): FeatureFlagResult {
    const result = this.featureFlags.evaluate(key, context);
    
    // Track evaluation
    if (this.config.enableAnalytics && context?.userId) {
      this.analytics.trackFeatureEvaluation(key, result.enabled, context.userId);
    }
    
    return result;
  }

  /**
   * Check if a flag is enabled
   */
  isEnabled(key: string, context?: EvaluationContext): boolean {
    return this.evaluate(key, context).enabled;
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlagConfig[] {
    return this.featureFlags.getAll();
  }

  // Rollout Methods

  /**
   * Create a rollout
   */
  createRollout(config: Omit<RolloutConfig, 'id' | 'currentStageIndex' | 'status' | 'createdAt' | 'updatedAt'>): RolloutConfig {
    return this.rolloutManager.create(config);
  }

  /**
   * Start a rollout
   */
  async startRollout(rolloutId: string): Promise<RolloutConfig> {
    return this.rolloutManager.start(rolloutId);
  }

  /**
   * Pause a rollout
   */
  async pauseRollout(rolloutId: string): Promise<RolloutConfig> {
    return this.rolloutManager.pause(rolloutId);
  }

  /**
   * Resume a rollout
   */
  async resumeRollout(rolloutId: string): Promise<RolloutConfig> {
    return this.rolloutManager.resume(rolloutId);
  }

  /**
   * Rollback a rollout
   */
  async rollbackRollout(rolloutId: string, reason?: string): Promise<RolloutConfig> {
    return this.rolloutManager.rollback(rolloutId, reason);
  }

  /**
   * Get rollout
   */
  getRollout(rolloutId: string): RolloutConfig | undefined {
    return this.rolloutManager.get(rolloutId);
  }

  /**
   * Get all rollouts
   */
  getAllRollouts(): RolloutConfig[] {
    return this.rolloutManager.getAll();
  }

  /**
   * Get rollout progress
   */
  getRolloutProgress(rolloutId: string): ReturnType<RolloutManager['getProgress']> {
    return this.rolloutManager.getProgress(rolloutId);
  }

  // Feedback Methods

  /**
   * Submit feedback
   */
  submitFeedback(data: {
    type: FeedbackType;
    title: string;
    description: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
    featureKey?: string;
    tags?: string[];
    rating?: number;
    npsScore?: number;
  }): FeedbackEntry {
    const entry = this.feedbackManager.submit(data);
    
    // Track feedback
    if (this.config.enableAnalytics) {
      this.analytics.trackFeedback(data.type, data.featureKey, data.userId);
      if (data.npsScore !== undefined) {
        this.analytics.trackNpsScore(data.npsScore, data.userId);
      }
    }
    
    return entry;
  }

  /**
   * Get feedback
   */
  getFeedback(feedbackId: string): FeedbackEntry | undefined {
    return this.feedbackManager.get(feedbackId);
  }

  /**
   * Update feedback status
   */
  updateFeedbackStatus(feedbackId: string, status: FeedbackEntry['status'], resolution?: string): FeedbackEntry {
    return this.feedbackManager.updateStatus(feedbackId, status, resolution);
  }

  /**
   * Add vote to feedback
   */
  voteFeedback(feedbackId: string, userId: string): FeedbackEntry {
    return this.feedbackManager.addVote(feedbackId, userId);
  }

  /**
   * Create a survey
   */
  createSurvey(data: Parameters<FeedbackManager['createSurvey']>[0]): FeedbackSurvey {
    return this.feedbackManager.createSurvey(data);
  }

  /**
   * Submit survey response
   */
  submitSurveyResponse(data: Parameters<FeedbackManager['submitSurveyResponse']>[0]): SurveyResponse {
    return this.feedbackManager.submitSurveyResponse(data);
  }

  /**
   * Get feedback statistics
   */
  getFeedbackStats(): ReturnType<FeedbackManager['getStats']> {
    return this.feedbackManager.getStats();
  }

  // Analytics Methods

  /**
   * Track a metric
   */
  trackMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.analytics.track(name, value, tags);
  }

  /**
   * Query metrics
   */
  queryMetrics(query: MetricQuery): MetricQueryResult {
    return this.analytics.query(query);
  }

  /**
   * Get feature usage stats
   */
  getFeatureUsageStats(featureKey: string, period: { start: Date; end: Date }): FeatureUsageStats {
    return this.analytics.getFeatureUsageStats(featureKey, period);
  }

  /**
   * Get beta program stats
   */
  getBetaProgramStats(period: { start: Date; end: Date }): BetaProgramStats {
    return this.analytics.getBetaProgramStats(period);
  }

  // Beta User Methods

  /**
   * Register a beta user
   */
  registerBetaUser(data: {
    id: string;
    email: string;
    name?: string;
    segments?: string[];
  }): BetaUser {
    return this.analytics.registerBetaUser(data);
  }

  /**
   * Get beta user
   */
  getBetaUser(userId: string): BetaUser | undefined {
    return this.analytics.getBetaUser(userId);
  }

  /**
   * Get all beta users
   */
  getAllBetaUsers(): BetaUser[] {
    return this.analytics.getAllBetaUsers();
  }

  // Program Configuration

  /**
   * Set beta program configuration
   */
  setProgramConfig(config: BetaProgramConfig): void {
    this.analytics.setProgramConfig(config);
  }

  /**
   * Get beta program configuration
   */
  getProgramConfig(): BetaProgramConfig | null {
    return this.analytics.getProgramConfig();
  }

  // Utility Methods

  /**
   * Handle rollout notifications
   */
  private handleRolloutNotification(event: RolloutEvent): void {
    if (this.config.debug) {
      console.log(`[BetaRelease] Rollout notification: ${event.type}`, event);
    }
    
    // Track rollout events
    if (this.config.enableAnalytics) {
      this.analytics.track('rollout_event', 1, {
        type: event.type,
        featureKey: event.featureKey,
        rolloutId: event.rolloutId,
      });
    }
  }

  /**
   * Export all state
   */
  exportState(): {
    flags: FeatureFlagConfig[];
    rollouts: RolloutConfig[];
    feedback: FeedbackEntry[];
    surveys: FeedbackSurvey[];
    betaUsers: BetaUser[];
  } {
    return {
      flags: this.featureFlags.getAll(),
      rollouts: this.rolloutManager.getAll(),
      feedback: this.feedbackManager.getAll(),
      surveys: this.feedbackManager.getAllSurveys(),
      betaUsers: this.analytics.getAllBetaUsers(),
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.featureFlags.clear();
    this.rolloutManager.getAll().forEach(r => this.rolloutManager.delete(r.id));
    this.feedbackManager.getAll().forEach(f => this.feedbackManager.delete(f.id));
    this.feedbackManager.getAllSurveys().forEach(s => this.feedbackManager.deleteSurvey(s.id));
    this.analytics.clear();
  }
}

export default BetaRelease;
