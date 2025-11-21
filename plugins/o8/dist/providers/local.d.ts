/**
 * LocalProvider - Filesystem-based resource provider
 *
 * Wraps existing ResourceLoader functionality to provide local filesystem resources
 * through the ResourceProvider interface. This is the highest priority provider
 * (priority = 0) and serves as the reference implementation for other providers.
 *
 * @module providers/local
 *
 * @example Basic Usage
 * ```typescript
 * import { LocalProvider } from "./providers/local.js";
 * import { Logger } from "./utils/logger.js";
 *
 * const logger = new Logger("LocalProvider");
 * const provider = new LocalProvider({ resourcesPath: "./resources" }, logger);
 *
 * await provider.initialize();
 *
 * // Fetch index of all resources
 * const index = await provider.fetchIndex();
 * console.log(`Found ${index.totalCount} resources`);
 *
 * // Search for resources
 * const results = await provider.search("typescript api", {
 *   categories: ["agent", "skill"],
 *   maxResults: 10,
 *   minScore: 50
 * });
 * ```
 *
 * @example Integration with Registry
 * ```typescript
 * import { ProviderRegistry } from "./providers/registry.js";
 * import { LocalProvider } from "./providers/local.js";
 *
 * const registry = new ProviderRegistry();
 * const localProvider = new LocalProvider(config, logger);
 *
 * await registry.register(localProvider);
 *
 * // Search across all providers (local will be queried first due to priority)
 * const results = await registry.searchAll("build api");
 * ```
 */
import { Logger } from "../utils/logger.js";
import { ResourceProvider, RemoteResource, RemoteResourceIndex, SearchResponse, SearchOptions, ProviderHealth, ProviderStats } from "./types.js";
/**
 * Configuration for LocalProvider
 */
export interface LocalProviderConfig {
    /**
     * Path to resources directory
     * @default process.env.RESOURCES_PATH || "./resources"
     */
    resourcesPath?: string;
    /**
     * Maximum number of resources to cache
     * @default 200
     */
    cacheSize?: number;
    /**
     * Cache TTL in milliseconds
     * @default 14400000 (4 hours)
     */
    cacheTTL?: number;
    /**
     * Index cache TTL in milliseconds
     * @default 86400000 (24 hours)
     */
    indexCacheTTL?: number;
    /**
     * Whether to enable caching
     * @default true
     */
    enableCache?: boolean;
}
/**
 * LocalProvider class
 *
 * Provides access to local filesystem resources through the ResourceProvider interface.
 * Wraps existing ResourceLoader functionality with:
 * - LRU caching for resources and indexes
 * - Performance metrics tracking
 * - Health monitoring
 * - Integration with FuzzyMatcher for intelligent search
 *
 * This is the highest priority provider (priority = 0) and should always be
 * registered first to ensure local resources are checked before remote providers.
 */
