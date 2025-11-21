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
import { TokenUsage, CategoryMetrics, EfficiencySnapshot } from './types.js';
/**
 * Efficiency calculation engine
 * Analyzes token usage to provide efficiency metrics and insights
 */
export declare class EfficiencyEngine {
    private logger;
    constructor();
    /**
     * Calculate efficiency percentage
     *
     * @param actual - Actual tokens used
     * @param baseline - Baseline tokens (without optimization)
     * @returns Efficiency percentage (0-100)
     */
    calculateEfficiency(actual: number, baseline: number): number;
    /**
     * Calculate token savings
     *
     * @param actual - Actual tokens used
     * @param baseline - Baseline tokens
     * @returns Tokens saved
     */
    calculateSavings(actual: number, baseline: number): number;
    /**
     * Group usage records by category
     *
     * @param records - Array of token usage records
     * @returns Map of category to aggregated metrics
     */
    groupByCategory(records: TokenUsage[]): Map<string, CategoryMetrics>;
    /**
     * Get top resources by metric
     *
     * @param records - Array of token usage records
     * @param metric - Metric to sort by ('efficiency', 'savings', 'tokens')
     * @param limit - Number of top resources to return
     * @returns Array of top resources
     */
    getTopResources(records: TokenUsage[], metric?: 'efficiency' | 'savings' | 'tokens', limit?: number): Array<{
        uri: string;
        category: string;
        loadCount: number;
        tokens: number;
        efficiency: number;
        savings: number;
    }>;
    /**
     * Calculate trend between two time periods
     *
     * @param current - Current period metrics
     * @param previous - Previous period metrics
     * @returns Trend analysis
     */
    calculateTrend(current: {
        efficiency: number;
        tokensSaved: number;
        costSavings: number;
    }, previous: {
        efficiency: number;
        tokensSaved: number;
        costSavings: number;
    }): {
        efficiencyChange: number;
        tokenSavingsChange: number;
        costSavingsChange: number;
        direction: 'improving' | 'declining' | 'stable';
    };
    /**
     * Generate efficiency snapshot from usage records
     *
     * @param records - Array of token usage records
     * @param period - Time period label
     * @param previousRecords - Optional previous period for trend analysis
     * @returns Complete efficiency snapshot
     */
    generateSnapshot(records: TokenUsage[], period?: string, previousRecords?: TokenUsage[]): EfficiencySnapshot;
    /**
     * Format efficiency percentage for display
     *
     * @param efficiency - Efficiency percentage
     * @returns Formatted string with color indicator
     */
    formatEfficiency(efficiency: number): string;
    /**
     * Format cost for display
     *
     * @param costUSD - Cost in USD
     * @returns Formatted cost string
     */
    formatCost(costUSD: number): string;
    /**
     * Format token count for display
     *
     * @param tokens - Token count
     * @returns Formatted token string
     */
    formatTokens(tokens: number): string;
}
//# sourceMappingURL=efficiency.d.ts.map