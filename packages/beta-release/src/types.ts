/**
 * @vcomm/beta-release - Type Definitions
 * 
 * Comprehensive type definitions for beta release strategy including
 * feature flags, gradual rollout, feedback collection, and analytics.
 */

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * Feature flag status
 */
export type FeatureFlagStatus = 'enabled' | 'disabled' | 'partial';

/**
 * Feature flag type
 */
export type FeatureFlagType = 
  | 'boolean'    // Simple on/off
  | 'variant'    // A/B testing variants
  | 'multivariate' // Multiple variants
  | 'percentage' // Percentage rollout
  | 'targeted';  // User/segment targeted

/**
 * Feature flag targeting rule
 */
export interface TargetingRule {
  /** Rule ID */
  id: string;
  /** Rule name */
  name: string;
  /** Rule priority (lower = higher priority) */
  priority: number;
  /** Conditions for the rule */
  conditions: TargetingCondition[];
  /** Whether all conditions must match */
  matchAll: boolean;
  /** Result when rule matches */
  result: FeatureFlagResult;
  /** Rule enabled status */
  enabled: boolean;
}

/**
 * Targeting condition
 */
export interface TargetingCondition {
  /** Property to check */
  property: string;
  /** Operator */
  operator: TargetingOperator;
  /** Value to compare */
  value: string | number | boolean | string[] | number[];
}

/**
 * Targeting operators
 */
export type TargetingOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'in'
  | 'not_in'
  | 'matches_regex'
  | 'is_set'
  | 'is_not_set';

/**
 * Feature flag result
 */
export interface FeatureFlagResult {
  /** Whether feature is enabled */
  enabled: boolean;
  /** Variant value (for A/B testing) */
  variant?: string;
  /** Variant configuration */
  config?: Record<string, unknown>;
  /** Reason for the result */
  reason?: string;
}

/**
 * Feature flag configuration
 */
export interface FeatureFlagConfig {
  /** Unique flag key */
  key: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Flag type */
  type: FeatureFlagType;
  /** Current status */
  status: FeatureFlagStatus;
  /** Default value when flag is disabled */
  defaultValue: FeatureFlagResult;
  /** Targeting rules */
  rules: TargetingRule[];
  /** Percentage rollout (0-100) */
  rolloutPercentage?: number;
  /** Variants for A/B testing */
  variants?: FeatureVariant[];
  /** Tags for organization */
  tags?: string[];
  /** Created date */
  createdAt: Date;
  /** Last updated date */
  updatedAt: Date;
  /** Created by user ID */
  createdBy: string;
  /** Environment (development, staging, production) */
  environment?: string;
  /** Expiration date */
  expiresAt?: Date;
  /** Whether to archive after expiration */
  archiveOnExpiry?: boolean;
}

/**
 * Feature variant for A/B testing
 */
export interface FeatureVariant {
  /** Variant key */
  key: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Weight for traffic allocation (0-100) */
  weight: number;
  /** Variant configuration */
  config?: Record<string, unknown>;
}

/**
 * Feature flag evaluation context
 */
export interface EvaluationContext {
  /** User ID */
  userId?: string;
  /** User email */
  email?: string;
  /** User name */
  name?: string;
  /** User segments */
  segments?: string[];
  /** User attributes */
  attributes?: Record<string, unknown>;
  /** Device ID */
  deviceId?: string;
  /** Session ID */
  sessionId?: string;
  /** IP address */
  ipAddress?: string;
  /** Country code */
  country?: string;
  /** Language */
  language?: string;
  /** Platform */
  platform?: 'web' | 'desktop' | 'mobile' | 'api';
  /** App version */
  appVersion?: string;
  /** Environment */
  environment?: string;
  /** Timestamp */
  timestamp?: Date;
}

// ============================================================================
// Gradual Rollout
// ============================================================================

/**
 * Rollout strategy type
 */
export type RolloutStrategyType =
  | 'percentage'    // Percentage of users
  | 'staged'        // Stage-based rollout
  | 'ring'          // Ring-based (canary)
  | 'regional'      // Region-by-region
  | 'segment';      // Segment-based

/**
 * Rollout status
 */
export type RolloutStatus =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'completed'
  | 'rolled_back'
  | 'failed';

/**
 * Rollout stage
 */
