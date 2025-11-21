/**
 * Provider Registry - manages multiple resource providers
 *
 * Handles registration, priority ordering, health monitoring, and
 * aggregated statistics across all providers.
 *
 * @module providers/registry
 */
import { EventEmitter } from "events";
import { ProviderError, ProviderUnavailableError, } from "./types.js";
/**
 * Default registry configuration
 */
const DEFAULT_CONFIG = {
    enableHealthChecks: true,
    healthCheckInterval: 60000, // 1 minute
    autoDisableUnhealthy: true,
    maxConsecutiveFailures: 3,
    enableEvents: true,
};
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
export class ProviderRegistry extends EventEmitter {
    providers = new Map();
    config;
    healthCheckTimer;
    consecutiveFailures = new Map();
    constructor(config) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    // ========================================
    // Provider Registration
    // ========================================
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
    async register(provider) {
        if (this.providers.has(provider.name)) {
            throw new Error(`Provider ${provider.name} is already registered`);
        }
        // Initialize the provider
        await provider.initialize();
        // Register it
        this.providers.set(provider.name, provider);
        this.consecutiveFailures.set(provider.name, 0);
        // Emit event
        this.emitEvent({
            type: "provider-registered",
            provider: provider.name,
            timestamp: new Date(),
            data: { enabled: provider.enabled, priority: provider.priority },
        });
        // Start health checks if this is the first provider
        if (this.providers.size === 1 && this.config.enableHealthChecks) {
            this.startHealthChecks();
        }
    }
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
    async unregister(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            return false;
        }
        // Shutdown the provider
        await provider.shutdown();
        // Remove it
        this.providers.delete(name);
        this.consecutiveFailures.delete(name);
        // Emit event
        this.emitEvent({
            type: "provider-unregistered",
            provider: name,
            timestamp: new Date(),
        });
        // Stop health checks if no providers left
        if (this.providers.size === 0) {
            this.stopHealthChecks();
        }
        return true;
    }
    /**
     * Get a registered provider by name
     *
     * @param name - Provider name
     * @returns Provider instance or undefined if not found
     */
    getProvider(name) {
        return this.providers.get(name);
    }
    /**
     * Get all registered providers
     *
     * @param enabledOnly - Only return enabled providers
     * @returns Array of providers sorted by priority
     */
    getProviders(enabledOnly = false) {
        const providers = Array.from(this.providers.values());
        const filtered = enabledOnly
            ? providers.filter((p) => p.enabled)
            : providers;
        // Sort by priority (lower = higher priority)
        return filtered.sort((a, b) => a.priority - b.priority);
    }
    /**
     * Enable a provider
     *
     * @param name - Provider name
     * @returns True if provider was enabled, false if not found
     */
    enable(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            return false;
        }
        provider.enabled = true;
        this.emitEvent({
            type: "provider-enabled",
            provider: name,
            timestamp: new Date(),
        });
        return true;
    }
    /**
     * Disable a provider
     *
     * @param name - Provider name
     * @returns True if provider was disabled, false if not found
     */
    disable(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            return false;
        }
        provider.enabled = false;
        this.emitEvent({
            type: "provider-disabled",
            provider: name,
            timestamp: new Date(),
        });
        return true;
    }
    // ========================================
    // Resource Operations (Single Provider)
    // ========================================
    /**
     * Fetch index from a specific provider
     *
     * @param providerName - Provider to fetch from
     * @returns Resource index
     * @throws {ProviderUnavailableError} If provider not found or disabled
     */
    async fetchIndex(providerName) {
        const provider = this.getEnabledProvider(providerName);
        return this.executeWithErrorHandling(provider, () => provider.fetchIndex(), "fetchIndex");
    }
    /**
     * Fetch resource from a specific provider
     *
     * @param providerName - Provider to fetch from
     * @param id - Resource ID
     * @param category - Resource category
     * @returns Complete resource
     * @throws {ProviderUnavailableError} If provider not found or disabled
     */
    async fetchResource(providerName, id, category) {
        const provider = this.getEnabledProvider(providerName);
        return this.executeWithErrorHandling(provider, () => provider.fetchResource(id, category), "fetchResource");
    }
    /**
     * Search in a specific provider
     *
     * @param providerName - Provider to search in
     * @param query - Search query
     * @param options - Search options
     * @returns Search results
     * @throws {ProviderUnavailableError} If provider not found or disabled
     */
    async search(providerName, query, options) {
        const provider = this.getEnabledProvider(providerName);
        return this.executeWithErrorHandling(provider, () => provider.search(query, options), "search");
    }
    // ========================================
    // Resource Operations (All Providers)
    // ========================================
    /**
     * Fetch indexes from all enabled providers
     *
     * @returns Array of indexes from all providers
     */
    async fetchAllIndexes() {
        const providers = this.getProviders(true);
        const results = await Promise.allSettled(providers.map((p) => this.executeWithErrorHandling(p, () => p.fetchIndex(), "fetchIndex")));
        return results
            .filter((r) => r.status === "fulfilled")
            .map((r) => r.value);
    }
    /**
     * Search across all enabled providers
     *
     * Queries all providers in parallel and merges results by relevance score.
     *
     * @param query - Search query
     * @param options - Search options
     * @returns Merged search results from all providers
     */
    async searchAll(query, options) {
        const providers = this.getProviders(true);
        const startTime = Date.now();
        // Search all providers in parallel
        const results = await Promise.allSettled(providers.map((p) => this.executeWithErrorHandling(p, () => p.search(query, options), "search")));
        // Merge successful results
        const allResults = results
            .filter((r) => r.status === "fulfilled")
            .flatMap((r) => r.value.results);
        // Sort by relevance score
        allResults.sort((a, b) => b.score - a.score);
        // Apply limits
        const maxResults = options?.maxResults || allResults.length;
        const limitedResults = allResults.slice(0, maxResults);
        // Calculate aggregate facets
        const facets = this.calculateFacets(allResults);
        return {
            results: limitedResults,
            totalMatches: allResults.length,
            query,
            searchTime: Date.now() - startTime,
            facets,
        };
    }
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
    async fetchResourceAny(id, category) {
        const providers = this.getProviders(true);
        if (providers.length === 0) {
            throw new ProviderUnavailableError("registry", "No enabled providers");
        }
        const errors = [];
        // Try each provider in priority order
        for (const provider of providers) {
            try {
                return await this.executeWithErrorHandling(provider, () => provider.fetchResource(id, category), "fetchResource");
            }
            catch (error) {
                errors.push(error);
                // Continue to next provider
            }
        }
        // All providers failed
        throw new ProviderError(`Failed to fetch resource ${id} from any provider: ${errors.map((e) => e.message).join("; ")}`, "registry", "ALL_FAILED");
    }
    // ========================================
    // Health & Monitoring
    // ========================================
    /**
     * Check health of a specific provider
     *
     * @param name - Provider name
     * @returns Health status
     * @throws {ProviderUnavailableError} If provider not found
     */
    async checkHealth(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            throw new ProviderUnavailableError("registry", `Provider ${name} not found`);
        }
        try {
            const health = await provider.healthCheck();
            // Update failure counter
            if (health.status === "healthy") {
                this.consecutiveFailures.set(name, 0);
            }
            else if (health.status === "unhealthy") {
                const failures = (this.consecutiveFailures.get(name) || 0) + 1;
                this.consecutiveFailures.set(name, failures);
                // Auto-disable if configured
                if (this.config.autoDisableUnhealthy &&
                    failures >= this.config.maxConsecutiveFailures) {
                    this.disable(name);
                    this.emitEvent({
                        type: "provider-disabled",
                        provider: name,
                        timestamp: new Date(),
                        data: { reason: "auto-disabled", consecutiveFailures: failures },
                    });
                }
            }
            return health;
        }
        catch (error) {
            const failures = (this.consecutiveFailures.get(name) || 0) + 1;
            this.consecutiveFailures.set(name, failures);
            throw error;
        }
    }
    /**
     * Check health of all providers
     *
     * @returns Map of provider names to health status
     */
    async checkAllHealth() {
        const providers = Array.from(this.providers.values());
        const results = await Promise.allSettled(providers.map((p) => this.checkHealth(p.name)));
        const healthMap = new Map();
        providers.forEach((provider, index) => {
            const result = results[index];
            if (result.status === "fulfilled") {
                healthMap.set(provider.name, result.value);
            }
            else {
                healthMap.set(provider.name, {
                    provider: provider.name,
                    status: "unhealthy",
                    lastCheck: new Date(),
                    reachable: false,
                    authenticated: false,
                    error: result.reason?.message || "Health check failed",
                });
            }
        });
        return healthMap;
    }
    /**
     * Get statistics for a specific provider
     *
     * @param name - Provider name
     * @returns Provider statistics
     * @throws {ProviderUnavailableError} If provider not found
     */
    getProviderStats(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            throw new ProviderUnavailableError("registry", `Provider ${name} not found`);
        }
        return provider.getStats();
    }
    /**
     * Get aggregate statistics across all providers
     *
     * @returns Registry-wide statistics
     */
    getAggregateStats() {
        const providers = Array.from(this.providers.values());
        const enabledProviders = providers.filter((p) => p.enabled);
        // Count healthy providers
        let healthyProviders = 0;
        for (const provider of providers) {
            const failures = this.consecutiveFailures.get(provider.name) || 0;
            if (failures === 0 && provider.enabled) {
                healthyProviders++;
            }
        }
        // Aggregate statistics
        const aggregate = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalResourcesFetched: 0,
            totalTokensFetched: 0,
            avgResponseTime: 0,
        };
        let totalResponseTime = 0;
        let providersWithStats = 0;
        for (const provider of providers) {
            const stats = provider.getStats();
            aggregate.totalRequests += stats.totalRequests;
            aggregate.successfulRequests += stats.successfulRequests;
            aggregate.failedRequests += stats.failedRequests;
            aggregate.totalResourcesFetched += stats.resourcesFetched;
            aggregate.totalTokensFetched += stats.tokensFetched;
            if (stats.totalRequests > 0) {
                totalResponseTime += stats.avgResponseTime;
                providersWithStats++;
            }
        }
        aggregate.avgResponseTime =
            providersWithStats > 0 ? totalResponseTime / providersWithStats : 0;
        return {
            totalProviders: providers.length,
            enabledProviders: enabledProviders.length,
            healthyProviders,
            aggregate,
        };
    }
    // ========================================
    // Internal Helpers
    // ========================================
    /**
     * Get an enabled provider or throw
     * @private
     */
    getEnabledProvider(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            throw new ProviderUnavailableError("registry", `Provider ${name} not found`);
        }
        if (!provider.enabled) {
            throw new ProviderUnavailableError("registry", `Provider ${name} is disabled`);
        }
        return provider;
    }
    /**
     * Execute a provider operation with error handling
     * @private
     */
    async executeWithErrorHandling(provider, operation, operationName) {
        try {
            const result = await operation();
            // Success - reset failure counter
            this.consecutiveFailures.set(provider.name, 0);
            return result;
        }
        catch (error) {
            // Track failure
            const failures = (this.consecutiveFailures.get(provider.name) || 0) + 1;
            this.consecutiveFailures.set(provider.name, failures);
            // Emit error event
            this.emitEvent({
                type: "provider-error",
                provider: provider.name,
                timestamp: new Date(),
                data: { operation: operationName, error: error.message },
            });
            // Auto-disable if threshold reached
            if (this.config.autoDisableUnhealthy &&
                failures >= this.config.maxConsecutiveFailures) {
                this.disable(provider.name);
            }
            throw error;
        }
    }
    /**
     * Calculate facets from search results
     * @private
     */
    calculateFacets(results) {
        const categories = {};
        const tags = {};
        for (const result of results) {
            // Count categories
            const cat = result.resource.category;
            categories[cat] = (categories[cat] || 0) + 1;
            // Count tags
            for (const tag of result.resource.tags || []) {
                tags[tag] = (tags[tag] || 0) + 1;
            }
        }
        return { categories, tags };
    }
    /**
     * Emit a provider event
     * @private
     */
    emitEvent(event) {
        if (this.config.enableEvents) {
            this.emit(event.type, event);
            this.emit("event", event);
        }
    }
    /**
     * Start periodic health checks
     * @private
     */
    startHealthChecks() {
        if (this.healthCheckTimer) {
            return; // Already running
        }
        this.healthCheckTimer = setInterval(async () => {
            const healthMap = await this.checkAllHealth();
            // Emit health change events for unhealthy providers
            for (const [name, health] of healthMap.entries()) {
                if (health.status !== "healthy") {
                    this.emitEvent({
                        type: "provider-health-changed",
                        provider: name,
                        timestamp: new Date(),
                        data: health,
                    });
                }
            }
        }, this.config.healthCheckInterval);
        // Don't keep process alive just for health checks
        this.healthCheckTimer.unref();
    }
    /**
     * Stop periodic health checks
     * @private
     */
    stopHealthChecks() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = undefined;
        }
    }
    /**
     * Shutdown the registry and all providers
     */
    async shutdown() {
        this.stopHealthChecks();
        const providers = Array.from(this.providers.values());
        await Promise.allSettled(providers.map((p) => p.shutdown()));
        this.providers.clear();
        this.consecutiveFailures.clear();
    }
}
//# sourceMappingURL=registry.js.map