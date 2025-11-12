/**
 * Token Store - In-memory storage for token usage data
 *
 * Provides storage and retrieval of token usage records with:
 * - In-memory storage (can be extended to Redis/DB later)
 * - Session aggregation
 * - Time-based queries
 * - Automatic cleanup of old data
 */

import { Logger } from '../utils/logger.js';
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
 * Default storage configuration
 */
const DEFAULT_STORE_CONFIG: StoreConfig = {
  maxRecords: 10000,
  retentionDays: 7,
  autoCleanup: true,
  cleanupIntervalMs: 3600000, // 1 hour
};

/**
 * In-memory token usage store
 * Stores token usage records and provides query capabilities
 */
export class TokenStore {
  private logger: Logger;
  private config: StoreConfig;
  private usageRecords: TokenUsage[];
  private sessionMap: Map<string, TokenSession>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<StoreConfig> = {}) {
    this.logger = new Logger('TokenStore');
    this.config = { ...DEFAULT_STORE_CONFIG, ...config };
    this.usageRecords = [];
    this.sessionMap = new Map();

    if (this.config.autoCleanup) {
      this.startAutoCleanup();
    }

    this.logger.info('TokenStore initialized', {
      maxRecords: this.config.maxRecords,
      retentionDays: this.config.retentionDays,
      autoCleanup: this.config.autoCleanup,
    });
  }

  /**
   * Save token usage record
   *
   * @param usage - Token usage record to save
   * @param sessionId - Optional session ID for aggregation
   */
  saveUsage(usage: TokenUsage, sessionId?: string): void {
    // Add to usage records
    this.usageRecords.push(usage);

    // Update session if provided
    if (sessionId) {
      this.updateSession(sessionId, usage);
    }

    // Enforce max records limit
    if (this.usageRecords.length > this.config.maxRecords) {
      const excess = this.usageRecords.length - this.config.maxRecords;
      this.usageRecords.splice(0, excess);
      this.logger.debug(`Removed ${excess} oldest records to enforce limit`);
    }

    this.logger.debug('Usage saved', {
      messageId: usage.messageId,
      sessionId,
      totalRecords: this.usageRecords.length,
    });
  }

  /**
   * Get recent usage records
   *
   * @param limit - Maximum number of records to return
   * @param category - Optional category filter
   * @returns Array of recent usage records
   */
  getRecentUsage(limit: number = 100, category?: string): TokenUsage[] {
    let records = [...this.usageRecords];

    // Filter by category if specified
    if (category) {
      records = records.filter((r) => r.category === category);
    }

    // Sort by timestamp (newest first) and limit
    return records
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get usage records within time range
   *
   * @param startTime - Start of time range
   * @param endTime - End of time range
   * @param category - Optional category filter
   * @returns Array of usage records in range
   */
  getUsageInRange(
    startTime: Date,
    endTime: Date,
    category?: string
  ): TokenUsage[] {
    let records = this.usageRecords.filter(
      (r) => r.timestamp >= startTime && r.timestamp <= endTime
    );

    if (category) {
      records = records.filter((r) => r.category === category);
    }

    return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get session data
   *
   * @param sessionId - Session identifier
   * @returns TokenSession or undefined if not found
   */
  getSessionData(sessionId: string): TokenSession | undefined {
    return this.sessionMap.get(sessionId);
  }

  /**
   * Get all sessions
   *
   * @returns Array of all sessions
   */
  getAllSessions(): TokenSession[] {
    return Array.from(this.sessionMap.values());
  }

  /**
   * End a session
   *
   * @param sessionId - Session identifier
   */
  endSession(sessionId: string): void {
    const session = this.sessionMap.get(sessionId);
    if (session && !session.endTime) {
      session.endTime = new Date();
      this.logger.debug('Session ended', { sessionId });
    }
  }

  /**
   * Get total usage count
   */
  getTotalCount(): number {
    return this.usageRecords.length;
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessionMap.size;
  }

  /**
   * Cleanup old data beyond retention period
   *
   * @returns Number of records removed
   */
  cleanup(): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const initialCount = this.usageRecords.length;

    // Remove old usage records
    this.usageRecords = this.usageRecords.filter(
      (r) => r.timestamp >= cutoffDate
    );

    // Remove old sessions
    for (const [sessionId, session] of this.sessionMap.entries()) {
      if (session.endTime && session.endTime < cutoffDate) {
        this.sessionMap.delete(sessionId);
      }
    }

    const removed = initialCount - this.usageRecords.length;

    if (removed > 0) {
      this.logger.info('Cleanup completed', {
        removed,
        remaining: this.usageRecords.length,
        cutoffDate: cutoffDate.toISOString(),
      });
    }

    return removed;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.usageRecords = [];
    this.sessionMap.clear();
    this.logger.debug('Store cleared');
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    totalRecords: number;
    totalSessions: number;
    oldestRecord?: Date;
    newestRecord?: Date;
    memoryUsageEstimate: string;
  } {
    const oldest =
      this.usageRecords.length > 0
        ? this.usageRecords.reduce((min, r) =>
            r.timestamp < min ? r.timestamp : min, this.usageRecords[0].timestamp
          )
        : undefined;

    const newest =
      this.usageRecords.length > 0
        ? this.usageRecords.reduce((max, r) =>
            r.timestamp > max ? r.timestamp : max, this.usageRecords[0].timestamp
          )
        : undefined;

    // Rough memory estimate (each record ~500 bytes)
    const estimatedBytes = this.usageRecords.length * 500;
    const memoryUsageEstimate =
      estimatedBytes > 1024 * 1024
        ? `${(estimatedBytes / 1024 / 1024).toFixed(2)} MB`
        : `${(estimatedBytes / 1024).toFixed(2)} KB`;

    return {
      totalRecords: this.usageRecords.length,
      totalSessions: this.sessionMap.size,
      oldestRecord: oldest,
      newestRecord: newest,
      memoryUsageEstimate,
    };
  }

  /**
   * Destroy store and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
    this.logger.info('TokenStore destroyed');
  }

  /**
   * Update or create session with new usage
   */
  private updateSession(sessionId: string, usage: TokenUsage): void {
    let session = this.sessionMap.get(sessionId);

    if (!session) {
      // Create new session
      session = {
        sessionId,
        startTime: usage.timestamp,
        messageCount: 0,
        trackedMessageIds: new Set(),
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheReadTokens: 0,
        totalCacheCreationTokens: 0,
        totalTokens: 0,
        totalBaselineTokens: 0,
        totalTokensSaved: 0,
        sessionEfficiency: 0,
        totalCostUSD: 0,
        totalCostSavingsUSD: 0,
        usageRecords: [],
      };
      this.sessionMap.set(sessionId, session);
    }

    // Update session with new usage
    if (!session.trackedMessageIds.has(usage.messageId)) {
      session.trackedMessageIds.add(usage.messageId);
      session.messageCount++;
      session.usageRecords.push(usage);

      session.totalInputTokens += usage.inputTokens;
      session.totalOutputTokens += usage.outputTokens;
      session.totalCacheReadTokens += usage.cacheReadTokens;
      session.totalCacheCreationTokens += usage.cacheCreationTokens;
      session.totalTokens += usage.totalTokens;
      session.totalBaselineTokens += usage.baselineTokens;
      session.totalTokensSaved += usage.tokensSaved;
      session.totalCostUSD += usage.costUSD;
      session.totalCostSavingsUSD += usage.costSavingsUSD;

      // Recalculate session efficiency
      session.sessionEfficiency =
        session.totalBaselineTokens > 0
          ? (session.totalTokensSaved / session.totalBaselineTokens) * 100
          : 0;
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);

    // Don't prevent Node.js from exiting
    this.cleanupTimer.unref();

    this.logger.debug('Auto-cleanup started', {
      intervalMs: this.config.cleanupIntervalMs,
    });
  }
}
