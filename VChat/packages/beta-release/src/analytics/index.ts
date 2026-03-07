/**
 * @vcomm/beta-release - Beta Analytics System
 * 
 * Provides analytics and metrics tracking for beta programs,
 * feature usage, and user engagement.
 */

import {
  BetaMetric,
  MetricType,
  MetricAggregation,
  MetricDataPoint,
  MetricQuery,
  MetricQueryResult,
  FeatureUsageStats,
  BetaProgramStats,
  BetaUser,
  BetaProgramConfig,
  BetaReleaseError,
  BetaReleaseErrorCode,
} from '../types';

/**
 * Analytics manager configuration
 */
export interface AnalyticsConfig {
  /** Enable metric collection */
  enableCollection?: boolean;
  /** Metric retention period in days */
  retentionDays?: number;
  /** Flush interval in seconds */
  flushInterval?: number;
  /** Maximum metrics in memory */
  maxMetricsInMemory?: number;
  /** Debug logging */
  debug?: boolean;
}

/**
 * Default analytics configuration
 */
const DEFAULT_ANALYTICS_CONFIG: Required<AnalyticsConfig> = {
  enableCollection: true,
  retentionDays: 90,
  flushInterval: 60,
  maxMetricsInMemory: 100000,
  debug: false,
};

/**
 * Stored metric entry
 */
interface StoredMetric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
}

/**
 * Analytics - Tracks and queries beta program metrics
 * 
 * @example
 * ```typescript
 * const analytics = new Analytics();
 * 
 * // Track a metric
 * analytics.track('feature_usage', 1, { feature: 'new-ui', userId: 'user123' });
 * 
 * // Query metrics
 * const result = analytics.query({
 *   metrics: ['feature_usage'],
 *   startTime: new Date(Date.now() - 86400000),
 *   endTime: new Date(),
 *   aggregation: 'sum',
 * });
 * ```
 */
export class Analytics {
  private config: Required<AnalyticsConfig>;
  private metrics: StoredMetric[] = [];
  private betaUsers: Map<string, BetaUser> = new Map();
  private programConfig: BetaProgramConfig | null = null;
  private flushTimer: NodeJS.Timeout | null = null;

  // Predefined metrics
  private readonly predefinedMetrics: Map<string, { type: MetricType; unit?: string }> = new Map([
    ['feature_evaluation', { type: 'counter' }],
    ['feature_enabled', { type: 'counter' }],
    ['feature_disabled', { type: 'counter' }],
    ['user_active', { type: 'gauge' }],
    ['feedback_submitted', { type: 'counter' }],
    ['nps_score', { type: 'gauge', unit: 'score' }],
    ['error_count', { type: 'counter' }],
    ['latency_ms', { type: 'histogram', unit: 'ms' }],
    ['rollout_percentage', { type: 'gauge', unit: '%' }],
  ]);

  constructor(config: AnalyticsConfig = {}) {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config };
    
