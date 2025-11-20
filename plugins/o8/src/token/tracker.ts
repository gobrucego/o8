/**
 * Token Tracker - Core token tracking logic
 *
 * Tracks token usage with message ID deduplication, baseline calculation,
 * and cost computation following Claude SDK token format.
 */

import { Logger } from '../utils/logger.js';
import {
  TokenUsage,
  TokenCostConfig,
  DEFAULT_TOKEN_COSTS,
  BaselineStrategy,
  DEFAULT_TRACKING_OPTIONS,
  TokenTrackingOptions,
} from './types.js';

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
export class TokenTracker {
  private logger: Logger;
  private trackedMessageIds: Set<string>;
  private costConfig: TokenCostConfig;
  private options: TokenTrackingOptions;

  constructor(options: Partial<TokenTrackingOptions> = {}) {
    this.logger = new Logger('TokenTracker');
    this.trackedMessageIds = new Set();
    this.options = { ...DEFAULT_TRACKING_OPTIONS, ...options };
    this.costConfig = this.options.customCosts || DEFAULT_TOKEN_COSTS;

    this.logger.info('TokenTracker initialized', {
      enabled: this.options.enabled,
      baselineStrategy: this.options.baselineStrategy,
      deduplication: this.options.deduplication,
    });
  }

  /**
   * Track token usage from Claude API response
   * Implements message ID deduplication to prevent double-counting
   *
   * @param messageId - Unique message identifier
   * @param claudeUsage - Token usage from Claude SDK
   * @param metadata - Optional metadata (category, resourceUri)
   * @returns TokenUsage record or null if deduplicated
   */
  track(
    messageId: string,
    claudeUsage: ClaudeTokenUsage,
    metadata?: {
      category?: string;
      resourceUri?: string;
      resourceCount?: number;
    }
  ): TokenUsage | null {
    if (!this.options.enabled) {
      this.logger.debug('Tracking disabled, skipping');
      return null;
    }

    // Deduplication check
    if (this.options.deduplication && this.trackedMessageIds.has(messageId)) {
      this.logger.debug(`Message ${messageId} already tracked, skipping duplicate`);
      return null;
    }

    // Extract token counts from Claude SDK format
    const inputTokens = claudeUsage.input_tokens;
    const outputTokens = claudeUsage.output_tokens;
    const cacheCreationTokens = claudeUsage.cache_creation_input_tokens || 0;
    const cacheReadTokens = claudeUsage.cache_read_input_tokens || 0;
    const totalTokens = inputTokens + outputTokens + cacheCreationTokens + cacheReadTokens;

    // Calculate baseline (what would have been used without orchestr8)
    const baselineTokens = this.calculateBaseline(
      claudeUsage,
      metadata?.resourceCount || 0
    );

    // Calculate savings
    const tokensSaved = Math.max(0, baselineTokens - totalTokens);
    const efficiencyPercentage = baselineTokens > 0
      ? (tokensSaved / baselineTokens) * 100
      : 0;

    // Calculate costs
    const costUSD = this.calculateCost(claudeUsage);
    const baselineCostUSD = this.calculateBaselineCost(baselineTokens);
    const costSavingsUSD = Math.max(0, baselineCostUSD - costUSD);

    // Create usage record
    const usage: TokenUsage = {
      messageId,
      timestamp: new Date(),
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheCreationTokens,
      totalTokens,
      category: metadata?.category,
      resourceUri: metadata?.resourceUri,
      baselineTokens,
      tokensSaved,
      efficiencyPercentage,
      costUSD,
      costSavingsUSD,
    };

    // Track message ID
    if (this.options.deduplication) {
      this.trackedMessageIds.add(messageId);
    }

    this.logger.debug('Token usage tracked', {
      messageId,
      totalTokens,
      efficiency: `${efficiencyPercentage.toFixed(1)}%`,
      saved: tokensSaved,
      cost: `$${costUSD.toFixed(4)}`,
    });

    return usage;
  }

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
  calculateBaseline(
    claudeUsage: ClaudeTokenUsage,
    resourceCount: number = 0
  ): number {
    const strategy = this.options.baselineStrategy;

    switch (strategy) {
      case 'no_jit':
        // Without JIT: all resources would be in system prompt
        // Estimate: average resource size = 500 tokens
        // All resources processed as input tokens, no caching benefit
        const avgResourceSize = 500;
        const estimatedResourceTokens = resourceCount * avgResourceSize;
        return (
          claudeUsage.input_tokens +
          claudeUsage.output_tokens +
          estimatedResourceTokens +
          (claudeUsage.cache_creation_input_tokens || 0) +
          (claudeUsage.cache_read_input_tokens || 0)
        );

      case 'no_cache':
        // With JIT but no caching: all tokens counted as regular input
        // Cache read tokens would be full input tokens
        return (
          claudeUsage.input_tokens +
          claudeUsage.output_tokens +
          (claudeUsage.cache_creation_input_tokens || 0) +
          (claudeUsage.cache_read_input_tokens || 0) * 10 // Cache reads are 10x cheaper
        );

      case 'custom':
        // Custom baseline (can be extended)
        return claudeUsage.input_tokens + claudeUsage.output_tokens;

      default:
        this.logger.warn(`Unknown baseline strategy: ${strategy}, using no_jit`);
        return this.calculateBaseline(claudeUsage, resourceCount);
    }
  }

