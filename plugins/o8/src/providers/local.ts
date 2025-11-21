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

import { promises as fs } from "fs";
import { join } from "path";
import { LRUCache } from "lru-cache";
import matter from "gray-matter";
import { Logger } from "../utils/logger.js";
import { FuzzyMatcher, ResourceFragment } from "../utils/fuzzyMatcher.js";
import {
  ResourceProvider,
  RemoteResource,
  RemoteResourceIndex,
  RemoteResourceMetadata,
  SearchResponse,
  SearchOptions,
  SearchResult,
  ProviderHealth,
  ProviderStats,
  ResourceNotFoundError,
  ProviderError,
  ProviderUnavailableError,
} from "./types.js";

// ============================================================================
// Configuration Types
// ============================================================================

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

// ============================================================================
// Internal Types
// ============================================================================

/**
 * Cached index entry
 * @private
 */
interface CachedIndex {
  index: RemoteResourceIndex;
  timestamp: Date;
}

/**
 * Performance metrics for tracking
 * @private
 */
interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cachedRequests: number;
  resourcesFetched: number;
  tokensFetched: number;
  responseTimes: number[];
  lastRequestTime?: Date;
  lastError?: { message: string; timestamp: Date };
  statsResetAt: Date;
}

// ============================================================================
// LocalProvider Implementation
// ============================================================================

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
export class LocalProvider implements ResourceProvider {
  // Provider metadata
  readonly name = "local";
  enabled = true;
  readonly priority = 0;

  // Configuration
  private resourcesPath: string;
  private config: Required<LocalProviderConfig>;

  // Dependencies
  private logger: Logger;
  private fuzzyMatcher: FuzzyMatcher;

  // Caching
  private resourceCache: LRUCache<string, RemoteResource>;
  private indexCache: CachedIndex | null = null;
  private resourceIndex: ResourceFragment[] | null = null;
  private indexLoadPromise: Promise<ResourceFragment[]> | null = null;

  // Statistics
  private metrics: PerformanceMetrics;

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
  constructor(config: LocalProviderConfig, logger: Logger) {
    this.logger = logger;

    // Apply defaults to configuration
    this.config = {
      resourcesPath:
        config.resourcesPath ||
        process.env.RESOURCES_PATH ||
        join(process.cwd(), "resources"),
      cacheSize: config.cacheSize ?? 200,
      cacheTTL: config.cacheTTL ?? 14400000, // 4 hours
      indexCacheTTL: config.indexCacheTTL ?? 86400000, // 24 hours
      enableCache: config.enableCache ?? true,
    };

    this.resourcesPath = this.config.resourcesPath;

    // Initialize LRU cache
    this.resourceCache = new LRUCache<string, RemoteResource>({
      max: this.config.cacheSize,
      ttl: this.config.cacheTTL,
      updateAgeOnGet: true,
    });

    // Initialize fuzzy matcher
    this.fuzzyMatcher = new FuzzyMatcher();

    // Initialize metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedRequests: 0,
      resourcesFetched: 0,
      tokensFetched: 0,
      responseTimes: [],
      statsResetAt: new Date(),
    };

