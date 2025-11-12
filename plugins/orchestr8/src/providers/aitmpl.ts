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

import { LRUCache } from "lru-cache";
import matter from "gray-matter";
import { Logger } from "../utils/logger.js";
import { ResourceFragment } from "../utils/fuzzyMatcher.js";
import {
  ResourceProvider,
  RemoteResourceIndex,
  RemoteResource,
  RemoteResourceMetadata,
  SearchResponse,
  SearchOptions,
  SearchResult,
  ProviderHealth,
  ProviderStats,
  ProviderError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  ResourceNotFoundError,
  RateLimitError,
} from "./types.js";
import { AitmplProviderConfig } from "../config/schema.js";
import {
  AitmplComponent,
  AitmplFrontmatter,
  AitmplCacheEntry,
  AitmplProviderMetrics,
  RateLimitBucket,
  AitmplRequestOptions,
  CATEGORY_MAPPING,
  AITMPL_DATA_SOURCES,
  AITMPL_DEFAULTS,
} from "./aitmpl-types.js";

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
export class AITMPLProvider implements ResourceProvider {
  readonly name = "aitmpl";
  enabled = true;
  readonly priority = 10; // Lower priority than local (0)

  private config: AitmplProviderConfig;
  private logger: Logger;

  // Caching
  private indexCache: AitmplCacheEntry<AitmplComponent[]> | null = null;
  private resourceCache: LRUCache<string, AitmplCacheEntry<RemoteResource>>;

  // Rate limiting
  private minuteBucket: RateLimitBucket;
  private hourBucket: RateLimitBucket;

  // Statistics
  private metrics: AitmplProviderMetrics;
  private statsResetAt: Date;

  // Health tracking
  private consecutiveFailures = 0;
  private lastSuccessfulRequest: Date | null = null;
  private lastHealthCheck: Date | null = null;

  constructor(config: AitmplProviderConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger("AITMPLProvider");

    // Initialize resource cache
    this.resourceCache = new LRUCache({
      max: AITMPL_DEFAULTS.MAX_CACHE_SIZE,
      ttl: config.cacheTTL || AITMPL_DEFAULTS.CACHE_TTL,
    });

    // Initialize rate limit buckets
    const now = new Date();
    this.minuteBucket = {
      tokens: config.rateLimit.requestsPerMinute,
      capacity: config.rateLimit.requestsPerMinute,
      lastRefill: now,
      refillRate: config.rateLimit.requestsPerMinute / 60000, // tokens per ms
    };

    this.hourBucket = {
      tokens: config.rateLimit.requestsPerHour,
      capacity: config.rateLimit.requestsPerHour,
      lastRefill: now,
      refillRate: config.rateLimit.requestsPerHour / 3600000, // tokens per ms
    };

    // Initialize metrics
    this.statsResetAt = now;
    this.metrics = {
      apiRequests: 0,
      apiSuccesses: 0,
      apiFailures: 0,
      cacheHits: 0,
      cacheMisses: 0,
      bytesDownloaded: 0,
      avgResponseTime: 0,
      rateLimitHits: 0,
    };
  }

  // ========================================
  // Lifecycle Management
  // ========================================

  /**
   * Initialize the provider
   *
   * Validates configuration and performs initial health check.
   */
  async initialize(): Promise<void> {
    this.logger.info("Initializing AITMPL provider", {
      enabled: this.enabled,
      cacheTTL: this.config.cacheTTL,
      rateLimit: this.config.rateLimit,
    });

    // Validate configuration
    if (!this.config.enabled) {
      this.enabled = false;
      this.logger.info("AITMPL provider is disabled in configuration");
      return;
    }

    // Perform initial health check
    try {
      const health = await this.healthCheck();
      if (health.status === "unhealthy") {
        this.logger.warn("AITMPL provider is unhealthy", { health });
      } else {
        this.logger.info("AITMPL provider initialized successfully", {
          health,
        });
      }
    } catch (error) {
      this.logger.error("Failed to perform initial health check", error);
      // Don't fail initialization - just log the error
    }
  }

