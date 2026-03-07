# @vcomm/beta-release

Comprehensive beta release strategy for V-COMM applications. Provides feature flags, gradual rollout, feedback collection, and analytics.

## Features

- **Feature Flags** - Boolean, variant, percentage, and targeted flags with caching
- **Gradual Rollout** - Staged, ring, regional, and segment-based rollouts with auto-advance
- **Feedback Collection** - Bug reports, feature requests, ratings, NPS, and surveys
- **Beta Analytics** - Usage tracking, feature adoption, and program statistics

## Installation

```bash
npm install @vcomm/beta-release
```

## Quick Start

```typescript
import { BetaRelease } from '@vcomm/beta-release';

const beta = new BetaRelease({ debug: true });

// Create and evaluate a feature flag
beta.createFlag({
  key: 'new-feature',
  name: 'New Feature',
  type: 'boolean',
  status: 'partial',
  rolloutPercentage: 25,
  defaultValue: { enabled: false },
  rules: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin',
});

// Check if feature is enabled
const result = beta.evaluate('new-feature', { userId: 'user123' });
console.log(result.enabled); // true or false based on rollout

// Collect feedback
const feedback = beta.submitFeedback({
  type: 'bug_report',
  title: 'Button not working',
  description: 'The save button does not respond',
  userId: 'user123',
});
```

## Feature Flags

### Flag Types

| Type | Description |
|------|-------------|
| `boolean` | Simple on/off switch |
| `variant` | A/B testing with multiple variants |
| `multivariate` | Multiple variants with custom weights |
| `percentage` | Percentage-based rollout |
| `targeted` | User/segment targeted |

### Creating Flags

```typescript
// Simple boolean flag
beta.createFlag({
  key: 'dark-mode',
  name: 'Dark Mode',
  type: 'boolean',
  status: 'enabled',
  defaultValue: { enabled: false },
  rules: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin',
});

// Variant flag for A/B testing
beta.createFlag({
  key: 'checkout-flow',
  name: 'Checkout Flow',
  type: 'variant',
  status: 'enabled',
  defaultValue: { enabled: true, variant: 'control' },
  variants: [
    { key: 'control', name: 'Control', weight: 50 },
    { key: 'variant-a', name: 'Variant A', weight: 25 },
    { key: 'variant-b', name: 'Variant B', weight: 25 },
  ],
  rules: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin',
});
```

### Targeting Rules

```typescript
beta.createFlag({
  key: 'premium-features',
  name: 'Premium Features',
  type: 'boolean',
  status: 'partial',
  defaultValue: { enabled: false },
  rules: [
    {
      id: 'rule-1',
      name: 'Premium Users',
      priority: 1,
      conditions: [
        { property: 'segments', operator: 'in', value: ['premium', 'enterprise'] },
      ],
      matchAll: false,
      result: { enabled: true },
      enabled: true,
    },
    {
      id: 'rule-2',
      name: 'Internal Team',
      priority: 2,
      conditions: [
        { property: 'email', operator: 'ends_with', value: '@company.com' },
      ],
      matchAll: true,
      result: { enabled: true },
      enabled: true,
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin',
});
```

### Evaluating Flags

```typescript
// Basic evaluation
const result = beta.evaluate('new-feature');

// With context
const result = beta.evaluate('new-feature', {
  userId: 'user123',
  email: 'user@example.com',
  segments: ['premium'],
  platform: 'web',
  appVersion: '1.0.0',
});

console.log(result.enabled);
console.log(result.variant);  // For variant flags
console.log(result.reason);   // Why the flag was enabled/disabled
```

## Gradual Rollout

### Creating Rollouts

```typescript
const rollout = beta.createRollout({
  featureKey: 'new-feature',
  name: 'New Feature Rollout',
  strategy: 'staged',
  stages: [
    {
      id: 'stage-1',
      name: 'Canary',
      order: 0,
      targetPercentage: 5,
      durationHours: 24,
      status: 'pending',
    },
    {
      id: 'stage-2',
      name: 'Early Adopters',
      order: 1,
      targetPercentage: 25,
      durationHours: 48,
      status: 'pending',
    },
    {
      id: 'stage-3',
      name: 'General Availability',
      order: 2,
      targetPercentage: 100,
      durationHours: 0, // Manual advance
      status: 'pending',
    },
  ],
  createdBy: 'admin',
  rollbackPlan: {
    autoRollback: true,
    triggers: [
      { type: 'error_rate', threshold: 5, operator: 'greater_than', timeWindowMinutes: 5 },
    ],
    rollbackToPercentage: 0,
  },
});

// Start the rollout
await beta.startRollout(rollout.id);
```

### Rollout Strategies

| Strategy | Description |
|----------|-------------|
| `percentage` | Roll out to a percentage of users |
| `staged` | Progress through defined stages |
| `ring` | Canary deployment rings |
| `regional` | Roll out region by region |
| `segment` | Roll out to user segments |

### Rollback

