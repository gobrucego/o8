import { Logger } from "../utils/logger.js";
import { ResourceMetadata } from "../types.js";
import { ResourceFragment } from "../utils/fuzzyMatcher.js";
import type { SearchOptions, SearchResult, ProviderHealth, ProviderStats } from "../providers/types.js";
import { TokenTracker } from "../token/tracker.js";
import { TokenStore } from "../token/store.js";
export declare class ResourceLoader {
    private logger;
    private resourcesPath;
    private cache;
    private uriParser;
    private fuzzyMatcher;
    private indexLookup;
    private resourceIndex;
    private indexLoadPromise;
    private registry;
    private providerConfigManager;
    private tokenTracker;
    private tokenStore;
    constructor(logger: Logger, tokenTracker?: TokenTracker, tokenStore?: TokenStore);
    /**
     * Load all resources from filesystem
     */
    loadAllResources(): Promise<ResourceMetadata[]>;
    /**
     * Initialize resource providers
     *
     * Loads provider configuration and initializes all enabled providers:
     * - LocalProvider (always enabled, priority 0)
     * - AITMPLProvider (if enabled in config)
     * - GitHubProvider (if enabled in config)
     *
     * Should be called after basic ResourceLoader initialization.
     */
    initializeProviders(): Promise<void>;
    /**
     * Recursively scan directory for resources
     */
    private scanDirectory;
    /**
     * Load resource index from all markdown files in resources directory.
     * Scans recursively, parses frontmatter metadata, and builds ResourceFragment objects.
     * Results are cached for performance.
     *
     * @returns Promise resolving to array of ResourceFragment objects
     */
    loadResourceIndex(): Promise<ResourceFragment[]>;
    /**
     * Internal implementation of resource index loading
     * OPTIMIZED: Parallel directory scanning for faster initial load
     * @private
     */
    private _loadResourceIndexImpl;
    /**
     * Recursively scan directory and extract resource fragments
     * @private
     */
    private _scanForFragments;
    /**
     * Parse a markdown file into a ResourceFragment
     * @private
     */
    private _parseResourceFragment;
    /**
     * Extract tags from frontmatter or content
     * @private
     */
    private _extractTags;
    /**
     * Extract capabilities from frontmatter or content
     * @private
     */
    private _extractCapabilities;
    /**
     * Extract use-when scenarios from frontmatter or content
     * @private
     */
    private _extractUseWhen;
    /**
     * Map category string to ResourceFragment category type
     * @private
     */
    private _mapCategory;
    /**
     * Load resource content.
     * Supports both static URIs (direct file load) and dynamic URIs (fuzzy matching).
     *
     * @param uri - Resource URI (static or dynamic)
     * @returns Promise resolving to resource content
     *
     * @example Static URI
     * loadResourceContent("o8://agents/typescript-developer")
     *
     * @example Dynamic URI
     * loadResourceContent("o8://agents/match?query=build+api&maxTokens=2000")
     */
    loadResourceContent(uri: string): Promise<string>;
    /**
     * Load static resource (direct file access or remote provider)
     * @private
     */
    private _loadStaticResource;
    /**
     * Load dynamic resource (index lookup or fuzzy matching)
     * @private
     */
    private _loadDynamicResource;
    /**
     * Convert URI to filesystem path
     */
    private uriToFilePath;
    /**
     * Get resources by category for HTTP API
     */
    getResourcesByCategory(category: string): Promise<any[]>;
    /**
     * Search resources by query for HTTP API
     */
    searchResources(query: string): Promise<any[]>;
    /**
     * Search across all enabled resource providers
     *
     * Queries all registered providers in parallel and returns merged results
     * sorted by relevance score.
     *
     * @param query - Search query string
     * @param options - Search options (categories, tags, limits, etc.)
     * @returns Promise resolving to array of search results
     *
     * @example
     * ```typescript
     * const results = await loader.searchAllProviders('typescript api', {
     *   categories: ['agent', 'skill'],
     *   maxResults: 20,
     *   minScore: 50
     * });
     * ```
     */
    searchAllProviders(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    /**
     * Search in a specific provider
     *
     * @param providerName - Name of provider to search ('local', 'aitmpl', 'github')
     * @param query - Search query string
     * @param options - Search options
     * @returns Promise resolving to array of search results
     */
    searchProvider(providerName: string, query: string, options?: SearchOptions): Promise<SearchResult[]>;
    /**
     * Get health status for all providers
     *
     * Checks health of all registered providers and returns their status.
     * Useful for monitoring and diagnostics.
     *
     * @returns Promise resolving to map of provider names to health status
     *
     * @example
     * ```typescript
     * const health = await loader.getProvidersHealth();
     * for (const [name, status] of Object.entries(health)) {
     *   console.log(`${name}: ${status.status} (${status.responseTime}ms)`);
     * }
     * ```
     */
    getProvidersHealth(): Promise<Record<string, ProviderHealth>>;
    /**
     * Get statistics for all providers
     *
     * Returns aggregate statistics including request counts, cache hit rates,
     * average response times, and rate limit status.
     *
     * @returns Object containing statistics for each provider
     *
     * @example
     * ```typescript
     * const stats = loader.getProvidersStats();
     * for (const [name, stat] of Object.entries(stats)) {
     *   console.log(`${name}: ${stat.totalRequests} requests, ${stat.cacheHitRate}% cache hit rate`);
     * }
     * ```
     */
    getProvidersStats(): Record<string, ProviderStats>;
    /**
     * Get aggregate statistics across all providers
     *
     * Returns registry-wide statistics including total providers, enabled providers,
     * healthy providers, and aggregate metrics.
     *
     * @returns Registry statistics object
     */
    getAggregateProviderStats(): import("../providers/types.js").RegistryStats;
    /**
     * Get list of all registered providers
     *
     * @param enabledOnly - If true, only return enabled providers
     * @returns Array of provider names
     */
    getProviderNames(enabledOnly?: boolean): string[];
    /**
     * Get cached resource content
     */
    getCachedResource(uri: string): string | undefined;
    /**
     * Get detailed information about all providers
     *
     * @returns Array of provider details including health and stats
     */
    getProviders(): Promise<any[]>;
    /**
     * Get index from a specific provider
     *
     * @param name - Provider name
     * @returns Provider's resource index
     */
    getProviderIndex(name: string): Promise<any>;
    /**
     * Get health status for a specific provider
     *
     * @param name - Provider name
     * @returns Provider health status
     */
    getProviderHealth(name: string): Promise<any>;
    /**
     * Get statistics for a specific provider
     *
     * @param name - Provider name
     * @returns Provider statistics
     */
    getProviderStats(name: string): any;
    /**
     * Enable a provider
     *
     * @param name - Provider name
     */
    enableProvider(name: string): Promise<void>;
    /**
     * Disable a provider
     *
     * @param name - Provider name
     */
    disableProvider(name: string): Promise<void>;
    /**
     * Ensure resource index is loaded (for HTTP API)
     */
    private ensureIndexLoaded;
}
//# sourceMappingURL=resourceLoader.d.ts.map