  /**
   * Shutdown the provider
   *
   * Clears caches and resets state.
   */
  async shutdown(): Promise<void> {
    this.logger.info("Shutting down AITMPL provider");

    // Clear caches
    this.indexCache = null;
    this.resourceCache.clear();

    // Reset state
    this.enabled = false;
    this.consecutiveFailures = 0;
    this.lastSuccessfulRequest = null;

    this.logger.info("AITMPL provider shutdown complete");
  }

  // ========================================
  // Resource Operations
  // ========================================

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
  async fetchIndex(): Promise<RemoteResourceIndex> {
    this.logger.debug("Fetching resource index");

    // Check cache first
    if (this.indexCache && this.isCacheValid(this.indexCache)) {
      this.logger.debug("Returning cached index");
      this.metrics.cacheHits++;
      return this.buildIndexFromComponents(this.indexCache.data);
    }

    this.metrics.cacheMisses++;

    // Fetch fresh data
    const components = await this.fetchComponentsJson();

    // Cache the raw components
    this.indexCache = {
      data: components,
      cachedAt: new Date(),
      ttl: this.config.cacheTTL || AITMPL_DEFAULTS.CACHE_TTL,
    };

    // Convert to index format
    return this.buildIndexFromComponents(components);
  }

  /**
   * Fetch a specific resource by ID and category
   *
   * @param id - Resource identifier (component name)
   * @param category - Resource category
   * @returns Promise resolving to complete resource with content
   * @throws {ResourceNotFoundError} If resource doesn't exist
   */
  async fetchResource(id: string, category: string): Promise<RemoteResource> {
    this.logger.debug("Fetching resource", { id, category });

    // Generate cache key
    const cacheKey = `${category}:${id}`;

    // Check cache first
    const cached = this.resourceCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      this.logger.debug("Returning cached resource", { id });
      this.metrics.cacheHits++;
      return cached.data;
    }

    this.metrics.cacheMisses++;

    // Fetch index to find the component
    const components = await this.getComponents();

    // Find matching component
    const component = components.find((c) => {
      const mappedCategory = CATEGORY_MAPPING[c.type];
      return c.name === id && mappedCategory === category;
    });

    if (!component) {
      throw new ResourceNotFoundError(this.name, id, category);
    }

    // Convert to resource format
    const resource = this.convertToResource(component);

    // Cache it
    this.resourceCache.set(cacheKey, {
      data: resource,
      cachedAt: new Date(),
      ttl: AITMPL_DEFAULTS.RESOURCE_CACHE_TTL,
    });

