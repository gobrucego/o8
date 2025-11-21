/**
 * IndexLookup: Lightweight useWhen index-based resource matching
 *
 * Provides 85-95% token reduction compared to fuzzy matching by using
 * pre-built keyword indexes for O(1) lookups instead of O(n*m*k) scoring.
 *
 * Three-tier strategy:
 * 1. Quick lookup cache (O(1), ~10ms) - common queries
 * 2. Keyword-based index (O(k), ~50ms) - keyword intersection
 * 3. Fuzzy fallback (O(n), ~200ms) - edge cases
 */
/**
 * Index entry representing a useWhen scenario
 */
export interface IndexEntry {
    scenario: string;
    keywords: string[];
    uri: string;
    category: string;
    estimatedTokens: number;
    relevance: number;
}
/**
 * Scored index entry after relevance calculation
 */
export interface ScoredEntry extends IndexEntry {
    score: number;
}
/**
 * Complete useWhen index structure
 */
export interface UseWhenIndex {
    version: string;
    generated: string;
    totalFragments: number;
    index: Record<string, IndexEntry>;
    keywords: Record<string, string[]>;
    stats: {
        totalScenarios: number;
        avgScenariosPerFragment: number;
        avgKeywordsPerScenario: number;
        indexSizeBytes: number;
    };
}
/**
 * Options for index lookup
 */
export interface LookupOptions {
    query: string;
    maxResults?: number;
    minScore?: number;
    categories?: string[];
    mode?: string;
}
/**
 * IndexLookup class implements lightweight index-based resource matching
 */
export declare class IndexLookup {
    private index;
    private quickLookupCache;
    private indexLoadPromise;
    private fuzzyMatcher;
    private resourcesPath;
    private cacheTTL;
    constructor(resourcesPath?: string);
    /**
     * Main lookup method with three-tier strategy
     *
     * @param query - User's search query
     * @param options - Lookup options
     * @returns Formatted result content
     */
    lookup(query: string, options: LookupOptions): Promise<string>;
    /**
     * Load all index files
     */
    loadIndexes(): Promise<void>;
    /**
     * Internal implementation of index loading
     */
    private _loadIndexesImpl;
    /**
     * Find matching scenarios using keyword intersection
     */
    private findMatchingScenarios;
    /**
     * Score scenarios by keyword overlap
     */
    private scoreByRelevance;
    /**
     * Format compact result (50-120 tokens)
     */
    private formatCompactResult;
    /**
     * Fallback to fuzzy matcher
     */
    private fuzzyFallback;
    /**
     * Extract keywords from query
     */
    private extractKeywords;
    /**
     * Normalize query for cache key
     */
    private normalizeQuery;
    /**
     * Capitalize first letter
     */
    private capitalize;
    /**
     * Log query metrics
     */
    private logMetrics;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        hits: number;
        indexLoaded: boolean;
    };
    /**
     * Clear cache
     */
    clearCache(): void;
}
//# sourceMappingURL=indexLookup.d.ts.map