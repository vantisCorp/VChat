/**
 * @vcomm/beta-release - Gradual Rollout System
 * 
 * Provides staged rollout management with automatic progression,
 * monitoring, and rollback capabilities.
 */

import {
  RolloutConfig,
  RolloutStatus,
  RolloutStage,
  // RolloutStrategyType,
  // RolloutMetric,
  // RollbackPlan,
  // RollbackTrigger,
  // RolloutNotifications,
  BetaReleaseError,
  BetaReleaseErrorCode,
} from '../types';
import { FeatureFlags } from '../flags';

/**
 * Rollout manager configuration
 */
export interface RolloutManagerConfig {
  /** Enable auto-advance between stages */
  enableAutoAdvance?: boolean;
  /** Default stage duration in hours */
  defaultStageDurationHours?: number;
  /** Enable monitoring integration */
  enableMonitoring?: boolean;
  /** Notification callback */
  onNotification?: (event: RolloutEvent) => void;
  /** Debug logging */
  debug?: boolean;
}

/**
 * Default rollout manager configuration
 */
const DEFAULT_ROLLOUT_MANAGER_CONFIG: Required<RolloutManagerConfig> = {
  enableAutoAdvance: true,
  defaultStageDurationHours: 24,
  enableMonitoring: true,
  onNotification: () => {},
  debug: false,
};

/**
 * Rollout event
 */
export interface RolloutEvent {
  type: 'stage_started' | 'stage_completed' | 'stage_failed' | 'rollout_completed' | 'rollback_triggered' | 'rollout_failed';
  rolloutId: string;
  featureKey: string;
  stage?: RolloutStage;
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

/**
 * RolloutManager - Manages gradual feature rollouts
 * 
 * @example
 * ```typescript
 * const rolloutManager = new RolloutManager(featureFlags);
 * 
 * // Create a staged rollout
 * const rollout = rolloutManager.create({
 *   featureKey: 'new-feature',
 *   name: 'New Feature Rollout',
 *   strategy: 'staged',
 *   stages: [
 *     { name: 'Canary', targetPercentage: 5, durationHours: 24 },
 *     { name: 'Early Adopters', targetPercentage: 25, durationHours: 48 },
 *     { name: 'General', targetPercentage: 100, durationHours: 0 },
 *   ],
 * });
 * 
 * // Start the rollout
 * await rolloutManager.start(rollout.id);
 * ```
 */
export class RolloutManager {
  private rollouts: Map<string, RolloutConfig> = new Map();
  private config: Required<RolloutManagerConfig>;
  private featureFlags: FeatureFlags;
  private stageTimers: Map<string, NodeJS.Timeout> = new Map();
  private rolloutIdCounter = 0;

  constructor(featureFlags: FeatureFlags, config: RolloutManagerConfig = {}) {
    this.config = { ...DEFAULT_ROLLOUT_MANAGER_CONFIG, ...config };
    this.featureFlags = featureFlags;
  }

