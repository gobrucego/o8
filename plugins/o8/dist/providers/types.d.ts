/**
 * Core types and interfaces for the ResourceProvider system
 *
 * This module defines the contract for remote resource providers, enabling
 * extensible integration with external resource repositories like AITMPL,
 * GitHub, and custom backends.
 *
 * @module providers/types
 */
import { ResourceFragment } from "../utils/fuzzyMatcher.js";
/**
 * Configuration for a resource provider
 */
export interface ProviderConfig {
    /** Unique identifier for the provider */
    name: string;
    /** Whether this provider is enabled on initialization */
    enabled?: boolean;
    /** Priority for provider ordering (lower = higher priority, local = 0, remote = 10+) */
    priority?: number;
    /** Base URL for HTTP-based providers */
    baseUrl?: string;
    /** Authentication token or API key */
    apiKey?: string;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Maximum number of retries for failed requests */
    maxRetries?: number;
    /** Enable request caching */
    enableCache?: boolean;
    /** Cache TTL in milliseconds */
    cacheTTL?: number;
    /** Rate limit: maximum requests per minute */
    rateLimit?: number;
    /** Custom headers for HTTP requests */
    headers?: Record<string, string>;
    /** Additional provider-specific configuration */
    custom?: Record<string, any>;
}
/**
 * Metadata about a remote resource without full content
 */
export interface RemoteResourceMetadata {
    /** Unique identifier for the resource */
    id: string;
    /** Resource category */
    category: "agent" | "skill" | "example" | "pattern" | "workflow";
    /** Resource title */
    title: string;
    /** Brief description */
    description: string;
    /** Tags for categorization and search */
    tags: string[];
    /** Capabilities this resource provides */
    capabilities: string[];
    /** Use cases when this resource is relevant */
    useWhen: string[];
    /** Estimated token count */
    estimatedTokens: number;
    /** Version or revision identifier */
    version?: string;
    /** Author or contributor information */
    author?: string;
    /** Creation timestamp */
    createdAt?: Date;
    /** Last update timestamp */
    updatedAt?: Date;
    /** Provider source name */
    source: string;
    /** Original URI at the provider */
    sourceUri: string;
}
/**
 * Complete resource with full content
 */
export interface RemoteResource extends RemoteResourceMetadata {
    /** Full resource content */
    content: string;
    /** Dependencies on other resources */
    dependencies?: string[];
    /** Related resources */
    related?: string[];
}
/**
 * Index of available resources from a provider
 */
export interface RemoteResourceIndex {
    /** Provider name */
    provider: string;
    /** Total number of resources available */
    totalCount: number;
    /** Resource metadata entries */
    resources: RemoteResourceMetadata[];
    /** Index version for cache invalidation */
    version: string;
    /** Timestamp of index generation */
    timestamp: Date;
    /** Categories available in this index */
    categories: Array<"agent" | "skill" | "example" | "pattern" | "workflow">;
    /** Statistics about the index */
    stats: {
        /** Total resources by category */
        byCategory: Record<string, number>;
        /** Total estimated tokens */
        totalTokens: number;
        /** Most common tags */
        topTags: Array<{
            tag: string;
            count: number;
        }>;
    };
}
/**
 * Search options for querying resources
 */
export interface SearchOptions {
    /** Search query string (optional for filter-only searches) */
    query?: string;
    /** Filter by categories */
    categories?: Array<"agent" | "skill" | "example" | "pattern" | "workflow">;
    /** Required tags (all must be present) */
    requiredTags?: string[];
    /** Optional tags (any can be present) */
    optionalTags?: string[];
    /** Maximum number of results */
    maxResults?: number;
    /** Minimum relevance score (0-100) */
    minScore?: number;
    /** Maximum token budget for results */
    maxTokens?: number;
    /** Sort order */
    sortBy?: "relevance" | "date" | "tokens" | "popularity";
    /** Sort direction */
    sortOrder?: "asc" | "desc";
    /** Pagination offset */
    offset?: number;
    /** Results per page */
    limit?: number;
}
/**
 * Search result with scoring
 */
export interface SearchResult {
    /** Matched resource fragment */
    resource: ResourceFragment;
    /** Relevance score (0-100) */
    score: number;
    /** Explanation of why this matched */
    matchReason?: string[];
    /** Highlighted snippets from content */
    highlights?: string[];
}
/**
 * Search response with metadata
 */
export interface SearchResponse {
    /** Search results */
    results: SearchResult[];
    /** Total number of matches (before pagination) */
    totalMatches: number;
    /** Query that was executed */
    query: string;
    /** Time taken for search (ms) */
    searchTime: number;
    /** Facets for refining search */
    facets?: {
        categories?: Record<string, number>;
        tags?: Record<string, number>;
    };
}
/**
 * Provider health status
 */
export interface ProviderHealth {
    /** Provider name */
    provider: string;
    /** Overall health status */
    status: "healthy" | "degraded" | "unhealthy" | "unknown";
    /** Timestamp of last health check */
    lastCheck: Date;
    /** Response time in milliseconds */
    responseTime?: number;
    /** Is the provider reachable? */
    reachable: boolean;
    /** Is authentication valid? */
    authenticated: boolean;
    /** Current error if unhealthy */
    error?: string;
    /** Additional health metrics */
    metrics?: {
        /** Success rate (0-1) */
        successRate?: number;
        /** Average response time (ms) */
        avgResponseTime?: number;
        /** Number of consecutive failures */
        consecutiveFailures?: number;
        /** Last successful request timestamp */
        lastSuccess?: Date;
    };
}
/**
 * Provider usage statistics
 */
