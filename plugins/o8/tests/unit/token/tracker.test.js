/**
 * Unit tests for TokenTracker
 * Tests token tracking, deduplication, baseline calculation, and cost computation
 */

import { describe, it, before, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// We'll import the compiled JS from dist
let TokenTracker;

describe('TokenTracker', () => {
  before(async () => {
    // Import compiled module
    const module = await import('../../../dist/token/tracker.js');
    TokenTracker = module.TokenTracker;
  });

  let tracker;

  beforeEach(() => {
    tracker = new TokenTracker();
  });

  afterEach(() => {
    if (tracker) {
      tracker.clearTracked();
    }
  });

  describe('track()', () => {
    it('should track basic token usage', () => {
      const usage = tracker.track('msg-1', {
        input_tokens: 1000,
        output_tokens: 500,
      });

      assert.ok(usage, 'Should return usage record');
      assert.equal(usage.messageId, 'msg-1');
      assert.equal(usage.inputTokens, 1000);
      assert.equal(usage.outputTokens, 500);
      assert.equal(usage.totalTokens, 1500);
      assert.equal(usage.cacheReadTokens, 0);
      assert.equal(usage.cacheCreationTokens, 0);
    });

    it('should track cache tokens', () => {
      const usage = tracker.track('msg-2', {
        input_tokens: 1000,
        output_tokens: 500,
        cache_creation_input_tokens: 200,
        cache_read_input_tokens: 300,
      });

      assert.equal(usage.cacheCreationTokens, 200);
      assert.equal(usage.cacheReadTokens, 300);
      assert.equal(usage.totalTokens, 2000);
    });

    it('should deduplicate by message ID', () => {
      const usage1 = tracker.track('msg-3', {
        input_tokens: 1000,
        output_tokens: 500,
      });

      const usage2 = tracker.track('msg-3', {
        input_tokens: 2000,
        output_tokens: 1000,
      });

      assert.ok(usage1, 'First track should succeed');
      assert.equal(usage2, null, 'Second track with same ID should be null');
      assert.equal(tracker.getTrackedCount(), 1);
    });

    it('should track metadata (category and resourceUri)', () => {
      const usage = tracker.track(
        'msg-4',
        {
          input_tokens: 1000,
          output_tokens: 500,
        },
        {
          category: 'agents',
          resourceUri: 'orchestr8://agents/project-manager',
        }
      );

      assert.equal(usage.category, 'agents');
      assert.equal(usage.resourceUri, 'orchestr8://agents/project-manager');
    });

    it('should calculate cost correctly', () => {
      const usage = tracker.track('msg-5', {
        input_tokens: 1_000_000, // 1M input tokens
        output_tokens: 100_000, // 100K output tokens
      });

      // Input: 1M * $3/M = $3.00
      // Output: 100K * $15/M = $1.50
      // Total: $4.50
      assert.equal(usage.costUSD.toFixed(2), '4.50');
    });

    it('should calculate cost with cache tokens', () => {
      const usage = tracker.track('msg-6', {
        input_tokens: 100_000,
        output_tokens: 50_000,
        cache_creation_input_tokens: 200_000,
        cache_read_input_tokens: 300_000,
      });

      // Input: 100K * $3/M = $0.30
      // Output: 50K * $15/M = $0.75
      // Cache creation: 200K * $3.75/M = $0.75
      // Cache read: 300K * $0.30/M = $0.09
      // Total: $1.89
      assert.equal(usage.costUSD.toFixed(2), '1.89');
    });

    it('should return null when tracking is disabled', () => {
      const disabledTracker = new TokenTracker({ enabled: false });
      const usage = disabledTracker.track('msg-7', {
        input_tokens: 1000,
        output_tokens: 500,
      });

      assert.equal(usage, null);
    });
  });

  describe('calculateBaseline()', () => {
    it('should calculate no_jit baseline correctly', () => {
      const claudeUsage = {
        input_tokens: 1000,
        output_tokens: 500,
      };

      const baseline = tracker.calculateBaseline(claudeUsage, 5); // 5 resources loaded

      // Baseline = 1000 + 500 + (5 * 500) = 4000
      assert.equal(baseline, 4000);
    });

    it('should calculate no_cache baseline correctly', () => {
      const noCacheTracker = new TokenTracker({ baselineStrategy: 'no_cache' });

      const claudeUsage = {
        input_tokens: 1000,
        output_tokens: 500,
        cache_read_input_tokens: 100,
      };

      const baseline = noCacheTracker.calculateBaseline(claudeUsage, 0);

      // Baseline = 1000 + 500 + (100 * 10) = 2500
      assert.equal(baseline, 2500);
    });

    it('should handle zero resources', () => {
      const claudeUsage = {
        input_tokens: 1000,
        output_tokens: 500,
      };

      const baseline = tracker.calculateBaseline(claudeUsage, 0);

      // Baseline = 1000 + 500 + 0 = 1500
      assert.equal(baseline, 1500);
    });
  });

  describe('calculateCost()', () => {
    it('should calculate input token cost', () => {
      const cost = tracker.calculateCost({
        input_tokens: 1_000_000,
        output_tokens: 0,
      });

      assert.equal(cost, 3.0); // $3 per million input tokens
    });

    it('should calculate output token cost', () => {
      const cost = tracker.calculateCost({
        input_tokens: 0,
        output_tokens: 1_000_000,
      });

      assert.equal(cost, 15.0); // $15 per million output tokens
    });

    it('should calculate cache creation cost', () => {
      const cost = tracker.calculateCost({
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_input_tokens: 1_000_000,
      });

      assert.equal(cost, 3.75); // $3.75 per million cache creation tokens
    });

    it('should calculate cache read cost', () => {
      const cost = tracker.calculateCost({
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 1_000_000,
      });

      assert.equal(cost, 0.30); // $0.30 per million cache read tokens
    });

    it('should calculate combined cost', () => {
      const cost = tracker.calculateCost({
        input_tokens: 500_000,
        output_tokens: 200_000,
        cache_creation_input_tokens: 100_000,
        cache_read_input_tokens: 300_000,
      });

      // Input: 500K * $3/M = $1.50
      // Output: 200K * $15/M = $3.00
      // Cache creation: 100K * $3.75/M = $0.375
      // Cache read: 300K * $0.30/M = $0.09
      // Total: $4.965
      assert.equal(cost.toFixed(3), '4.965');
    });
  });

  describe('hasTracked()', () => {
    it('should return true for tracked message', () => {
      tracker.track('msg-8', { input_tokens: 100, output_tokens: 50 });
      assert.equal(tracker.hasTracked('msg-8'), true);
    });

    it('should return false for untracked message', () => {
      assert.equal(tracker.hasTracked('msg-never-tracked'), false);
    });
  });

  describe('getTrackedCount()', () => {
    it('should return correct tracked count', () => {
      assert.equal(tracker.getTrackedCount(), 0);

      tracker.track('msg-9', { input_tokens: 100, output_tokens: 50 });
      assert.equal(tracker.getTrackedCount(), 1);

      tracker.track('msg-10', { input_tokens: 100, output_tokens: 50 });
      assert.equal(tracker.getTrackedCount(), 2);
    });

    it('should not increment count for duplicates', () => {
      tracker.track('msg-11', { input_tokens: 100, output_tokens: 50 });
      tracker.track('msg-11', { input_tokens: 100, output_tokens: 50 });

      assert.equal(tracker.getTrackedCount(), 1);
    });
  });

  describe('clearTracked()', () => {
    it('should clear all tracked messages', () => {
      tracker.track('msg-12', { input_tokens: 100, output_tokens: 50 });
      tracker.track('msg-13', { input_tokens: 100, output_tokens: 50 });

      assert.equal(tracker.getTrackedCount(), 2);

      tracker.clearTracked();

      assert.equal(tracker.getTrackedCount(), 0);
      assert.equal(tracker.hasTracked('msg-12'), false);
    });
  });

  describe('efficiency calculation', () => {
    it('should calculate efficiency percentage', () => {
      const usage = tracker.track(
        'msg-14',
        {
          input_tokens: 1000,
          output_tokens: 500,
        },
        {
          resourceCount: 5, // 5 resources loaded
        }
      );

      // Baseline = 1000 + 500 + (5 * 500) = 4000
      // Actual = 1500
      // Saved = 2500
      // Efficiency = (2500 / 4000) * 100 = 62.5%
      assert.equal(usage.baselineTokens, 4000);
      assert.equal(usage.tokensSaved, 2500);
      assert.equal(usage.efficiencyPercentage, 62.5);
    });

    it('should handle zero baseline', () => {
      const customTracker = new TokenTracker({ baselineStrategy: 'custom' });
      const usage = customTracker.track('msg-15', {
        input_tokens: 0,
        output_tokens: 0,
      });

      assert.equal(usage.baselineTokens, 0);
      assert.equal(usage.efficiencyPercentage, 0);
    });
  });

  describe('configuration', () => {
    it('should use custom costs', () => {
      const customTracker = new TokenTracker({
        customCosts: {
          inputCostPerMillion: 10.0,
          outputCostPerMillion: 20.0,
          cacheReadCostPerMillion: 1.0,
          cacheCreationCostPerMillion: 5.0,
        },
      });

      const usage = customTracker.track('msg-16', {
        input_tokens: 1_000_000,
        output_tokens: 0,
      });

      assert.equal(usage.costUSD, 10.0); // Custom $10 per million
    });

    it('should allow deduplication to be disabled', () => {
      const noDedupTracker = new TokenTracker({ deduplication: false });

      const usage1 = noDedupTracker.track('msg-17', {
        input_tokens: 100,
        output_tokens: 50,
      });

      const usage2 = noDedupTracker.track('msg-17', {
        input_tokens: 100,
        output_tokens: 50,
      });

      assert.ok(usage1);
      assert.ok(usage2); // Should not be null with dedup disabled
    });

    it('should get current configuration', () => {
      const config = tracker.getConfig();

      assert.ok(config.options);
      assert.ok(config.costs);
      assert.equal(config.options.enabled, true);
      assert.equal(config.costs.inputCostPerMillion, 3.0);
    });

    it('should update configuration', () => {
      tracker.updateConfig({ baselineStrategy: 'no_cache' });

      const config = tracker.getConfig();
      assert.equal(config.options.baselineStrategy, 'no_cache');
    });
  });
});