  /**
   * Create a new rollout
   */
  create(config: Omit<RolloutConfig, 'id' | 'currentStageIndex' | 'status' | 'createdAt' | 'updatedAt'>): RolloutConfig {
    const id = this.generateId();
    
    // Validate feature flag exists
    if (!this.featureFlags.has(config.featureKey)) {
      throw new BetaReleaseError(
        `Feature flag ${config.featureKey} not found`,
        BetaReleaseErrorCode.FLAG_NOT_FOUND
      );
    }

    // Validate stages
    this.validateStages(config.stages);

    const rollout: RolloutConfig = {
      ...config,
      id,
      status: 'draft',
      currentStageIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Initialize stage statuses
    rollout.stages = rollout.stages.map((stage, index) => ({
      ...stage,
      id: stage.id || `stage-${index}`,
      status: 'pending' as const,
      currentPercentage: 0,
    }));

    this.rollouts.set(id, rollout);
    return rollout;
  }

  /**
   * Start a rollout
   */
  async start(rolloutId: string): Promise<RolloutConfig> {
    const rollout = this.rollouts.get(rolloutId);
    if (!rollout) {
      throw new BetaReleaseError(
        `Rollout ${rolloutId} not found`,
        BetaReleaseErrorCode.ROLLOUT_NOT_FOUND
      );
    }

    if (rollout.status === 'running') {
      throw new BetaReleaseError(
        `Rollout ${rolloutId} is already running`,
        BetaReleaseErrorCode.ROLLOUT_ALREADY_RUNNING
      );
    }

    // Reset all stages to pending
    rollout.stages = rollout.stages.map(stage => ({
      ...stage,
      status: 'pending',
      currentPercentage: 0,
    }));

    // Start first stage
    rollout.status = 'running';
    rollout.currentStageIndex = 0;
    rollout.startedAt = new Date();
    rollout.updatedAt = new Date();

    await this.startStage(rollout, 0);

    this.rollouts.set(rolloutId, rollout);
    return rollout;
  }

  /**
   * Pause a rollout
   */
  async pause(rolloutId: string): Promise<RolloutConfig> {
    const rollout = this.rollouts.get(rolloutId);
    if (!rollout) {
      throw new BetaReleaseError(
        `Rollout ${rolloutId} not found`,
        BetaReleaseErrorCode.ROLLOUT_NOT_FOUND
      );
    }

    if (rollout.status !== 'running') {
      throw new BetaReleaseError(
        `Rollout ${rolloutId} is not running`,
        BetaReleaseErrorCode.ROLLOUT_NOT_FOUND
      );
    }

    // Clear any pending stage timers
    this.clearStageTimer(rolloutId);

    rollout.status = 'paused';
    rollout.updatedAt = new Date();

    this.rollouts.set(rolloutId, rollout);
    return rollout;
  }

  /**
   * Resume a paused rollout
   */
  async resume(rolloutId: string): Promise<RolloutConfig> {
    const rollout = this.rollouts.get(rolloutId);
    if (!rollout) {
      throw new BetaReleaseError(
        `Rollout ${rolloutId} not found`,
        BetaReleaseErrorCode.ROLLOUT_NOT_FOUND
      );
    }

    if (rollout.status !== 'paused') {
      throw new BetaReleaseError(
        `Rollout ${rolloutId} is not paused`,
        BetaReleaseErrorCode.ROLLOUT_NOT_FOUND
      );
    }

    rollout.status = 'running';
    rollout.updatedAt = new Date();

    // Continue from current stage
    await this.startStage(rollout, rollout.currentStageIndex);

    this.rollouts.set(rolloutId, rollout);
    return rollout;
  }

  /**
   * Rollback a rollout
   */
  async rollback(rolloutId: string, reason?: string): Promise<RolloutConfig> {
    const rollout = this.rollouts.get(rolloutId);
    if (!rollout) {
      throw new BetaReleaseError(
        `Rollout ${rolloutId} not found`,
        BetaReleaseErrorCode.ROLLOUT_NOT_FOUND
      );
    }

    this.clearStageTimer(rolloutId);

    // Get rollback target percentage
    const rollbackPlan = rollout.rollbackPlan;
    const targetPercentage = rollbackPlan?.rollbackToPercentage ?? 0;

    // Update feature flag
    const flag = this.featureFlags.get(rollout.featureKey);
    if (flag) {
      this.featureFlags.update(rollout.featureKey, {
        rolloutPercentage: targetPercentage,
      });
    }

    // Update rollout status
    rollout.status = 'rolled_back';
    rollout.completedAt = new Date();
    rollout.updatedAt = new Date();

    // Reset stage statuses
    rollout.stages = rollout.stages.map(stage => ({
      ...stage,
      status: 'failed' as const,
    }));

    // Send notification
    this.sendNotification({
      type: 'rollback_triggered',
      rolloutId,
      featureKey: rollout.featureKey,
      message: `Rollback triggered: ${reason || 'Manual rollback'}`,
      timestamp: new Date(),
      data: { targetPercentage, reason },
    });

    this.rollouts.set(rolloutId, rollout);
    return rollout;
  }

  /**
   * Complete a rollout
   */
  async complete(rolloutId: string): Promise<RolloutConfig> {
    const rollout = this.rollouts.get(rolloutId);
    if (!rollout) {
      throw new BetaReleaseError(
        `Rollout ${rolloutId} not found`,
        BetaReleaseErrorCode.ROLLOUT_NOT_FOUND
      );
    }

    rollout.status = 'completed';
    rollout.completedAt = new Date();
    rollout.updatedAt = new Date();

    this.clearStageTimer(rolloutId);

    this.sendNotification({
      type: 'rollout_completed',
      rolloutId,
      featureKey: rollout.featureKey,
      message: `Rollout completed successfully`,
      timestamp: new Date(),
    });

    this.rollouts.set(rolloutId, rollout);
    return rollout;
  }

  /**
   * Start a specific stage
   */
  private async startStage(rollout: RolloutConfig, stageIndex: number): Promise<void> {
    if (stageIndex >= rollout.stages.length) {
      // All stages complete
      await this.complete(rollout.id);
      return;
    }

    const stage = rollout.stages[stageIndex];
    stage.status = 'running';
    stage.startedAt = new Date();
    stage.currentPercentage = stage.targetPercentage;

    // Update feature flag with current percentage
    const flag = this.featureFlags.get(rollout.featureKey);
    if (flag) {
      this.featureFlags.update(rollout.featureKey, {
        rolloutPercentage: stage.targetPercentage,
        status: stage.targetPercentage >= 100 ? 'enabled' : 'partial',
      });
    }

    rollout.currentStageIndex = stageIndex;
    rollout.updatedAt = new Date();

    this.sendNotification({
      type: 'stage_started',
      rolloutId: rollout.id,
      featureKey: rollout.featureKey,
      stage,
      message: `Stage "${stage.name}" started at ${stage.targetPercentage}%`,
      timestamp: new Date(),
    });

    // Set up auto-advance if enabled
    if (stage.autoAdvance !== false && this.config.enableAutoAdvance && stage.durationHours > 0) {
      this.scheduleStageCompletion(rollout, stageIndex);
    }

    this.rollouts.set(rollout.id, rollout);
  }

  /**
   * Complete a stage
   */
  private async completeStage(rollout: RolloutConfig, stageIndex: number): Promise<void> {
    const stage = rollout.stages[stageIndex];
    stage.status = 'completed';
    stage.completedAt = new Date();

    rollout.updatedAt = new Date();

    this.sendNotification({
      type: 'stage_completed',
      rolloutId: rollout.id,
      featureKey: rollout.featureKey,
      stage,
      message: `Stage "${stage.name}" completed`,
      timestamp: new Date(),
    });

    // Move to next stage
    if (stageIndex < rollout.stages.length - 1) {
      await this.startStage(rollout, stageIndex + 1);
    } else {
      await this.complete(rollout.id);
    }
  }

  /**
   * Schedule stage completion
   */
  private scheduleStageCompletion(rollout: RolloutConfig, stageIndex: number): void {
    const stage = rollout.stages[stageIndex];
    const delayMs = stage.durationHours * 60 * 60 * 1000;

    const timer = setTimeout(async () => {
      try {
        const currentRollout = this.rollouts.get(rollout.id);
        if (currentRollout && currentRollout.status === 'running') {
          await this.completeStage(currentRollout, stageIndex);
        }
      } catch (error) {
        this.logDebug(`Error completing stage ${stageIndex}: ${error}`);
      }
    }, delayMs);

    this.stageTimers.set(rollout.id, timer);
  }

  /**
   * Clear stage timer
   */
  private clearStageTimer(rolloutId: string): void {
    const timer = this.stageTimers.get(rolloutId);
    if (timer) {
      clearTimeout(timer);
      this.stageTimers.delete(rolloutId);
    }
  }

  /**
   * Validate stages configuration
   */
  private validateStages(stages: RolloutStage[]): void {
    if (!stages || stages.length === 0) {
      throw new BetaReleaseError(
        'Rollout must have at least one stage',
        BetaReleaseErrorCode.VALIDATION_ERROR
      );
    }

    let previousPercentage = 0;
    for (const stage of stages) {
      if (stage.targetPercentage < previousPercentage) {
        throw new BetaReleaseError(
          'Stages must have increasing target percentages',
          BetaReleaseErrorCode.VALIDATION_ERROR
        );
      }
      if (stage.targetPercentage > 100) {
        throw new BetaReleaseError(
          'Target percentage cannot exceed 100',
          BetaReleaseErrorCode.VALIDATION_ERROR
        );
      }
      previousPercentage = stage.targetPercentage;
    }
  }

  /**
   * Generate unique rollout ID
   */
  private generateId(): string {
    return `rollout_${++this.rolloutIdCounter}_${Date.now()}`;
  }

  /**
   * Send notification
   */
  private sendNotification(event: RolloutEvent): void {
    this.config.onNotification(event);
    this.logDebug(`Notification: ${event.type} - ${event.message}`);
  }

  /**
   * Debug logging
   */
  private logDebug(message: string): void {
    if (this.config.debug) {
      console.log(`[RolloutManager] ${message}`);
    }
  }

  /**
   * Get a rollout by ID
   */
  get(rolloutId: string): RolloutConfig | undefined {
    return this.rollouts.get(rolloutId);
  }

  /**
   * Get all rollouts
   */
  getAll(): RolloutConfig[] {
    return Array.from(this.rollouts.values());
  }

  /**
   * Get rollouts by status
   */
  getByStatus(status: RolloutStatus): RolloutConfig[] {
    return this.getAll().filter(r => r.status === status);
  }

  /**
   * Get active rollouts
   */
  getActive(): RolloutConfig[] {
    return this.getByStatus('running');
  }

  /**
   * Get rollouts for a feature
   */
  getByFeature(featureKey: string): RolloutConfig[] {
    return this.getAll().filter(r => r.featureKey === featureKey);
  }

  /**
   * Delete a rollout
   */
  delete(rolloutId: string): boolean {
    this.clearStageTimer(rolloutId);
    return this.rollouts.delete(rolloutId);
  }

  /**
   * Get current progress of a rollout
   */
  getProgress(rolloutId: string): {
    currentStage: number;
    totalStages: number;
    currentPercentage: number;
    targetPercentage: number;
    status: RolloutStatus;
  } | undefined {
    const rollout = this.rollouts.get(rolloutId);
    if (!rollout) return undefined;

    const currentStage = rollout.stages[rollout.currentStageIndex];
    const lastStage = rollout.stages[rollout.stages.length - 1];

    return {
      currentStage: rollout.currentStageIndex + 1,
      totalStages: rollout.stages.length,
      currentPercentage: currentStage?.currentPercentage || 0,
      targetPercentage: lastStage?.targetPercentage || 100,
      status: rollout.status,
    };
  }

  /**
   * Manually advance to next stage
   */
  async advanceStage(rolloutId: string): Promise<RolloutConfig> {
    const rollout = this.rollouts.get(rolloutId);
    if (!rollout) {
      throw new BetaReleaseError(
        `Rollout ${rolloutId} not found`,
        BetaReleaseErrorCode.ROLLOUT_NOT_FOUND
      );
    }

    if (rollout.status !== 'running') {
      throw new BetaReleaseError(
        `Rollout ${rolloutId} is not running`,
        BetaReleaseErrorCode.ROLLOUT_NOT_FOUND
      );
    }

    this.clearStageTimer(rolloutId);
    await this.completeStage(rollout, rollout.currentStageIndex);
    
    return this.rollouts.get(rolloutId)!;
  }

  /**
   * Check rollback triggers
   */
  async checkRollbackTriggers(rolloutId: string, metrics: Map<string, number>): Promise<boolean> {
    const rollout = this.rollouts.get(rolloutId);
    if (!rollout || !rollout.rollbackPlan) return false;

    for (const trigger of rollout.rollbackPlan.triggers) {
      const metricValue = metrics.get(trigger.metricName || trigger.type);
      if (metricValue === undefined) continue;

      const shouldRollback = trigger.operator === 'greater_than'
        ? metricValue > trigger.threshold
        : metricValue < trigger.threshold;

      if (shouldRollback && rollout.rollbackPlan.autoRollback) {
        await this.rollback(rolloutId, `Trigger: ${trigger.type} ${trigger.operator} ${trigger.threshold}`);
        return true;
      }
    }

    return false;
  }
}

export default RolloutManager;
