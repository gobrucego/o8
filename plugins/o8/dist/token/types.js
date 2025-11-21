/**
 * Token System Type Definitions
 *
 * Core types for tracking token usage, efficiency, and cost metrics
 * in the orchestr8 MCP server with JIT loading and dynamic resource assembly.
 */
/**
 * Default Claude Sonnet 4.5 pricing
 */
export const DEFAULT_TOKEN_COSTS = {
    inputCostPerMillion: 3.00, // $3 per million input tokens
    outputCostPerMillion: 15.00, // $15 per million output tokens
    cacheReadCostPerMillion: 0.30, // $0.30 per million cache read tokens
    cacheCreationCostPerMillion: 3.75, // $3.75 per million cache creation tokens
};
/**
 * Default tracking options
 */
export const DEFAULT_TRACKING_OPTIONS = {
    enabled: true,
    baselineStrategy: 'no_jit',
    deduplication: true,
    retentionDays: 7,
    enableTrends: true,
};
//# sourceMappingURL=types.js.map