export interface RolloutStage {
  /** Stage ID */
  id: string;
  /** Stage name */
  name: string;
  /** Stage order */
  order: number;
  /** Target percentage */
  targetPercentage: number;
  /** Current percentage */
  currentPercentage: number;
  /** Duration in hours (0 = manual) */
  durationHours: number;
  /** Stage status */
  status: 'pending' | 'running' | 'completed' | 'failed';
  /** Started at */
  startedAt?: Date;
  /** Completed at */
  completedAt?: Date;
  /** Success metrics for this stage */
  successMetrics?: RolloutMetric[];
  /** Rollback threshold */
  rollbackThreshold?: number;
  /** Auto-advance to next stage */
  autoAdvance?: boolean;
}

/**
 * Rollout metric
 */
export interface RolloutMetric {
  /** Metric name */
  name: string;
  /** Current value */
  currentValue: number;
  /** Target value */
  targetValue?: number;
  /** Threshold for rollback */
  rollbackThreshold?: number;
  /** Metric unit */
  unit?: string;
}

/**
 * Rollout configuration
 */
export interface RolloutConfig {
  /** Rollout ID */
  id: string;
  /** Feature flag key */
  featureKey: string;
  /** Rollout name */
  name: string;
  /** Description */
  description?: string;
  /** Strategy type */
  strategy: RolloutStrategyType;
  /** Current status */
  status: RolloutStatus;
  /** Rollout stages */
  stages: RolloutStage[];
  /** Current stage index */
  currentStageIndex: number;
  /** Started at */
  startedAt?: Date;
  /** Completed at */
  completedAt?: Date;
  /** Created by */
  createdBy: string;
  /** Created at */
  createdAt?: Date;
  /** Updated at */
  updatedAt?: Date;
  /** Target segments */
  targetSegments?: string[];
  /** Excluded segments */
  excludeSegments?: string[];
  /** Rollback plan */
  rollbackPlan?: RollbackPlan;
  /** Notification settings */
  notifications?: RolloutNotifications;
}

/**
 * Rollback plan
 */
export interface RollbackPlan {
  /** Auto rollback enabled */
  autoRollback: boolean;
  /** Trigger conditions */
  triggers: RollbackTrigger[];
  /** Rollback to percentage */
  rollbackToPercentage: number;
  /** Notification recipients */
  notifyRecipients?: string[];
}

/**
 * Rollback trigger
 */
export interface RollbackTrigger {
  /** Trigger type */
  type: 'error_rate' | 'latency' | 'metric_threshold' | 'manual';
  /** Threshold value */
  threshold: number;
  /** Comparison operator */
  operator: 'greater_than' | 'less_than';
  /** Time window in minutes */
  timeWindowMinutes: number;
  /** Metric name (for metric_threshold) */
  metricName?: string;
}

/**
 * Rollout notifications
 */
export interface RolloutNotifications {
  /** Notify on stage complete */
  onStageComplete?: boolean;
  /** Notify on rollout complete */
  onRolloutComplete?: boolean;
  /** Notify on rollback */
  onRollback?: boolean;
  /** Notify on failure */
  onFailure?: boolean;
  /** Email recipients */
  emails?: string[];
  /** Webhook URLs */
  webhooks?: string[];
  /** Slack channels */
  slackChannels?: string[];
}

// ============================================================================
// Feedback Collection
// ============================================================================

/**
 * Feedback type
 */
export type FeedbackType =
  | 'bug_report'
  | 'feature_request'
  | 'general'
  | 'rating'
  | 'nps'
  | 'survey';

/**
 * Feedback status
 */
export type FeedbackStatus =
  | 'new'
  | 'acknowledged'
  | 'in_review'
  | 'planned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'duplicate';

/**
 * Feedback priority
 */
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Feedback entry
 */
export interface FeedbackEntry {
  /** Feedback ID */
  id: string;
  /** Feedback type */
  type: FeedbackType;
  /** Status */
  status: FeedbackStatus;
  /** Priority */
  priority: FeedbackPriority;
  /** Title/subject */
  title: string;
  /** Description/content */
  description: string;
  /** Rating (1-5 for rating type) */
  rating?: number;
  /** NPS score (0-10 for nps type) */
  npsScore?: number;
  /** User ID */
  userId?: string;
  /** User email */
  userEmail?: string;
  /** User name */
  userName?: string;
  /** Feature flag key (related feature) */
  featureKey?: string;
  /** Tags */
  tags: string[];
  /** Attachments */
  attachments?: FeedbackAttachment[];
  /** Metadata */
  metadata?: Record<string, unknown>;
  /** Created at */
  createdAt: Date;
  /** Updated at */
  updatedAt: Date;
  /** Assigned to user ID */
  assignedTo?: string;
  /** Resolution notes */
  resolution?: string;
  /** Internal notes */
  internalNotes?: string;
  /** Votes/upvotes */
  votes: number;
  /** Voter user IDs */
  voters: string[];
}