```typescript
// Manual rollback
await beta.rollbackRollout(rolloutId, 'Critical bug detected');

// Automatic rollback based on triggers
// (configured in rollbackPlan)
```

## Feedback Collection

### Submitting Feedback

```typescript
// Bug report
beta.submitFeedback({
  type: 'bug_report',
  title: 'Login fails on Safari',
  description: 'Users cannot login using Safari browser',
  userId: 'user123',
  priority: 'high',
  tags: ['login', 'safari', 'browser'],
});

// Feature request
beta.submitFeedback({
  type: 'feature_request',
  title: 'Dark mode support',
  description: 'Please add dark mode to the application',
  userId: 'user456',
  tags: ['ui', 'accessibility'],
});

// Rating
beta.submitFeedback({
  type: 'rating',
  title: 'Feature Rating',
  description: 'How would you rate the new feature?',
  rating: 4,
  featureKey: 'new-feature',
});

// NPS
beta.submitFeedback({
  type: 'nps',
  title: 'NPS Survey',
  description: 'How likely are you to recommend us?',
  npsScore: 9,
});
```

### Creating Surveys

```typescript
const survey = beta.createSurvey({
  name: 'Beta Feedback Survey',
  description: 'Help us improve the beta experience',
  questions: [
    {
      text: 'How satisfied are you with the beta?',
      type: 'rating',
      required: true,
      ratingScale: [1, 5],
    },
    {
      text: 'What features do you use most?',
      type: 'multiple_choice',
      required: false,
      options: ['Messaging', 'Voice', 'Video', 'Screen Share'],
    },
    {
      text: 'Any additional feedback?',
      type: 'text',
      required: false,
      placeholder: 'Share your thoughts...',
    },
  ],
  active: true,
});

// Submit response
beta.submitSurveyResponse({
  surveyId: survey.id,
  userId: 'user123',
  answers: {
    'q-0': 4,
    'q-1': ['Messaging', 'Voice'],
    'q-2': 'Great experience so far!',
  },
});
```

## Analytics

### Tracking Metrics

```typescript
// Custom metrics
beta.trackMetric('custom_event', 1, { category: 'user_action' });

// Automatic tracking (via evaluate)
beta.evaluate('new-feature', { userId: 'user123' });
// Automatically tracks: feature_evaluation, feature_enabled/disabled
```

### Querying Metrics

```typescript
const result = beta.queryMetrics({
  metrics: ['feature_evaluation'],
  startTime: new Date(Date.now() - 86400000), // 24 hours ago
  endTime: new Date(),
  aggregation: 'sum',
  resolution: '1h',
  filters: { feature: 'new-feature' },
});

for (const point of result.data) {
  console.log(`${point.timestamp}: ${point.value}`);
}
```

### Feature Usage Stats

```typescript
const stats = beta.getFeatureUsageStats('new-feature', {
  start: new Date(Date.now() - 7 * 86400000), // 7 days ago
  end: new Date(),
});

console.log(`Total evaluations: ${stats.totalEvaluations}`);
console.log(`Enable rate: ${(stats.enableRate * 100).toFixed(1)}%`);
console.log(`Unique users: ${stats.uniqueUsers}`);
```

### Beta Program Stats

```typescript
const programStats = beta.getBetaProgramStats({
  start: new Date(Date.now() - 30 * 86400000), // 30 days ago
  end: new Date(),
});

console.log(`Total beta users: ${programStats.totalBetaUsers}`);
console.log(`Active users: ${programStats.activeUsers}`);
console.log(`Average NPS: ${programStats.averageNps}`);
console.log(`Bug reports: ${programStats.bugReports}`);
```

## API Reference

### BetaRelease

| Method | Description |
|--------|-------------|
| `createFlag(config)` | Create a feature flag |
| `getFlag(key)` | Get flag configuration |
| `updateFlag(key, updates)` | Update a flag |
| `deleteFlag(key)` | Delete a flag |
| `evaluate(key, context)` | Evaluate a flag |
| `isEnabled(key, context)` | Check if flag is enabled |
| `createRollout(config)` | Create a rollout |
| `startRollout(id)` | Start a rollout |
| `pauseRollout(id)` | Pause a rollout |
| `rollbackRollout(id, reason)` | Rollback a rollout |
| `submitFeedback(data)` | Submit feedback |
| `createSurvey(data)` | Create a survey |
| `trackMetric(name, value, tags)` | Track a metric |
| `queryMetrics(query)` | Query metrics |
| `registerBetaUser(data)` | Register a beta user |

## Configuration

```typescript
interface BetaReleaseConfig {
  // Enable debug logging
  debug?: boolean;
  
  // Enable caching for feature flags
  enableCache?: boolean;
  
  // Cache TTL in seconds
  cacheTtl?: number;
  
  // Enable auto-advance for rollouts
  enableAutoAdvance?: boolean;
  
  // Auto-acknowledge feedback
  autoAcknowledgeFeedback?: boolean;
  
  // Enable analytics collection
  enableAnalytics?: boolean;
}
```

## License

MIT
