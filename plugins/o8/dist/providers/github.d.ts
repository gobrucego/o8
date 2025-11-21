/**
 * GitHubProvider - Fetch resources from GitHub repositories
 *
 * This provider enables fetching resources from arbitrary GitHub repositories,
 * supporting multi-repository configurations, optional authentication, aggressive
 * caching, and rate limit tracking.
 *
 * Features:
 * - Multi-repository support
 * - Optional GitHub authentication (personal/OAuth tokens)
 * - Auto-detect repository structure
 * - Aggressive caching with ETag support
 * - Rate limit tracking and protection
 * - Comprehensive error handling
 *
 * @module providers/github
 */
import { GithubProviderConfig } from "../config/schema.js";
import { Logger } from "../utils/logger.js";
import { ResourceProvider, RemoteResourceIndex, RemoteResource, SearchResponse, SearchOptions, ProviderHealth, ProviderStats } from "./types.js";
/**
 * GitHubProvider implementation
 *
 * Fetches resources from GitHub repositories with support for:
 * - Multiple repositories
 * - Optional authentication
 * - Automatic structure detection
 * - Aggressive caching
 * - Rate limit protection
 *
 * @example
 * ```typescript
 * const provider = new GitHubProvider({
 *   enabled: true,
 *   repos: ['davila7/claude-code-templates', 'awesome-claude/resources'],
 *   branch: 'main',
 *   auth: { token: 'ghp_xxx', type: 'personal' },
 *   cacheTTL: 3600000,
 *   timeout: 30000,
 *   retryAttempts: 3
 * }, logger);
 *
 * await provider.initialize();
 * const index = await provider.fetchIndex();
 * ```
 */
export declare class GitHubProvider implements ResourceProvider {
    readonly name = "github";
    enabled: boolean;
    readonly priority = 15;
    private config;
    private logger;
    private indexCache;
    private resourceCache;
    private treeCache;
    private rateLimit;
    private rateLimitCheckedAt;
    private stats;
    private requestTimes;
    private cacheStats;
    private repositories;
    private initialized;
    constructor(config: GithubProviderConfig, logger: Logger);
    /**
     * Initialize the provider
     *
     * Validates configuration, tests authentication if provided,
     * and performs initial rate limit check.
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
     * Scans all configured repositories in parallel and builds
     * a unified index of all resources found.
     *
     * @returns Promise resolving to resource index
     * @throws {ProviderError} If index fetch fails
     */
    fetchIndex(): Promise<RemoteResourceIndex>;
    /**
     * Fetch a specific resource by ID and category
     *
     * @param id - Unique resource identifier (format: owner/repo/path)
     * @param category - Resource category
     * @returns Promise resolving to complete resource with content
     * @throws {ResourceNotFoundError} If resource doesn't exist
     * @throws {ProviderError} If fetch fails
     */
    fetchResource(id: string, category: string): Promise<RemoteResource>;
    /**
     * Search for resources matching query
     *
     * Searches across all cached repository indexes.
     *
     * @param query - Search query string
     * @param options - Search options and filters
     * @returns Promise resolving to search results
     * @throws {ProviderError} If search fails
     */
    search(query: string, options?: SearchOptions): Promise<SearchResponse>;
    /**
     * Check provider health status
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
     * Scan a repository and build its index
     *
     * @param repoString - Repository string (format: owner/repo)
     * @returns Scan result with statistics
     */
    private scanRepository;
    /**
     * Fetch repository tree from GitHub API
     */
    private fetchRepositoryTree;
    /**
     * Detect repository structure type
     */
    private detectStructure;
    /**
     * Check if a file path is a resource file
     */
    private isResourceFile;
    /**
     * Infer category from file path
     */
    private inferCategory;
    /**
     * Fetch with retry logic
     */
    private fetchWithRetry;
    /**
     * Get headers for GitHub API requests
     */
    private getHeaders;
    /**
     * Update rate limit from API
     */
    private updateRateLimit;
    /**
     * Check rate limit from response headers
     */
    private checkRateLimit;
    /**
     * Check authentication status
     */
    private checkAuthentication;
    /**
     * Extract keywords from query
     */
    private extractKeywords;
    /**
     * Calculate relevance score for a resource
     */
    private calculateScore;
    /**
     * Get match reasons for a resource
     */
    private getMatchReasons;
    /**
     * Validate repository format (owner/repo)
     */
    private isValidRepoFormat;
    /**
     * Parse repository string into components
     */
    private parseRepository;
    /**
     * Build RemoteResource from cached data
     */
    private buildRemoteResource;
    /**
     * Record request metrics
     */
    private recordRequest;
    /**
     * Update cache hit rate
     */
    private updateCacheHitRate;
    /**
     * Wrap errors in ProviderError
     */
    private wrapError;
}
//# sourceMappingURL=github.d.ts.map