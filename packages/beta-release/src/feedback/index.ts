/**
 * @vcomm/beta-release - Feedback Collection System
 * 
 * Provides comprehensive feedback collection including bug reports,
 * feature requests, surveys, and NPS tracking.
 */

import {
  FeedbackEntry,
  FeedbackType,
  FeedbackStatus,
  FeedbackPriority,
  FeedbackAttachment,
  FeedbackSurvey,
  SurveyQuestion,
  SurveyResponse,
  SurveyTargetAudience,
  BetaReleaseError,
  BetaReleaseErrorCode,
} from '../types';

/**
 * Feedback manager configuration
 */
export interface FeedbackManagerConfig {
  /** Maximum attachments per feedback */
  maxAttachmentsPerFeedback?: number;
  /** Maximum attachment size in bytes */
  maxAttachmentSize?: number;
  /** Allowed attachment MIME types */
  allowedAttachmentTypes?: string[];
  /** Auto-acknowledge feedback */
  autoAcknowledge?: boolean;
  /** Default priority for bug reports */
  defaultBugPriority?: FeedbackPriority;
  /** Debug logging */
  debug?: boolean;
}

/**
 * Default feedback manager configuration
 */
const DEFAULT_FEEDBACK_MANAGER_CONFIG: Required<FeedbackManagerConfig> = {
  maxAttachmentsPerFeedback: 5,
  maxAttachmentSize: 10 * 1024 * 1024, // 10MB
  allowedAttachmentTypes: ['image/*', 'text/*', 'application/pdf'],
  autoAcknowledge: true,
  defaultBugPriority: 'medium',
  debug: false,
};

/**
 * Feedback query options
 */
export interface FeedbackQuery {
  /** Filter by type */
  type?: FeedbackType;
  /** Filter by status */
  status?: FeedbackStatus;
  /** Filter by priority */
  priority?: FeedbackPriority;
  /** Filter by feature key */
  featureKey?: string;
  /** Filter by user ID */
  userId?: string;
  /** Filter by tags */
  tags?: string[];
  /** Search in title/description */
  search?: string;
  /** Sort by field */
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'votes';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

/**
 * FeedbackManager - Manages feedback collection and surveys
 * 
 * @example
 * ```typescript
 * const feedback = new FeedbackManager();
 * 
 * // Submit feedback
 * const entry = feedback.submit({
 *   type: 'bug_report',
 *   title: 'Button not working',
 *   description: 'The save button does not respond',
 *   userId: 'user123',
 * });
 * 
 * // Create a survey
 * const survey = feedback.createSurvey({
 *   name: 'Beta Feedback Survey',
 *   questions: [
 *     { text: 'How satisfied are you?', type: 'rating', required: true },
 *   ],
 * });
 * ```
 */
export class FeedbackManager {
  private feedback: Map<string, FeedbackEntry> = new Map();
  private surveys: Map<string, FeedbackSurvey> = new Map();
  private surveyResponses: Map<string, SurveyResponse[]> = new Map();
  private config: Required<FeedbackManagerConfig>;
  private feedbackIdCounter = 0;
  private surveyIdCounter = 0;

  constructor(config: FeedbackManagerConfig = {}) {
    this.config = { ...DEFAULT_FEEDBACK_MANAGER_CONFIG, ...config };
  }

  /**
   * Submit new feedback
   */
  submit(data: {
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
    attachments?: FeedbackAttachment[];
    metadata?: Record<string, unknown>;
  }): FeedbackEntry {
    // Validate required fields
    if (!data.title?.trim()) {
      throw new BetaReleaseError(
        'Feedback title is required',
        BetaReleaseErrorCode.VALIDATION_ERROR
      );
    }

    if (!data.description?.trim()) {
      throw new BetaReleaseError(
        'Feedback description is required',
        BetaReleaseErrorCode.VALIDATION_ERROR
      );
    }

    // Validate rating if provided
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new BetaReleaseError(
        'Rating must be between 1 and 5',
        BetaReleaseErrorCode.VALIDATION_ERROR
      );
    }

