/**
 * Provider System - Remote Resource Integration
 *
 * This module provides the core infrastructure for integrating remote
 * resource providers into the orchestr8 system. It enables fetching
 * resources from external repositories like AITMPL, GitHub, and custom
 * backends.
 *
 * ## Architecture
 *
 * The provider system consists of three main components:
 *
 * 1. **Types** (`types.ts`) - Core interfaces and type definitions
 *    - ResourceProvider interface
 *    - Resource and index types
 *    - Search and query types
 *    - Health and statistics types
 *    - Error classes
 *
 * 2. **Registry** (`registry.ts`) - Provider management
 *    - Register/unregister providers
 *    - Priority-based ordering
 *    - Health monitoring
 *    - Aggregate statistics
 *    - Event emission
 *
 * 3. **Implementations** (future waves)
 *    - LocalProvider - Local filesystem resources
 *    - AITMPLProvider - AITMPL repository
 *    - GitHubProvider - GitHub repositories
 *    - CustomProvider - User-defined providers
 *
 * ## Usage
 *
 * ### Basic Setup
 *
 * ```typescript
 * import { ProviderRegistry } from './providers';
 * import { LocalProvider } from './providers/local';
 * import { AITMPLProvider } from './providers/aitmpl';
 *
 * // Create registry
 * const registry = new ProviderRegistry({
 *   enableHealthChecks: true,
 *   healthCheckInterval: 60000,
 *   autoDisableUnhealthy: true,
 * });
 *
 * // Register providers
 * await registry.register(new LocalProvider({
 *   name: 'local',
 *   priority: 0,
 *   resourcesPath: './resources',
 * }));
 *
 * await registry.register(new AITMPLProvider({
 *   name: 'aitmpl',
 *   priority: 10,
 *   baseUrl: 'https://api.aitmpl.org',
 * }));
 * ```
 *
 * ### Searching Resources
 *
 * ```typescript
 * // Search across all providers
 * const results = await registry.searchAll('typescript api', {
 *   categories: ['agent', 'skill'],
 *   maxResults: 10,
 *   minScore: 50,
 * });
 *
 * // Search in specific provider
 * const localResults = await registry.search('local', 'testing patterns');
 * ```
 *
 * ### Fetching Resources
 *
 * ```typescript
 * // Fetch from specific provider
 * const resource = await registry.fetchResource(
 *   'aitmpl',
 *   'typescript-api-builder',
 *   'agent'
 * );
 *
 * // Try all providers in priority order
 * const resource = await registry.fetchResourceAny(
 *   'error-handling-pattern',
 *   'pattern'
 * );
 * ```
 *
 * ### Monitoring Health
 *
 * ```typescript
 * // Check specific provider
 * const health = await registry.checkHealth('aitmpl');
 * console.log(`Status: ${health.status}, Response: ${health.responseTime}ms`);
 *
 * // Check all providers
 * const allHealth = await registry.checkAllHealth();
 * for (const [name, health] of allHealth.entries()) {
 *   console.log(`${name}: ${health.status}`);
 * }
 *
 * // Get statistics
 * const stats = registry.getAggregateStats();
 * console.log(`Total requests: ${stats.aggregate.totalRequests}`);
 * console.log(`Success rate: ${stats.aggregate.successfulRequests / stats.aggregate.totalRequests}`);
 * ```
 *
 * ### Event Handling
 *
 * ```typescript
 * registry.on('provider-error', (event) => {
 *   console.error(`Provider ${event.provider} error:`, event.data);
 * });
 *
 * registry.on('provider-disabled', (event) => {
 *   console.warn(`Provider ${event.provider} disabled:`, event.data);
 * });
 *
 * registry.on('provider-health-changed', (event) => {
 *   console.log(`Provider ${event.provider} health:`, event.data.status);
 * });
 * ```
 *
 * ## Implementing Custom Providers
 *
 * To create a custom provider, implement the `ResourceProvider` interface:
 *
 * ```typescript
 * import {
 *   ResourceProvider,
 *   RemoteResourceIndex,
 *   RemoteResource,
 *   SearchResponse,
 *   ProviderHealth,
 *   ProviderStats
 * } from './providers';
 *
 * export class MyCustomProvider implements ResourceProvider {
 *   name = 'my-provider';
 *   enabled = true;
 *   priority = 20;
 *
 *   private stats: ProviderStats = {
 *     provider: 'my-provider',
 *     totalRequests: 0,
 *     successfulRequests: 0,
 *     failedRequests: 0,
 *     cachedRequests: 0,
 *     resourcesFetched: 0,
 *     tokensFetched: 0,
 *     avgResponseTime: 0,
 *     cacheHitRate: 0,
 *     uptime: 1.0,
 *     statsResetAt: new Date(),
 *   };
 *
 *   async initialize(): Promise<void> {
 *     // Setup connections, load config, etc.
 *   }
 *
 *   async shutdown(): Promise<void> {
 *     // Cleanup resources
 *   }
 *
 *   async fetchIndex(): Promise<RemoteResourceIndex> {
 *     // Fetch list of available resources
 *   }
 *
 *   async fetchResource(id: string, category: string): Promise<RemoteResource> {
 *     // Fetch specific resource content
 *   }
 *
 *   async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
 *     // Search for matching resources
 *   }
 *
 *   async healthCheck(): Promise<ProviderHealth> {
 *     // Check provider health
 *   }
 *
 *   getStats(): ProviderStats {
 *     return this.stats;
 *   }
 *
 *   resetStats(): void {
 *     this.stats = { ...initial stats };
 *   }
 * }
 * ```
 *
 * ## Integration with ResourceLoader
 *
 * The provider system integrates with the existing ResourceLoader to enable
 * transparent access to both local and remote resources:
 *
 * ```typescript
 * // In ResourceLoader
 * import { ProviderRegistry } from './providers';
 *
 * class ResourceLoader {
 *   private providerRegistry: ProviderRegistry;
 *
 *   async loadResourceContent(uri: string): Promise<string> {
 *     // Parse URI
 *     const { provider, resourceId, category } = parseURI(uri);
 *
 *     if (provider === 'local') {
 *       // Load from local filesystem
 *       return this.loadLocal(resourceId);
 *     } else {
 *       // Load from remote provider
 *       const resource = await this.providerRegistry.fetchResource(
 *         provider,
 *         resourceId,
 *         category
 *       );
 *       return resource.content;
 *     }
 *   }
 * }
 * ```
 *
 * ## Caching Strategy
 *
 * Providers should implement their own caching:
 *
 * 1. **Provider-level cache** - Each provider caches its own responses
 * 2. **ResourceLoader cache** - ResourceLoader caches final content
 * 3. **TTL-based expiration** - Configurable TTL per provider
 * 4. **Cache invalidation** - Manual invalidation on resource updates
 *
 * ## Error Handling
 *
 * The provider system includes comprehensive error types:
 *
 * - `ProviderError` - Base error for all provider operations
 * - `ProviderTimeoutError` - Request timeout
 * - `ProviderUnavailableError` - Provider unreachable
 * - `ResourceNotFoundError` - Resource doesn't exist
 * - `ProviderAuthenticationError` - Auth failure
 * - `RateLimitError` - Rate limit exceeded
 *
 * ```typescript
 * try {
 *   const resource = await registry.fetchResource('aitmpl', 'agent-id', 'agent');
 * } catch (error) {
 *   if (error instanceof ResourceNotFoundError) {
 *     console.error('Resource not found:', error.resourceId);
 *   } else if (error instanceof RateLimitError) {
 *     console.error('Rate limited, retry after:', error.retryAfter);
 *   } else if (error instanceof ProviderTimeoutError) {
 *     console.error('Provider timeout');
 *   }
 * }
 * ```
 *
 * ## Next Steps (Wave 2 & 3)
 *
 * Wave 2 will implement:
 * - LocalProvider - Wraps existing local filesystem access
 * - AITMPLProvider - Connects to AITMPL API
 * - GitHubProvider - Fetches from GitHub repositories
 *
 * Wave 3 will integrate:
 * - Update ResourceLoader to use ProviderRegistry
 * - Add provider selection UI in web interface
 * - Implement provider configuration management
 * - Add provider analytics and monitoring dashboard
 *
 * @module providers
 */
// Export error classes
export { ProviderError, ProviderTimeoutError, ProviderUnavailableError, ResourceNotFoundError, ProviderAuthenticationError, RateLimitError, } from "./types.js";
// Export registry
export { ProviderRegistry } from "./registry.js";
// Export provider implementations
export { GitHubProvider } from "./github.js";
export { AITMPLProvider } from "./aitmpl.js";
export { CATEGORY_MAPPING, AITMPL_DATA_SOURCES, AITMPL_DEFAULTS, } from "./aitmpl-types.js";
//# sourceMappingURL=index.js.map