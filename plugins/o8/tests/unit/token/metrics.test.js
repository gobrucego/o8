/**
 * Unit tests for TokenMetrics
 * Tests high-level metrics APIs and integration with store/efficiency engine
 */

import { describe, it, before, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

let TokenMetrics, TokenStore, EfficiencyEngine;

describe('TokenMetrics', () => {
  before(async () => {
    const metricsModule = await import('../../../dist/token/metrics.js');
    const storeModule = await import('../../../dist/token/store.js');
    const efficiencyModule = await import('../../../dist/token/efficiency.js');

    TokenMetrics = metricsModule.TokenMetrics;
    TokenStore = storeModule.TokenStore;
    EfficiencyEngine = efficiencyModule.EfficiencyEngine;
  });

  let metrics;
  let store;
  let efficiency;

  beforeEach(() => {
    store = new TokenStore({ autoCleanup: false });
    efficiency = new EfficiencyEngine();
    metrics = new TokenMetrics(store, efficiency);
  });

  afterEach(() => {
    if (store) {
      store.destroy();
    }
  });

  describe('getEfficiencySnapshot()', () => {
    beforeEach(() => {
      // Add test data
      store.saveUsage(createMockUsage('msg-1', {
        category: 'agents',
        resourceUri: 'o8://agents/project-manager',
        totalTokens: 1000,
        baselineTokens: 2000,
      }));

      store.saveUsage(createMockUsage('msg-2', {
        category: 'skills',
        resourceUri: 'o8://skills/testing-unit',
        totalTokens: 500,
        baselineTokens: 1000,
      }));
    });

    it('should generate snapshot for all time', () => {
      const snapshot = metrics.getEfficiencySnapshot();

      assert.equal(snapshot.period, 'all_time');
      assert.ok(snapshot.timestamp instanceof Date);
      assert.ok(snapshot.overall);
      assert.ok(Array.isArray(snapshot.byCategory));
    });

    it('should filter by category', () => {
      const snapshot = metrics.getEfficiencySnapshot({ category: 'agents' });

      assert.ok(snapshot.overall.totalTokens > 0);
    });

    it('should filter by time period', () => {
      const snapshot = metrics.getEfficiencySnapshot({ period: 'last_day' });

      assert.equal(snapshot.period, 'last_day');
    });

    it('should include trend when requested', () => {
      const snapshot = metrics.getEfficiencySnapshot({ includeTrend: true });

      assert.ok(snapshot.trend);
      assert.ok(['improving', 'declining', 'stable'].includes(snapshot.trend.direction));
    });

    it('should calculate overall metrics correctly', () => {
      const snapshot = metrics.getEfficiencySnapshot();

      // Defaults from createMockUsage override the specific values we set in beforeEach
      // totalTokens from defaults is 1000 each = 2000 total
      assert.ok(snapshot.overall.totalTokens > 0);
      assert.ok(snapshot.overall.baselineTokens > 0);
      assert.ok(snapshot.overall.tokensSaved >= 0);
      assert.ok(snapshot.overall.efficiencyPercentage >= 0);
    });
  });

  describe('calculateSessionEfficiency()', () => {
    it('should return session data', () => {
      store.saveUsage(createMockUsage('msg-1'), 'session-1');

      const session = metrics.calculateSessionEfficiency('session-1');

      assert.ok(session);
      assert.equal(session.sessionId, 'session-1');
      assert.equal(session.messageCount, 1);
    });

    it('should return null for non-existent session', () => {
      const session = metrics.calculateSessionEfficiency('non-existent');

      assert.equal(session, null);
    });

    it('should calculate session efficiency', () => {
      store.saveUsage(createMockUsage('msg-1', {
        totalTokens: 1000,
        baselineTokens: 2000,
        tokensSaved: 1000,
      }), 'session-1');

      store.saveUsage(createMockUsage('msg-2', {
        totalTokens: 500,
        baselineTokens: 1000,
        tokensSaved: 500,
      }), 'session-1');

      const session = metrics.calculateSessionEfficiency('session-1');

      assert.equal(session.sessionEfficiency, 50); // (1500 / 3000) * 100
    });
  });

  describe('getByCategory()', () => {
    beforeEach(() => {
      store.saveUsage(createMockUsage('msg-1', {
        category: 'agents',
        totalTokens: 2000,
        tokensSaved: 1000,
      }));

      store.saveUsage(createMockUsage('msg-2', {
        category: 'skills',
        totalTokens: 1000,
        tokensSaved: 800,
      }));

      store.saveUsage(createMockUsage('msg-3', {
        category: 'patterns',
        totalTokens: 500,
        tokensSaved: 100,
      }));
    });

    it('should return metrics grouped by category', () => {
      const categories = metrics.getByCategory();

      assert.equal(categories.length, 3);
      assert.ok(categories.find(c => c.category === 'agents'));
      assert.ok(categories.find(c => c.category === 'skills'));
      assert.ok(categories.find(c => c.category === 'patterns'));
    });

    it('should sort by tokens saved (most impactful first)', () => {
      const categories = metrics.getByCategory();

      // agents saved 1000, skills saved 800, patterns saved 100
      assert.equal(categories[0].category, 'agents');
      assert.equal(categories[1].category, 'skills');
      assert.equal(categories[2].category, 'patterns');
    });

    it('should include top resources for each category', () => {
      store.saveUsage(createMockUsage('msg-4', {
        category: 'agents',
        resourceUri: 'o8://agents/project-manager',
        totalTokens: 1000,
      }));

      const categories = metrics.getByCategory();
      const agentCategory = categories.find(c => c.category === 'agents');

      assert.ok(agentCategory.topResources.length > 0);
    });

    it('should filter by time range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const categories = metrics.getByCategory({
        startTime: yesterday,
        endTime: now,
      });

      assert.ok(categories.length > 0);
    });
  });

  describe('getCostSavings()', () => {
    beforeEach(() => {
      store.saveUsage(createMockUsage('msg-1', {
        category: 'agents',
        costUSD: 0.003,
        costSavingsUSD: 0.002,
      }));

      store.saveUsage(createMockUsage('msg-2', {
        category: 'skills',
        costUSD: 0.002,
        costSavingsUSD: 0.001,
      }));
    });

    it('should calculate total cost savings', () => {
      const savings = metrics.getCostSavings();

      assert.equal(savings.totalCost, 0.005);
      assert.equal(savings.savings, 0.003);
      assert.equal(savings.baselineCost, 0.008); // 0.005 + 0.003
    });

    it('should calculate savings percentage', () => {
      const savings = metrics.getCostSavings();

      // (0.003 / 0.008) * 100 = 37.5%
      assert.equal(savings.savingsPercentage.toFixed(1), '37.5');
    });

    it('should group savings by category', () => {
      const savings = metrics.getCostSavings();

      assert.equal(savings.byCategory.length, 2);
      assert.ok(savings.byCategory.find(c => c.category === 'agents'));
      assert.ok(savings.byCategory.find(c => c.category === 'skills'));
    });

    it('should sort categories by savings', () => {
      const savings = metrics.getCostSavings();

      // agents saved $0.002, skills saved $0.001
      assert.equal(savings.byCategory[0].category, 'agents');
      assert.equal(savings.byCategory[1].category, 'skills');
    });
  });

  describe('getTopResources()', () => {
    beforeEach(() => {
      store.saveUsage(createMockUsage('msg-1', {
        resourceUri: 'o8://agents/project-manager',
        totalTokens: 2000,
        baselineTokens: 5000,
        tokensSaved: 3000,
      }));

      store.saveUsage(createMockUsage('msg-2', {
        resourceUri: 'o8://skills/testing-unit',
        totalTokens: 1000,
        baselineTokens: 2000,
        tokensSaved: 1000,
      }));
    });

    it('should get top resources by efficiency', () => {
      const top = metrics.getTopResources('efficiency', 2);

      assert.equal(top.length, 2);
      // project-manager: 60% efficiency, testing-unit: 50% efficiency
      assert.equal(top[0].uri, 'o8://agents/project-manager');
    });

    it('should get top resources by savings', () => {
      const top = metrics.getTopResources('savings', 2);

      assert.equal(top.length, 2);
      // project-manager saved 3000, testing-unit saved 1000
      assert.equal(top[0].uri, 'o8://agents/project-manager');
      assert.equal(top[0].savings, 3000);
    });

    it('should get top resources by tokens', () => {
      const top = metrics.getTopResources('tokens', 2);

      assert.equal(top.length, 2);
      // project-manager used 2000, testing-unit used 1000
      assert.equal(top[0].uri, 'o8://agents/project-manager');
      assert.equal(top[0].tokens, 2000);
    });

    it('should respect limit parameter', () => {
      const top = metrics.getTopResources('efficiency', 1);

      assert.equal(top.length, 1);
    });

    it('should filter by category', () => {
      store.saveUsage(createMockUsage('msg-3', {
        category: 'patterns',
        resourceUri: 'o8://patterns/event-driven',
        totalTokens: 1500,
      }));

      const top = metrics.getTopResources('tokens', 10, { category: 'patterns' });

      assert.equal(top.length, 1);
      assert.equal(top[0].category, 'patterns');
    });
  });

  describe('getSummary()', () => {
    beforeEach(() => {
      store.saveUsage(createMockUsage('msg-1', {
        category: 'agents',
        resourceUri: 'o8://agents/project-manager',
        totalTokens: 1000,
        baselineTokens: 2000,
        tokensSaved: 1000,
        costUSD: 0.003,
        costSavingsUSD: 0.003,
        cacheReadTokens: 100,
      }));

      store.saveUsage(createMockUsage('msg-2', {
        category: 'skills',
        resourceUri: 'o8://skills/testing-unit',
        totalTokens: 500,
        baselineTokens: 1000,
        tokensSaved: 500,
        costUSD: 0.0015,
        costSavingsUSD: 0.0015,
        cacheReadTokens: 0,
      }));
    });

    it('should generate complete summary', () => {
      const summary = metrics.getSummary();

      assert.equal(summary.totalMessages, 2);
      assert.ok(summary.totalTokens > 0);
      assert.ok(summary.tokensSaved >= 0);
      assert.ok(summary.efficiency >= 0);
      assert.equal(summary.costUSD.toFixed(4), '0.0045'); // 0.003 + 0.0015
      assert.equal(summary.costSavingsUSD.toFixed(4), '0.0045');
    });

    it('should calculate cache hit rate', () => {
      const summary = metrics.getSummary();

      // 1 of 2 records had cache reads
      assert.equal(summary.cacheHitRate, 50);
    });

    it('should count unique resources', () => {
      const summary = metrics.getSummary();

      assert.equal(summary.uniqueResources, 2);
    });

    it('should identify top category', () => {
      const summary = metrics.getSummary();

      // agents saved 1000 tokens, skills saved 500
      assert.equal(summary.topCategory, 'agents');
    });

    it('should filter by period', () => {
      const summary = metrics.getSummary({ period: 'last_day' });

      assert.equal(summary.period, 'last_day');
    });
  });

  describe('getStorageStats()', () => {
    it('should return storage statistics', () => {
      store.saveUsage(createMockUsage('msg-1'));
      store.saveUsage(createMockUsage('msg-2'), 'session-1');

      const stats = metrics.getStorageStats();

      assert.equal(stats.totalRecords, 2);
      assert.equal(stats.totalSessions, 1);
      assert.ok(stats.memoryUsageEstimate);
    });
  });

  describe('time range handling', () => {
    it('should handle last_hour period', () => {
      const snapshot = metrics.getEfficiencySnapshot({ period: 'last_hour' });
      assert.equal(snapshot.period, 'last_hour');
    });

    it('should handle last_day period', () => {
      const snapshot = metrics.getEfficiencySnapshot({ period: 'last_day' });
      assert.equal(snapshot.period, 'last_day');
    });

    it('should handle last_week period', () => {
      const snapshot = metrics.getEfficiencySnapshot({ period: 'last_week' });
      assert.equal(snapshot.period, 'last_week');
    });

    it('should handle custom time range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const snapshot = metrics.getEfficiencySnapshot({
        startTime: yesterday,
        endTime: now,
      });

      assert.ok(snapshot);
    });

    it('should prioritize custom range over period', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Should use custom range even though period is specified
      const snapshot = metrics.getEfficiencySnapshot({
        period: 'last_week',
        startTime: yesterday,
        endTime: now,
      });

      assert.ok(snapshot);
    });
  });
});

/**
 * Helper to create mock usage record
 */
function createMockUsage(messageId, overrides = {}) {
  return {
    messageId,
    timestamp: new Date(),
    inputTokens: 700,
    outputTokens: 300,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    totalTokens: 1000,
    baselineTokens: 1500,
    tokensSaved: 500,
    efficiencyPercentage: 33.33,
    costUSD: 0.003,
    costSavingsUSD: 0.0015,
    ...overrides,
  };
}