    // Validate NPS score if provided
    if (data.npsScore !== undefined && (data.npsScore < 0 || data.npsScore > 10)) {
      throw new BetaReleaseError(
        'NPS score must be between 0 and 10',
        BetaReleaseErrorCode.VALIDATION_ERROR
      );
    }

    // Validate attachments
    if (data.attachments && data.attachments.length > this.config.maxAttachmentsPerFeedback) {
      throw new BetaReleaseError(
        `Maximum ${this.config.maxAttachmentsPerFeedback} attachments allowed`,
        BetaReleaseErrorCode.VALIDATION_ERROR
      );
    }

    const id = this.generateFeedbackId();
    const now = new Date();

    const entry: FeedbackEntry = {
      id,
      type: data.type,
      status: this.config.autoAcknowledge ? 'acknowledged' : 'new',
      priority: data.type === 'bug_report' ? this.config.defaultBugPriority : 'medium',
      title: data.title.trim(),
      description: data.description.trim(),
      rating: data.rating,
      npsScore: data.npsScore,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      featureKey: data.featureKey,
      tags: data.tags || [],
      attachments: data.attachments,
      metadata: data.metadata,
      createdAt: now,
      updatedAt: now,
      votes: 0,
      voters: [],
    };

    this.feedback.set(id, entry);
    this.logDebug(`Created feedback ${id}: ${data.title}`);

    return entry;
  }

  /**
   * Get feedback by ID
   */
  get(feedbackId: string): FeedbackEntry | undefined {
    return this.feedback.get(feedbackId);
  }

  /**
   * Update feedback
   */
  update(feedbackId: string, updates: Partial<FeedbackEntry>): FeedbackEntry {
    const existing = this.feedback.get(feedbackId);
    if (!existing) {
      throw new BetaReleaseError(
        `Feedback ${feedbackId} not found`,
        BetaReleaseErrorCode.FEEDBACK_NOT_FOUND
      );
    }

    // Prevent updating immutable fields
    const { _id, _createdAt, _voters, ...allowedUpdates } = updates as any;

    const updated: FeedbackEntry = {
      ...existing,
      ...allowedUpdates,
      updatedAt: new Date(),
    };

    this.feedback.set(feedbackId, updated);
    return updated;
  }

  /**
   * Update feedback status
   */
  updateStatus(feedbackId: string, status: FeedbackStatus, resolution?: string): FeedbackEntry {
    return this.update(feedbackId, { 
      status, 
      resolution,
      updatedAt: new Date(),
    });
  }

  /**
   * Update feedback priority
   */
  updatePriority(feedbackId: string, priority: FeedbackPriority): FeedbackEntry {
    return this.update(feedbackId, { priority });
  }

  /**
   * Assign feedback to a user
   */
  assign(feedbackId: string, userId: string): FeedbackEntry {
    return this.update(feedbackId, { assignedTo: userId });
  }

  /**
   * Add vote to feedback
   */
  addVote(feedbackId: string, userId: string): FeedbackEntry {
    const existing = this.feedback.get(feedbackId);
    if (!existing) {
      throw new BetaReleaseError(
        `Feedback ${feedbackId} not found`,
        BetaReleaseErrorCode.FEEDBACK_NOT_FOUND
      );
    }

    if (existing.voters.includes(userId)) {
      throw new BetaReleaseError(
        'User has already voted on this feedback',
        BetaReleaseErrorCode.VALIDATION_ERROR
      );
    }

    const updated: FeedbackEntry = {
      ...existing,
      votes: existing.votes + 1,
      voters: [...existing.voters, userId],
      updatedAt: new Date(),
    };

    this.feedback.set(feedbackId, updated);
    return updated;
  }

  /**
   * Remove vote from feedback
   */
  removeVote(feedbackId: string, userId: string): FeedbackEntry {
    const existing = this.feedback.get(feedbackId);
    if (!existing) {
      throw new BetaReleaseError(
        `Feedback ${feedbackId} not found`,
        BetaReleaseErrorCode.FEEDBACK_NOT_FOUND
      );
    }

    const voterIndex = existing.voters.indexOf(userId);
    if (voterIndex === -1) {
      throw new BetaReleaseError(
        'User has not voted on this feedback',
        BetaReleaseErrorCode.VALIDATION_ERROR
      );
    }

    const updated: FeedbackEntry = {
      ...existing,
      votes: existing.votes - 1,
      voters: existing.voters.filter(v => v !== userId),
      updatedAt: new Date(),
    };

    this.feedback.set(feedbackId, updated);
    return updated;
  }

