/**
 * Token Store - In-memory storage for token usage data
 *
 * Provides storage and retrieval of token usage records with:
 * - In-memory storage (can be extended to Redis/DB later)
 * - Session aggregation
 * - Time-based queries
 * - Automatic cleanup of old data
 */
import { TokenUsage, TokenSession } from './types.js';
/**
 * Storage configuration
 */
export interface StoreConfig {
    /** Maximum records to keep in memory */
    maxRecords: number;
    /** Data retention period in days */
    retentionDays: number;
    /** Enable automatic cleanup */
    autoCleanup: boolean;
    /** Cleanup interval in milliseconds */
    cleanupIntervalMs: number;
}
/**
 * In-memory token usage store
 * Stores token usage records and provides query capabilities
 */
export declare class TokenStore {
    private logger;
    private config;
    private usageRecords;
    private sessionMap;
    private cleanupTimer?;
    constructor(config?: Partial<StoreConfig>);
    /**
     * Save token usage record
     *
     * @param usage - Token usage record to save
     * @param sessionId - Optional session ID for aggregation
     */
    saveUsage(usage: TokenUsage, sessionId?: string): void;
    /**
     * Get recent usage records
     *
     * @param limit - Maximum number of records to return
     * @param category - Optional category filter
     * @returns Array of recent usage records
     */
    getRecentUsage(limit?: number, category?: string): TokenUsage[];
    /**
     * Get usage records within time range
     *
     * @param startTime - Start of time range
     * @param endTime - End of time range
     * @param category - Optional category filter
     * @returns Array of usage records in range
     */
    getUsageInRange(startTime: Date, endTime: Date, category?: string): TokenUsage[];
    /**
     * Get session data
     *
     * @param sessionId - Session identifier
     * @returns TokenSession or undefined if not found
     */
    getSessionData(sessionId: string): TokenSession | undefined;
    /**
     * Get all sessions
     *
     * @returns Array of all sessions
     */
    getAllSessions(): TokenSession[];
    /**
     * End a session
     *
     * @param sessionId - Session identifier
     */
    endSession(sessionId: string): void;
    /**
     * Get total usage count
     */
    getTotalCount(): number;
    /**
     * Get session count
     */
    getSessionCount(): number;
    /**
     * Cleanup old data beyond retention period
     *
     * @returns Number of records removed
     */
    cleanup(): number;
    /**
     * Clear all data (for testing)
     */
    clear(): void;
    /**
     * Get storage statistics
     */
    getStats(): {
        totalRecords: number;
        totalSessions: number;
        oldestRecord?: Date;
        newestRecord?: Date;
        memoryUsageEstimate: string;
    };
    /**
     * Destroy store and cleanup resources
     */
    destroy(): void;
    /**
     * Update or create session with new usage
     */
    private updateSession;
    /**
     * Start automatic cleanup timer
     */
    private startAutoCleanup;
}
//# sourceMappingURL=store.d.ts.map