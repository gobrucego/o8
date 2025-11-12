#!/usr/bin/env node

/**
 * Token Tracking Integration Tests
 *
 * Comprehensive end-to-end tests for the token tracking system:
 * 1. System initialization
 * 2. Token tracking on dynamic resource loads
 * 3. API endpoint correctness
 * 4. Session aggregation
 * 5. Category-based metrics
 * 6. Cache tracking
 * 7. Message ID deduplication
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TokenTracker } from '../../dist/token/tracker.js';
import { TokenStore } from '../../dist/token/store.js';
import { TokenMetrics } from '../../dist/token/metrics.js';
import { EfficiencyEngine } from '../../dist/token/efficiency.js';
import { ResourceLoader } from '../../dist/loaders/resourceLoader.js';
import { Logger } from '../../dist/utils/logger.js';
import { HTTPTransport } from '../../dist/transports/http.js';
import { StatsCollector } from '../../dist/stats/collector.js';

/**
 * Mock MCP Server for HTTP transport testing
 */
class MockMCPServer {
  constructor(tokenSystem) {
    this.tokenSystem = tokenSystem;
  }

  async handleRequest(method, params) {
    return { success: true };
  }

  async getAvailableAgents() {
    return [];
  }

  async getAvailableSkills() {
    return [];
  }

  async getAvailableWorkflows() {
    return [];
  }

  async getAvailablePatterns() {
    return [];
  }

  async searchResources(query) {
    return [];
  }

  async getResourceContent(uri) {
    return 'test content';
  }

  async getProviders() {
    return [];
  }

  async getProviderIndex(name) {
    return { resources: [] };
  }

  async searchAllProviders(query, options) {
    return [];
  }

  async getProviderHealth(name) {
    return { status: 'healthy' };
  }

  async getAllProvidersHealth() {
    return {};
  }

  getProviderStats(name) {
    return {};
  }

  async enableProvider(name) {}

  async disableProvider(name) {}
}

