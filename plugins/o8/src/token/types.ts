/**
 * Token System Type Definitions
 *
 * Core types for tracking token usage, efficiency, and cost metrics
 * in the orchestr8 MCP server with JIT loading and dynamic resource assembly.
 */

/**
 * Individual token usage record with deduplication support
 * Maps to Claude SDK token usage format
 */
export interface TokenUsage {
  /** Unique message ID for deduplication */
  messageId: string;

  /** Timestamp when tokens were recorded */
  timestamp: Date;

  /** Input tokens consumed (from Claude SDK) */
  inputTokens: number;

  /** Output tokens generated (from Claude SDK) */
  outputTokens: number;

  /** Cache read tokens (from Claude SDK cache_read_input_tokens) */
  cacheReadTokens: number;

  /** Cache creation tokens (from Claude SDK cache_creation_input_tokens) */
  cacheCreationTokens: number;

  /** Total tokens (sum of all token types) */
  totalTokens: number;

  /** Resource category that triggered this usage (e.g., 'agent', 'skill', 'pattern') */
  category?: string;

  /** Specific resource URI loaded (e.g., 'o8://agents/project-manager') */
  resourceUri?: string;

  /** Baseline tokens (what would have been used without orchestr8) */
  baselineTokens: number;

  /** Tokens saved (baseline - actual) */
  tokensSaved: number;

  /** Efficiency percentage ((tokensSaved / baseline) * 100) */
  efficiencyPercentage: number;

  /** Cost in USD (based on Claude pricing) */
  costUSD: number;

  /** Cost savings in USD */
  costSavingsUSD: number;
}

/**
 * Session-level token aggregation
 * Provides cumulative metrics for a conversation or workflow session
 */
export interface TokenSession {
  /** Session ID (could be conversation ID or workflow run ID) */
  sessionId: string;

  /** Session start time */
  startTime: Date;

  /** Session end time (undefined if still active) */
  endTime?: Date;

  /** Total messages in session */
  messageCount: number;

  /** Unique message IDs tracked (for deduplication) */
  trackedMessageIds: Set<string>;

  /** Total input tokens across all messages */
  totalInputTokens: number;

  /** Total output tokens across all messages */
  totalOutputTokens: number;

  /** Total cache read tokens */
  totalCacheReadTokens: number;

  /** Total cache creation tokens */
  totalCacheCreationTokens: number;

  /** Total tokens consumed */
  totalTokens: number;

  /** Total baseline tokens (without orchestr8) */
  totalBaselineTokens: number;

  /** Total tokens saved */
  totalTokensSaved: number;

  /** Session-wide efficiency percentage */
  sessionEfficiency: number;

  /** Total cost in USD */
  totalCostUSD: number;

  /** Total cost savings in USD */
  totalCostSavingsUSD: number;

  /** Token usage records in this session */
  usageRecords: TokenUsage[];
}

/**
 * Category-level metrics aggregation
 * Groups token usage by resource category (agents, skills, patterns, etc.)
 */
export interface CategoryMetrics {
  /** Category name (e.g., 'agents', 'skills', 'patterns') */
  category: string;

  /** Number of times this category was loaded */
  loadCount: number;

  /** Total tokens for this category */
  totalTokens: number;

  /** Total input tokens */
  inputTokens: number;

  /** Total output tokens */
  outputTokens: number;

  /** Total cache tokens */
  cacheTokens: number;

  /** Baseline tokens for this category */
  baselineTokens: number;

  /** Tokens saved in this category */
  tokensSaved: number;

  /** Category efficiency percentage */
  efficiency: number;

  /** Cost in USD for this category */
  costUSD: number;

  /** Cost savings in USD for this category */
  costSavingsUSD: number;

  /** Most frequently loaded resources in this category */
  topResources: Array<{
    uri: string;
    loadCount: number;
    tokens: number;
  }>;
}

/**
 * Real-time efficiency snapshot
 * Provides current state of token efficiency across all dimensions
 */
export interface EfficiencySnapshot {
  /** Snapshot timestamp */
  timestamp: Date;

  /** Time period covered (e.g., 'last_hour', 'last_day', 'all_time') */
  period: string;

  /** Overall efficiency metrics */
  overall: {
    totalTokens: number;
    baselineTokens: number;
    tokensSaved: number;
    efficiencyPercentage: number;
    costUSD: number;
    costSavingsUSD: number;
  };

  /** Breakdown by category */
  byCategory: CategoryMetrics[];

  /** Cache effectiveness metrics */
  cache: {
    totalCacheHits: number;
    totalCacheReads: number;
    totalCacheCreations: number;
    cacheHitRate: number;
    cacheTokensSaved: number;
  };

  /** Trend analysis (compared to previous period) */
  trend: {
    efficiencyChange: number; // Percentage point change
    tokenSavingsChange: number; // Absolute token change
    costSavingsChange: number; // USD change
    direction: 'improving' | 'declining' | 'stable';
  };

  /** Top performing resources (highest efficiency) */
  topPerformers: Array<{
    uri: string;
    category: string;
    efficiency: number;
    tokensSaved: number;
  }>;

  /** Resources needing optimization (lowest efficiency) */
  needsOptimization: Array<{
    uri: string;
    category: string;
    efficiency: number;
    loadCount: number;
  }>;
}

/**
 * Token cost configuration
 * Claude API pricing (as of Jan 2025)
 */
export interface TokenCostConfig {
  /** Input token cost per million tokens */
  inputCostPerMillion: number;

  /** Output token cost per million tokens */
  outputCostPerMillion: number;

  /** Cache read cost per million tokens */
  cacheReadCostPerMillion: number;

  /** Cache creation cost per million tokens */
  cacheCreationCostPerMillion: number;
}

/**
 * Default Claude Sonnet 4.5 pricing
 */
export const DEFAULT_TOKEN_COSTS: TokenCostConfig = {
  inputCostPerMillion: 3.00,        // $3 per million input tokens
  outputCostPerMillion: 15.00,      // $15 per million output tokens
  cacheReadCostPerMillion: 0.30,    // $0.30 per million cache read tokens
  cacheCreationCostPerMillion: 3.75, // $3.75 per million cache creation tokens
};

/**
 * Baseline calculation strategy
 * Determines how baseline tokens are calculated
 */
export type BaselineStrategy =
  | 'no_jit'      // Baseline = all resources loaded upfront
  | 'no_cache'    // Baseline = JIT but no prompt caching
  | 'custom';     // Custom baseline calculation

/**
 * Token tracking options
 */
export interface TokenTrackingOptions {
  /** Enable/disable token tracking */
  enabled: boolean;

  /** Baseline calculation strategy */
  baselineStrategy: BaselineStrategy;

  /** Custom cost configuration (optional) */
  customCosts?: TokenCostConfig;

  /** Deduplication enabled */
  deduplication: boolean;

  /** Data retention period in days */
  retentionDays: number;

  /** Enable trend analysis */
  enableTrends: boolean;
}

/**
 * Default tracking options
 */
export const DEFAULT_TRACKING_OPTIONS: TokenTrackingOptions = {
  enabled: true,
  baselineStrategy: 'no_jit',
  deduplication: true,
  retentionDays: 7,
  enableTrends: true,
};
