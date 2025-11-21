/**
 * Unit tests for EfficiencyEngine
 * Tests efficiency calculations, grouping, trend analysis
 */

import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

let EfficiencyEngine;

describe('EfficiencyEngine', () => {
  before(async () => {
    const module = await import('../../../dist/token/efficiency.js');
    EfficiencyEngine = module.EfficiencyEngine;
  });

  let engine;

  beforeEach(() => {
    engine = new EfficiencyEngine();
  });

  describe('calculateEfficiency()', () => {
    it('should calculate efficiency percentage', () => {
      const efficiency = engine.calculateEfficiency(500, 1000);
      assert.equal(efficiency, 50); // (1000 - 500) / 1000 * 100 = 50%
    });

    it('should handle 100% efficiency', () => {
      const efficiency = engine.calculateEfficiency(0, 1000);
      assert.equal(efficiency, 100);
    });

    it('should handle 0% efficiency', () => {
      const efficiency = engine.calculateEfficiency(1000, 1000);
      assert.equal(efficiency, 0);
    });

    it('should handle zero baseline', () => {
      const efficiency = engine.calculateEfficiency(100, 0);
      assert.equal(efficiency, 0);
    });

    it('should handle actual > baseline', () => {
      const efficiency = engine.calculateEfficiency(2000, 1000);
      assert.equal(efficiency, 0); // No savings when actual exceeds baseline
    });
  });

  describe('calculateSavings()', () => {
    it('should calculate positive savings', () => {
      const savings = engine.calculateSavings(500, 1000);
      assert.equal(savings, 500);
    });

    it('should return 0 for negative savings', () => {
      const savings = engine.calculateSavings(1500, 1000);
      assert.equal(savings, 0);
    });

    it('should return 0 when actual equals baseline', () => {
      const savings = engine.calculateSavings(1000, 1000);
      assert.equal(savings, 0);
    });
  });

  describe('groupByCategory()', () => {
    it('should group records by category', () => {
      const records = [
        createMockUsage('msg-1', { category: 'agents', totalTokens: 1000 }),
        createMockUsage('msg-2', { category: 'agents', totalTokens: 500 }),
        createMockUsage('msg-3', { category: 'skills', totalTokens: 800 }),
      ];

      const grouped = engine.groupByCategory(records);

      assert.equal(grouped.size, 2);
      assert.ok(grouped.has('agents'));
      assert.ok(grouped.has('skills'));

      const agentMetrics = grouped.get('agents');
      assert.equal(agentMetrics.loadCount, 2);
      assert.equal(agentMetrics.totalTokens, 1500);

      const skillMetrics = grouped.get('skills');
      assert.equal(skillMetrics.loadCount, 1);
      assert.equal(skillMetrics.totalTokens, 800);
    });

    it('should handle uncategorized records', () => {
      const records = [
        createMockUsage('msg-1', { totalTokens: 1000 }), // No category
      ];

      const grouped = engine.groupByCategory(records);

      assert.ok(grouped.has('uncategorized'));
    });

    it('should aggregate all token types', () => {
      const records = [
        createMockUsage('msg-1', {
          category: 'agents',
          inputTokens: 1000,
          outputTokens: 500,
          cacheReadTokens: 200,
          cacheCreationTokens: 100,
          totalTokens: 1800,
        }),
      ];

      const grouped = engine.groupByCategory(records);
      const metrics = grouped.get('agents');

      assert.equal(metrics.inputTokens, 1000);
      assert.equal(metrics.outputTokens, 500);
      assert.equal(metrics.cacheTokens, 300); // 200 + 100
    });

    it('should calculate category efficiency', () => {
      const records = [
        createMockUsage('msg-1', {
          category: 'agents',
          totalTokens: 1000,
          baselineTokens: 2000,
          tokensSaved: 1000,
        }),
      ];

      const grouped = engine.groupByCategory(records);
      const metrics = grouped.get('agents');

      assert.equal(metrics.efficiency, 50);
    });

    it('should aggregate costs', () => {
      const records = [
        createMockUsage('msg-1', {
          category: 'agents',
          costUSD: 1.5,
          costSavingsUSD: 0.5,
        }),
        createMockUsage('msg-2', {
          category: 'agents',
          costUSD: 2.0,
          costSavingsUSD: 1.0,
        }),
      ];

      const grouped = engine.groupByCategory(records);
      const metrics = grouped.get('agents');

      assert.equal(metrics.costUSD, 3.5);
      assert.equal(metrics.costSavingsUSD, 1.5);
    });
  });

  describe('getTopResources()', () => {
    const records = [
      createMockUsage('msg-1', {
        resourceUri: 'o8://agents/project-manager',
        category: 'agents',
        totalTokens: 1000,
        baselineTokens: 4000,
        tokensSaved: 3000,
      }),
      createMockUsage('msg-2', {
        resourceUri: 'o8://skills/testing-unit',
        category: 'skills',
        totalTokens: 500,
        baselineTokens: 1000,
        tokensSaved: 500,
      }),
      createMockUsage('msg-3', {
        resourceUri: 'o8://patterns/event-driven',
        category: 'patterns',
        totalTokens: 2000,
        baselineTokens: 2500,
        tokensSaved: 500,
      }),
    ];

    it('should get top resources by efficiency', () => {
      const top = engine.getTopResources(records, 'efficiency', 2);

      assert.equal(top.length, 2);
      // project-manager: 75% efficiency
      // testing-unit: 50% efficiency
      assert.equal(top[0].uri, 'o8://agents/project-manager');
      assert.equal(top[0].efficiency, 75);
    });

    it('should get top resources by savings', () => {
      const top = engine.getTopResources(records, 'savings', 2);

      assert.equal(top.length, 2);
      // project-manager saved 3000 tokens (highest)
      assert.equal(top[0].uri, 'o8://agents/project-manager');
      assert.equal(top[0].savings, 3000);
    });

    it('should get top resources by tokens', () => {
      const top = engine.getTopResources(records, 'tokens', 2);

      assert.equal(top.length, 2);
      // event-driven used 2000 tokens (highest)
      assert.equal(top[0].uri, 'o8://patterns/event-driven');
      assert.equal(top[0].tokens, 2000);
    });

    it('should respect limit parameter', () => {
      const top = engine.getTopResources(records, 'efficiency', 1);

      assert.equal(top.length, 1);
    });

    it('should aggregate multiple loads of same resource', () => {
      const multiLoadRecords = [
        createMockUsage('msg-1', {
          resourceUri: 'o8://agents/project-manager',
          totalTokens: 1000,
          baselineTokens: 2000,
        }),
        createMockUsage('msg-2', {
          resourceUri: 'o8://agents/project-manager',
          totalTokens: 500,
          baselineTokens: 1000,
        }),
      ];

      const top = engine.getTopResources(multiLoadRecords, 'tokens', 1);

      assert.equal(top.length, 1);
      assert.equal(top[0].loadCount, 2);
      assert.equal(top[0].tokens, 1500); // 1000 + 500
    });

    it('should skip records without resourceUri', () => {
      const mixedRecords = [
        createMockUsage('msg-1', { resourceUri: 'o8://agents/test' }),
        createMockUsage('msg-2', {}), // No resourceUri
      ];

      const top = engine.getTopResources(mixedRecords, 'efficiency', 10);

      assert.equal(top.length, 1);
    });
  });

  describe('calculateTrend()', () => {
    it('should detect improving trend', () => {
      const current = { efficiency: 60, tokensSaved: 3000, costSavings: 1.5 };
      const previous = { efficiency: 40, tokensSaved: 2000, costSavings: 1.0 };

      const trend = engine.calculateTrend(current, previous);

      assert.equal(trend.efficiencyChange, 20);
      assert.equal(trend.tokenSavingsChange, 1000);
      assert.equal(trend.costSavingsChange, 0.5);
      assert.equal(trend.direction, 'improving');
    });

    it('should detect declining trend', () => {
      const current = { efficiency: 30, tokensSaved: 1000, costSavings: 0.5 };
      const previous = { efficiency: 50, tokensSaved: 2000, costSavings: 1.0 };

      const trend = engine.calculateTrend(current, previous);

      assert.equal(trend.efficiencyChange, -20);
      assert.equal(trend.tokenSavingsChange, -1000);
      assert.equal(trend.costSavingsChange, -0.5);
      assert.equal(trend.direction, 'declining');
    });

    it('should detect stable trend', () => {
      const current = { efficiency: 50.5, tokensSaved: 2100, costSavings: 1.05 };
      const previous = { efficiency: 50, tokensSaved: 2000, costSavings: 1.0 };

      const trend = engine.calculateTrend(current, previous);

      assert.equal(trend.direction, 'stable'); // <1% change
    });
  });

  describe('generateSnapshot()', () => {
    const records = [
      createMockUsage('msg-1', {
        category: 'agents',
        resourceUri: 'o8://agents/project-manager',
        totalTokens: 1000,
        baselineTokens: 2000,
        tokensSaved: 1000,
        costUSD: 0.003,
        costSavingsUSD: 0.003,
        cacheReadTokens: 100,
      }),
      createMockUsage('msg-2', {
        category: 'skills',
        resourceUri: 'o8://skills/testing-unit',
        totalTokens: 500,
        baselineTokens: 1000,
        tokensSaved: 500,
        costUSD: 0.0015,
        costSavingsUSD: 0.0015,
        cacheReadTokens: 0,
        cacheCreationTokens: 50,
      }),
    ];

    it('should generate complete snapshot', () => {
      const snapshot = engine.generateSnapshot(records, 'last_day');

      assert.equal(snapshot.period, 'last_day');
      assert.ok(snapshot.timestamp instanceof Date);
      assert.ok(snapshot.overall);
      assert.ok(snapshot.byCategory);
      assert.ok(snapshot.cache);
      assert.ok(snapshot.trend);
      assert.ok(snapshot.topPerformers);
      assert.ok(snapshot.needsOptimization);
    });

    it('should calculate overall metrics', () => {
      const snapshot = engine.generateSnapshot(records);

      assert.equal(snapshot.overall.totalTokens, 1500);
      assert.equal(snapshot.overall.baselineTokens, 3000);
      assert.equal(snapshot.overall.tokensSaved, 1500);
      assert.equal(snapshot.overall.efficiencyPercentage, 50);
      assert.equal(snapshot.overall.costUSD.toFixed(4), '0.0045');
      assert.equal(snapshot.overall.costSavingsUSD.toFixed(4), '0.0045');
    });

    it('should calculate cache metrics', () => {
      const snapshot = engine.generateSnapshot(records);

      assert.equal(snapshot.cache.totalCacheReads, 100);
      assert.equal(snapshot.cache.totalCacheCreations, 50);
      assert.equal(snapshot.cache.totalCacheHits, 1); // 1 record with cache reads
      assert.equal(snapshot.cache.cacheHitRate, 50); // 1 of 2 records
      assert.equal(snapshot.cache.cacheTokensSaved, 900); // 100 * 9
    });

    it('should include top performers', () => {
      const snapshot = engine.generateSnapshot(records);

      assert.ok(snapshot.topPerformers.length > 0);
      assert.ok(snapshot.topPerformers[0].uri);
      assert.ok(snapshot.topPerformers[0].efficiency >= 0);
    });

    it('should include trend with previous period', () => {
      const previousRecords = [
        createMockUsage('msg-prev', {
          totalTokens: 2000,
          baselineTokens: 3000,
          tokensSaved: 1000,
          costSavingsUSD: 0.003,
        }),
      ];

      const snapshot = engine.generateSnapshot(records, 'last_day', previousRecords);

      assert.ok(snapshot.trend.efficiencyChange !== 0 ||
                snapshot.trend.direction === 'stable');
    });
  });

  describe('formatting utilities', () => {
    it('should format efficiency with labels', () => {
      assert.equal(engine.formatEfficiency(75), '75.0% (excellent)');
      assert.equal(engine.formatEfficiency(40), '40.0% (good)');
      assert.equal(engine.formatEfficiency(20), '20.0% (fair)');
      assert.equal(engine.formatEfficiency(5), '5.0% (needs improvement)');
    });

    it('should format cost', () => {
      const formatted1 = engine.formatCost(0.005);
      const formatted2 = engine.formatCost(1.5);
      const formatted3 = engine.formatCost(0.0001);

      assert.ok(formatted1.startsWith('$'));
      assert.ok(formatted2.startsWith('$'));
      assert.ok(formatted3.includes('m')); // millidollars
    });

    it('should format tokens', () => {
      assert.equal(engine.formatTokens(500), '500');
      assert.equal(engine.formatTokens(1500), '1.5K');
      assert.equal(engine.formatTokens(1500000), '1.50M');
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