  /**
   * Calculate cost in USD from Claude token usage
   *
   * @param claudeUsage - Token usage from Claude SDK
   * @returns Cost in USD
   */
  calculateCost(claudeUsage: ClaudeTokenUsage): number {
    const inputCost =
      (claudeUsage.input_tokens / 1_000_000) * this.costConfig.inputCostPerMillion;

    const outputCost =
      (claudeUsage.output_tokens / 1_000_000) * this.costConfig.outputCostPerMillion;

    const cacheCreationCost =
      ((claudeUsage.cache_creation_input_tokens || 0) / 1_000_000) *
      this.costConfig.cacheCreationCostPerMillion;

    const cacheReadCost =
      ((claudeUsage.cache_read_input_tokens || 0) / 1_000_000) *
      this.costConfig.cacheReadCostPerMillion;

    return inputCost + outputCost + cacheCreationCost + cacheReadCost;
  }

  /**
   * Calculate baseline cost (for comparison)
   *
   * @param baselineTokens - Baseline token count
   * @returns Baseline cost in USD
   */
  private calculateBaselineCost(baselineTokens: number): number {
    // Assume baseline is primarily input tokens (conservative estimate)
    return (baselineTokens / 1_000_000) * this.costConfig.inputCostPerMillion;
  }

  /**
   * Check if message ID has been tracked
   *
   * @param messageId - Message identifier
   * @returns True if already tracked
   */
  hasTracked(messageId: string): boolean {
    return this.trackedMessageIds.has(messageId);
  }

  /**
   * Get tracked message count
   *
   * @returns Number of unique messages tracked
   */
  getTrackedCount(): number {
    return this.trackedMessageIds.size;
  }

  /**
   * Clear tracked message IDs (for testing or session reset)
   */
  clearTracked(): void {
    this.logger.debug('Clearing tracked message IDs', {
      count: this.trackedMessageIds.size,
    });
    this.trackedMessageIds.clear();
  }

  /**
   * Get current configuration
   */
  getConfig(): {
    options: TokenTrackingOptions;
    costs: TokenCostConfig;
  } {
    return {
      options: { ...this.options },
      costs: { ...this.costConfig },
    };
  }

  /**
   * Update configuration
   *
   * @param options - Partial options to update
   */
  updateConfig(options: Partial<TokenTrackingOptions>): void {
    this.options = { ...this.options, ...options };
    if (options.customCosts) {
      this.costConfig = options.customCosts;
    }
    this.logger.info('Configuration updated', this.options);
  }
}