export interface ProviderStats {
    /** Provider name */
    provider: string;
    /** Total requests made */
    totalRequests: number;
    /** Successful requests */
    successfulRequests: number;
    /** Failed requests */
    failedRequests: number;
    /** Cached requests */
    cachedRequests: number;
    /** Total resources fetched */
    resourcesFetched: number;
    /** Total tokens fetched */
    tokensFetched: number;
    /** Average response time (ms) */
    avgResponseTime: number;
    /** Cache hit rate (0-1) */
    cacheHitRate: number;
    /** Uptime percentage (0-1) */
    uptime: number;
    /** Rate limit status */
    rateLimit?: {
        /** Remaining requests */
        remaining: number;
        /** Total allowed per period */
        limit: number;
        /** Reset time */
        resetAt: Date;
    };
    /** Last reset timestamp */
    statsResetAt: Date;
}
/**
 * Base error for provider operations
 */
export declare class ProviderError extends Error {
    provider: string;
    code?: string | undefined;
    statusCode?: number | undefined;
    cause?: Error | undefined;
    constructor(message: string, provider: string, code?: string | undefined, statusCode?: number | undefined, cause?: Error | undefined);
}
/**
 * Error when provider request times out
 */
export declare class ProviderTimeoutError extends ProviderError {
    constructor(provider: string, timeout: number, cause?: Error);
}
/**
 * Error when provider is unavailable or unreachable
 */
export declare class ProviderUnavailableError extends ProviderError {
    constructor(provider: string, reason?: string, cause?: Error);
}
/**
 * Error when requested resource is not found
 */
export declare class ResourceNotFoundError extends ProviderError {
    constructor(provider: string, resourceId: string, category?: string, cause?: Error);
    resourceId: string;
    category?: string;
}
/**
 * Error when authentication fails
 */
export declare class ProviderAuthenticationError extends ProviderError {
    constructor(provider: string, reason?: string, cause?: Error);
}
/**
 * Error when rate limit is exceeded
 */
export declare class RateLimitError extends ProviderError {
    constructor(provider: string, retryAfter?: number, cause?: Error);
    retryAfter?: number;
}
/**
 * ResourceProvider interface - contract for all resource providers
 *
 * Providers implement this interface to integrate with the resource system.
 * They can fetch resources from remote repositories, search across content,
 * and provide health monitoring.
 *
 * @example
 * ```typescript
 * class GitHubProvider implements ResourceProvider {
 *   name = "github";
 *   enabled = true;
 *   priority = 10;
 *
 *   async initialize() {
 *     // Connect to GitHub API
 *   }
 *
 *   async fetchResource(id: string, category: string) {
 *     // Fetch from GitHub repository
 *   }
 *
 *   // ... implement other methods
 * }
 * ```
 */
export interface ResourceProvider {
    /** Unique provider name */
    readonly name: string;
    /** Whether this provider is currently enabled */
    enabled: boolean;
    /** Priority for provider ordering (lower = higher priority) */
    readonly priority: number;
    /**
     * Initialize the provider
     * Called once when the provider is registered
     * Use this to establish connections, load configurations, etc.
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the provider
     * Called when the provider is being removed or application is shutting down
     * Use this to cleanup resources, close connections, etc.
     */
    shutdown(): Promise<void>;
    /**
     * Fetch the complete index of available resources
     * This should return metadata for all resources without full content
     *
     * @returns Promise resolving to resource index
     * @throws {ProviderError} If index fetch fails
     */
    fetchIndex(): Promise<RemoteResourceIndex>;
    /**
     * Fetch a specific resource by ID and category
     *
     * @param id - Unique resource identifier
     * @param category - Resource category
     * @returns Promise resolving to complete resource with content
     * @throws {ResourceNotFoundError} If resource doesn't exist
     * @throws {ProviderError} If fetch fails
     */
    fetchResource(id: string, category: string): Promise<RemoteResource>;
    /**
     * Search for resources matching query
     *
     * @param query - Search query string
     * @param options - Search options and filters
     * @returns Promise resolving to search results
     * @throws {ProviderError} If search fails
     */
    search(query: string, options?: SearchOptions): Promise<SearchResponse>;
    /**
     * Check provider health status
     * Should be fast and lightweight
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
     * Useful for testing or periodic resets
     */
    resetStats(): void;
}
/**
 * Event emitted when provider state changes
 */
export interface ProviderEvent {
    /** Event type */
    type: "provider-registered" | "provider-unregistered" | "provider-enabled" | "provider-disabled" | "provider-error" | "provider-health-changed";
    /** Provider name */
    provider: string;
    /** Event timestamp */
    timestamp: Date;
    /** Additional event data */
    data?: any;
}
/**
 * Registry configuration
 */
export interface RegistryConfig {
    /** Enable automatic health monitoring */
    enableHealthChecks?: boolean;
    /** Health check interval in milliseconds */
    healthCheckInterval?: number;
    /** Auto-disable unhealthy providers */
    autoDisableUnhealthy?: boolean;
    /** Maximum consecutive failures before auto-disable */
    maxConsecutiveFailures?: number;
    /** Enable event emission */
    enableEvents?: boolean;
}
/**
 * Registry statistics
 */
export interface RegistryStats {
    /** Total number of registered providers */
    totalProviders: number;
    /** Number of enabled providers */
    enabledProviders: number;
    /** Number of healthy providers */
    healthyProviders: number;
    /** Aggregate statistics */
    aggregate: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        totalResourcesFetched: number;
        totalTokensFetched: number;
        avgResponseTime: number;
    };
}
//# sourceMappingURL=types.d.ts.map