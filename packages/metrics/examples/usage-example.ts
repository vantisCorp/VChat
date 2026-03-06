/**
 * Example usage of @vcomm/metrics
 * Demonstrates various features and integrations
 */

import express from 'express';
import { createMonitoring } from '@vcomm/metrics';

// Initialize monitoring
const monitoring = createMonitoring({
  enablePrometheus: true,
  enableSentry: true,
  sentryDsn: process.env.SENTRY_DSN,
  environment: 'development',
  sampleRate: 1.0
});

const app = express();

// Example 1: HTTP Request Tracking Middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    monitoring.trackRequest(
      req.method,
      req.path,
      res.statusCode,
      Date.now() - start,
      parseInt(res.get('Content-Length') || '0')
    );
  });
  
  next();
});

// Example 2: Metrics Endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  const { contentType, data } = await monitoring.getMetricsEndpoint();
  res.set('Content-Type', contentType);
  res.send(data);
});

// Example 3: Health Check Endpoint
app.get('/health', async (req, res) => {
  const health = await monitoring.healthCheck();
  res.json(health);
});

// Example 4: Message Tracking
app.post('/api/messages', async (req, res) => {
  const { channel, content, type } = req.body;
  
  try {
    // Measure processing time
    const result = await monitoring.measureTime(
      'send_message',
      async () => {
        // Simulate message sending
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return { id: 'msg_123', status: 'sent' };
      },
      { channel }
    );
    
    // Track message sent
    monitoring.trackMessage('sent', channel, 'success', type);
    
    res.json(result);
  } catch (error) {
    // Track message error
    monitoring.trackMessage('sent', channel, 'error', type);
    
    // Capture exception with Sentry
    monitoring.getSentry().captureException(error as Error, {
      channel,
      content
    });
    
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Example 5: Queue Size Monitoring
app.get('/api/queue/stats', (req, res) => {
  // Simulate queue stats
  const queueStats = {
    messageQueue: Math.floor(Math.random() * 5000),
    notificationQueue: Math.floor(Math.random() * 1000),
    workerQueue: Math.floor(Math.random() * 200)
  };
  
  // Track queue sizes
  Object.entries(queueStats).forEach(([queueType, size]) => {
    monitoring.trackQueueSize(queueType, size as number);
  });
  
  res.json(queueStats);
});

// Example 6: System Metrics Update
setInterval(() => {
  const systemStats = {
    activeConnections: Math.floor(Math.random() * 1000),
    memoryUsage: process.memoryUsage().heapUsed,
    cpuUsage: Math.random() * 100,
    diskUsage: Math.floor(Math.random() * 1000000000),
    networkIO: {
      inbound: Math.floor(Math.random() * 1000000),
      outbound: Math.floor(Math.random() * 1000000)
    }
  };
  
  monitoring.updateSystemMetrics(systemStats);
}, 5000);

// Example 7: Error Tracking with Context
app.get('/api/error', (req, res) => {
  try {
    // Simulate an error
    throw new Error('Intentional error for testing');
  } catch (error) {
    monitoring.getSentry().captureException(error as Error, {
      route: '/api/error',
      userId: 'user_123',
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Example 8: Transaction Tracking
app.get('/api/complex-operation', async (req, res) => {
  const sentry = monitoring.getSentry();
  
  // Start a transaction
  const transaction = sentry.startTransaction('complex-operation', 'api');
  
  try {
    // Step 1: Validate input
    const span1 = transaction?.startChild({ op: 'validation' });
    await new Promise(resolve => setTimeout(resolve, 10));
    span1?.finish();
    
    // Step 2: Process data
    const span2 = transaction?.startChild({ op: 'processing' });
    await new Promise(resolve => setTimeout(resolve, 50));
    span2?.finish();
    
    // Step 3: Save to database
    const span3 = transaction?.startChild({ op: 'database' });
    await new Promise(resolve => setTimeout(resolve, 30));
    span3?.finish();
    
    transaction?.finish();
    
    res.json({ success: true });
  } catch (error) {
    transaction?.setStatus('internal_error');
    transaction?.finish();
    
    res.status(500).json({ error: 'Operation failed' });
  }
});

// Example 9: User Context Tracking
app.post('/api/login', (req, res) => {
  const { userId, email, username } = req.body;
  
  // Set user context in Sentry
  monitoring.getSentry().setUser({
    id: userId,
    email,
    username
  });
  
  res.json({ success: true });
});

app.post('/api/logout', (req, res) => {
  // Clear user context
  monitoring.getSentry().clearUser();
  
  res.json({ success: true });
});

// Example 10: Breadcrumb Tracking
app.get('/api/step1', (req, res) => {
  monitoring.getSentry().addBreadcrumb({
    message: 'Step 1 completed',
    category: 'workflow',
    level: 'info',
    data: { step: 1, timestamp: Date.now() }
  });
  
  res.json({ step: 1, status: 'completed' });
});

app.get('/api/step2', (req, res) => {
  monitoring.getSentry().addBreadcrumb({
    message: 'Step 2 completed',
    category: 'workflow',
    level: 'info',
    data: { step: 2, timestamp: Date.now() }
  });
  
  res.json({ step: 2, status: 'completed' });
});

app.get('/api/step3', (req, res) => {
  monitoring.getSentry().addBreadcrumb({
    message: 'Step 3 completed',
    category: 'workflow',
    level: 'info',
    data: { step: 3, timestamp: Date.now() }
  });
  
  res.json({ step: 3, status: 'completed' });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`❤️  Health check at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await monitoring.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await monitoring.shutdown();
  process.exit(0);
});

export { app, monitoring };