export declare class LocalProvider implements ResourceProvider {
    readonly name = "local";
    enabled: boolean;
    readonly priority = 0;
    private resourcesPath;
    private config;
    private logger;
    private fuzzyMatcher;
    private resourceCache;
    private indexCache;
    private resourceIndex;
    private indexLoadPromise;
    private metrics;
    /**
     * Create a new LocalProvider instance
     *
     * @param config - Provider configuration
     * @param logger - Logger instance for diagnostics
     *
     * @example
     * ```typescript
     * const provider = new LocalProvider(
     *   {
     *     resourcesPath: "./resources",
     *     cacheSize: 300,
     *     cacheTTL: 3600000 // 1 hour
     *   },
     *   logger
     * );
     * ```
     */
    constructor(config: LocalProviderConfig, logger: Logger);
    /**
     * Initialize the provider
     *
     * Validates that the resources directory exists and is accessible.
     * Optionally pre-loads the resource index for faster first queries.
     *
     * @throws {ProviderUnavailableError} If resources directory is not accessible
     *
     * @example
     * ```typescript
     * await provider.initialize();
     * console.log("Provider ready");
     * ```
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the provider
     *
     * Clears caches and performs cleanup.
     */
    shutdown(): Promise<void>;
    /**
     * Fetch the complete index of available resources
     *
     * Scans the filesystem for all resources and returns metadata without full content.
     * Results are cached for 24 hours by default.
     *
     * @returns Promise resolving to resource index
     * @throws {ProviderError} If index fetch fails
     *
     * @example
     * ```typescript
     * const index = await provider.fetchIndex();
     * console.log(`Total: ${index.totalCount} resources`);
     * console.log(`Categories: ${index.categories.join(", ")}`);
     * console.log(`Top tags: ${index.stats.topTags.map(t => t.tag).join(", ")}`);
     * ```
     */
    fetchIndex(): Promise<RemoteResourceIndex>;
    /**
     * Fetch a specific resource by ID and category
     *
     * Loads the full content of a resource from the filesystem.
     * Results are cached according to configured TTL.
     *
     * @param id - Resource identifier (e.g., "typescript-developer")
     * @param category - Resource category (e.g., "agent", "skill")
     * @returns Promise resolving to complete resource with content
     * @throws {ResourceNotFoundError} If resource doesn't exist
     * @throws {ProviderError} If fetch fails
     *
     * @example
     * ```typescript
     * const resource = await provider.fetchResource("typescript-developer", "agent");
     * console.log(resource.title);
     * console.log(resource.content);
     * console.log(`Tokens: ${resource.estimatedTokens}`);
     * ```
     */
    fetchResource(id: string, category: string): Promise<RemoteResource>;
    /**
     * Search for resources matching query
     *
     * Uses FuzzyMatcher to intelligently search across all resources based on:
     * - Query keywords
     * - Tags
     * - Capabilities
     * - Use-when scenarios
     * - Category filters
     *
     * @param query - Search query string
     * @param options - Search options and filters
     * @returns Promise resolving to search results
     * @throws {ProviderError} If search fails
     *
     * @example Basic Search
     * ```typescript
     * const results = await provider.search("build REST API");
     * for (const result of results.results) {
     *   console.log(`${result.resource.id} - Score: ${result.score}`);
     * }
     * ```
     *
     * @example Advanced Search with Filters
     * ```typescript
     * const results = await provider.search("authentication", {
     *   categories: ["agent", "skill"],
     *   requiredTags: ["security"],
     *   minScore: 50,
     *   maxResults: 10,
     *   maxTokens: 5000
     * });
     * ```
     */
    search(query: string, options?: SearchOptions): Promise<SearchResponse>;
    /**
     * Check provider health status
     *
     * Verifies that:
     * - Resources directory exists and is readable
     * - Cache is functioning properly
     * - No recent critical errors
     *
     * @returns Promise resolving to health status
     *
     * @example
     * ```typescript
     * const health = await provider.healthCheck();
     * console.log(`Status: ${health.status}`);
     * console.log(`Response time: ${health.responseTime}ms`);
     * console.log(`Reachable: ${health.reachable}`);
     * ```
     */
    healthCheck(): Promise<ProviderHealth>;
    /**
     * Get provider statistics
     *
     * Returns comprehensive statistics about provider usage and performance.
     *
     * @returns Current provider statistics
     *
     * @example
     * ```typescript
     * const stats = provider.getStats();
     * console.log(`Total requests: ${stats.totalRequests}`);
     * console.log(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
     * console.log(`Avg response time: ${stats.avgResponseTime.toFixed(0)}ms`);
     * ```
     */
    getStats(): ProviderStats;
    /**
     * Reset provider statistics
     *
     * Clears all accumulated statistics. Useful for testing or periodic resets.
     *
     * @example
     * ```typescript
     * provider.resetStats();
     * console.log("Statistics reset");
     * ```
     */
    resetStats(): void;
    /**
     * Load and cache resource index
     * @private
     */
    private loadResourceIndex;
    /**
     * Internal implementation of resource index loading
     * Scans all category directories in parallel
     * @private
     */
    private loadResourceIndexImpl;
    /**
     * Recursively scan directory for fragment files
     * @private
     */
    private scanFragmentsDirectory;
    /**
     * Parse a markdown file into a ResourceFragment
     * @private
     */
    private parseResourceFragment;
    /**
     * Convert ResourceFragment to RemoteResourceMetadata
     * @private
     */
    private fragmentToMetadata;
    /**
     * Map category to directory name (pluralization)
     * @private
     */
    private categoryToDirectory;
    /**
     * Generate match reason explanation
     * @private
     */
    private generateMatchReason;
    /**
     * Sort search results
     * @private
     */
    private sortResults;
    /**
     * Calculate facets from search results
     * @private
     */
    private calculateFacets;
    /**
     * Track response time
     * @private
     */
    private trackResponseTime;
    /**
     * Track error
     * @private
     */
    private trackError;
    /**
     * Calculate average response time
     * @private
     */
    private calculateAvgResponseTime;
}
//# sourceMappingURL=local.d.ts.map