    return resource;
  }

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
  async search(
    query: string,
    options?: SearchOptions,
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    this.logger.debug("Searching resources", { query, options });

    // Get all components
    const components = await this.getComponents();

    // Extract search keywords
    const keywords = this.extractKeywords(query);

    // Score and filter components
    const scored: SearchResult[] = [];

    for (const component of components) {
      const resource = this.convertToResourceFragment(component);
      const score = this.calculateRelevanceScore(
        component,
        resource,
        keywords,
        options,
      );

      // Apply minimum score threshold
      const minScore = options?.minScore ?? 10;
      if (score >= minScore) {
        scored.push({
          resource: {
            ...resource,
            source: this.name, // Add source field for provider identification
          } as any,
          score,
          matchReason: this.getMatchReasons(component, keywords),
        });
      }
    }

    // Sort by relevance
    scored.sort((a, b) => b.score - a.score);

    // Apply result limit
    const maxResults = options?.maxResults ?? scored.length;
    const results = scored.slice(0, maxResults);

    // Calculate facets
    const facets = this.calculateFacets(results);

    const searchTime = Date.now() - startTime;

    this.logger.debug("Search complete", {
      query,
      totalMatches: scored.length,
      returnedResults: results.length,
      searchTime,
    });

    return {
      results,
      totalMatches: scored.length,
      query,
      searchTime,
      facets,
    };
  }

  // ========================================
  // Health & Monitoring
  // ========================================

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
  async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();
    this.lastHealthCheck = new Date();

    this.logger.debug("Performing health check");

    const health: ProviderHealth = {
      provider: this.name,
      status: "unknown",
      lastCheck: this.lastHealthCheck,
      reachable: false,
      authenticated: true, // No auth required for public GitHub
    };

    try {
      // Try to fetch index (will use cache if available)
      const index = await this.fetchIndex();

      // Check if we got valid data
      if (index.resources.length > 0) {
        health.reachable = true;
        health.status = "healthy";
        health.responseTime = Date.now() - startTime;
      } else {
        health.status = "degraded";
        health.error = "No resources found in index";
      }

      // Check success rate
      const totalRequests = this.metrics.apiRequests;
      if (totalRequests > 0) {
        const successRate = this.metrics.apiSuccesses / totalRequests;
        health.metrics = {
          successRate,
          avgResponseTime: this.metrics.avgResponseTime,
          consecutiveFailures: this.consecutiveFailures,
          lastSuccess: this.lastSuccessfulRequest || undefined,
        };

        // Degrade status if success rate is low
        if (successRate < 0.5) {
          health.status = "degraded";
          health.error = `Low success rate: ${(successRate * 100).toFixed(1)}%`;
        } else if (successRate < 0.9 && health.status === "healthy") {
          health.status = "degraded";
        }
      }

      // Check consecutive failures
      if (this.consecutiveFailures >= 3) {
        health.status = "unhealthy";
        health.error = `${this.consecutiveFailures} consecutive failures`;
      }

      this.logger.debug("Health check complete", { health });
    } catch (error) {
      health.status = "unhealthy";
      health.reachable = false;
      health.error = (error as Error).message;
      health.responseTime = Date.now() - startTime;

      this.logger.warn("Health check failed", error);
    }

    return health;
  }

  /**
   * Get provider statistics
   *
   * @returns Current provider statistics
   */
  getStats(): ProviderStats {
    const totalRequests = this.metrics.apiRequests;
    const cacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const totalWithCache = totalRequests + cacheRequests;

    return {
      provider: this.name,
      totalRequests: totalWithCache,
      successfulRequests: this.metrics.apiSuccesses + this.metrics.cacheHits,
      failedRequests: this.metrics.apiFailures,
      cachedRequests: this.metrics.cacheHits,
      resourcesFetched: this.metrics.apiSuccesses,
      tokensFetched: 0, // Not tracked currently
      avgResponseTime: this.metrics.avgResponseTime,
      cacheHitRate:
        cacheRequests > 0 ? this.metrics.cacheHits / cacheRequests : 0,
      uptime: totalRequests > 0 ? this.metrics.apiSuccesses / totalRequests : 1,
      rateLimit: {
        remaining: Math.floor(
          Math.min(this.minuteBucket.tokens, this.hourBucket.tokens),
        ),
        limit: this.config.rateLimit.requestsPerMinute,
        resetAt: new Date(Date.now() + 60000), // Next minute
      },
      statsResetAt: this.statsResetAt,
    };
  }

  /**
   * Reset provider statistics
   */
  resetStats(): void {
    this.metrics = {
      apiRequests: 0,
      apiSuccesses: 0,
      apiFailures: 0,
      cacheHits: 0,
      cacheMisses: 0,
      bytesDownloaded: 0,
      avgResponseTime: 0,
      rateLimitHits: 0,
    };
    this.statsResetAt = new Date();
    this.consecutiveFailures = 0;

    this.logger.info("Provider statistics reset");
  }

  // ========================================
  // HTTP Client & Rate Limiting
  // ========================================

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
  private async httpFetch(
    url: string,
    options?: AitmplRequestOptions,
  ): Promise<string> {
    const timeout =
      options?.timeout || this.config.timeout || AITMPL_DEFAULTS.TIMEOUT;
    const maxRetries =
      options?.retries ??
      this.config.retryAttempts ??
      AITMPL_DEFAULTS.MAX_RETRIES;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check and consume rate limit tokens
        this.checkRateLimit();

        // Track request
        this.metrics.apiRequests++;
        const startTime = Date.now();

        // Build headers
        const headers: Record<string, string> = {
          "User-Agent": AITMPL_DEFAULTS.USER_AGENT,
          ...(options?.headers || {}),
        };

        // Add ETag for conditional requests
        if (options?.etag) {
          headers["If-None-Match"] = options.etag;
        }

        // Make request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(url, {
            headers,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Handle response
          if (!response.ok) {
            if (response.status === 304) {
              // Not modified - return empty (cached version should be used)
              this.logger.debug("HTTP 304 Not Modified", { url });
              throw new Error("Not modified"); // Will trigger retry
            }

            if (response.status === 429) {
              // Rate limit from GitHub
              const retryAfter = response.headers.get("Retry-After");
              throw new RateLimitError(
                this.name,
                retryAfter ? parseInt(retryAfter) * 1000 : undefined,
              );
            }

            if (response.status === 404) {
              throw new ResourceNotFoundError(this.name, url);
            }

            throw new ProviderError(
              `HTTP ${response.status}: ${response.statusText}`,
              this.name,
              "HTTP_ERROR",
              response.status,
            );
          }

          // Success
          const text = await response.text();
          const responseTime = Date.now() - startTime;

          // Update metrics
          this.metrics.apiSuccesses++;
          this.metrics.bytesDownloaded += text.length;
          this.updateAvgResponseTime(responseTime);
          this.consecutiveFailures = 0;
          this.lastSuccessfulRequest = new Date();

          this.logger.debug("HTTP request successful", {
            url,
            responseTime,
            bytes: text.length,
          });

          return text;
        } catch (error) {
          clearTimeout(timeoutId);

          // Handle abort (timeout)
          if ((error as Error).name === "AbortError") {
            throw new ProviderTimeoutError(this.name, timeout);
          }

          throw error;
        }
      } catch (error) {
        lastError = error as Error;

        // Don't retry rate limit errors
        if (error instanceof RateLimitError) {
          this.metrics.rateLimitHits++;
          throw error;
        }

        // Don't retry not found errors
        if (error instanceof ResourceNotFoundError) {
          throw error;
        }

        // Log retry attempt
        if (attempt < maxRetries) {
          const backoff = this.calculateBackoff(attempt);
          this.logger.warn(`Request failed, retrying in ${backoff}ms`, {
            url,
            attempt: attempt + 1,
            maxRetries,
            error: lastError.message,
          });

          await this.sleep(backoff);
        }
      }
    }

    // All retries exhausted
    this.metrics.apiFailures++;
    this.consecutiveFailures++;

    if (this.metrics.lastError) {
      this.metrics.lastError = {
        message: lastError?.message || "Unknown error",
        timestamp: new Date(),
      };
    }

    throw new ProviderUnavailableError(
      this.name,
      `Failed after ${maxRetries} retries: ${lastError?.message}`,
      lastError || undefined,
    );
  }

  /**
   * Check rate limit and consume token
   *
   * @throws {RateLimitError} If rate limit exceeded
   */
  private checkRateLimit(): void {
    // Refill tokens based on time elapsed
    const now = new Date();

    // Refill minute bucket
    const minuteElapsed =
      now.getTime() - this.minuteBucket.lastRefill.getTime();
    this.minuteBucket.tokens = Math.min(
      this.minuteBucket.capacity,
      this.minuteBucket.tokens + minuteElapsed * this.minuteBucket.refillRate,
    );
    this.minuteBucket.lastRefill = now;

    // Refill hour bucket
    const hourElapsed = now.getTime() - this.hourBucket.lastRefill.getTime();
    this.hourBucket.tokens = Math.min(
      this.hourBucket.capacity,
      this.hourBucket.tokens + hourElapsed * this.hourBucket.refillRate,
    );
    this.hourBucket.lastRefill = now;

    // Check if we have tokens available
    if (this.minuteBucket.tokens < 1) {
      const resetIn = Math.ceil(
        (1 - this.minuteBucket.tokens) / this.minuteBucket.refillRate,
      );
      throw new RateLimitError(this.name, resetIn);
    }

    if (this.hourBucket.tokens < 1) {
      const resetIn = Math.ceil(
        (1 - this.hourBucket.tokens) / this.hourBucket.refillRate,
      );
      throw new RateLimitError(this.name, resetIn);
    }

    // Consume tokens
    this.minuteBucket.tokens -= 1;
    this.hourBucket.tokens -= 1;
  }

  /**
   * Calculate exponential backoff delay
   *
   * @param attempt - Retry attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  private calculateBackoff(attempt: number): number {
    const base = AITMPL_DEFAULTS.BACKOFF_BASE;
    const max = AITMPL_DEFAULTS.MAX_BACKOFF;

    // Exponential backoff with jitter
    const exponential = base * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * exponential; // 0-30% jitter

    return Math.min(exponential + jitter, max);
  }

  /**
   * Sleep for specified milliseconds
   *
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update average response time with new measurement
   *
   * @param responseTime - New response time in ms
   */
  private updateAvgResponseTime(responseTime: number): void {
    const totalRequests = this.metrics.apiSuccesses;
    if (totalRequests === 1) {
      this.metrics.avgResponseTime = responseTime;
    } else {
      // Running average
      this.metrics.avgResponseTime =
        (this.metrics.avgResponseTime * (totalRequests - 1) + responseTime) /
        totalRequests;
    }
  }

  // ========================================
  // Data Fetching & Conversion
  // ========================================

  /**
   * Fetch components.json from GitHub
   *
   * @returns Promise resolving to array of AITMPL components
   * @throws {ProviderError} If fetch or parse fails
   */
  private async fetchComponentsJson(): Promise<AitmplComponent[]> {
    this.logger.debug("Fetching components.json");

    const url = AITMPL_DATA_SOURCES.COMPONENTS_JSON;

    try {
      const text = await this.httpFetch(url);

      // Parse JSON
      const data = JSON.parse(text);

      // Handle different response formats
      if (Array.isArray(data)) {
        // Direct array format
        return data as AitmplComponent[];
      } else if (data.components && Array.isArray(data.components)) {
        // { components: [...] } format
        return data.components as AitmplComponent[];
      } else if (data.agents && Array.isArray(data.agents)) {
        // { agents: [...] } format (current AITMPL structure)
        return data.agents as AitmplComponent[];
      } else if (typeof data === "object") {
        // Object with category keys: { agents: [...], skills: [...], ... }
        // Flatten all arrays into single array
        const components: AitmplComponent[] = [];
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key])) {
            components.push(...(data[key] as AitmplComponent[]));
          }
        }
        if (components.length > 0) {
          return components;
        }
      }

      throw new Error(
        "Unexpected JSON structure: " + JSON.stringify(Object.keys(data)),
      );
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      throw new ProviderError(
        `Failed to fetch components.json: ${(error as Error).message}`,
        this.name,
        "FETCH_FAILED",
        undefined,
        error as Error,
      );
    }
  }

  /**
   * Get components (from cache or fetch)
   *
   * @returns Promise resolving to array of components
   */
  private async getComponents(): Promise<AitmplComponent[]> {
    // Return cached if valid
    if (this.indexCache && this.isCacheValid(this.indexCache)) {
      return this.indexCache.data;
    }

    // Fetch fresh
    const components = await this.fetchComponentsJson();

    // Update cache
    this.indexCache = {
      data: components,
      cachedAt: new Date(),
      ttl: this.config.cacheTTL || AITMPL_DEFAULTS.CACHE_TTL,
    };

    return components;
  }

  /**
   * Build resource index from components
   *
   * @param components - Array of AITMPL components
   * @returns Resource index
   */
  private buildIndexFromComponents(
    components: AitmplComponent[],
  ): RemoteResourceIndex {
    const resources: RemoteResourceMetadata[] = components.map((c) =>
      this.convertToResourceMetadata(c),
    );

    // Calculate statistics
    const byCategory: Record<string, number> = {};
    const tagCounts = new Map<string, number>();
    let totalTokens = 0;

    for (const resource of resources) {
      // Count by category
      byCategory[resource.category] = (byCategory[resource.category] || 0) + 1;

      // Count tags
      for (const tag of resource.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }

      // Sum tokens
      totalTokens += resource.estimatedTokens;
    }

    // Get top tags
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    // Get unique categories
    const categories = Array.from(
      new Set(resources.map((r) => r.category)),
    ) as RemoteResourceIndex["categories"];

    return {
      provider: this.name,
      totalCount: resources.length,
      resources,
      version: "1.0",
      timestamp: new Date(),
      categories,
      stats: {
        byCategory,
        totalTokens,
        topTags,
      },
    };
  }

  /**
   * Convert AITMPL component to resource metadata
   *
   * @param component - AITMPL component
   * @returns Resource metadata
   */
  private convertToResourceMetadata(
    component: AitmplComponent,
  ): RemoteResourceMetadata {
    const frontmatter = this.parseFrontmatter(component.content);
    const category = CATEGORY_MAPPING[component.type];

    return {
      id: component.name,
      category,
      title: frontmatter.name || component.name,
      description:
        frontmatter.description || component.description || "No description",
      tags: frontmatter.tags || [component.category, component.type],
      capabilities: frontmatter.capabilities || [],
      useWhen: frontmatter.useWhen || [],
      estimatedTokens:
        frontmatter.estimatedTokens || this.estimateTokens(component.content),
      version: frontmatter.version,
      author: frontmatter.author,
      source: this.name,
      sourceUri: `${AITMPL_DATA_SOURCES.GITHUB_REPO}/blob/main/${component.path}`,
    };
  }

  /**
   * Convert AITMPL component to full resource
   *
   * @param component - AITMPL component
   * @returns Complete resource with content
   */
  private convertToResource(component: AitmplComponent): RemoteResource {
    const metadata = this.convertToResourceMetadata(component);
    const frontmatter = this.parseFrontmatter(component.content);

    return {
      ...metadata,
      content: component.content,
      dependencies: frontmatter.dependencies,
      related: frontmatter.related,
    };
  }

  /**
   * Convert AITMPL component to resource fragment (for search)
   *
   * @param component - AITMPL component
   * @returns Resource fragment
   */
  private convertToResourceFragment(
    component: AitmplComponent,
  ): ResourceFragment {
    const metadata = this.convertToResourceMetadata(component);

    return {
      id: metadata.id,
      category: metadata.category,
      tags: metadata.tags,
      capabilities: metadata.capabilities,
      useWhen: metadata.useWhen,
      estimatedTokens: metadata.estimatedTokens,
      content: component.content,
    };
  }

  /**
   * Parse YAML frontmatter from markdown content
   *
   * @param content - Markdown content with frontmatter
   * @returns Parsed frontmatter object
   */
  private parseFrontmatter(content: string): AitmplFrontmatter {
    try {
      const parsed = matter(content);
      return parsed.data as AitmplFrontmatter;
    } catch (error) {
      this.logger.warn("Failed to parse frontmatter", error);
      return {};
    }
  }

  /**
   * Estimate token count from content
   *
   * Uses rough approximation: 1 token ≈ 4 characters
   *
   * @param content - Text content
   * @returns Estimated token count
   */
  private estimateTokens(content: string): number {
    return Math.max(
      Math.ceil(content.length / 4),
      AITMPL_DEFAULTS.MIN_ESTIMATED_TOKENS,
    );
  }

  // ========================================
  // Search & Scoring
  // ========================================

  /**
   * Extract keywords from search query
   *
   * @param query - Search query string
   * @returns Array of keywords
   */
  private extractKeywords(query: string): string[] {
    // Normalize
    const normalized = query.toLowerCase().replace(/[^\w\s-]/g, " ");

    // Stop words
    const stopWords = new Set([
      "a",
      "an",
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "as",
      "is",
      "was",
      "are",
      "were",
      "be",
    ]);

    // Split and filter
    const words = normalized
      .split(/\s+/)
      .filter((word) => word.length > 1 && !stopWords.has(word));

    return Array.from(new Set(words));
  }

  /**
   * Calculate relevance score for a component
   *
   * @param component - AITMPL component
   * @param resource - Converted resource fragment
   * @param keywords - Search keywords
   * @param options - Search options
   * @returns Relevance score (0-100)
   */
  private calculateRelevanceScore(
    component: AitmplComponent,
    resource: ResourceFragment,
    keywords: string[],
    options?: SearchOptions,
  ): number {
    let score = 0;

    // Category filter
    if (options?.categories && options.categories.length > 0) {
      if (!options.categories.includes(resource.category)) {
        return 0; // Filtered out
      }
      score += 15; // Category match bonus
    }

    // Required tags
    if (options?.requiredTags && options.requiredTags.length > 0) {
      const hasAll = options.requiredTags.every((tag) =>
        resource.tags.includes(tag),
      );
      if (!hasAll) {
        return 0; // Filtered out
      }
      score += 10; // Required tags bonus
    }

    // Optional tags
    if (options?.optionalTags && options.optionalTags.length > 0) {
      const matchedOptional = options.optionalTags.filter((tag) =>
        resource.tags.includes(tag),
      ).length;
      score += matchedOptional * 5;
    }

    // Keyword matching
    const nameLower = component.name.toLowerCase();
    const descLower = (component.description || "").toLowerCase();

    for (const keyword of keywords) {
      // Name match (+15)
      if (nameLower.includes(keyword)) {
        score += 15;
      }

      // Description match (+8)
      if (descLower.includes(keyword)) {
        score += 8;
      }

      // Tag match (+10)
      if (resource.tags.some((tag) => tag.includes(keyword))) {
        score += 10;
      }

      // Capability match (+8)
      if (
        resource.capabilities.some((cap) => cap.toLowerCase().includes(keyword))
      ) {
        score += 8;
      }

      // Use-when match (+5)
      if (resource.useWhen.some((use) => use.toLowerCase().includes(keyword))) {
        score += 5;
      }
    }

    // Popularity bonus (based on downloads)
    if (component.downloads > 1000) {
      score += 10;
    } else if (component.downloads > 100) {
      score += 5;
    }

    // Security score bonus
    if (component.security && component.security.valid) {
      const securityBonus = Math.floor(component.security.score / 20); // 0-5 points
      score += securityBonus;
    }

    // Size preference (smaller is better)
    if (resource.estimatedTokens < 1000) {
      score += 5;
    } else if (resource.estimatedTokens > 5000) {
      score -= 5;
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Get match reasons for search result
   *
   * @param component - AITMPL component
   * @param keywords - Search keywords
   * @returns Array of match reason strings
   */
  private getMatchReasons(
    component: AitmplComponent,
    keywords: string[],
  ): string[] {
    const reasons: string[] = [];

    const nameLower = component.name.toLowerCase();
    const descLower = (component.description || "").toLowerCase();

    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        reasons.push(`Name contains "${keyword}"`);
      }
      if (descLower.includes(keyword)) {
        reasons.push(`Description contains "${keyword}"`);
      }
    }

    if (component.downloads > 1000) {
      reasons.push("Popular component (1000+ downloads)");
    }

    if (component.security && component.security.score >= 95) {
      reasons.push("High security score");
    }

    return reasons.slice(0, 3); // Limit to top 3 reasons
  }

  /**
   * Calculate facets from search results
   *
   * @param results - Search results
   * @returns Facets object
   */
  private calculateFacets(results: SearchResult[]) {
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

  // ========================================
  // Cache Management
  // ========================================

  /**
   * Check if cache entry is still valid
   *
   * @param entry - Cache entry to check
   * @returns True if valid, false if expired
   */
  private isCacheValid<T>(entry: AitmplCacheEntry<T>): boolean {
    const age = Date.now() - entry.cachedAt.getTime();
    return age < entry.ttl;
  }
}