/**
 * Feedback attachment
 */
export interface FeedbackAttachment {
  /** Attachment ID */
  id: string;
  /** File name */
  name: string;
  /** MIME type */
  type: string;
  /** File URL */
  url: string;
  /** File size in bytes */
  size: number;
}

/**
 * Feedback survey
 */
export interface FeedbackSurvey {
  /** Survey ID */
  id: string;
  /** Survey name */
  name: string;
  /** Survey description */
  description?: string;
  /** Survey questions */
  questions: SurveyQuestion[];
  /** Target audience */
  targetAudience?: SurveyTargetAudience;
  /** Active status */
  active: boolean;
  /** Start date */
  startsAt?: Date;
  /** End date */
  endsAt?: Date;
  /** Created at */
  createdAt: Date;
  /** Response count */
  responseCount: number;
}

/**
 * Survey question
 */
export interface SurveyQuestion {
  /** Question ID */
  id: string;
  /** Question text */
  text: string;
  /** Question type */
  type: 'text' | 'rating' | 'nps' | 'multiple_choice' | 'checkbox' | 'dropdown';
  /** Required question */
  required: boolean;
  /** Options (for multiple choice, checkbox, dropdown) */
  options?: string[];
  /** Rating scale (min, max) */
  ratingScale?: [number, number];
  /** Placeholder text */
  placeholder?: string;
  /** Order/index */
  order: number;
}

/**
 * Survey target audience
 */
export interface SurveyTargetAudience {
  /** User segments */
  segments?: string[];
  /** User IDs */
  userIds?: string[];
  /** Feature flags */
  featureKeys?: string[];
  /** Percentage of users */
  percentage?: number;
  /** Filters */
  filters?: TargetingCondition[];
}

/**
 * Survey response
 */
