/**
 * Token Tracker - Core token tracking logic
 *
 * Tracks token usage with message ID deduplication, baseline calculation,
 * and cost computation following Claude SDK token format.
 */
import { TokenUsage, TokenCostConfig, TokenTrackingOptions } from './types.js';
/**
 * Claude SDK token usage format (from API response)
 */
export interface ClaudeTokenUsage {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
}
/**
 * Core token tracking class
 * Handles tracking, deduplication, baseline calculation, and cost computation
 */
export declare class TokenTracker {
    private logger;
    private trackedMessageIds;
    private costConfig;
    private options;
    constructor(options?: Partial<TokenTrackingOptions>);
    /**
     * Track token usage from Claude API response
     * Implements message ID deduplication to prevent double-counting
     *
     * @param messageId - Unique message identifier
     * @param claudeUsage - Token usage from Claude SDK
     * @param metadata - Optional metadata (category, resourceUri)
     * @returns TokenUsage record or null if deduplicated
     */
    track(messageId: string, claudeUsage: ClaudeTokenUsage, metadata?: {
        category?: string;
        resourceUri?: string;
        resourceCount?: number;
    }): TokenUsage | null;
    /**
     * Calculate baseline tokens (what would have been used without orchestr8)
     *
     * Strategies:
     * - 'no_jit': All resources loaded upfront in system prompt
     * - 'no_cache': JIT loading but no prompt caching
     * - 'custom': Custom calculation
     *
     * @param claudeUsage - Actual token usage
     * @param resourceCount - Number of JIT-loaded resources
     * @returns Baseline token count
     */
    calculateBaseline(claudeUsage: ClaudeTokenUsage, resourceCount?: number): number;
    /**
     * Calculate cost in USD from Claude token usage
     *
     * @param claudeUsage - Token usage from Claude SDK
     * @returns Cost in USD
     */
    calculateCost(claudeUsage: ClaudeTokenUsage): number;
    /**
     * Calculate baseline cost (for comparison)
     *
     * @param baselineTokens - Baseline token count
     * @returns Baseline cost in USD
     */
    private calculateBaselineCost;
    /**
     * Check if message ID has been tracked
     *
     * @param messageId - Message identifier
     * @returns True if already tracked
     */
    hasTracked(messageId: string): boolean;
    /**
     * Get tracked message count
     *
     * @returns Number of unique messages tracked
     */
    getTrackedCount(): number;
    /**
     * Clear tracked message IDs (for testing or session reset)
     */
    clearTracked(): void;
    /**
     * Get current configuration
     */
    getConfig(): {
        options: TokenTrackingOptions;
        costs: TokenCostConfig;
    };
    /**
     * Update configuration
     *
     * @param options - Partial options to update
     */
    updateConfig(options: Partial<TokenTrackingOptions>): void;
}
//# sourceMappingURL=tracker.d.ts.map