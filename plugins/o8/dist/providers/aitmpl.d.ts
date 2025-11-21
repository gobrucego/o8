/**
 * AITMPL Resource Provider
 *
 * Fetches community-contributed components from aitmpl.com (claude-code-templates)
 * and integrates them with the orchestr8 resource system.
 *
 * Data Source: GitHub raw content from davila7/claude-code-templates
 * - Primary: https://raw.githubusercontent.com/.../docs/components.json
 * - Fallback: GitHub API for individual resources
 *
 * @module providers/aitmpl
 */
import { Logger } from "../utils/logger.js";
import { ResourceProvider, RemoteResourceIndex, RemoteResource, SearchResponse, SearchOptions, ProviderHealth, ProviderStats } from "./types.js";
import { AitmplProviderConfig } from "../config/schema.js";
/**
 * AITMPLProvider - Fetches resources from aitmpl.com
 *
 * This provider integrates with the claude-code-templates repository,
 * providing access to 400+ community-contributed components including
 * agents, skills, commands, templates, and more.
 *
 * Features:
 * - HTTP-based fetching from GitHub raw content
 * - Aggressive caching (24h index, 7d resources)
 * - Rate limiting (configurable per minute/hour)
 * - Retry logic with exponential backoff
 * - Format conversion (AITMPL → orchestr8)
 * - Health monitoring and statistics
 *
 * @example
 * ```typescript
 * const provider = new AITMPLProvider(config, logger);
 * await provider.initialize();
 *
 * const index = await provider.fetchIndex();
 * const resource = await provider.fetchResource("rust-pro", "agent");
 * const results = await provider.search("typescript api");
 * ```
 */
export declare class AITMPLProvider implements ResourceProvider {
    readonly name = "aitmpl";
    enabled: boolean;
    readonly priority = 10;
    private config;
    private logger;
    private indexCache;
    private resourceCache;
    private minuteBucket;
    private hourBucket;
    private metrics;
    private statsResetAt;
    private consecutiveFailures;
    private lastSuccessfulRequest;
    private lastHealthCheck;
    constructor(config: AitmplProviderConfig, logger?: Logger);
    /**
     * Initialize the provider
     *
     * Validates configuration and performs initial health check.
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the provider
     *
     * Clears caches and resets state.
     */
    shutdown(): Promise<void>;
    /**
     * Fetch the complete index of available resources
     *
     * Retrieves the components.json file from GitHub and converts
     * all components to orchestr8 resource metadata format.
     *
     * Uses aggressive caching (24 hours by default).
     *
     * @returns Promise resolving to resource index
     * @throws {ProviderUnavailableError} If fetch fails
     */
    fetchIndex(): Promise<RemoteResourceIndex>;
    /**
     * Fetch a specific resource by ID and category
     *
     * @param id - Resource identifier (component name)
     * @param category - Resource category
     * @returns Promise resolving to complete resource with content
     * @throws {ResourceNotFoundError} If resource doesn't exist
     */
    fetchResource(id: string, category: string): Promise<RemoteResource>;
    /**
     * Search for resources matching query
     *
     * Implements fuzzy matching against component names, descriptions,
     * tags, and categories. Respects filters and options.
     *
     * @param query - Search query string
     * @param options - Search options and filters
     * @returns Promise resolving to search results
     */
    search(query: string, options?: SearchOptions): Promise<SearchResponse>;
    /**
     * Check provider health status
     *
     * Performs a lightweight check to verify:
     * - Can reach GitHub raw content endpoint
     * - Recent success rate is acceptable
     * - Rate limit not exhausted
     *
     * @returns Promise resolving to health status
     */
    healthCheck(): Promise<ProviderHealth>;
    /**
     * Get provider statistics
     *
     * @returns Current provider statistics
     */
    getStats(): ProviderStats;
    /**
     * Reset provider statistics
     */
    resetStats(): void;
    /**
     * Make HTTP request with rate limiting, retry logic, and error handling
     *
     * @param url - URL to fetch
     * @param options - Request options
     * @returns Promise resolving to response text
     * @throws {RateLimitError} If rate limit exceeded
     * @throws {ProviderTimeoutError} If request times out
     * @throws {ProviderError} For other errors
     */
    private httpFetch;
    /**
     * Check rate limit and consume token
     *
     * @throws {RateLimitError} If rate limit exceeded
     */
    private checkRateLimit;
    /**
     * Calculate exponential backoff delay
     *
     * @param attempt - Retry attempt number (0-indexed)
     * @returns Delay in milliseconds
     */
    private calculateBackoff;
    /**
     * Sleep for specified milliseconds
     *
     * @param ms - Milliseconds to sleep
     */
    private sleep;
    /**
     * Update average response time with new measurement
     *
     * @param responseTime - New response time in ms
     */
    private updateAvgResponseTime;
    /**
     * Fetch components.json from GitHub
     *
     * @returns Promise resolving to array of AITMPL components
     * @throws {ProviderError} If fetch or parse fails
     */
    private fetchComponentsJson;
    /**
     * Get components (from cache or fetch)
     *
     * @returns Promise resolving to array of components
     */
    private getComponents;
    /**
     * Build resource index from components
     *
     * @param components - Array of AITMPL components
     * @returns Resource index
     */
    private buildIndexFromComponents;
    /**
     * Convert AITMPL component to resource metadata
     *
     * @param component - AITMPL component
     * @returns Resource metadata
     */
    private convertToResourceMetadata;
    /**
     * Convert AITMPL component to full resource
     *
     * @param component - AITMPL component
     * @returns Complete resource with content
     */
    private convertToResource;
    /**
     * Convert AITMPL component to resource fragment (for search)
     *
     * @param component - AITMPL component
     * @returns Resource fragment
     */
    private convertToResourceFragment;
    /**
     * Parse YAML frontmatter from markdown content
     *
     * @param content - Markdown content with frontmatter
     * @returns Parsed frontmatter object
     */
    private parseFrontmatter;
    /**
     * Estimate token count from content
     *
     * Uses rough approximation: 1 token ≈ 4 characters
     *
     * @param content - Text content
     * @returns Estimated token count
     */
    private estimateTokens;
    /**
     * Extract keywords from search query
     *
     * @param query - Search query string
     * @returns Array of keywords
     */
    private extractKeywords;
    /**
     * Calculate relevance score for a component
     *
     * @param component - AITMPL component
     * @param resource - Converted resource fragment
     * @param keywords - Search keywords
     * @param options - Search options
     * @returns Relevance score (0-100)
     */
    private calculateRelevanceScore;
    /**
     * Get match reasons for search result
     *
     * @param component - AITMPL component
     * @param keywords - Search keywords
     * @returns Array of match reason strings
     */
    private getMatchReasons;
    /**
     * Calculate facets from search results
     *
     * @param results - Search results
     * @returns Facets object
     */
    private calculateFacets;
    /**
     * Check if cache entry is still valid
     *
     * @param entry - Cache entry to check
     * @returns True if valid, false if expired
     */
    private isCacheValid;
}
//# sourceMappingURL=aitmpl.d.ts.map