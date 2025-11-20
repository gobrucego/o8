/**
 * Token Metrics - High-level metrics aggregation and reporting
 *
 * Integrates TokenStore and EfficiencyEngine to provide:
 * - Real-time efficiency snapshots
 * - Session efficiency calculations
 * - Category-based metrics
 * - Cost savings reports
 * - Time-based analysis
 */

import { Logger } from '../utils/logger.js';
import { TokenStore } from './store.js';
import { EfficiencyEngine } from './efficiency.js';
import {
  TokenUsage,
  TokenSession,
  CategoryMetrics,
  EfficiencySnapshot,
} from './types.js';

/**
 * Metrics query options
 */
export interface MetricsQuery {
  /** Time period: 'last_hour', 'last_day', 'last_week', 'all_time', or custom range */
  period?: 'last_hour' | 'last_day' | 'last_week' | 'all_time';

  /** Custom time range start */
  startTime?: Date;

  /** Custom time range end */
  endTime?: Date;

  /** Filter by category */
  category?: string;

  /** Include trend analysis */
  includeTrend?: boolean;
}

/**
 * Token metrics calculation engine
 * Provides high-level metrics APIs by coordinating store and efficiency engine
 */
export class TokenMetrics {
  private logger: Logger;
  private store: TokenStore;
  private efficiency: EfficiencyEngine;

  constructor(store: TokenStore, efficiency?: EfficiencyEngine) {
    this.logger = new Logger('TokenMetrics');
    this.store = store;
    this.efficiency = efficiency || new EfficiencyEngine();

    this.logger.info('TokenMetrics initialized');
  }

  /**
   * Get current efficiency snapshot
   *
   * @param query - Query options for filtering and time range
   * @returns Efficiency snapshot with all metrics
   */
  getEfficiencySnapshot(query: MetricsQuery = {}): EfficiencySnapshot {
    const { period = 'all_time', category, includeTrend = true } = query;

    // Get time range
    const { startTime, endTime } = this.getTimeRange(query);

    // Get usage records for period
    const records = category
      ? this.store.getUsageInRange(startTime, endTime, category)
      : this.store.getUsageInRange(startTime, endTime);

    // Get previous period for trend analysis
    let previousRecords: TokenUsage[] | undefined;
    if (includeTrend) {
      const periodDuration = endTime.getTime() - startTime.getTime();
      const prevStart = new Date(startTime.getTime() - periodDuration);
      const prevEnd = startTime;

      previousRecords = category
        ? this.store.getUsageInRange(prevStart, prevEnd, category)
        : this.store.getUsageInRange(prevStart, prevEnd);
    }

    // Generate snapshot
    const snapshot = this.efficiency.generateSnapshot(
      records,
      period,
      previousRecords
    );

    this.logger.debug('Efficiency snapshot generated', {
      period,
      recordCount: records.length,
      efficiency: snapshot.overall.efficiencyPercentage.toFixed(1) + '%',
    });

    return snapshot;
  }

  /**
   * Calculate session efficiency
   *
   * @param sessionId - Session identifier
   * @returns Session metrics or null if session not found
   */
  calculateSessionEfficiency(sessionId: string): TokenSession | null {
    const session = this.store.getSessionData(sessionId);
    if (!session) {
      this.logger.warn('Session not found', { sessionId });
      return null;
    }

    return session;
  }

  /**
   * Get metrics grouped by category
   *
   * @param query - Query options
   * @returns Array of category metrics
   */
  getByCategory(query: MetricsQuery = {}): CategoryMetrics[] {
    const { startTime, endTime } = this.getTimeRange(query);
    const records = this.store.getUsageInRange(startTime, endTime);

    const categoryMap = this.efficiency.groupByCategory(records);

    // Add top resources to each category
    for (const [category, metrics] of categoryMap.entries()) {
      const categoryRecords = records.filter((r) => r.category === category);
      const topResources = this.efficiency
        .getTopResources(categoryRecords, 'tokens', 5)
        .map((r) => ({
          uri: r.uri,
          loadCount: r.loadCount,
          tokens: r.tokens,
        }));

      metrics.topResources = topResources;
    }

    // Sort by tokens saved (most impactful first)
    return Array.from(categoryMap.values()).sort(
      (a, b) => b.tokensSaved - a.tokensSaved
    );
  }