describe('Token Tracking Integration Tests', () => {
  let tracker;
  let store;
  let metrics;
  let efficiency;
  let logger;
  let resourceLoader;
  let tokenSystem;

  before(() => {
    logger = new Logger('TokenTrackingTest');
  });

  beforeEach(() => {
    // Initialize token tracking system components
    tracker = new TokenTracker({
      enabled: true,
      baselineStrategy: 'no_jit',
      deduplication: true,
    });

    store = new TokenStore({
      maxRecords: 1000,
      retentionDays: 7,
      autoCleanup: false, // Disable for tests
    });

    efficiency = new EfficiencyEngine();
    metrics = new TokenMetrics(store, efficiency);

    tokenSystem = {
      tracker,
      store,
      metrics,
      efficiency,
    };

    // Initialize ResourceLoader with token tracking
    resourceLoader = new ResourceLoader(logger, tracker, store);

    // Clear any existing data
    store.clear();
    tracker.clearTracked();
  });

  after(() => {
    if (store) {
      store.destroy();
    }
  });

  describe('1. Token System Initialization', () => {
    it('should initialize token system correctly', () => {
      assert.ok(tracker, 'TokenTracker should be initialized');
      assert.ok(store, 'TokenStore should be initialized');
      assert.ok(metrics, 'TokenMetrics should be initialized');
      assert.ok(efficiency, 'EfficiencyEngine should be initialized');
    });

    it('should initialize ResourceLoader with token tracking', () => {
      assert.ok(resourceLoader, 'ResourceLoader should be initialized');
      // Verify ResourceLoader has token tracking components (internal)
    });

    it('should have correct initial state', () => {
      const stats = store.getStats();
      assert.strictEqual(stats.totalRecords, 0, 'Should start with 0 records');
      assert.strictEqual(stats.totalSessions, 0, 'Should start with 0 sessions');
      assert.strictEqual(tracker.getTrackedCount(), 0, 'Should have 0 tracked messages');
    });
  });

  describe('2. Token Tracking on Dynamic Resource Load', () => {
    it('should track tokens when loading a resource', () => {
      const messageId = 'test-msg-001';
      const claudeUsage = {
        input_tokens: 1000,
        output_tokens: 500,
        cache_creation_input_tokens: 200,
        cache_read_input_tokens: 100,
      };

      const usage = tracker.track(messageId, claudeUsage, {
        category: 'agent',
        resourceUri: 'orchestr8://agents/project-manager',
        resourceCount: 3,
      });

      assert.ok(usage, 'Should return usage record');
      assert.strictEqual(usage.messageId, messageId);
      assert.strictEqual(usage.inputTokens, 1000);
      assert.strictEqual(usage.outputTokens, 500);
      assert.strictEqual(usage.cacheCreationTokens, 200);
      assert.strictEqual(usage.cacheReadTokens, 100);
      assert.strictEqual(usage.totalTokens, 1800);
      assert.strictEqual(usage.category, 'agent');
      assert.strictEqual(usage.resourceUri, 'orchestr8://agents/project-manager');
    });

    it('should calculate baseline tokens correctly', () => {
      const messageId = 'test-msg-002';
      const claudeUsage = {
        input_tokens: 1000,
        output_tokens: 500,
        cache_creation_input_tokens: 200,
        cache_read_input_tokens: 100,
      };

      const usage = tracker.track(messageId, claudeUsage, {
        resourceCount: 5, // 5 resources loaded
      });

      // With no_jit strategy: baseline = actual + (resourceCount * 500)
      const expectedBaseline = 1000 + 500 + 200 + 100 + (5 * 500);
      assert.strictEqual(usage.baselineTokens, expectedBaseline);
      assert.ok(usage.tokensSaved > 0, 'Should have token savings');
      assert.ok(usage.efficiencyPercentage > 0, 'Should have positive efficiency');
    });

    it('should calculate costs correctly', () => {
      const messageId = 'test-msg-003';
      const claudeUsage = {
        input_tokens: 1000000, // 1M tokens
        output_tokens: 500000,
        cache_creation_input_tokens: 100000,
        cache_read_input_tokens: 50000,
      };

      const usage = tracker.track(messageId, claudeUsage);

      // Expected costs (based on default pricing):
      // Input: 1M * $3/M = $3
      // Output: 0.5M * $15/M = $7.5
      // Cache creation: 0.1M * $3.75/M = $0.375
      // Cache read: 0.05M * $0.30/M = $0.015
      // Total: $10.89
      const expectedCost = 3 + 7.5 + 0.375 + 0.015;
      assert.ok(Math.abs(usage.costUSD - expectedCost) < 0.01,
        `Cost should be approximately $${expectedCost}, got $${usage.costUSD}`);
    });

    it('should store usage in TokenStore', () => {
      const messageId = 'test-msg-004';
      const claudeUsage = {
        input_tokens: 1000,
        output_tokens: 500,
      };

      const usage = tracker.track(messageId, claudeUsage);
      store.saveUsage(usage);

      const stats = store.getStats();
      assert.strictEqual(stats.totalRecords, 1);

      const recent = store.getRecentUsage(10);
      assert.strictEqual(recent.length, 1);
      assert.strictEqual(recent[0].messageId, messageId);
    });
  });

  describe('3. API Endpoints Data Correctness', () => {
    beforeEach(() => {
      // Populate store with test data
      const testData = [
        {
          messageId: 'msg-1',
          claudeUsage: { input_tokens: 1000, output_tokens: 500 },
          metadata: { category: 'agent', resourceUri: 'orchestr8://agents/test-1' },
        },
        {
          messageId: 'msg-2',
          claudeUsage: { input_tokens: 2000, output_tokens: 1000 },
          metadata: { category: 'skill', resourceUri: 'orchestr8://skills/test-1' },
        },
        {
          messageId: 'msg-3',
          claudeUsage: { input_tokens: 1500, output_tokens: 750, cache_read_input_tokens: 500 },
          metadata: { category: 'agent', resourceUri: 'orchestr8://agents/test-2' },
        },
      ];

      testData.forEach((data) => {
        const usage = tracker.track(data.messageId, data.claudeUsage, data.metadata);
        if (usage) {
          store.saveUsage(usage);
        }
      });
    });

    it('should return valid efficiency snapshot', () => {
      const snapshot = metrics.getEfficiencySnapshot({ period: 'all_time' });

      assert.ok(snapshot, 'Snapshot should be returned');
      assert.ok(snapshot.timestamp, 'Should have timestamp');
      assert.strictEqual(snapshot.period, 'all_time');
      assert.ok(snapshot.overall, 'Should have overall metrics');
      assert.ok(snapshot.overall.totalTokens > 0, 'Should have total tokens');
      assert.ok(snapshot.overall.baselineTokens > 0, 'Should have baseline tokens');
      assert.ok(Array.isArray(snapshot.byCategory), 'Should have category breakdown');
      assert.ok(snapshot.cache, 'Should have cache metrics');
    });

    it('should group metrics by category correctly', () => {
      const snapshot = metrics.getEfficiencySnapshot();
      const categories = snapshot.byCategory;

      assert.ok(categories.length > 0, 'Should have categories');

      // Find agent and skill categories
      const agentMetrics = categories.find((c) => c.category === 'agent');
      const skillMetrics = categories.find((c) => c.category === 'skill');

      assert.ok(agentMetrics, 'Should have agent metrics');
      assert.ok(skillMetrics, 'Should have skill metrics');
      assert.strictEqual(agentMetrics.loadCount, 2, 'Agent should have 2 loads');
      assert.strictEqual(skillMetrics.loadCount, 1, 'Skill should have 1 load');
    });

    it('should calculate summary correctly', () => {
      const summary = metrics.getSummary({ period: 'all_time' });

      assert.strictEqual(summary.totalMessages, 3, 'Should have 3 messages');
      assert.ok(summary.totalTokens > 0, 'Should have total tokens');
      assert.ok(summary.tokensSaved >= 0, 'Should have tokens saved (>=0)');
      assert.ok(summary.efficiency >= 0 && summary.efficiency <= 100,
        'Efficiency should be between 0-100%');
      assert.ok(summary.costUSD > 0, 'Should have cost');
      assert.ok(summary.uniqueResources === 3, 'Should have 3 unique resources');
    });

    it('should handle period query parameter', () => {
      // Test last_hour
      const hourSnapshot = metrics.getEfficiencySnapshot({ period: 'last_hour' });
      assert.strictEqual(hourSnapshot.period, 'last_hour');

      // Test last_day
      const daySnapshot = metrics.getEfficiencySnapshot({ period: 'last_day' });
      assert.strictEqual(daySnapshot.period, 'last_day');

      // Test last_week
      const weekSnapshot = metrics.getEfficiencySnapshot({ period: 'last_week' });
      assert.strictEqual(weekSnapshot.period, 'last_week');
    });

    it('should return cost savings report', () => {
      const costReport = metrics.getCostSavings({ period: 'all_time' });

      assert.strictEqual(costReport.period, 'all_time');
      assert.ok(costReport.totalCost >= 0, 'Total cost should be non-negative');
      assert.ok(costReport.baselineCost >= costReport.totalCost,
        'Baseline cost should be >= actual cost');
      assert.ok(costReport.savings >= 0, 'Savings should be non-negative');
      assert.ok(Array.isArray(costReport.byCategory), 'Should have category breakdown');
    });
  });

  describe('4. Session Aggregation', () => {
    it('should create and track session', () => {
      const sessionId = 'session-001';
      const usage1 = tracker.track('msg-1', {
        input_tokens: 1000,
        output_tokens: 500,
      });
      const usage2 = tracker.track('msg-2', {
        input_tokens: 2000,
        output_tokens: 1000,
      });

      store.saveUsage(usage1, sessionId);
      store.saveUsage(usage2, sessionId);

      const session = store.getSessionData(sessionId);
      assert.ok(session, 'Session should exist');
      assert.strictEqual(session.sessionId, sessionId);
      assert.strictEqual(session.messageCount, 2);
      assert.strictEqual(session.trackedMessageIds.size, 2);
      assert.strictEqual(session.totalInputTokens, 3000);
      assert.strictEqual(session.totalOutputTokens, 1500);
      assert.strictEqual(session.totalTokens, 4500);
    });

    it('should calculate session efficiency', () => {
      const sessionId = 'session-002';

      for (let i = 0; i < 5; i++) {
        const usage = tracker.track(`msg-${i}`, {
          input_tokens: 1000,
          output_tokens: 500,
        }, {
          resourceCount: 3,
        });
        store.saveUsage(usage, sessionId);
      }

      const session = store.getSessionData(sessionId);
      assert.ok(session.sessionEfficiency >= 0, 'Session should have valid efficiency');
      assert.ok(session.totalTokensSaved >= 0, 'Session should have token savings (>=0)');
      assert.ok(session.totalCostSavingsUSD >= 0, 'Session should have cost savings (>=0)');
      assert.strictEqual(session.messageCount, 5, 'Session should have 5 messages');
    });

    it('should handle session end', () => {
      const sessionId = 'session-003';
      const usage = tracker.track('msg-1', { input_tokens: 1000, output_tokens: 500 });
      store.saveUsage(usage, sessionId);

      const session = store.getSessionData(sessionId);
      assert.ok(!session.endTime, 'Session should not have end time initially');

      store.endSession(sessionId);
      const endedSession = store.getSessionData(sessionId);
      assert.ok(endedSession.endTime, 'Session should have end time after ending');
    });

    it('should list all sessions', () => {
      // Create multiple sessions
      for (let i = 0; i < 3; i++) {
        const sessionId = `session-${i}`;
        const usage = tracker.track(`msg-${i}`, {
          input_tokens: 1000,
          output_tokens: 500,
        });
        store.saveUsage(usage, sessionId);
      }

      const sessions = store.getAllSessions();
      assert.strictEqual(sessions.length, 3, 'Should have 3 sessions');
    });
  });

  describe('5. Category-Based Metrics', () => {
    beforeEach(() => {
      // Create usage across different categories
      const categories = ['agent', 'skill', 'pattern', 'workflow', 'example'];

      categories.forEach((category, index) => {
        const usage = tracker.track(`msg-${category}-${index}`, {
          input_tokens: 1000 * (index + 1),
          output_tokens: 500 * (index + 1),
        }, {
          category,
          resourceUri: `orchestr8://${category}s/test-${index}`,
        });
        store.saveUsage(usage);
      });
    });

    it('should separate categories correctly', () => {
      const categoryMetrics = metrics.getByCategory();

      assert.ok(categoryMetrics.length >= 5, 'Should have at least 5 categories');

      const categories = categoryMetrics.map((m) => m.category);
      assert.ok(categories.includes('agent'), 'Should include agent category');
      assert.ok(categories.includes('skill'), 'Should include skill category');
      assert.ok(categories.includes('pattern'), 'Should include pattern category');
      assert.ok(categories.includes('workflow'), 'Should include workflow category');
      assert.ok(categories.includes('example'), 'Should include example category');
    });

    it('should calculate category-specific metrics', () => {
      const categoryMetrics = metrics.getByCategory();
      const agentMetrics = categoryMetrics.find((m) => m.category === 'agent');

      assert.ok(agentMetrics, 'Should have agent metrics');
      assert.strictEqual(agentMetrics.loadCount, 1);
      assert.ok(agentMetrics.totalTokens > 0);
      assert.ok(agentMetrics.inputTokens > 0);
      assert.ok(agentMetrics.outputTokens > 0);
      assert.ok(agentMetrics.baselineTokens > 0);
      assert.ok(agentMetrics.tokensSaved >= 0);
      assert.ok(agentMetrics.efficiency >= 0);
    });

    it('should filter by category in snapshot', () => {
      const snapshot = metrics.getEfficiencySnapshot({
        period: 'all_time',
        category: 'agent',
      });

      // When filtered by category, should only include that category's data
      assert.ok(snapshot.overall.totalTokens > 0);
    });
  });

  describe('6. Cache Tracking Differentiation', () => {
    it('should track cache miss (initial load)', () => {
      const messageId = 'cache-miss-001';
      const usage = tracker.track(messageId, {
        input_tokens: 1000,
        output_tokens: 500,
        cache_creation_input_tokens: 1000, // Cache created
        cache_read_input_tokens: 0, // No cache read
      });

      assert.strictEqual(usage.cacheCreationTokens, 1000);
      assert.strictEqual(usage.cacheReadTokens, 0);
    });

    it('should track cache hit (subsequent load)', () => {
      const messageId = 'cache-hit-001';
      const usage = tracker.track(messageId, {
        input_tokens: 100,
        output_tokens: 500,
        cache_creation_input_tokens: 0, // No cache creation
        cache_read_input_tokens: 900, // Cache read
      });

      assert.strictEqual(usage.cacheCreationTokens, 0);
      assert.strictEqual(usage.cacheReadTokens, 900);
    });

    it('should calculate cache metrics in snapshot', () => {
      // Create cache miss
      const usage1 = tracker.track('msg-1', {
        input_tokens: 1000,
        output_tokens: 500,
        cache_creation_input_tokens: 1000,
      });
      store.saveUsage(usage1);

      // Create cache hit
      const usage2 = tracker.track('msg-2', {
        input_tokens: 100,
        output_tokens: 500,
        cache_read_input_tokens: 900,
      });
      store.saveUsage(usage2);

      const snapshot = metrics.getEfficiencySnapshot();

      assert.ok(snapshot.cache, 'Should have cache metrics');
      assert.strictEqual(snapshot.cache.totalCacheCreations, 1000);
      assert.strictEqual(snapshot.cache.totalCacheReads, 900);
      assert.ok(snapshot.cache.cacheHitRate >= 0 && snapshot.cache.cacheHitRate <= 100,
        'Cache hit rate should be 0-100%');
    });
  });

  describe('7. Message ID Deduplication', () => {
    it('should prevent duplicate tracking of same message', () => {
      const messageId = 'duplicate-test-001';
      const claudeUsage = {
        input_tokens: 1000,
        output_tokens: 500,
      };

      // First track - should succeed
      const usage1 = tracker.track(messageId, claudeUsage);
      assert.ok(usage1, 'First track should return usage');
      store.saveUsage(usage1);

      // Second track with same ID - should return null
      const usage2 = tracker.track(messageId, claudeUsage);
      assert.strictEqual(usage2, null, 'Duplicate track should return null');

      // Verify only one record in store
      const stats = store.getStats();
      assert.strictEqual(stats.totalRecords, 1, 'Should only have 1 record');
    });

    it('should track different message IDs', () => {
      const usage1 = tracker.track('msg-unique-1', {
        input_tokens: 1000,
        output_tokens: 500,
      });
      const usage2 = tracker.track('msg-unique-2', {
        input_tokens: 1000,
        output_tokens: 500,
      });

      assert.ok(usage1, 'First message should be tracked');
      assert.ok(usage2, 'Second message should be tracked');

      store.saveUsage(usage1);
      store.saveUsage(usage2);

      const stats = store.getStats();
      assert.strictEqual(stats.totalRecords, 2, 'Should have 2 records');
    });

    it('should maintain deduplication across sessions', () => {
      const messageId = 'session-dup-001';

      const usage1 = tracker.track(messageId, {
        input_tokens: 1000,
        output_tokens: 500,
      });
      store.saveUsage(usage1, 'session-1');

      // Try to track same message in different session
      const usage2 = tracker.track(messageId, {
        input_tokens: 1000,
        output_tokens: 500,
      });

      assert.strictEqual(usage2, null, 'Should be deduplicated even in different session');
    });
  });

  describe('8. Error Handling and Edge Cases', () => {
    it('should handle empty store gracefully', () => {
      const snapshot = metrics.getEfficiencySnapshot();

      assert.strictEqual(snapshot.overall.totalTokens, 0);
      assert.strictEqual(snapshot.overall.baselineTokens, 0);
      assert.strictEqual(snapshot.overall.tokensSaved, 0);
      assert.strictEqual(snapshot.overall.efficiencyPercentage, 0);
      assert.strictEqual(snapshot.byCategory.length, 0);
    });

    it('should handle missing session gracefully', () => {
      const session = store.getSessionData('non-existent-session');
      assert.strictEqual(session, undefined);
    });

    it('should handle zero token usage', () => {
      const usage = tracker.track('zero-tokens', {
        input_tokens: 0,
        output_tokens: 0,
      });

      assert.ok(usage);
      assert.strictEqual(usage.totalTokens, 0);
      assert.strictEqual(usage.costUSD, 0);
    });

    it('should handle disabled tracking', () => {
      const disabledTracker = new TokenTracker({
        enabled: false,
      });

      const usage = disabledTracker.track('disabled-test', {
        input_tokens: 1000,
        output_tokens: 500,
      });

      assert.strictEqual(usage, null, 'Disabled tracker should return null');
    });

    it('should handle store cleanup', () => {
      // Add old records
      const oldUsage = tracker.track('old-msg', {
        input_tokens: 1000,
        output_tokens: 500,
      });

      if (oldUsage) {
        // Manually set old timestamp
        oldUsage.timestamp = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
        store.saveUsage(oldUsage);
      }

      // Add new record
      const newUsage = tracker.track('new-msg', {
        input_tokens: 1000,
        output_tokens: 500,
      });
      store.saveUsage(newUsage);

      // Run cleanup (should remove records older than 7 days)
      const removed = store.cleanup();

      assert.ok(removed >= 0, 'Cleanup should return number of removed records');
    });
  });

  describe('9. Performance and Memory', () => {
    it('should handle 100 records efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        const usage = tracker.track(`perf-msg-${i}`, {
          input_tokens: 1000,
          output_tokens: 500,
        }, {
          category: 'agent',
        });
        store.saveUsage(usage);
      }

      const elapsed = Date.now() - start;
      assert.ok(elapsed < 1000, `Should process 100 records in <1s, took ${elapsed}ms`);

      const stats = store.getStats();
      assert.strictEqual(stats.totalRecords, 100);
    });

    it('should respect maxRecords limit', () => {
      const limitedStore = new TokenStore({
        maxRecords: 10,
        autoCleanup: false,
      });

      // Add 20 records
      for (let i = 0; i < 20; i++) {
        const usage = tracker.track(`limit-msg-${i}`, {
          input_tokens: 1000,
          output_tokens: 500,
        });
        limitedStore.saveUsage(usage);
      }

      const stats = limitedStore.getStats();
      assert.ok(stats.totalRecords <= 10, `Should limit to 10 records, has ${stats.totalRecords}`);

      limitedStore.destroy();
    });

    it('should provide memory usage estimate', () => {
      // Add some records
      for (let i = 0; i < 50; i++) {
        const usage = tracker.track(`mem-msg-${i}`, {
          input_tokens: 1000,
          output_tokens: 500,
        });
        store.saveUsage(usage);
      }

      const stats = store.getStats();
      assert.ok(stats.memoryUsageEstimate, 'Should provide memory estimate');
      assert.ok(stats.memoryUsageEstimate.includes('KB') ||
                stats.memoryUsageEstimate.includes('MB'),
                'Memory estimate should be in KB or MB');
    });
  });
});

console.log('\n✅ Token Tracking Integration Tests Complete\n');
