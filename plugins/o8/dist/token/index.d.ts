/**
 * Token Tracking System - Barrel Export
 *
 * Provides a clean, unified API for the token tracking infrastructure.
 * This is the main entry point for other modules to import token functionality.
 */
import { TokenTracker } from './tracker.js';
import { TokenStore, StoreConfig } from './store.js';
import { EfficiencyEngine } from './efficiency.js';
import { TokenMetrics } from './metrics.js';
import { TokenTrackingOptions } from './types.js';
export { TokenTracker, ClaudeTokenUsage } from './tracker.js';
export { TokenStore, StoreConfig } from './store.js';
export { EfficiencyEngine } from './efficiency.js';
export { TokenMetrics, MetricsQuery } from './metrics.js';
export { TokenUsage, TokenSession, CategoryMetrics, EfficiencySnapshot, TokenCostConfig, BaselineStrategy, TokenTrackingOptions, DEFAULT_TOKEN_COSTS, DEFAULT_TRACKING_OPTIONS, } from './types.js';
/**
 * Factory function to create a complete token tracking system
 *
 * @param options - Optional configuration
 * @returns Configured token system components
 */
export declare function createTokenSystem(options?: {
    tracking?: Partial<TokenTrackingOptions>;
    storage?: Partial<StoreConfig>;
}): {
    tracker: TokenTracker;
    store: TokenStore;
    efficiency: EfficiencyEngine;
    metrics: TokenMetrics;
};
//# sourceMappingURL=index.d.ts.map