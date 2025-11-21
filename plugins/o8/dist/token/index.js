/**
 * Token Tracking System - Barrel Export
 *
 * Provides a clean, unified API for the token tracking infrastructure.
 * This is the main entry point for other modules to import token functionality.
 */
// Import classes and types for local use
import { TokenTracker } from './tracker.js';
import { TokenStore } from './store.js';
import { EfficiencyEngine } from './efficiency.js';
import { TokenMetrics } from './metrics.js';
// Re-export everything for consumers
export { TokenTracker } from './tracker.js';
export { TokenStore } from './store.js';
export { EfficiencyEngine } from './efficiency.js';
export { TokenMetrics } from './metrics.js';
// Type definitions
export { DEFAULT_TOKEN_COSTS, DEFAULT_TRACKING_OPTIONS, } from './types.js';
/**
 * Factory function to create a complete token tracking system
 *
 * @param options - Optional configuration
 * @returns Configured token system components
 */
export function createTokenSystem(options) {
    const tracker = new TokenTracker(options?.tracking);
    const store = new TokenStore(options?.storage);
    const efficiency = new EfficiencyEngine();
    const metrics = new TokenMetrics(store, efficiency);
    return {
        tracker,
        store,
        efficiency,
        metrics,
    };
}
//# sourceMappingURL=index.js.map