export interface SurveyResponse {
  /** Response ID */
  id: string;
  /** Survey ID */
  surveyId: string;
  /** User ID */
  userId?: string;
  /** Answers keyed by question ID */
  answers: Record<string, string | number | string[]>;
  /** Submitted at */
  submittedAt: Date;
  /** Completion time in seconds */
  completionTime?: number;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Beta Analytics
// ============================================================================

/**
 * Metric type
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

/**
 * Metric aggregation
 */
export type MetricAggregation = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'p50' | 'p95' | 'p99';

/**
 * Beta metric
 */
export interface BetaMetric {
  /** Metric ID */
  id: string;
  /** Metric name */
  name: string;
  /** Display name */
  displayName: string;
  /** Description */
  description?: string;
  /** Metric type */
  type: MetricType;
  /** Unit */
  unit?: string;
  /** Tags */
  tags: Record<string, string>;
  /** Current value */
  value: number;
  /** Timestamp */
  timestamp: Date;
  /** Aggregation period */
  aggregationPeriod?: 'minute' | 'hour' | 'day';
}

/**
 * Metric data point
 */
export interface MetricDataPoint {
  /** Timestamp */
  timestamp: Date;
  /** Value */
  value: number;
  /** Tags */
  tags?: Record<string, string>;
}

/**
 * Metric query
 */
export interface MetricQuery {
  /** Metric name(s) */
  metrics: string[];
  /** Start time */
  startTime: Date;
  /** End time */
  endTime: Date;
  /** Aggregation */
  aggregation: MetricAggregation;
  /** Group by tags */
  groupBy?: string[];
  /** Filter by tags */
  filters?: Record<string, string>;
  /** Resolution (data point interval) */
  resolution?: '1m' | '5m' | '15m' | '1h' | '1d';
}

/**
 * Metric query result
 */
export interface MetricQueryResult {
  /** Query ID */
  queryId: string;
  /** Metric name */
  metricName: string;
  /** Data points */
  data: MetricDataPoint[];
  /** Aggregation used */
  aggregation: MetricAggregation;
  /** Total data points */
  totalPoints: number;
  /** Query duration in ms */
  queryDuration: number;
}

/**
 * Feature usage stats
 */
export interface FeatureUsageStats {
  /** Feature flag key */
  featureKey: string;
  /** Total evaluations */
  totalEvaluations: number;
  /** Enabled count */
  enabledCount: number;
  /** Disabled count */
  disabledCount: number;
  /** Enable rate */
  enableRate: number;
  /** Unique users */
  uniqueUsers: number;
  /** Variant distribution */
  variantDistribution?: Record<string, number>;
  /** Time period */
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Beta program stats
 */
export interface BetaProgramStats {
  /** Total beta users */
  totalBetaUsers: number;
  /** Active users (last 7 days) */
  activeUsers: number;
  /** Feedback count */
  totalFeedback: number;
  /** Bug reports */
  bugReports: number;
  /** Feature requests */
  featureRequests: number;
  /** Average NPS score */
  averageNps?: number;
  /** Average rating */
  averageRating?: number;
  /** Feature adoption rates */
  featureAdoption: Record<string, number>;
  /** Error rate */
  errorRate: number;
  /** Period */
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Beta user
 */
export interface BetaUser {
  /** User ID */
  id: string;
  /** Email */
  email: string;
  /** Name */
  name?: string;
  /** Joined date */
  joinedAt: Date;
  /** Last active date */
  lastActiveAt?: Date;
  /** User segments */
  segments: string[];
  /** Features enrolled */
  enrolledFeatures: string[];
  /** Feedback count */
  feedbackCount: number;
  /** NPS score */
  npsScore?: number;
  /** Status */
  status: 'active' | 'inactive' | 'churned';
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Beta program configuration
 */
export interface BetaProgramConfig {
  /** Program ID */
  id: string;
  /** Program name */
  name: string;
  /** Description */
  description?: string;
  /** Program status */
  status: 'draft' | 'active' | 'paused' | 'completed';
  /** Start date */
  startsAt?: Date;
  /** End date */
  endsAt?: Date;
  /** Max beta users */
  maxUsers?: number;
  /** Auto-accept users */
  autoAccept: boolean;
  /** Required segments */
  requiredSegments?: string[];
  /** Features in beta */
  betaFeatures: string[];
  /** Feedback configuration */
  feedbackConfig?: {
    /** Show feedback prompt */
    showPrompt: boolean;
    /** Prompt frequency */
    promptFrequency: 'always' | 'daily' | 'weekly' | 'once';
    /** Custom prompt message */
    promptMessage?: string;
  };
  /** Created at */
  createdAt: Date;
  /** Updated at */
  updatedAt: Date;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Beta release error codes
 */
export enum BetaReleaseErrorCode {
  // Feature flags
  FLAG_NOT_FOUND = 'FLAG_NOT_FOUND',
  FLAG_ALREADY_EXISTS = 'FLAG_ALREADY_EXISTS',
  INVALID_FLAG_CONFIG = 'INVALID_FLAG_CONFIG',
  
  // Rollout
  ROLLOUT_NOT_FOUND = 'ROLLOUT_NOT_FOUND',
  ROLLOUT_ALREADY_RUNNING = 'ROLLOUT_ALREADY_RUNNING',
  ROLLOUT_STAGE_FAILED = 'ROLLOUT_STAGE_FAILED',
  ROLLOUT_ROLLBACK_FAILED = 'ROLLOUT_ROLLBACK_FAILED',
  
  // Feedback
  FEEDBACK_NOT_FOUND = 'FEEDBACK_NOT_FOUND',
  SURVEY_NOT_FOUND = 'SURVEY_NOT_FOUND',
  SURVEY_CLOSED = 'SURVEY_CLOSED',
  
  // Analytics
  METRIC_NOT_FOUND = 'METRIC_NOT_FOUND',
  QUERY_FAILED = 'QUERY_FAILED',
  
  // General
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Beta release error
 */
export class BetaReleaseError extends Error {
  code: BetaReleaseErrorCode;
  details?: Record<string, unknown>;

  constructor(message: string, code: BetaReleaseErrorCode, details?: Record<string, unknown>) {
    super(message);
    this.name = 'BetaReleaseError';
    this.code = code;
    this.details = details;
  }
}
