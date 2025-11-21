/**
 * Statistics Collector
 *
 * Centralized statistics collection and broadcasting for the MCP server.
 * Used by both stdio and HTTP transports to track server metrics.
 */
import type { TokenMetrics } from '../token/metrics.js';
export interface ActivityEvent {
    type: string;
    timestamp: number;
    data?: any;
}
export interface StatsSnapshot {
    uptime: number;
    requests: {
        total: number;
        byMethod: Record<string, number>;
    };
    cache: {
        hits: number;
        misses: number;
        hitRate: string;
    };
    latency: {
        p50: number;
        p95: number;
        p99: number;
        avg: number;
    };
    errors: number;
    memory: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
    lastActivity: number;
    tokens?: {
        efficiency: number;
        tokensSaved: number;
        totalCost: number;
        recentSavings: number;
        totalActualTokens: number;
        totalBaselineTokens: number;
    };
}
export type StatsSubscriber = (snapshot: StatsSnapshot) => void;
export type ActivitySubscriber = (event: ActivityEvent) => void;
export declare class StatsCollector {
    private startTime;
    private stats;
    private activityLog;
    private subscribers;
    private activitySubscribers;
    private readonly maxLatencies;
    private readonly maxActivityLog;
    private tokenMetrics;
    constructor(tokenMetrics?: TokenMetrics);
    /**
     * Track a request to the MCP server
     */
    trackRequest(method: string, latencyMs: number, params?: any): void;
    /**
     * Track a cache hit
     */
    trackCacheHit(): void;
    /**
     * Track a cache miss
     */
    trackCacheMiss(): void;
    /**
     * Track an error
     */
    trackError(errorData?: any): void;
    /**
     * Log an activity event
     */
    logActivity(type: string, data?: any): void;
    /**
     * Get activity log
     */
    getActivityLog(limit?: number): ActivityEvent[];
    /**
     * Get current statistics snapshot
     */
    getSnapshot(): Promise<StatsSnapshot>;
    /**
     * Subscribe to statistics updates
     * Returns an unsubscribe function
     */
    subscribe(callback: StatsSubscriber): () => void;
    /**
     * Subscribe to activity events
     * Returns an unsubscribe function
     */
    subscribeToActivity(callback: ActivitySubscriber): () => void;
    /**
     * Get number of active subscribers
     */
    getSubscriberCount(): number;
    /**
     * Get number of active activity subscribers
     */
    getActivitySubscriberCount(): number;
    /**
     * Reset statistics (useful for testing)
     */
    reset(): void;
    /**
     * Notify all subscribers of stats update
     */
    private notifySubscribers;
    /**
     * Notify all activity subscribers of new activity
     */
    private notifyActivitySubscribers;
    /**
     * Calculate cache hit rate
     */
    private calculateHitRate;
    /**
     * Calculate percentile from sorted array
     */
    private calculatePercentile;
    /**
     * Calculate average from array
     */
    private calculateAverage;
}
//# sourceMappingURL=collector.d.ts.map