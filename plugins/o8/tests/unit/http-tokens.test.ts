/**
 * HTTP API Token Endpoint Tests
 *
 * Tests all token tracking HTTP API endpoints:
 * 1. GET /api/tokens/efficiency - Efficiency snapshot
 * 2. GET /api/tokens/summary - Summary statistics
 * 3. GET /api/tokens/by-category - Category breakdown
 * 4. GET /api/tokens/cost-savings - Cost savings report
 * 5. GET /api/tokens/trends - Trend analysis
 * 6. GET /api/tokens/sessions/:id - Session details
 *
 * Each endpoint is tested for:
 * - Returns 200 with valid data
 * - Handles period query parameter correctly
 * - Returns appropriate errors for invalid requests
 * - Data structure matches TypeScript interface
 * - Handles empty state gracefully
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { HTTPTransport } from '../../dist/transports/http.js';
import { TokenTracker } from '../../dist/token/tracker.js';
import { TokenStore } from '../../dist/token/store.js';
import { TokenMetrics } from '../../dist/token/metrics.js';
import { EfficiencyEngine } from '../../dist/token/efficiency.js';
import { StatsCollector } from '../../dist/stats/collector.js';
import { Logger } from '../../dist/utils/logger.js';
import http from 'http';

/**
 * Mock MCP Server for testing
 */
class MockMCPServer {
  tokenSystem: any;

  constructor(tokenSystem: any) {
    this.tokenSystem = tokenSystem;
  }