  /**
   * Get cost savings report
   *
   * @param query - Query options
   * @returns Cost savings summary
   */
  getCostSavings(query: MetricsQuery = {}): {
    period: string;
    totalCost: number;
    baselineCost: number;
    savings: number;
    savingsPercentage: number;
    byCategory: Array<{
      category: string;
      cost: number;
      savings: number;
    }>;
  } {
    const { period = 'all_time' } = query;
    const { startTime, endTime } = this.getTimeRange(query);
    const records = this.store.getUsageInRange(startTime, endTime);

    const totalCost = records.reduce((sum, r) => sum + r.costUSD, 0);
    const savings = records.reduce((sum, r) => sum + r.costSavingsUSD, 0);
    const baselineCost = totalCost + savings;
    const savingsPercentage =
      baselineCost > 0 ? (savings / baselineCost) * 100 : 0;

    // Group by category
    const categoryMap = this.efficiency.groupByCategory(records);
    const byCategory = Array.from(categoryMap.values())
      .map((c) => ({
        category: c.category,
        cost: c.costUSD,
        savings: c.costSavingsUSD,
      }))
      .sort((a, b) => b.savings - a.savings);

    return {
      period,
      totalCost,
      baselineCost,
      savings,
      savingsPercentage,
      byCategory,
    };
  }

  /**
   * Get top performing resources
   *
   * @param metric - Metric to rank by
   * @param limit - Number of results
   * @param query - Query options
   * @returns Array of top resources
   */
  getTopResources(
    metric: 'efficiency' | 'savings' | 'tokens' = 'efficiency',
    limit: number = 10,
    query: MetricsQuery = {}
  ) {
    const { startTime, endTime } = this.getTimeRange(query);
    const records = query.category
      ? this.store.getUsageInRange(startTime, endTime, query.category)
      : this.store.getUsageInRange(startTime, endTime);

    return this.efficiency.getTopResources(records, metric, limit);
  }

  /**
   * Get summary statistics
   *
   * @param query - Query options
   * @returns Summary statistics
   */
  getSummary(query: MetricsQuery = {}): {
    period: string;
    totalMessages: number;
    totalTokens: number;
    tokensSaved: number;
    efficiency: number;
    costUSD: number;
    costSavingsUSD: number;
    cacheHitRate: number;
    uniqueResources: number;
    topCategory: string;
  } {
    const { period = 'all_time' } = query;
    const { startTime, endTime } = this.getTimeRange(query);
    const records = this.store.getUsageInRange(startTime, endTime);

    const totalMessages = records.length;
    const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
    const baselineTokens = records.reduce((sum, r) => sum + r.baselineTokens, 0);
    const tokensSaved = records.reduce((sum, r) => sum + r.tokensSaved, 0);
    const efficiency = this.efficiency.calculateEfficiency(totalTokens, baselineTokens);
    const costUSD = records.reduce((sum, r) => sum + r.costUSD, 0);
    const costSavingsUSD = records.reduce((sum, r) => sum + r.costSavingsUSD, 0);

    const cacheHits = records.filter((r) => r.cacheReadTokens > 0).length;
    const cacheHitRate = totalMessages > 0 ? (cacheHits / totalMessages) * 100 : 0;

    const uniqueResources = new Set(
      records.map((r) => r.resourceUri).filter(Boolean)
    ).size;

    // Find top category by tokens saved
    const categoryMap = this.efficiency.groupByCategory(records);
    const topCategory =
      Array.from(categoryMap.values()).sort((a, b) => b.tokensSaved - a.tokensSaved)[0]
        ?.category || 'none';

    return {
      period,
      totalMessages,
      totalTokens,
      tokensSaved,
      efficiency,
      costUSD,
      costSavingsUSD,
      cacheHitRate,
      uniqueResources,
      topCategory,
    };
  }

  /**
   * Get storage statistics
   */
  getStorageStats() {
    return this.store.getStats();
  }

  /**
   * Get time range from query
   */
  private getTimeRange(query: MetricsQuery): {
    startTime: Date;
    endTime: Date;
  } {
    // Custom range takes precedence
    if (query.startTime && query.endTime) {
      return {
        startTime: query.startTime,
        endTime: query.endTime,
      };
    }

    const endTime = new Date();
    let startTime = new Date(0); // Unix epoch (all time)

    switch (query.period) {
      case 'last_hour':
        startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
        break;
      case 'last_day':
        startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last_week':
        startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'all_time':
      default:
        // Keep epoch start time
        break;
    }

    return { startTime, endTime };
  }
}
