/**
 * Efficiency Engine - Token efficiency calculations and analysis
 *
 * Provides:
 * - Efficiency percentage calculations
 * - Token savings analysis
 * - Category-based grouping
 * - Trend analysis
 * - Performance insights
 */

import { Logger } from '../utils/logger.js';
import {
  TokenUsage,
  CategoryMetrics,
  EfficiencySnapshot,
} from './types.js';

/**
 * Efficiency calculation engine
 * Analyzes token usage to provide efficiency metrics and insights
 */
export class EfficiencyEngine {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('EfficiencyEngine');
  }

  /**
   * Calculate efficiency percentage
   *
   * @param actual - Actual tokens used
   * @param baseline - Baseline tokens (without optimization)
   * @returns Efficiency percentage (0-100)
   */
  calculateEfficiency(actual: number, baseline: number): number {
    if (baseline === 0) return 0;
    const saved = Math.max(0, baseline - actual);
    return (saved / baseline) * 100;
  }

  /**
   * Calculate token savings
   *
   * @param actual - Actual tokens used
   * @param baseline - Baseline tokens
   * @returns Tokens saved
   */
  calculateSavings(actual: number, baseline: number): number {
    return Math.max(0, baseline - actual);
  }

  /**
   * Group usage records by category
   *
   * @param records - Array of token usage records
   * @returns Map of category to aggregated metrics
   */
  groupByCategory(records: TokenUsage[]): Map<string, CategoryMetrics> {
    const categoryMap = new Map<string, CategoryMetrics>();

    for (const record of records) {
      const category = record.category || 'uncategorized';

      let metrics = categoryMap.get(category);
      if (!metrics) {
        metrics = {
          category,
          loadCount: 0,
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          cacheTokens: 0,
          baselineTokens: 0,
          tokensSaved: 0,
          efficiency: 0,
          costUSD: 0,
          costSavingsUSD: 0,
          topResources: [],
        };
        categoryMap.set(category, metrics);
      }

      // Aggregate metrics
      metrics.loadCount++;
      metrics.totalTokens += record.totalTokens;
      metrics.inputTokens += record.inputTokens;
      metrics.outputTokens += record.outputTokens;
      metrics.cacheTokens += record.cacheReadTokens + record.cacheCreationTokens;
      metrics.baselineTokens += record.baselineTokens;
      metrics.tokensSaved += record.tokensSaved;
      metrics.costUSD += record.costUSD;
      metrics.costSavingsUSD += record.costSavingsUSD;
    }

    // Calculate efficiency for each category
    for (const metrics of categoryMap.values()) {
      metrics.efficiency = this.calculateEfficiency(
        metrics.totalTokens,
        metrics.baselineTokens
      );
    }

    return categoryMap;
  }

  /**
   * Get top resources by metric
   *
   * @param records - Array of token usage records
   * @param metric - Metric to sort by ('efficiency', 'savings', 'tokens')
   * @param limit - Number of top resources to return
   * @returns Array of top resources
   */
  getTopResources(
    records: TokenUsage[],
    metric: 'efficiency' | 'savings' | 'tokens' = 'efficiency',
    limit: number = 10
  ): Array<{
    uri: string;
    category: string;
    loadCount: number;
    tokens: number;
    efficiency: number;
    savings: number;
  }> {
    const resourceMap = new Map<
      string,
      {
        uri: string;
        category: string;
        loadCount: number;
        tokens: number;
        baseline: number;
        savings: number;
        efficiency: number;
      }
    >();

    // Aggregate by resource URI
    for (const record of records) {
      if (!record.resourceUri) continue;

      const uri = record.resourceUri;
      let resource = resourceMap.get(uri);

      if (!resource) {
        resource = {
          uri,
          category: record.category || 'uncategorized',
          loadCount: 0,
          tokens: 0,
          baseline: 0,
          savings: 0,
          efficiency: 0,
        };
        resourceMap.set(uri, resource);
      }

      resource.loadCount++;
      resource.tokens += record.totalTokens;
      resource.baseline += record.baselineTokens;
      resource.savings += record.tokensSaved;
    }

    // Calculate efficiency for each resource
    for (const resource of resourceMap.values()) {
      resource.efficiency = this.calculateEfficiency(
        resource.tokens,
        resource.baseline
      );
    }

    // Sort by selected metric
    const sorted = Array.from(resourceMap.values()).sort((a, b) => {
      switch (metric) {
        case 'efficiency':
          return b.efficiency - a.efficiency;
        case 'savings':
          return b.savings - a.savings;
        case 'tokens':
          return b.tokens - a.tokens;
        default:
          return 0;
      }
    });

    return sorted.slice(0, limit);
  }

  /**
   * Calculate trend between two time periods
   *
   * @param current - Current period metrics
   * @param previous - Previous period metrics
   * @returns Trend analysis
   */
  calculateTrend(
    current: { efficiency: number; tokensSaved: number; costSavings: number },
    previous: { efficiency: number; tokensSaved: number; costSavings: number }
  ): {
    efficiencyChange: number;
    tokenSavingsChange: number;
    costSavingsChange: number;
    direction: 'improving' | 'declining' | 'stable';
  } {
    const efficiencyChange = current.efficiency - previous.efficiency;
    const tokenSavingsChange = current.tokensSaved - previous.tokensSaved;
    const costSavingsChange = current.costSavings - previous.costSavings;

    // Determine direction based on efficiency change
    let direction: 'improving' | 'declining' | 'stable';
    if (Math.abs(efficiencyChange) < 1) {
      direction = 'stable';
    } else if (efficiencyChange > 0) {
      direction = 'improving';
    } else {
      direction = 'declining';
    }

    return {
      efficiencyChange,
      tokenSavingsChange,
      costSavingsChange,
      direction,
    };
  }

  /**
   * Generate efficiency snapshot from usage records
   *
   * @param records - Array of token usage records
   * @param period - Time period label
   * @param previousRecords - Optional previous period for trend analysis
   * @returns Complete efficiency snapshot
   */
  generateSnapshot(
    records: TokenUsage[],
    period: string = 'all_time',
    previousRecords?: TokenUsage[]
  ): EfficiencySnapshot {
    // Calculate overall metrics
    const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
    const baselineTokens = records.reduce((sum, r) => sum + r.baselineTokens, 0);
    const tokensSaved = records.reduce((sum, r) => sum + r.tokensSaved, 0);
    const costUSD = records.reduce((sum, r) => sum + r.costUSD, 0);
    const costSavingsUSD = records.reduce((sum, r) => sum + r.costSavingsUSD, 0);
    const efficiencyPercentage = this.calculateEfficiency(totalTokens, baselineTokens);

    // Group by category
    const categoryMap = this.groupByCategory(records);
    const byCategory = Array.from(categoryMap.values());

    // Calculate cache metrics
    const totalCacheReads = records.reduce((sum, r) => sum + r.cacheReadTokens, 0);
    const totalCacheCreations = records.reduce(
      (sum, r) => sum + r.cacheCreationTokens,
      0
    );
    const totalCacheHits = records.filter((r) => r.cacheReadTokens > 0).length;
    const cacheHitRate = records.length > 0 ? (totalCacheHits / records.length) * 100 : 0;

    // Estimate cache tokens saved (cache reads are 10x cheaper than regular input)
    const cacheTokensSaved = totalCacheReads * 9; // 90% savings on cache reads

    // Get top performers (highest efficiency)
    const topPerformers = this.getTopResources(records, 'efficiency', 5).map((r) => ({
      uri: r.uri,
      category: r.category,
      efficiency: r.efficiency,
      tokensSaved: r.savings,
    }));

    // Get resources needing optimization (lowest efficiency, but frequently loaded)
    const allResources = this.getTopResources(records, 'efficiency', 1000);
    const needsOptimization = allResources
      .filter((r) => r.loadCount >= 3) // Only frequently used resources
      .sort((a, b) => a.efficiency - b.efficiency) // Lowest efficiency first
      .slice(0, 5)
      .map((r) => ({
        uri: r.uri,
        category: r.category,
        efficiency: r.efficiency,
        loadCount: r.loadCount,
      }));

    // Calculate trend if previous period provided
    let trend;
    if (previousRecords && previousRecords.length > 0) {
      const prevTotal = previousRecords.reduce((sum, r) => sum + r.totalTokens, 0);
      const prevBaseline = previousRecords.reduce((sum, r) => sum + r.baselineTokens, 0);
      const prevSaved = previousRecords.reduce((sum, r) => sum + r.tokensSaved, 0);
      const prevCost = previousRecords.reduce((sum, r) => sum + r.costSavingsUSD, 0);
      const prevEfficiency = this.calculateEfficiency(prevTotal, prevBaseline);

      trend = this.calculateTrend(
        { efficiency: efficiencyPercentage, tokensSaved, costSavings: costSavingsUSD },
        { efficiency: prevEfficiency, tokensSaved: prevSaved, costSavings: prevCost }
      );
    } else {
      trend = {
        efficiencyChange: 0,
        tokenSavingsChange: 0,
        costSavingsChange: 0,
        direction: 'stable' as const,
      };
    }

    return {
      timestamp: new Date(),
      period,
      overall: {
        totalTokens,
        baselineTokens,
        tokensSaved,
        efficiencyPercentage,
        costUSD,
        costSavingsUSD,
      },
      byCategory,
      cache: {
        totalCacheHits,
        totalCacheReads,
        totalCacheCreations,
        cacheHitRate,
        cacheTokensSaved,
      },
      trend,
      topPerformers,
      needsOptimization,
    };
  }

  /**
   * Format efficiency percentage for display
   *
   * @param efficiency - Efficiency percentage
   * @returns Formatted string with color indicator
   */
  formatEfficiency(efficiency: number): string {
    const formatted = efficiency.toFixed(1);
    if (efficiency >= 50) return `${formatted}% (excellent)`;
    if (efficiency >= 30) return `${formatted}% (good)`;
    if (efficiency >= 10) return `${formatted}% (fair)`;
    return `${formatted}% (needs improvement)`;
  }

  /**
   * Format cost for display
   *
   * @param costUSD - Cost in USD
   * @returns Formatted cost string
   */
  formatCost(costUSD: number): string {
    if (costUSD < 0.01) return `$${(costUSD * 1000).toFixed(3)}m`;
    if (costUSD < 1) return `$${costUSD.toFixed(3)}`;
    return `$${costUSD.toFixed(2)}`;
  }

  /**
   * Format token count for display
   *
   * @param tokens - Token count
   * @returns Formatted token string
   */
  formatTokens(tokens: number): string {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`;
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
    return tokens.toString();
  }
}