  async handleRequest(method: string, params: any) {
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

  async searchResources(query: string) {
    return [];
  }

  async getResourceContent(uri: string) {
    return 'test content';
  }

  async getProviders() {
    return [];
  }

  async getProviderIndex(name: string) {
    return { resources: [] };
  }

  async searchAllProviders(query: string, options?: any) {
    return [];
  }

  async getProviderHealth(name: string) {
    return { status: 'healthy' };
  }

  async getAllProvidersHealth() {
    return {};
  }

  getProviderStats(name: string) {
    return {};
  }

  async enableProvider(name: string) {}

  async disableProvider(name: string) {}
}

/**
 * Helper to make HTTP requests to test server
 */
function makeRequest(
  port: number,
  path: string,
  method = 'GET'
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode!, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode!, data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

describe('HTTP API Token Endpoint Tests', () => {
  let transport: HTTPTransport;
  let tracker: TokenTracker;
  let store: TokenStore;
  let metrics: TokenMetrics;
  let efficiency: EfficiencyEngine;
  let mcpServer: MockMCPServer;
  let stats: StatsCollector;
  let testPort: number;

  before(async () => {
    // Find available port
    testPort = 8123;

    // Initialize token tracking system
    tracker = new TokenTracker({
      enabled: true,
      baselineStrategy: 'no_jit',
      deduplication: true,
    });

    store = new TokenStore({
      maxRecords: 1000,
      autoCleanup: false,
    });

    efficiency = new EfficiencyEngine();
    metrics = new TokenMetrics(store, efficiency);

    const tokenSystem = {
      tracker,
      store,
      metrics,
      efficiency,
    };

    // Initialize HTTP transport
    stats = new StatsCollector();
    mcpServer = new MockMCPServer(tokenSystem);

    transport = new HTTPTransport(
      {
        port: testPort,
        staticPath: '/tmp/test-static',
        enableCORS: true,
      },
      mcpServer as any,
      stats
    );

    // Start server
    await transport.start();

    // Give server time to start
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  after(async () => {
    if (transport) {
      await transport.stop();
    }
    if (store) {
      store.destroy();
    }
  });

  beforeEach(() => {
    // Clear data before each test
    store.clear();
    tracker.clearTracked();

    // Populate with test data
    populateTestData();
  });

  function populateTestData() {
    const testData = [
      {
        messageId: 'api-msg-1',
        claudeUsage: { input_tokens: 1000, output_tokens: 500 },
        metadata: { category: 'agent', resourceUri: 'o8://agents/test-1' },
      },
      {
        messageId: 'api-msg-2',
        claudeUsage: { input_tokens: 2000, output_tokens: 1000, cache_read_input_tokens: 500 },
        metadata: { category: 'skill', resourceUri: 'o8://skills/test-1' },
      },
      {
        messageId: 'api-msg-3',
        claudeUsage: { input_tokens: 1500, output_tokens: 750, cache_creation_input_tokens: 1000 },
        metadata: { category: 'pattern', resourceUri: 'o8://patterns/test-1' },
      },
      {
        messageId: 'api-msg-4',
        claudeUsage: { input_tokens: 3000, output_tokens: 1500 },
        metadata: { category: 'workflow', resourceUri: 'o8://workflows/test-1' },
      },
    ];

    testData.forEach((data) => {
      const usage = tracker.track(data.messageId, data.claudeUsage, data.metadata);
      if (usage) {
        store.saveUsage(usage, 'test-session-1');
      }
    });
  }

  describe('1. GET /api/tokens/efficiency', () => {
    it('should return 200 with efficiency snapshot', async () => {
      const response = await makeRequest(testPort, '/api/tokens/efficiency');

      assert.strictEqual(response.status, 200);
      assert.ok(response.data);
      assert.ok(response.data.timestamp);
      assert.ok(response.data.period);
      assert.ok(response.data.overall);
      assert.ok(Array.isArray(response.data.byCategory));
    });

    it('should handle period query parameter', async () => {
      const periods = ['last_hour', 'last_day', 'last_week', 'all_time'];

      for (const period of periods) {
        const response = await makeRequest(
          testPort,
          `/api/tokens/efficiency?period=${period}`
        );

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.data.period, period);
      }
    });

    it('should include overall metrics', async () => {
      const response = await makeRequest(testPort, '/api/tokens/efficiency');

      assert.ok(response.data.overall);
      assert.ok(typeof response.data.overall.totalTokens === 'number');
      assert.ok(typeof response.data.overall.baselineTokens === 'number');
      assert.ok(typeof response.data.overall.tokensSaved === 'number');
      assert.ok(typeof response.data.overall.efficiencyPercentage === 'number');
      assert.ok(typeof response.data.overall.costUSD === 'number');
      assert.ok(typeof response.data.overall.costSavingsUSD === 'number');
    });

    it('should include category breakdown', async () => {
      const response = await makeRequest(testPort, '/api/tokens/efficiency');

      assert.ok(Array.isArray(response.data.byCategory));
      assert.ok(response.data.byCategory.length > 0);

      const category = response.data.byCategory[0];
      assert.ok(category.category);
      assert.ok(typeof category.loadCount === 'number');
      assert.ok(typeof category.totalTokens === 'number');
      assert.ok(typeof category.efficiency === 'number');
    });

    it('should include cache metrics', async () => {
      const response = await makeRequest(testPort, '/api/tokens/efficiency');

      assert.ok(response.data.cache);
      assert.ok(typeof response.data.cache.totalCacheHits === 'number');
      assert.ok(typeof response.data.cache.totalCacheReads === 'number');
      assert.ok(typeof response.data.cache.totalCacheCreations === 'number');
      assert.ok(typeof response.data.cache.cacheHitRate === 'number');
    });

    it('should include trend analysis', async () => {
      const response = await makeRequest(testPort, '/api/tokens/efficiency');

      assert.ok(response.data.trend);
      assert.ok(typeof response.data.trend.efficiencyChange === 'number');
      assert.ok(typeof response.data.trend.tokenSavingsChange === 'number');
      assert.ok(['improving', 'declining', 'stable'].includes(response.data.trend.direction));
    });

    it('should handle empty state gracefully', async () => {
      store.clear();

      const response = await makeRequest(testPort, '/api/tokens/efficiency');

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.overall.totalTokens, 0);
      assert.strictEqual(response.data.overall.baselineTokens, 0);
      assert.strictEqual(response.data.byCategory.length, 0);
    });
  });

  describe('2. GET /api/tokens/summary', () => {
    it('should return 200 with summary data', async () => {
      const response = await makeRequest(testPort, '/api/tokens/summary');

      assert.strictEqual(response.status, 200);
      assert.ok(response.data);
      assert.ok(typeof response.data.totalMessages === 'number');
      assert.ok(typeof response.data.totalTokens === 'number');
    });

    it('should include all summary fields', async () => {
      const response = await makeRequest(testPort, '/api/tokens/summary');

      assert.ok(response.data.period);
      assert.ok(typeof response.data.totalMessages === 'number');
      assert.ok(typeof response.data.totalTokens === 'number');
      assert.ok(typeof response.data.tokensSaved === 'number');
      assert.ok(typeof response.data.efficiency === 'number');
      assert.ok(typeof response.data.costUSD === 'number');
      assert.ok(typeof response.data.costSavingsUSD === 'number');
      assert.ok(typeof response.data.cacheHitRate === 'number');
      assert.ok(typeof response.data.uniqueResources === 'number');
      assert.ok(response.data.topCategory);
    });

    it('should handle period parameter', async () => {
      const response = await makeRequest(testPort, '/api/tokens/summary?period=last_day');

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.period, 'last_day');
    });

    it('should calculate correct message count', async () => {
      const response = await makeRequest(testPort, '/api/tokens/summary');

      assert.strictEqual(response.data.totalMessages, 4);
    });

    it('should calculate correct unique resources', async () => {
      const response = await makeRequest(testPort, '/api/tokens/summary');

      assert.strictEqual(response.data.uniqueResources, 4);
    });

    it('should handle empty state', async () => {
      store.clear();

      const response = await makeRequest(testPort, '/api/tokens/summary');

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.totalMessages, 0);
      assert.strictEqual(response.data.totalTokens, 0);
      assert.strictEqual(response.data.uniqueResources, 0);
    });
  });

  describe('3. GET /api/tokens/by-category', () => {
    it('should return 200 with category metrics', async () => {
      const response = await makeRequest(testPort, '/api/tokens/by-category');

      assert.strictEqual(response.status, 200);
      assert.ok(response.data);
      assert.ok(Array.isArray(response.data.categories));
      assert.ok(response.data.timestamp);
    });

    it('should include all categories', async () => {
      const response = await makeRequest(testPort, '/api/tokens/by-category');

      const categories = response.data.categories.map((c: any) => c.category);
      assert.ok(categories.includes('agent'));
      assert.ok(categories.includes('skill'));
      assert.ok(categories.includes('pattern'));
      assert.ok(categories.includes('workflow'));
    });

    it('should include category metrics fields', async () => {
      const response = await makeRequest(testPort, '/api/tokens/by-category');

      const category = response.data.categories[0];
      assert.ok(category.category);
      assert.ok(typeof category.loadCount === 'number');
      assert.ok(typeof category.totalTokens === 'number');
      assert.ok(typeof category.inputTokens === 'number');
      assert.ok(typeof category.outputTokens === 'number');
      assert.ok(typeof category.baselineTokens === 'number');
      assert.ok(typeof category.tokensSaved === 'number');
      assert.ok(typeof category.efficiency === 'number');
      assert.ok(typeof category.costUSD === 'number');
    });

    it('should handle period parameter', async () => {
      const response = await makeRequest(testPort, '/api/tokens/by-category?period=all_time');

      assert.strictEqual(response.status, 200);
      assert.ok(response.data.categories.length > 0);
    });

    it('should sort by most impactful', async () => {
      const response = await makeRequest(testPort, '/api/tokens/by-category');

      const categories = response.data.categories;
      if (categories.length > 1) {
        // Should be sorted by tokensSaved descending
        for (let i = 0; i < categories.length - 1; i++) {
          assert.ok(categories[i].tokensSaved >= categories[i + 1].tokensSaved);
        }
      }
    });

    it('should handle empty state', async () => {
      store.clear();

      const response = await makeRequest(testPort, '/api/tokens/by-category');

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.categories.length, 0);
    });
  });