    this.logger.debug("LocalProvider initialized", {
      resourcesPath: this.resourcesPath,
      cacheSize: this.config.cacheSize,
    });
  }

  // ========================================
  // Lifecycle Management
  // ========================================

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
  async initialize(): Promise<void> {
    this.logger.info("Initializing LocalProvider", {
      resourcesPath: this.resourcesPath,
    });

    try {
      // Verify resources directory exists and is readable
      await fs.access(this.resourcesPath, fs.constants.R_OK);
      this.logger.info("Resources directory accessible", {
        path: this.resourcesPath,
      });

      // Optionally pre-load index for faster first queries
      // This is done in background to not block initialization
      this.loadResourceIndex().catch((error) => {
        this.logger.warn("Failed to pre-load resource index", error);
      });
    } catch (error) {
      const message = `Resources directory not accessible: ${this.resourcesPath}`;
      this.logger.error(message, error);
      throw new ProviderUnavailableError("local", message, error as Error);
    }
  }

  /**
   * Shutdown the provider
   *
   * Clears caches and performs cleanup.
   */
  async shutdown(): Promise<void> {
    this.logger.info("Shutting down LocalProvider");

    // Clear caches
    this.resourceCache.clear();
    this.indexCache = null;
    this.resourceIndex = null;
    this.indexLoadPromise = null;

    this.logger.info("LocalProvider shutdown complete");
  }

  // ========================================
  // Resource Operations
  // ========================================

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
  async fetchIndex(): Promise<RemoteResourceIndex> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Check cache first
      if (this.config.enableCache && this.indexCache) {
        const age = Date.now() - this.indexCache.timestamp.getTime();
        if (age < this.config.indexCacheTTL) {
          this.logger.debug("Index cache hit", { age: `${Math.round(age / 1000)}s` });
          this.metrics.cachedRequests++;
          this.trackResponseTime(Date.now() - startTime);
          return this.indexCache.index;
        }
        this.logger.debug("Index cache expired, reloading");
      }

      // Load resource fragments
      const fragments = await this.loadResourceIndex();

      // Convert to metadata entries
      const resources: RemoteResourceMetadata[] = fragments.map((fragment) =>
        this.fragmentToMetadata(fragment),
      );

      // Calculate statistics
      const byCategory: Record<string, number> = {};
      const tagCounts: Map<string, number> = new Map();
      let totalTokens = 0;

      for (const fragment of fragments) {
        // Count by category
        byCategory[fragment.category] = (byCategory[fragment.category] || 0) + 1;

        // Count tags
        for (const tag of fragment.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }

        // Sum tokens
        totalTokens += fragment.estimatedTokens;
      }

      // Get top tags
      const topTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([tag, count]) => ({ tag, count }));

      // Build index
      const index: RemoteResourceIndex = {
        provider: this.name,
        totalCount: fragments.length,
        resources,
        version: new Date().toISOString(), // Use timestamp as version
        timestamp: new Date(),
        categories: [
          "agent",
          "skill",
          "example",
          "pattern",
          "workflow",
        ] as const,
        stats: {
          byCategory,
          totalTokens,
          topTags,
        },
      };

      // Cache the index
      if (this.config.enableCache) {
        this.indexCache = {
          index,
          timestamp: new Date(),
        };
      }

      this.metrics.successfulRequests++;
      this.trackResponseTime(Date.now() - startTime);

      this.logger.info("Index fetched successfully", {
        totalCount: index.totalCount,
        categories: Object.keys(byCategory),
      });

      return index;
    } catch (error) {
      this.metrics.failedRequests++;
      this.trackError(error as Error);
      this.trackResponseTime(Date.now() - startTime);

      const message = "Failed to fetch resource index";
      this.logger.error(message, error);
      throw new ProviderError(message, this.name, "INDEX_FETCH_FAILED", 500, error as Error);
    }
  }

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
  async fetchResource(id: string, category: string): Promise<RemoteResource> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    const cacheKey = `${category}:${id}`;

    try {
      // Check cache first
      if (this.config.enableCache && this.resourceCache.has(cacheKey)) {
        this.logger.debug("Resource cache hit", { id, category });
        this.metrics.cachedRequests++;
        this.trackResponseTime(Date.now() - startTime);
        return this.resourceCache.get(cacheKey)!;
      }

      // Construct file path
      const categoryPlural = this.categoryToDirectory(category);
      const filePath = join(
        this.resourcesPath,
        categoryPlural,
        `${id}.md`,
      );

      this.logger.debug("Loading resource from filesystem", { filePath });

      // Read and parse file
      let content: string;
      try {
        content = await fs.readFile(filePath, "utf-8");
      } catch (error: any) {
        if (error.code === "ENOENT") {
          throw new ResourceNotFoundError(this.name, id, category);
        }
        throw error;
      }

      // Parse frontmatter and content
      const parsed = matter(content);
      const frontmatter = parsed.data;
      const body = parsed.content;

      // Build resource object
      const resource: RemoteResource = {
        id,
        category: category as RemoteResource["category"],
        title: frontmatter.title || id,
        description: frontmatter.description || "",
        tags: Array.isArray(frontmatter.tags)
          ? frontmatter.tags.map((t: any) => String(t).toLowerCase())
          : [],
        capabilities: Array.isArray(frontmatter.capabilities)
          ? frontmatter.capabilities.map((c: any) => String(c))
          : [],
        useWhen: Array.isArray(frontmatter.useWhen)
          ? frontmatter.useWhen.map((u: any) => String(u))
          : [],
        estimatedTokens:
          frontmatter.estimatedTokens || Math.ceil(body.length / 4),
        version: frontmatter.version,
        author: frontmatter.author,
        createdAt: frontmatter.createdAt
          ? new Date(frontmatter.createdAt)
          : undefined,
        updatedAt: frontmatter.updatedAt
          ? new Date(frontmatter.updatedAt)
          : undefined,
        source: this.name,
        sourceUri: `o8://${categoryPlural}/${id}`,
        content: body,
        dependencies: Array.isArray(frontmatter.dependencies)
          ? frontmatter.dependencies
          : undefined,
        related: Array.isArray(frontmatter.related)
          ? frontmatter.related
          : undefined,
      };

      // Cache the resource
      if (this.config.enableCache) {
        this.resourceCache.set(cacheKey, resource);
      }

      // Update metrics
      this.metrics.successfulRequests++;
      this.metrics.resourcesFetched++;
      this.metrics.tokensFetched += resource.estimatedTokens;
      this.trackResponseTime(Date.now() - startTime);

      this.logger.debug("Resource fetched successfully", {
        id,
        category,
        tokens: resource.estimatedTokens,
      });

      return resource;
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        // Don't count as failed request - it's a valid "not found" response
        this.logger.debug("Resource not found", { id, category });
        throw error;
      }

      this.metrics.failedRequests++;
      this.trackError(error as Error);
      this.trackResponseTime(Date.now() - startTime);

      const message = `Failed to fetch resource ${id} in category ${category}`;
      this.logger.error(message, error);
      throw new ProviderError(message, this.name, "RESOURCE_FETCH_FAILED", 500, error as Error);
    }
  }

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
  async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Load resource index
      await this.loadResourceIndex();

      // Perform fuzzy match
      const matchResult = await this.fuzzyMatcher.match({
        query,
        categories: options?.categories as any,
        maxTokens: options?.maxTokens,
        requiredTags: options?.requiredTags,
        mode: "catalog", // Use catalog mode for provider search
        maxResults: options?.maxResults ?? 15,
        minScore: options?.minScore ?? 10,
      });

      // Convert to SearchResult format
      const results: SearchResult[] = matchResult.fragments.map(
        (fragment, index) => ({
          resource: {
            ...fragment,
            source: this.name, // Add source field for provider identification
          } as any,
          score: matchResult.matchScores[index],
          matchReason: this.generateMatchReason(fragment, query),
        }),
      );

      // Apply sorting if specified
      if (options?.sortBy && options.sortBy !== "relevance") {
        this.sortResults(results, options.sortBy, options.sortOrder || "desc");
      }

      // Apply pagination
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? results.length;
      const paginatedResults = results.slice(offset, offset + limit);

      // Calculate facets
      const facets = this.calculateFacets(results);

      const response: SearchResponse = {
        results: paginatedResults,
        totalMatches: results.length,
        query,
        searchTime: Date.now() - startTime,
        facets,
      };

      this.metrics.successfulRequests++;
      this.trackResponseTime(Date.now() - startTime);

      this.logger.info("Search completed", {
        query,
        matches: results.length,
        returned: paginatedResults.length,
      });

      return response;
    } catch (error) {
      this.metrics.failedRequests++;
      this.trackError(error as Error);
      this.trackResponseTime(Date.now() - startTime);

      const message = `Search failed for query: ${query}`;
      this.logger.error(message, error);
      throw new ProviderError(message, this.name, "SEARCH_FAILED", 500, error as Error);
    }
  }

  // ========================================
  // Health & Monitoring
  // ========================================

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
  async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();

    try {
      // Check if resources directory is accessible
      await fs.access(this.resourcesPath, fs.constants.R_OK);

      // Calculate success rate
      const totalAttempts =
        this.metrics.successfulRequests + this.metrics.failedRequests;
      const successRate =
        totalAttempts > 0 ? this.metrics.successfulRequests / totalAttempts : 1;

      // Determine status based on success rate and recent errors
      let status: ProviderHealth["status"] = "healthy";
      if (successRate < 0.5) {
        status = "unhealthy";
      } else if (successRate < 0.9) {
        status = "degraded";
      }

      // Check for recent errors (within last 5 minutes)
      if (this.metrics.lastError) {
        const errorAge =
          Date.now() - this.metrics.lastError.timestamp.getTime();
        if (errorAge < 300000 && status === "healthy") {
          // Recent error within 5 minutes
          status = "degraded";
        }
      }

      const responseTime = Date.now() - startTime;

      return {
        provider: this.name,
        status,
        lastCheck: new Date(),
        responseTime,
        reachable: true,
        authenticated: true, // Local filesystem doesn't require auth
        error: status !== "healthy" ? this.metrics.lastError?.message : undefined,
        metrics: {
          successRate,
          avgResponseTime: this.calculateAvgResponseTime(),
          consecutiveFailures: 0, // Tracked by registry
          lastSuccess: this.metrics.lastRequestTime,
        },
      };
    } catch (error) {
      return {
        provider: this.name,
        status: "unhealthy",
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        reachable: false,
        authenticated: false,
        error: `Resources directory not accessible: ${(error as Error).message}`,
      };
    }
  }

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
  getStats(): ProviderStats {
    const totalAttempts =
      this.metrics.successfulRequests + this.metrics.failedRequests;
    const uptime =
      totalAttempts > 0 ? this.metrics.successfulRequests / totalAttempts : 1;

    return {
      provider: this.name,
      totalRequests: this.metrics.totalRequests,
      successfulRequests: this.metrics.successfulRequests,
      failedRequests: this.metrics.failedRequests,
      cachedRequests: this.metrics.cachedRequests,
      resourcesFetched: this.metrics.resourcesFetched,
      tokensFetched: this.metrics.tokensFetched,
      avgResponseTime: this.calculateAvgResponseTime(),
      cacheHitRate:
        this.metrics.totalRequests > 0
          ? this.metrics.cachedRequests / this.metrics.totalRequests
          : 0,
      uptime,
      statsResetAt: this.metrics.statsResetAt,
    };
  }

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
  resetStats(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedRequests: 0,
      resourcesFetched: 0,
      tokensFetched: 0,
      responseTimes: [],
      statsResetAt: new Date(),
    };

    this.logger.info("Statistics reset");
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Load and cache resource index
   * @private
   */
  private async loadResourceIndex(): Promise<ResourceFragment[]> {
    // Return cached index if available
    if (this.resourceIndex !== null) {
      this.logger.debug("Returning cached resource index");
      return this.resourceIndex;
    }

    // If already loading, wait for that promise
    if (this.indexLoadPromise !== null) {
      this.logger.debug("Waiting for in-progress resource index load");
      return this.indexLoadPromise;
    }

    // Start loading
    this.logger.info("Loading resource index...");
    this.indexLoadPromise = this.loadResourceIndexImpl();

    try {
      this.resourceIndex = await this.indexLoadPromise;

      // Set index in fuzzy matcher
      this.fuzzyMatcher.setResourceIndex(this.resourceIndex);

      this.logger.info(
        `Resource index loaded with ${this.resourceIndex.length} fragments`,
      );
      return this.resourceIndex;
    } finally {
      this.indexLoadPromise = null;
    }
  }

  /**
   * Internal implementation of resource index loading
   * Scans all category directories in parallel
   * @private
   */
  private async loadResourceIndexImpl(): Promise<ResourceFragment[]> {
    try {
      const categories: Array<{
        dir: string;
        type: ResourceFragment["category"];
      }> = [
        { dir: "agents", type: "agent" },
        { dir: "skills", type: "skill" },
        { dir: "examples", type: "example" },
        { dir: "patterns", type: "pattern" },
        { dir: "guides", type: "pattern" },
        { dir: "workflows", type: "workflow" },
      ];

      // Scan all categories in parallel
      const categoryPromises = categories.map(async ({ dir, type }) => {
        const categoryPath = join(this.resourcesPath, dir);
        const categoryFragments: ResourceFragment[] = [];

        try {
          await fs.access(categoryPath);
          await this.scanFragmentsDirectory(
            categoryPath,
            type,
            dir,
            categoryFragments,
          );
        } catch (error) {
          this.logger.debug(`Category directory not found: ${categoryPath}`);
        }

        return categoryFragments;
      });

      const fragmentArrays = await Promise.all(categoryPromises);
      const fragments = fragmentArrays.flat();

      this.logger.info(`Scanned ${fragments.length} resource fragments`);
      return fragments;
    } catch (error) {
      this.logger.error("Error loading resource index:", error);
      return [];
    }
  }

  /**
   * Recursively scan directory for fragment files
   * @private
   */
  private async scanFragmentsDirectory(
    dirPath: string,
    category: ResourceFragment["category"],
    categoryName: string,
    fragments: ResourceFragment[],
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this.scanFragmentsDirectory(
            fullPath,
            category,
            categoryName,
            fragments,
          );
        } else if (entry.name.endsWith(".md")) {
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            const fragment = this.parseResourceFragment(
              content,
              category,
              categoryName,
              entry.name,
            );
            fragments.push(fragment);
          } catch (error) {
            this.logger.warn(`Failed to parse resource: ${fullPath}`, error);
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Error scanning directory: ${dirPath}`, error);
    }
  }

  /**
   * Parse a markdown file into a ResourceFragment
   * @private
   */
  private parseResourceFragment(
    content: string,
    category: ResourceFragment["category"],
    categoryName: string,
    filename: string,
  ): ResourceFragment {
    const parsed = matter(content);
    const frontmatter = parsed.data;
    const body = parsed.content;

    const id = frontmatter.id || filename.replace(/\.md$/, "");

    return {
      id: `${categoryName}/${id}`,
      category,
      tags: Array.isArray(frontmatter.tags)
        ? frontmatter.tags.map((t: any) => String(t).toLowerCase())
        : [],
      capabilities: Array.isArray(frontmatter.capabilities)
        ? frontmatter.capabilities.map((c: any) => String(c))
        : [],
      useWhen: Array.isArray(frontmatter.useWhen)
        ? frontmatter.useWhen.map((u: any) => String(u))
        : [],
      estimatedTokens:
        frontmatter.estimatedTokens || Math.ceil(body.length / 4),
      content: body,
    };
  }

  /**
   * Convert ResourceFragment to RemoteResourceMetadata
   * @private
   */
  private fragmentToMetadata(
    fragment: ResourceFragment,
  ): RemoteResourceMetadata {
    // Extract ID from full path (e.g., "agents/typescript-developer" -> "typescript-developer")
    const id = fragment.id.split("/").pop() || fragment.id;

    return {
      id,
      category: fragment.category,
      title: id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      description: fragment.capabilities[0] || "",
      tags: fragment.tags,
      capabilities: fragment.capabilities,
      useWhen: fragment.useWhen,
      estimatedTokens: fragment.estimatedTokens,
      source: this.name,
      sourceUri: `o8://${fragment.category}s/${id}`,
    };
  }

  /**
   * Map category to directory name (pluralization)
   * @private
   */
  private categoryToDirectory(category: string): string {
    const mapping: Record<string, string> = {
      agent: "agents",
      skill: "skills",
      example: "examples",
      pattern: "patterns",
      workflow: "workflows",
    };
    return mapping[category] || `${category}s`;
  }

  /**
   * Generate match reason explanation
   * @private
   */
  private generateMatchReason(
    fragment: ResourceFragment,
    query: string,
  ): string[] {
    const reasons: string[] = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    // Check tag matches
    const matchedTags = fragment.tags.filter((tag) =>
      queryWords.some((word) => tag.includes(word)),
    );
    if (matchedTags.length > 0) {
      reasons.push(`Tags: ${matchedTags.join(", ")}`);
    }

    // Check capability matches
    const matchedCaps = fragment.capabilities.filter((cap) =>
      queryWords.some((word) => cap.toLowerCase().includes(word)),
    );
    if (matchedCaps.length > 0) {
      reasons.push(`Capabilities: ${matchedCaps.slice(0, 2).join(", ")}`);
    }

    // Check category match
    if (queryWords.includes(fragment.category)) {
      reasons.push(`Category: ${fragment.category}`);
    }

    return reasons.length > 0 ? reasons : ["General relevance"];
  }

  /**
   * Sort search results
   * @private
   */
  private sortResults(
    results: SearchResult[],
    sortBy: SearchOptions["sortBy"],
    sortOrder: "asc" | "desc",
  ): void {
    const multiplier = sortOrder === "asc" ? 1 : -1;

    results.sort((a, b) => {
      switch (sortBy) {
        case "tokens":
          return (
            (a.resource.estimatedTokens - b.resource.estimatedTokens) *
            multiplier
          );
        case "date":
          // Local provider doesn't have dates, use relevance as fallback
          return (a.score - b.score) * multiplier;
        case "popularity":
          // Local provider doesn't track popularity, use relevance as fallback
          return (a.score - b.score) * multiplier;
        default:
          return (a.score - b.score) * multiplier;
      }
    });
  }

  /**
   * Calculate facets from search results
   * @private
   */
  private calculateFacets(results: SearchResult[]): {
    categories?: Record<string, number>;
    tags?: Record<string, number>;
  } {
    const categories: Record<string, number> = {};
    const tags: Record<string, number> = {};

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
   * Track response time
   * @private
   */
  private trackResponseTime(ms: number): void {
    this.metrics.responseTimes.push(ms);
    this.metrics.lastRequestTime = new Date();

    // Keep only last 100 response times for rolling average
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift();
    }
  }

  /**
   * Track error
   * @private
   */
  private trackError(error: Error): void {
    this.metrics.lastError = {
      message: error.message,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate average response time
   * @private
   */
  private calculateAvgResponseTime(): number {
    if (this.metrics.responseTimes.length === 0) {
      return 0;
    }

    const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.metrics.responseTimes.length;
  }
}
