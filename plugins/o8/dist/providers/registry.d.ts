/**
 * Provider Registry - manages multiple resource providers
 *
 * Handles registration, priority ordering, health monitoring, and
 * aggregated statistics across all providers.
 *
 * @module providers/registry
 */
import { EventEmitter } from "events";
import { ResourceProvider, RegistryConfig, RegistryStats, ProviderHealth, ProviderStats, RemoteResourceIndex, RemoteResource, SearchResponse, SearchOptions } from "./types.js";
/**
 * Provider Registry
 *
 * Central manager for all resource providers. Handles:
 * - Provider registration and lifecycle
 * - Priority-based ordering
 * - Health monitoring
 * - Aggregate statistics
 * - Event emission
 *
 * @example
 * ```typescript
 * const registry = new ProviderRegistry();
 *
 * // Register providers
 * await registry.register(localProvider);
 * await registry.register(githubProvider);
 *
 * // Search across all providers
 * const results = await registry.searchAll("typescript api");
 *
 * // Get aggregate stats
 * const stats = registry.getAggregateStats();
 * ```
 */
export declare class ProviderRegistry extends EventEmitter {
    private providers;
    private config;
    private healthCheckTimer?;
    private consecutiveFailures;
    constructor(config?: RegistryConfig);
    /**
     * Register a new provider
     *
     * @param provider - Provider instance to register
     * @throws {Error} If provider with same name already exists
     *
     * @example
     * ```typescript
     * const provider = new GitHubProvider({ name: "github", ... });
     * await registry.register(provider);
     * ```
     */
    register(provider: ResourceProvider): Promise<void>;
    /**
     * Unregister a provider
     *
     * @param name - Provider name to unregister
     * @returns True if provider was unregistered, false if not found
     *
     * @example
     * ```typescript
     * await registry.unregister("github");
     * ```
     */
    unregister(name: string): Promise<boolean>;
    /**
     * Get a registered provider by name
     *
     * @param name - Provider name
     * @returns Provider instance or undefined if not found
     */
    getProvider(name: string): ResourceProvider | undefined;
    /**
     * Get all registered providers
     *
     * @param enabledOnly - Only return enabled providers
     * @returns Array of providers sorted by priority
     */
    getProviders(enabledOnly?: boolean): ResourceProvider[];
    /**
     * Enable a provider
     *
     * @param name - Provider name
     * @returns True if provider was enabled, false if not found
     */
    enable(name: string): boolean;
    /**
     * Disable a provider
     *
     * @param name - Provider name
     * @returns True if provider was disabled, false if not found
     */
    disable(name: string): boolean;
    /**
     * Fetch index from a specific provider
     *
     * @param providerName - Provider to fetch from
     * @returns Resource index
     * @throws {ProviderUnavailableError} If provider not found or disabled
     */
    fetchIndex(providerName: string): Promise<RemoteResourceIndex>;
    /**
     * Fetch resource from a specific provider
     *
     * @param providerName - Provider to fetch from
     * @param id - Resource ID
     * @param category - Resource category
     * @returns Complete resource
     * @throws {ProviderUnavailableError} If provider not found or disabled
     */
    fetchResource(providerName: string, id: string, category: string): Promise<RemoteResource>;
    /**
     * Search in a specific provider
     *
     * @param providerName - Provider to search in
     * @param query - Search query
     * @param options - Search options
     * @returns Search results
     * @throws {ProviderUnavailableError} If provider not found or disabled
     */
    search(providerName: string, query: string, options?: SearchOptions): Promise<SearchResponse>;
    /**
     * Fetch indexes from all enabled providers
     *
     * @returns Array of indexes from all providers
     */
    fetchAllIndexes(): Promise<RemoteResourceIndex[]>;
    /**
     * Search across all enabled providers
     *
     * Queries all providers in parallel and merges results by relevance score.
     *
     * @param query - Search query
     * @param options - Search options
     * @returns Merged search results from all providers
     */
    searchAll(query: string, options?: SearchOptions): Promise<SearchResponse>;
    /**
     * Try to fetch a resource from providers in priority order
     *
     * Attempts to fetch from each enabled provider until successful.
     *
     * @param id - Resource ID
     * @param category - Resource category
     * @returns First successfully fetched resource
     * @throws {ProviderError} If all providers fail
     */
    fetchResourceAny(id: string, category: string): Promise<RemoteResource>;
    /**
     * Check health of a specific provider
     *
     * @param name - Provider name
     * @returns Health status
     * @throws {ProviderUnavailableError} If provider not found
     */
    checkHealth(name: string): Promise<ProviderHealth>;
    /**
     * Check health of all providers
     *
     * @returns Map of provider names to health status
     */
    checkAllHealth(): Promise<Map<string, ProviderHealth>>;
    /**
     * Get statistics for a specific provider
     *
     * @param name - Provider name
     * @returns Provider statistics
     * @throws {ProviderUnavailableError} If provider not found
     */
    getProviderStats(name: string): ProviderStats;
    /**
     * Get aggregate statistics across all providers
     *
     * @returns Registry-wide statistics
     */
    getAggregateStats(): RegistryStats;
    /**
     * Get an enabled provider or throw
     * @private
     */
    private getEnabledProvider;
    /**
     * Execute a provider operation with error handling
     * @private
     */
    private executeWithErrorHandling;
    /**
     * Calculate facets from search results
     * @private
     */
    private calculateFacets;
    /**
     * Emit a provider event
     * @private
     */
    private emitEvent;
    /**
     * Start periodic health checks
     * @private
     */
    private startHealthChecks;
    /**
     * Stop periodic health checks
     * @private
     */
    private stopHealthChecks;
    /**
     * Shutdown the registry and all providers
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=registry.d.ts.map