  describe('4. GET /api/tokens/cost-savings', () => {
    it('should return 200 with cost savings report', async () => {
      const response = await makeRequest(testPort, '/api/tokens/cost-savings');

      assert.strictEqual(response.status, 200);
      assert.ok(response.data);
      assert.ok(response.data.period);
      assert.ok(response.data.timestamp);
    });

    it('should include all cost fields', async () => {
      const response = await makeRequest(testPort, '/api/tokens/cost-savings');

      assert.ok(typeof response.data.totalCostUsd === 'number');
      assert.ok(typeof response.data.totalCostSavingsUsd === 'number');
      assert.ok(typeof response.data.baselineCostUsd === 'number');
      assert.ok(typeof response.data.efficiency === 'number');
      assert.ok(typeof response.data.tokensSaved === 'number');
    });

    it('should calculate correct cost relationship', async () => {
      const response = await makeRequest(testPort, '/api/tokens/cost-savings');

      const total = response.data.totalCostUsd;
      const savings = response.data.totalCostSavingsUsd;
      const baseline = response.data.baselineCostUsd;

      // Baseline should equal total + savings
      assert.ok(Math.abs(baseline - (total + savings)) < 0.01);
    });

    it('should handle period parameter', async () => {
      const response = await makeRequest(
        testPort,
        '/api/tokens/cost-savings?period=last_week'
      );

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.period, 'last_week');
    });

    it('should show positive savings', async () => {
      const response = await makeRequest(testPort, '/api/tokens/cost-savings');

      assert.ok(response.data.totalCostSavingsUsd > 0);
      assert.ok(response.data.tokensSaved > 0);
    });

    it('should handle empty state', async () => {
      store.clear();

      const response = await makeRequest(testPort, '/api/tokens/cost-savings');

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.totalCostUsd, 0);
      assert.strictEqual(response.data.totalCostSavingsUsd, 0);
    });
  });

  describe('5. GET /api/tokens/trends', () => {
    it('should return 200 with trend data', async () => {
      const response = await makeRequest(testPort, '/api/tokens/trends');

      assert.strictEqual(response.status, 200);
      assert.ok(response.data);
      assert.ok(response.data.trend);
      assert.ok(response.data.overall);
      assert.ok(response.data.timestamp);
    });

    it('should include trend fields', async () => {
      const response = await makeRequest(testPort, '/api/tokens/trends');

      assert.ok(response.data.trend);
      assert.ok(typeof response.data.trend.efficiencyChange === 'number');
      assert.ok(typeof response.data.trend.tokenSavingsChange === 'number');
      assert.ok(typeof response.data.trend.costSavingsChange === 'number');
      assert.ok(['improving', 'declining', 'stable'].includes(response.data.trend.direction));
    });

    it('should include overall metrics', async () => {
      const response = await makeRequest(testPort, '/api/tokens/trends');

      assert.ok(response.data.overall);
      assert.ok(typeof response.data.overall.totalTokens === 'number');
      assert.ok(typeof response.data.overall.efficiencyPercentage === 'number');
    });

    it('should handle period parameter', async () => {
      const response = await makeRequest(testPort, '/api/tokens/trends?period=last_hour');

      assert.strictEqual(response.status, 200);
      // Trend analysis should be included
      assert.ok(response.data.trend);
    });

    it('should handle empty state', async () => {
      store.clear();

      const response = await makeRequest(testPort, '/api/tokens/trends');

      assert.strictEqual(response.status, 200);
      assert.ok(response.data.trend);
      assert.strictEqual(response.data.trend.efficiencyChange, 0);
    });
  });

  describe('6. GET /api/tokens/sessions/:id', () => {
    it('should return 200 with session data', async () => {
      const response = await makeRequest(testPort, '/api/tokens/sessions/test-session-1');

      assert.strictEqual(response.status, 200);
      assert.ok(response.data);
      assert.strictEqual(response.data.sessionId, 'test-session-1');
    });

    it('should include all session fields', async () => {
      const response = await makeRequest(testPort, '/api/tokens/sessions/test-session-1');

      const session = response.data;
      assert.strictEqual(session.sessionId, 'test-session-1');
      assert.ok(session.startTime);
      assert.ok(typeof session.messageCount === 'number');
      assert.ok(Array.isArray(session.trackedMessageIds));
      assert.ok(typeof session.totalInputTokens === 'number');
      assert.ok(typeof session.totalOutputTokens === 'number');
      assert.ok(typeof session.totalTokens === 'number');
      assert.ok(typeof session.sessionEfficiency === 'number');
      assert.ok(Array.isArray(session.usageRecords));
    });

    it('should have correct message count', async () => {
      const response = await makeRequest(testPort, '/api/tokens/sessions/test-session-1');

      assert.strictEqual(response.data.messageCount, 4);
      assert.strictEqual(response.data.trackedMessageIds.length, 4);
      assert.strictEqual(response.data.usageRecords.length, 4);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await makeRequest(testPort, '/api/tokens/sessions/non-existent');

      assert.strictEqual(response.status, 404);
      assert.ok(response.data.error);
    });

    it('should serialize Set to Array', async () => {
      const response = await makeRequest(testPort, '/api/tokens/sessions/test-session-1');

      // trackedMessageIds should be array (converted from Set)
      assert.ok(Array.isArray(response.data.trackedMessageIds));
      assert.ok(response.data.trackedMessageIds.length > 0);
    });
  });

  describe('7. Error Handling', () => {
    it('should return 503 when token system not initialized', async () => {
      // Create server without token system
      const noTokenServer = new MockMCPServer(undefined);
      const noTokenTransport = new HTTPTransport(
        {
          port: testPort + 1,
          staticPath: '/tmp/test-static',
          enableCORS: true,
        },
        noTokenServer as any,
        stats
      );

      await noTokenTransport.start();

      const response = await makeRequest(testPort + 1, '/api/tokens/efficiency');

      assert.strictEqual(response.status, 503);
      assert.ok(response.data.error);
      assert.ok(response.data.error.includes('not initialized'));

      await noTokenTransport.stop();
    });

    it('should handle invalid period parameter gracefully', async () => {
      const response = await makeRequest(
        testPort,
        '/api/tokens/efficiency?period=invalid'
      );

      // Should still return 200 with default behavior
      assert.strictEqual(response.status, 200);
    });

    it('should handle malformed requests', async () => {
      // All GET endpoints should handle no body
      const response = await makeRequest(testPort, '/api/tokens/efficiency');

      assert.strictEqual(response.status, 200);
    });
  });

  describe('8. Data Consistency', () => {
    it('should have consistent totals across endpoints', async () => {
      const efficiency = await makeRequest(testPort, '/api/tokens/efficiency');
      const summary = await makeRequest(testPort, '/api/tokens/summary');

      assert.strictEqual(
        efficiency.data.overall.totalTokens,
        summary.data.totalTokens
      );
      assert.strictEqual(
        efficiency.data.overall.tokensSaved,
        summary.data.tokensSaved
      );
    });

    it('should match category sum to overall total', async () => {
      const response = await makeRequest(testPort, '/api/tokens/efficiency');

      const categoryTotal = response.data.byCategory.reduce(
        (sum: number, cat: any) => sum + cat.totalTokens,
        0
      );

      assert.strictEqual(categoryTotal, response.data.overall.totalTokens);
    });

    it('should have consistent costs', async () => {
      const efficiency = await makeRequest(testPort, '/api/tokens/efficiency');
      const costs = await makeRequest(testPort, '/api/tokens/cost-savings');

      assert.strictEqual(efficiency.data.overall.costUSD, costs.data.totalCostUsd);
      assert.strictEqual(
        efficiency.data.overall.costSavingsUSD,
        costs.data.totalCostSavingsUsd
      );
    });
  });
});