    if (this.config.enableCollection) {
      this.startFlushTimer();
    }
  }

  /**
   * Track a metric
   */
  track(name: string, value: number, tags: Record<string, string> = {}): void {
    if (!this.config.enableCollection) return;

    // Get metric type (default to gauge)
    const metricDef = this.predefinedMetrics.get(name);
    const type = metricDef?.type || 'gauge';

    const metric: StoredMetric = {
      name,
      type,
      value,
      timestamp: new Date(),
      tags,
    };

    // Check memory limit
    if (this.metrics.length >= this.config.maxMetricsInMemory) {
      this.flush();
    }

    this.metrics.push(metric);
    this.logDebug(`Tracked ${name}=${value} with tags ${JSON.stringify(tags)}`);
  }

  /**
   * Track feature evaluation
   */
  trackFeatureEvaluation(featureKey: string, enabled: boolean, userId?: string): void {
    this.track('feature_evaluation', 1, {
      feature: featureKey,
      result: enabled ? 'enabled' : 'disabled',
      ...(userId && { userId }),
    });

    if (enabled) {
      this.track('feature_enabled', 1, { feature: featureKey });
    } else {
      this.track('feature_disabled', 1, { feature: featureKey });
    }
  }

  /**
   * Track user activity
   */
  trackUserActivity(userId: string, action: string): void {
    this.track('user_active', 1, { userId, action });
    
    // Update beta user record
    const user = this.betaUsers.get(userId);
    if (user) {
      user.lastActiveAt = new Date();
      user.status = 'active';
      this.betaUsers.set(userId, user);
    }
  }

  /**
   * Track feedback
   */
  trackFeedback(type: string, featureKey?: string, userId?: string): void {
    this.track('feedback_submitted', 1, {
      type,
      ...(featureKey && { feature: featureKey }),
      ...(userId && { userId }),
    });
  }

  /**
   * Track NPS score
   */
  trackNpsScore(score: number, userId?: string): void {
    this.track('nps_score', score, { ...(userId && { userId }) });
    
    // Update beta user record
    if (userId) {
      const user = this.betaUsers.get(userId);
      if (user) {
        user.npsScore = score;
        this.betaUsers.set(userId, user);
      }
    }
  }

  /**
   * Query metrics
   */
  query(query: MetricQuery): MetricQueryResult {
    const startTime = Date.now();
    
    // Filter metrics by time range
    let filtered = this.metrics.filter(m => {
      if (m.name !== query.metrics[0]) return false; // Single metric query for now
      if (m.timestamp < query.startTime) return false;
      if (m.timestamp > query.endTime) return false;
      
      // Apply tag filters
      if (query.filters) {
        for (const [key, value] of Object.entries(query.filters)) {
          if (m.tags[key] !== value) return false;
        }
      }
      
      return true;
    });

    // Sort by timestamp
    filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Aggregate data
    const data = this.aggregateData(filtered, query);

    return {
      queryId: `query_${Date.now()}`,
      metricName: query.metrics[0],
      data,
      aggregation: query.aggregation,
      totalPoints: data.length,
      queryDuration: Date.now() - startTime,
    };
  }

  /**
   * Aggregate metric data
   */
  private aggregateData(
    metrics: StoredMetric[],
    query: MetricQuery
  ): MetricDataPoint[] {
    if (metrics.length === 0) return [];

    // Group by resolution
    const resolution = query.resolution || '1h';
    const grouped = new Map<number, StoredMetric[]>();

    for (const metric of metrics) {
      const bucket = this.getTimeBucket(metric.timestamp, resolution);
      const existing = grouped.get(bucket) || [];
      existing.push(metric);
      grouped.set(bucket, existing);
    }

    // Aggregate each group
    const result: MetricDataPoint[] = [];

    for (const [bucket, groupMetrics] of grouped) {
      const values = groupMetrics.map(m => m.value);
      let aggregatedValue: number;

      switch (query.aggregation) {
        case 'sum':
          aggregatedValue = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'min':
          aggregatedValue = Math.min(...values);
          break;
        case 'max':
          aggregatedValue = Math.max(...values);
          break;
        case 'count':
          aggregatedValue = values.length;
          break;
        case 'p50':
          aggregatedValue = this.percentile(values, 50);
          break;
        case 'p95':
          aggregatedValue = this.percentile(values, 95);
          break;
        case 'p99':
          aggregatedValue = this.percentile(values, 99);
          break;
        default:
          aggregatedValue = values[values.length - 1];
      }

      result.push({
        timestamp: new Date(bucket),
        value: aggregatedValue,
        tags: query.groupBy?.reduce((acc, key) => {
          acc[key] = groupMetrics[0].tags[key] || '';
          return acc;
        }, {} as Record<string, string>),
      });
    }

    return result;
  }

  /**
   * Get time bucket for resolution
   */
  private getTimeBucket(timestamp: Date, resolution: string): number {
    const ms = timestamp.getTime();
    
    switch (resolution) {
      case '1m':
        return Math.floor(ms / 60000) * 60000;
      case '5m':
        return Math.floor(ms / 300000) * 300000;
      case '15m':
        return Math.floor(ms / 900000) * 900000;
      case '1h':
        return Math.floor(ms / 3600000) * 3600000;
      case '1d':
        return Math.floor(ms / 86400000) * 86400000;
      default:
        return ms;
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get feature usage statistics
   */
  getFeatureUsageStats(featureKey: string, period: { start: Date; end: Date }): FeatureUsageStats {
    const evaluations = this.metrics.filter(m => 
      m.name === 'feature_evaluation' &&
      m.tags.feature === featureKey &&
      m.timestamp >= period.start &&
      m.timestamp <= period.end
    );

    const enabledCount = evaluations.filter(m => m.tags.result === 'enabled').length;
    const disabledCount = evaluations.filter(m => m.tags.result === 'disabled').length;
    const totalEvaluations = evaluations.length;

    // Get unique users
    const uniqueUsers = new Set(
      evaluations
        .filter(m => m.tags.userId)
        .map(m => m.tags.userId)
    ).size;

    // Calculate variant distribution
    const variantDistribution: Record<string, number> = {};
    const variantMetrics = this.metrics.filter(m =>
      m.name === 'feature_enabled' &&
      m.tags.feature === featureKey &&
      m.timestamp >= period.start &&
      m.timestamp <= period.end
    );

    for (const metric of variantMetrics) {
      const variant = metric.tags.variant || 'default';
      variantDistribution[variant] = (variantDistribution[variant] || 0) + 1;
    }

    return {
      featureKey,
      totalEvaluations,
      enabledCount,
      disabledCount,
      enableRate: totalEvaluations > 0 ? enabledCount / totalEvaluations : 0,
      uniqueUsers,
      variantDistribution: Object.keys(variantDistribution).length > 0 ? variantDistribution : undefined,
      period,
    };
  }

  /**
   * Get beta program statistics
   */
  getBetaProgramStats(period: { start: Date; end: Date }): BetaProgramStats {
    // Calculate active users
    const activeUserMetrics = this.metrics.filter(m =>
      m.name === 'user_active' &&
      m.timestamp >= period.start &&
      m.timestamp <= period.end
    );
    const activeUsers = new Set(activeUserMetrics.map(m => m.tags.userId)).size;

    // Calculate feedback counts
    const feedbackMetrics = this.metrics.filter(m =>
      m.name === 'feedback_submitted' &&
      m.timestamp >= period.start &&
      m.timestamp <= period.end
    );
    const totalFeedback = feedbackMetrics.length;
    const bugReports = feedbackMetrics.filter(m => m.tags.type === 'bug_report').length;
    const featureRequests = feedbackMetrics.filter(m => m.tags.type === 'feature_request').length;

    // Calculate NPS
    const npsMetrics = this.metrics.filter(m =>
      m.name === 'nps_score' &&
      m.timestamp >= period.start &&
      m.timestamp <= period.end
    );
    const averageNps = npsMetrics.length > 0
      ? npsMetrics.reduce((sum, m) => sum + m.value, 0) / npsMetrics.length
      : undefined;

    // Calculate ratings
    const ratingMetrics = this.metrics.filter(m =>
      m.name === 'feedback_submitted' &&
      m.tags.type === 'rating' &&
      m.timestamp >= period.start &&
      m.timestamp <= period.end
    );
    const averageRating = ratingMetrics.length > 0
      ? ratingMetrics.reduce((sum, m) => sum + m.value, 0) / ratingMetrics.length
      : undefined;

    // Calculate feature adoption
    const featureAdoption: Record<string, number> = {};
    const featureMetrics = this.metrics.filter(m =>
      m.name === 'feature_enabled' &&
      m.timestamp >= period.start &&
      m.timestamp <= period.end
    );

    for (const metric of featureMetrics) {
      const feature = metric.tags.feature;
      if (feature) {
        featureAdoption[feature] = (featureAdoption[feature] || 0) + 1;
      }
    }

    // Calculate error rate
    const errorMetrics = this.metrics.filter(m =>
      m.name === 'error_count' &&
      m.timestamp >= period.start &&
      m.timestamp <= period.end
    );
    const errorRate = errorMetrics.length > 0
      ? errorMetrics.reduce((sum, m) => sum + m.value, 0) / activeUsers || 0
      : 0;

    return {
      totalBetaUsers: this.betaUsers.size,
      activeUsers,
      totalFeedback,
      bugReports,
      featureRequests,
      averageNps,
      averageRating,
      featureAdoption,
      errorRate,
      period,
    };
  }

  // Beta User Management

  /**
   * Register a beta user
   */
  registerBetaUser(data: {
    id: string;
    email: string;
    name?: string;
    segments?: string[];
  }): BetaUser {
    if (this.betaUsers.has(data.id)) {
      throw new BetaReleaseError(
        `Beta user ${data.id} already exists`,
        BetaReleaseErrorCode.VALIDATION_ERROR
      );
    }

    const user: BetaUser = {
      id: data.id,
      email: data.email,
      name: data.name,
      joinedAt: new Date(),
      segments: data.segments || [],
      enrolledFeatures: [],
      feedbackCount: 0,
      status: 'active',
    };

    this.betaUsers.set(data.id, user);
    this.track('user_active', 1, { userId: data.id, action: 'registered' });

    return user;
  }

  /**
   * Get beta user
   */
  getBetaUser(userId: string): BetaUser | undefined {
    return this.betaUsers.get(userId);
  }

  /**
   * Update beta user
   */
  updateBetaUser(userId: string, updates: Partial<BetaUser>): BetaUser {
    const existing = this.betaUsers.get(userId);
    if (!existing) {
      throw new BetaReleaseError(
        `Beta user ${userId} not found`,
        BetaReleaseErrorCode.VALIDATION_ERROR
      );
    }

    const updated: BetaUser = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID change
    };

    this.betaUsers.set(userId, updated);
    return updated;
  }

  /**
   * Enroll user in feature
   */
  enrollUserInFeature(userId: string, featureKey: string): BetaUser {
    const user = this.betaUsers.get(userId);
    if (!user) {
      throw new BetaReleaseError(
        `Beta user ${userId} not found`,
        BetaReleaseErrorCode.VALIDATION_ERROR
      );
    }

    if (!user.enrolledFeatures.includes(featureKey)) {
      user.enrolledFeatures.push(featureKey);
      this.betaUsers.set(userId, user);
    }

    return user;
  }

  /**
   * Get all beta users
   */
  getAllBetaUsers(): BetaUser[] {
    return Array.from(this.betaUsers.values());
  }

  /**
   * Get active beta users
   */
  getActiveBetaUsers(daysSinceActive = 7): BetaUser[] {
    const cutoff = new Date(Date.now() - daysSinceActive * 86400000);
    return this.getAllBetaUsers().filter(u => 
      u.lastActiveAt && u.lastActiveAt >= cutoff
    );
  }

  // Program Configuration

  /**
   * Set beta program configuration
   */
  setProgramConfig(config: BetaProgramConfig): void {
    this.programConfig = config;
  }

  /**
   * Get beta program configuration
   */
  getProgramConfig(): BetaProgramConfig | null {
    return this.programConfig;
  }

  // Utility Methods

  /**
   * Flush metrics to storage
   */
  private flush(): void {
    // In a real implementation, this would persist metrics to a database
    this.logDebug(`Flushing ${this.metrics.length} metrics`);
    
    // Remove old metrics beyond retention period
    const cutoff = new Date(Date.now() - this.config.retentionDays * 86400000);
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval * 1000);
  }

  /**
   * Stop flush timer
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Debug logging
   */
  private logDebug(message: string): void {
    if (this.config.debug) {
      console.log(`[Analytics] ${message}`);
    }
  }

  /**
   * Get metric count
   */
  getMetricCount(): number {
    return this.metrics.length;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.metrics = [];
    this.betaUsers.clear();
    this.programConfig = null;
  }
}

export default Analytics;