  /**
   * Query feedback
   */
  query(options: FeedbackQuery = {}): FeedbackEntry[] {
    let results = Array.from(this.feedback.values());

    // Apply filters
    if (options.type) {
      results = results.filter(f => f.type === options.type);
    }

    if (options.status) {
      results = results.filter(f => f.status === options.status);
    }

    if (options.priority) {
      results = results.filter(f => f.priority === options.priority);
    }

    if (options.featureKey) {
      results = results.filter(f => f.featureKey === options.featureKey);
    }

    if (options.userId) {
      results = results.filter(f => f.userId === options.userId);
    }

    if (options.tags && options.tags.length > 0) {
      results = results.filter(f => 
        options.tags!.some(tag => f.tags.includes(tag))
      );
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      results = results.filter(f =>
        f.title.toLowerCase().includes(searchLower) ||
        f.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updatedAt':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'priority': {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
          }
        case 'votes':
          comparison = a.votes - b.votes;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Apply pagination
    if (options.offset !== undefined) {
      results = results.slice(options.offset);
    }

    if (options.limit !== undefined) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Delete feedback
   */
  delete(feedbackId: string): boolean {
    return this.feedback.delete(feedbackId);
  }

  // Survey Methods

  /**
   * Create a new survey
   */
  createSurvey(data: {
    name: string;
    description?: string;
    questions: Omit<SurveyQuestion, 'id' | 'order'>[];
    targetAudience?: SurveyTargetAudience;
    active?: boolean;
    startsAt?: Date;
    endsAt?: Date;
  }): FeedbackSurvey {
    if (!data.name?.trim()) {
      throw new BetaReleaseError(
        'Survey name is required',
        BetaReleaseErrorCode.VALIDATION_ERROR
      );
    }

    if (!data.questions || data.questions.length === 0) {
      throw new BetaReleaseError(
        'Survey must have at least one question',
        BetaReleaseErrorCode.VALIDATION_ERROR
      );
    }

    const id = this.generateSurveyId();
    const questions: SurveyQuestion[] = data.questions.map((q, index) => ({
      ...q,
      id: `q-${index}`,
      order: index,
    }));

    const survey: FeedbackSurvey = {
      id,
      name: data.name,
      description: data.description,
      questions,
      targetAudience: data.targetAudience,
      active: data.active ?? true,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      createdAt: new Date(),
      responseCount: 0,
    };

    this.surveys.set(id, survey);
    this.surveyResponses.set(id, []);

    this.logDebug(`Created survey ${id}: ${data.name}`);
    return survey;
  }

  /**
   * Get survey by ID
   */
  getSurvey(surveyId: string): FeedbackSurvey | undefined {
    return this.surveys.get(surveyId);
  }

  /**
   * Update survey
   */
  updateSurvey(surveyId: string, updates: Partial<FeedbackSurvey>): FeedbackSurvey {
    const existing = this.surveys.get(surveyId);
    if (!existing) {
      throw new BetaReleaseError(
        `Survey ${surveyId} not found`,
        BetaReleaseErrorCode.SURVEY_NOT_FOUND
      );
    }

    // Prevent updating immutable fields
    const { _id, _createdAt, _responseCount, ...allowedUpdates } = updates as any;

    const updated: FeedbackSurvey = {
      ...existing,
      ...allowedUpdates,
    };

    this.surveys.set(surveyId, updated);
    return updated;
  }

  /**
   * Submit survey response
   */
  submitSurveyResponse(data: {
    surveyId: string;
    userId?: string;
    answers: Record<string, string | number | string[]>;
    completionTime?: number;
    metadata?: Record<string, unknown>;
  }): SurveyResponse {
    const survey = this.surveys.get(data.surveyId);
    if (!survey) {
      throw new BetaReleaseError(
        `Survey ${data.surveyId} not found`,
        BetaReleaseErrorCode.SURVEY_NOT_FOUND
      );
    }

    if (!survey.active) {
      throw new BetaReleaseError(
        'Survey is not active',
        BetaReleaseErrorCode.SURVEY_CLOSED
      );
    }

    if (survey.endsAt && new Date() > survey.endsAt) {
      throw new BetaReleaseError(
        'Survey has ended',
        BetaReleaseErrorCode.SURVEY_CLOSED
      );
    }

    // Validate required questions answered
    for (const question of survey.questions) {
      if (question.required && !(question.id in data.answers)) {
        throw new BetaReleaseError(
          `Required question "${question.text}" not answered`,
          BetaReleaseErrorCode.VALIDATION_ERROR
        );
      }
    }

    const response: SurveyResponse = {
      id: `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      surveyId: data.surveyId,
      userId: data.userId,
      answers: data.answers,
      submittedAt: new Date(),
      completionTime: data.completionTime,
      metadata: data.metadata,
    };

    // Store response
    const responses = this.surveyResponses.get(data.surveyId) || [];
    responses.push(response);
    this.surveyResponses.set(data.surveyId, responses);

    // Update response count
    survey.responseCount++;
    this.surveys.set(data.surveyId, survey);

    this.logDebug(`Submitted response for survey ${data.surveyId}`);
    return response;
  }

  /**
   * Get survey responses
   */
  getSurveyResponses(surveyId: string): SurveyResponse[] {
    return this.surveyResponses.get(surveyId) || [];
  }

  /**
   * Get all surveys
   */
  getAllSurveys(): FeedbackSurvey[] {
    return Array.from(this.surveys.values());
  }

  /**
   * Get active surveys
   */
  getActiveSurveys(): FeedbackSurvey[] {
    return this.getAllSurveys().filter(s => s.active);
  }

  /**
   * Delete survey
   */
  deleteSurvey(surveyId: string): boolean {
    this.surveyResponses.delete(surveyId);
    return this.surveys.delete(surveyId);
  }

  // Statistics

  /**
   * Get feedback statistics
   */
  getStats(): {
    total: number;
    byType: Record<FeedbackType, number>;
    byStatus: Record<FeedbackStatus, number>;
    byPriority: Record<FeedbackPriority, number>;
    averageRating?: number;
    averageNps?: number;
    totalVotes: number;
  } {
    const all = Array.from(this.feedback.values());
    
    const byType: Record<FeedbackType, number> = {
      bug_report: 0,
      feature_request: 0,
      general: 0,
      rating: 0,
      nps: 0,
      survey: 0,
    };

    const byStatus: Record<FeedbackStatus, number> = {
      new: 0,
      acknowledged: 0,
      in_review: 0,
      planned: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      duplicate: 0,
    };

    const byPriority: Record<FeedbackPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let totalRating = 0;
    let ratingCount = 0;
    let totalNps = 0;
    let npsCount = 0;
    let totalVotes = 0;

    for (const entry of all) {
      byType[entry.type]++;
      byStatus[entry.status]++;
      byPriority[entry.priority]++;
      totalVotes += entry.votes;

      if (entry.rating !== undefined) {
        totalRating += entry.rating;
        ratingCount++;
      }

      if (entry.npsScore !== undefined) {
        totalNps += entry.npsScore;
        npsCount++;
      }
    }

    return {
      total: all.length,
      byType,
      byStatus,
      byPriority,
      averageRating: ratingCount > 0 ? totalRating / ratingCount : undefined,
      averageNps: npsCount > 0 ? totalNps / npsCount : undefined,
      totalVotes,
    };
  }

  // Utility Methods

  /**
   * Generate feedback ID
   */
  private generateFeedbackId(): string {
    return `fb_${++this.feedbackIdCounter}_${Date.now()}`;
  }

  /**
   * Generate survey ID
   */
  private generateSurveyId(): string {
    return `survey_${++this.surveyIdCounter}_${Date.now()}`;
  }

  /**
   * Debug logging
   */
  private logDebug(message: string): void {
    if (this.config.debug) {
      console.log(`[FeedbackManager] ${message}`);
    }
  }

  /**
   * Get all feedback
   */
  getAll(): FeedbackEntry[] {
    return Array.from(this.feedback.values());
  }
}

export default FeedbackManager;
