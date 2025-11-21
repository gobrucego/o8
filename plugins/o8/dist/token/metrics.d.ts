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
import { TokenStore } from './store.js';
import { EfficiencyEngine } from './efficiency.js';
import { TokenSession, CategoryMetrics, EfficiencySnapshot } from './types.js';
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
export declare class TokenMetrics {
    private logger;
    private store;
    private efficiency;
    constructor(store: TokenStore, efficiency?: EfficiencyEngine);
    /**
     * Get current efficiency snapshot
     *
     * @param query - Query options for filtering and time range
     * @returns Efficiency snapshot with all metrics
     */
    getEfficiencySnapshot(query?: MetricsQuery): EfficiencySnapshot;
    /**
     * Calculate session efficiency
     *
     * @param sessionId - Session identifier
     * @returns Session metrics or null if session not found
     */
    calculateSessionEfficiency(sessionId: string): TokenSession | null;
    /**
     * Get metrics grouped by category
     *
     * @param query - Query options
     * @returns Array of category metrics
     */
    getByCategory(query?: MetricsQuery): CategoryMetrics[];
    /**
     * Get cost savings report
     *
     * @param query - Query options
     * @returns Cost savings summary
     */
    getCostSavings(query?: MetricsQuery): {
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
    };
    /**
     * Get top performing resources
     *
     * @param metric - Metric to rank by
     * @param limit - Number of results
     * @param query - Query options
     * @returns Array of top resources
     */
    getTopResources(metric?: 'efficiency' | 'savings' | 'tokens', limit?: number, query?: MetricsQuery): {
        uri: string;
        category: string;
        loadCount: number;
        tokens: number;
        efficiency: number;
        savings: number;
    }[];
    /**
     * Get summary statistics
     *
     * @param query - Query options
     * @returns Summary statistics
     */
    getSummary(query?: MetricsQuery): {
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
    };
    /**
     * Get storage statistics
     */
    getStorageStats(): {
        totalRecords: number;
        totalSessions: number;
        oldestRecord?: Date;
        newestRecord?: Date;
        memoryUsageEstimate: string;
    };
    /**
     * Get time range from query
     */
    private getTimeRange;
}
//# sourceMappingURL=metrics.d.ts.map