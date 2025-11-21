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
import { LRUCache } from "lru-cache";
import matter from "gray-matter";
import { ProviderError, ProviderTimeoutError, ResourceNotFoundError, ProviderAuthenticationError, RateLimitError, } from "./types.js";
import { KNOWN_DIRECTORY_STRUCTURES, } from "./github-types.js";
/**
 * GitHub API base URL
 */
const GITHUB_API_BASE = "https://api.github.com";
/**
 * GitHub raw content base URL
 */
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";
/**
 * Default cache TTLs (in milliseconds)
 */
const DEFAULT_CACHE_TTL = {
    index: 24 * 60 * 60 * 1000, // 24 hours
    resource: 7 * 24 * 60 * 60 * 1000, // 7 days
    tree: 60 * 60 * 1000, // 1 hour
};
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
export class GitHubProvider {
    name = "github";
    enabled = true;
    priority = 15;
    config;
    logger;
    // Caching
    indexCache;
    resourceCache;
    treeCache;
    // Rate limiting
    rateLimit = null;
    rateLimitCheckedAt = null;
    // Statistics
    stats;
    requestTimes = [];
    cacheStats;
    // Repository indexes
    repositories = new Map();
    initialized = false;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.enabled = config.enabled;
        // Initialize caches
        const cacheTTL = config.cacheTTL || DEFAULT_CACHE_TTL.index;
        this.indexCache = new LRUCache({
            max: 100, // Max 100 repository indexes
            ttl: cacheTTL,
        });
        this.resourceCache = new LRUCache({
            max: 1000, // Max 1000 resources
            ttl: config.cacheTTL || DEFAULT_CACHE_TTL.resource,
        });
        this.treeCache = new LRUCache({
            max: 50, // Max 50 tree responses
            ttl: DEFAULT_CACHE_TTL.tree,
        });
        // Initialize statistics
        this.stats = {
            provider: this.name,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cachedRequests: 0,
            resourcesFetched: 0,
            tokensFetched: 0,
            avgResponseTime: 0,
            cacheHitRate: 0,
            uptime: 1.0,
            statsResetAt: new Date(),
        };
        this.cacheStats = {
            totalEntries: 0,
            hits: 0,
            misses: 0,
            evictions: 0,
            hitRate: 0,
            estimatedSize: 0,
        };
    }
    // ========================================
    // Lifecycle Management
    // ========================================
    /**
     * Initialize the provider
     *
     * Validates configuration, tests authentication if provided,
     * and performs initial rate limit check.
     */
    async initialize() {
        this.logger.info("Initializing GitHubProvider");
        // Validate configuration
        if (!this.config.repos || this.config.repos.length === 0) {
            this.logger.warn("No repositories configured for GitHub provider");
            this.enabled = false;
            return;
        }
        // Validate repository format
        for (const repo of this.config.repos) {
            if (!this.isValidRepoFormat(repo)) {
                throw new ProviderError(`Invalid repository format: ${repo}. Expected format: owner/repo`, this.name, "INVALID_CONFIG");
            }
        }
        // Test authentication if provided
        if (this.config.auth?.token) {
            try {
                await this.checkAuthentication();
                this.logger.info("GitHub authentication verified");
            }
            catch (error) {
                this.logger.error("GitHub authentication failed", error);
                throw error;
            }
        }
        // Check rate limit
        try {
            await this.updateRateLimit();
            this.logger.info("GitHub rate limit checked", {
                remaining: this.rateLimit?.remaining,
                limit: this.rateLimit?.limit,
            });
        }
        catch (error) {
            this.logger.warn("Could not check rate limit", error);
        }
        this.initialized = true;
        this.logger.info(`GitHubProvider initialized with ${this.config.repos.length} repositories`);
    }
    /**
     * Shutdown the provider
     *
     * Clears caches and resets state.
     */
    async shutdown() {
        this.logger.info("Shutting down GitHubProvider");
        this.indexCache.clear();
        this.resourceCache.clear();
        this.treeCache.clear();
        this.repositories.clear();
        this.initialized = false;
        this.logger.info("GitHubProvider shut down");
    }
    // ========================================
    // Resource Operations
    // ========================================
    /**
     * Fetch the complete index of available resources
     *
     * Scans all configured repositories in parallel and builds
     * a unified index of all resources found.
     *
     * @returns Promise resolving to resource index
     * @throws {ProviderError} If index fetch fails
     */
    async fetchIndex() {
        this.logger.info("Fetching GitHub resource index");
        const startTime = Date.now();
        try {
            // Scan all repositories in parallel
            const scanPromises = this.config.repos.map((repo) => this.scanRepository(repo));
            const scanResults = await Promise.allSettled(scanPromises);
            // Collect successful scans
            const successfulScans = [];
            const failedScans = [];
            scanResults.forEach((result, index) => {
                if (result.status === "fulfilled") {
                    successfulScans.push(result.value);
                    if (!result.value.success) {
                        failedScans.push({
                            repo: this.config.repos[index],
                            error: result.value.error || "Unknown error",
                        });
                    }
                }
                else {
                    failedScans.push({
                        repo: this.config.repos[index],
                        error: result.reason?.message || "Scan failed",
                    });
                }
            });
            if (failedScans.length > 0) {
                this.logger.warn("Some repositories failed to scan", { failedScans });
            }
            // Build unified index from all repositories
            const allResources = [];
            const categories = new Set();
            const byCategory = {};
            let totalTokens = 0;
            const tagCounts = new Map();
            for (const [repoKey, repoIndex] of this.repositories.entries()) {
                for (const resource of repoIndex.resources) {
                    // Convert GitHubResourceMetadata to RemoteResourceMetadata
                    const metadata = {
                        id: resource.id,
                        category: resource.category,
                        title: resource.title || resource.id,
                        description: resource.description || "",
                        tags: resource.tags || [],
                        capabilities: resource.capabilities || [],
                        useWhen: resource.useWhen || [],
                        estimatedTokens: resource.estimatedTokens || Math.ceil(resource.size / 4),
                        source: `github:${resource.repo.owner}/${resource.repo.repo}`,
                        sourceUri: `https://github.com/${resource.repo.owner}/${resource.repo.repo}/blob/${resource.repo.branch}/${resource.path}`,
                    };
                    allResources.push(metadata);
                    categories.add(resource.category);
                    byCategory[resource.category] =
                        (byCategory[resource.category] || 0) + 1;
                    totalTokens += metadata.estimatedTokens;
                    // Count tags
                    for (const tag of metadata.tags) {
                        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                    }
                }
            }
            // Get top tags
            const topTags = Array.from(tagCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([tag, count]) => ({ tag, count }));
            const duration = Date.now() - startTime;
            this.recordRequest(duration, true);
            const index = {
                provider: this.name,
                totalCount: allResources.length,
                resources: allResources,
                version: new Date().toISOString(),
                timestamp: new Date(),
                categories: Array.from(categories),
                stats: {
                    byCategory,
                    totalTokens,
                    topTags,
                },
            };
            this.logger.info("GitHub index fetched", {
                totalResources: allResources.length,
                repositories: this.repositories.size,
                duration,
            });
            return index;
        }
        catch (error) {
            this.recordRequest(Date.now() - startTime, false);
            this.logger.error("Failed to fetch GitHub index", error);
            throw this.wrapError(error, "Failed to fetch GitHub index");
        }
    }
    /**
     * Fetch a specific resource by ID and category
     *
     * @param id - Unique resource identifier (format: owner/repo/path)
     * @param category - Resource category
     * @returns Promise resolving to complete resource with content
     * @throws {ResourceNotFoundError} If resource doesn't exist
     * @throws {ProviderError} If fetch fails
     */
    async fetchResource(id, category) {
        this.logger.info("Fetching GitHub resource", { id, category });
        const startTime = Date.now();
        try {
            // Check cache first
            const cacheKey = `${id}:${category}`;
            const cached = this.resourceCache.get(cacheKey);
            if (cached) {
                this.logger.debug("Resource cache hit", { id });
                this.stats.cachedRequests++;
                this.cacheStats.hits++;
                this.updateCacheHitRate();
                return this.buildRemoteResource(id, category, cached);
            }
            this.cacheStats.misses++;
            this.updateCacheHitRate();
            // Parse resource ID (format: owner/repo/path)
            const parts = id.split("/");
            if (parts.length < 3) {
                throw new ResourceNotFoundError(this.name, id, category, new Error("Invalid resource ID format"));
            }
            const owner = parts[0];
            const repo = parts[1];
            const path = parts.slice(2).join("/");
            const branch = this.config.branch || "main";
            // Fetch raw content
            const url = `${GITHUB_RAW_BASE}/${owner}/${repo}/${branch}/${path}`;
            const response = await this.fetchWithRetry(url, {
                timeout: this.config.timeout,
            });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new ResourceNotFoundError(this.name, id, category);
                }
                throw new ProviderError(`Failed to fetch resource: ${response.statusText}`, this.name, "FETCH_FAILED", response.status);
            }
            const content = await response.text();
            // Parse frontmatter
            const parsed = matter(content);
            const frontmatter = parsed.data;
            const body = parsed.content;
            // Cache the resource
            const cachedResource = {
                content: body,
                frontmatter,
                sha: "", // We don't have SHA from raw fetch
                cachedAt: new Date(),
                etag: response.headers.get("etag") || undefined,
            };
            this.resourceCache.set(cacheKey, cachedResource);
            const duration = Date.now() - startTime;
            this.recordRequest(duration, true);
            this.stats.resourcesFetched++;
            this.stats.tokensFetched += Math.ceil(body.length / 4);
            return this.buildRemoteResource(id, category, cachedResource);
        }
        catch (error) {
            this.recordRequest(Date.now() - startTime, false);
            this.logger.error("Failed to fetch GitHub resource", { id, error });
            throw this.wrapError(error, `Failed to fetch resource ${id}`);
        }
    }
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
    async search(query, options) {
        this.logger.info("Searching GitHub resources", { query, options });
        const startTime = Date.now();
        try {
            // Ensure we have an index
            if (this.repositories.size === 0) {
                await this.fetchIndex();
            }
            // Extract keywords from query
            const keywords = this.extractKeywords(query);
            this.logger.debug("Extracted keywords", { keywords });
            // Collect all resources from all repositories
            const allResources = [];
            for (const repoIndex of this.repositories.values()) {
                allResources.push(...repoIndex.resources);
            }
            // Filter by category if specified
            let filtered = allResources;
            if (options?.categories && options.categories.length > 0) {
                filtered = filtered.filter((r) => options.categories.includes(r.category));
            }
            // Score and filter resources
            const scored = filtered
                .map((resource) => {
                const score = this.calculateScore(resource, keywords, options);
                return {
                    resource: {
                        id: resource.id,
                        category: resource.category,
                        tags: resource.tags || [],
                        capabilities: resource.capabilities || [],
                        useWhen: resource.useWhen || [],
                        estimatedTokens: resource.estimatedTokens || 0,
                        content: "", // Not loaded yet
                        source: this.name, // Add source field for provider identification
                    },
                    score,
                    matchReason: this.getMatchReasons(resource, keywords),
                };
            })
                .filter((result) => result.score >= (options?.minScore || 0));
            // Sort by score
            scored.sort((a, b) => b.score - a.score);
            // Apply result limit
            const maxResults = options?.maxResults || scored.length;
            const limited = scored.slice(0, maxResults);
            const duration = Date.now() - startTime;
            this.recordRequest(duration, true);
            return {
                results: limited,
                totalMatches: scored.length,
                query,
                searchTime: duration,
            };
        }
        catch (error) {
            this.recordRequest(Date.now() - startTime, false);
            this.logger.error("Failed to search GitHub resources", error);
            throw this.wrapError(error, "Failed to search GitHub resources");
        }
    }
    // ========================================
    // Health & Monitoring
    // ========================================
    /**
     * Check provider health status
     *
     * @returns Promise resolving to health status
     */
    async healthCheck() {
        this.logger.debug("Performing health check");
        const startTime = Date.now();
        try {
            // Check rate limit
            await this.updateRateLimit();
            const responseTime = Date.now() - startTime;
            const remainingPercent = this.rateLimit
                ? this.rateLimit.remaining / this.rateLimit.limit
                : 1;
            // Determine health status
            let status;
            if (!this.initialized) {
                status = "unhealthy";
            }
            else if (remainingPercent < 0.1) {
                status = "degraded"; // Less than 10% remaining
            }
            else if (this.stats.successfulRequests === 0 &&
                this.stats.totalRequests > 0) {
                status = "unhealthy";
            }
            else if (this.stats.failedRequests / Math.max(this.stats.totalRequests, 1) >
                0.5) {
                status = "degraded";
            }
            else {
                status = "healthy";
            }
            const successRate = this.stats.totalRequests > 0
                ? this.stats.successfulRequests / this.stats.totalRequests
                : 1;
            return {
                provider: this.name,
                status,
                lastCheck: new Date(),
                responseTime,
                reachable: true,
                authenticated: !!this.config.auth?.token,
                metrics: {
                    successRate,
                    avgResponseTime: this.stats.avgResponseTime,
                    consecutiveFailures: 0,
                    lastSuccess: new Date(),
                },
            };
        }
        catch (error) {
            this.logger.error("Health check failed", error);
            return {
                provider: this.name,
                status: "unhealthy",
                lastCheck: new Date(),
                reachable: false,
                authenticated: false,
                error: error.message,
            };
        }
    }
    /**
     * Get provider statistics
     *
     * @returns Current provider statistics
     */
    getStats() {
        // Update rate limit info if available
        if (this.rateLimit) {
            this.stats.rateLimit = {
                remaining: this.rateLimit.remaining,
                limit: this.rateLimit.limit,
                resetAt: new Date(this.rateLimit.reset * 1000),
            };
        }
        return { ...this.stats };
    }
    /**
     * Reset provider statistics
     */
    resetStats() {
        this.stats = {
            provider: this.name,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cachedRequests: 0,
            resourcesFetched: 0,
            tokensFetched: 0,
            avgResponseTime: 0,
            cacheHitRate: 0,
            uptime: 1.0,
            statsResetAt: new Date(),
        };
        this.requestTimes = [];
        this.cacheStats = {
            totalEntries: 0,
            hits: 0,
            misses: 0,
            evictions: 0,
            hitRate: 0,
            estimatedSize: 0,
        };
        this.logger.info("Statistics reset");
    }
    // ========================================
    // Repository Scanning
    // ========================================
    /**
     * Scan a repository and build its index
     *
     * @param repoString - Repository string (format: owner/repo)
     * @returns Scan result with statistics
     */
    async scanRepository(repoString) {
        this.logger.info("Scanning repository", { repo: repoString });
        const startTime = Date.now();
        try {
            const repo = this.parseRepository(repoString);
            const repoKey = `${repo.owner}/${repo.repo}`;
            // Check cache
            const cachedIndex = this.indexCache.get(repoKey);
            if (cachedIndex) {
                this.logger.debug("Repository index cache hit", { repo: repoKey });
                this.repositories.set(repoKey, cachedIndex);
                this.stats.cachedRequests++;
                return {
                    repo,
                    success: true,
                    resourceCount: cachedIndex.resources.length,
                    structureType: cachedIndex.structure.structureType,
                    duration: Date.now() - startTime,
                };
            }
            // Fetch repository tree
            const tree = await this.fetchRepositoryTree(repo);
            // Detect structure
            const structure = this.detectStructure(repo, tree);
            // Extract markdown files
            const mdFiles = tree.tree.filter((entry) => entry.type === "blob" &&
                entry.path?.endsWith(".md") &&
                this.isResourceFile(entry.path, structure));
            this.logger.debug("Found markdown files", {
                repo: repoKey,
                count: mdFiles.length,
            });
            // Build resource metadata (without fetching content)
            const resources = mdFiles.map((file) => {
                const category = this.inferCategory(file.path, structure);
                const id = `${repo.owner}/${repo.repo}/${file.path}`;
                return {
                    id,
                    category,
                    path: file.path,
                    repo,
                    sha: file.sha,
                    size: file.size || 0,
                    estimatedTokens: file.size ? Math.ceil(file.size / 4) : 0,
                };
            });
            // Build repository index
            const repoIndex = {
                repo,
                structure,
                resources,
                version: tree.sha,
                timestamp: new Date(),
            };
            // Cache the index
            this.indexCache.set(repoKey, repoIndex);
            this.repositories.set(repoKey, repoIndex);
            const duration = Date.now() - startTime;
            this.logger.info("Repository scanned successfully", {
                repo: repoKey,
                resources: resources.length,
                structure: structure.structureType,
                duration,
            });
            return {
                repo,
                success: true,
                resourceCount: resources.length,
                structureType: structure.structureType,
                duration,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error("Failed to scan repository", {
                repo: repoString,
                error,
            });
            const repo = this.parseRepository(repoString);
            return {
                repo,
                success: false,
                resourceCount: 0,
                structureType: "flat",
                error: error.message,
                duration,
            };
        }
    }
    /**
     * Fetch repository tree from GitHub API
     */
    async fetchRepositoryTree(repo) {
        const repoKey = `${repo.owner}/${repo.repo}`;
        // Check cache
        const cached = this.treeCache.get(repoKey);
        if (cached) {
            this.logger.debug("Tree cache hit", { repo: repoKey });
            return cached;
        }
        // Fetch from API
        const url = `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.repo}/git/trees/${repo.branch}?recursive=1`;
        const response = await this.fetchWithRetry(url, {
            headers: this.getHeaders(),
            timeout: this.config.timeout,
        });
        await this.checkRateLimit(response);
        if (!response.ok) {
            if (response.status === 404) {
                throw new ProviderError(`Repository not found: ${repoKey}`, this.name, "NOT_FOUND", 404);
            }
            throw new ProviderError(`Failed to fetch repository tree: ${response.statusText}`, this.name, "FETCH_FAILED", response.status);
        }
        const tree = (await response.json());
        // Cache the tree
        this.treeCache.set(repoKey, tree);
        return tree;
    }
    /**
     * Detect repository structure type
     */
    detectStructure(repo, tree) {
        const directories = new Set();
        // Extract top-level directories
        for (const entry of tree.tree) {
            if (entry.type === "tree") {
                const topLevel = entry.path.split("/")[0];
                directories.add(topLevel);
            }
        }
        // Check for known structures
        const orchestr8Dirs = new Set(Object.keys(KNOWN_DIRECTORY_STRUCTURES.orchestr8));
        const templateDirs = new Set(Object.keys(KNOWN_DIRECTORY_STRUCTURES["claude-code-templates"]));
        const hasOrchstr8 = Array.from(orchestr8Dirs).some((dir) => directories.has(dir));
        const hasTemplate = Array.from(templateDirs).some((dir) => directories.has(dir));
        let structureType;
        let categoryMap;
        if (hasOrchstr8) {
            structureType = "orchestr8";
            categoryMap = KNOWN_DIRECTORY_STRUCTURES.orchestr8;
        }
        else if (hasTemplate) {
            structureType = "claude-code-templates";
            categoryMap = KNOWN_DIRECTORY_STRUCTURES["claude-code-templates"];
        }
        else {
            structureType = "flat";
            categoryMap = {};
        }
        // Build directory list
        const resourceDirs = [];
        for (const dir of directories) {
            const category = categoryMap[dir];
            if (category) {
                const fileCount = tree.tree.filter((e) => e.type === "blob" &&
                    e.path.startsWith(`${dir}/`) &&
                    e.path.endsWith(".md")).length;
                resourceDirs.push({
                    category,
                    path: dir,
                    fileCount,
                });
            }
        }
        return {
            repo,
            structureType,
            directories: resourceDirs,
            totalFiles: tree.tree.filter((e) => e.type === "blob" && e.path.endsWith(".md")).length,
            lastScanned: new Date(),
        };
    }
    /**
     * Check if a file path is a resource file
     */
    isResourceFile(path, structure) {
        // In flat structure, all markdown files are resources
        if (structure.structureType === "flat") {
            return true;
        }
        // In structured repos, only files in known directories
        return structure.directories.some((dir) => path.startsWith(`${dir.path}/`));
    }
    /**
     * Infer category from file path
     */
    inferCategory(path, structure) {
        // Try to match against known directories
        for (const dir of structure.directories) {
            if (path.startsWith(`${dir.path}/`)) {
                return dir.category;
            }
        }
        // Default to pattern for unknown
        return "pattern";
    }
    // ========================================
    // HTTP Utilities
    // ========================================
    /**
     * Fetch with retry logic
     */
    async fetchWithRetry(url, options = {}) {
        const maxRetries = options.retryCount ?? this.config.retryAttempts ?? 3;
        const timeout = options.timeout ?? this.config.timeout ?? 30000;
        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                const response = await fetch(url, {
                    method: options.method || "GET",
                    headers: options.headers || {},
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                return response;
            }
            catch (error) {
                lastError = error;
                if (error instanceof Error && error.name === "AbortError") {
                    this.logger.warn(`Request timeout (attempt ${attempt + 1}/${maxRetries + 1})`, { url });
                }
                else {
                    this.logger.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1})`, {
                        url,
                        error: error.message,
                    });
                }
                // Wait before retry (exponential backoff)
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        throw new ProviderTimeoutError(this.name, timeout, lastError);
    }
    /**
     * Get headers for GitHub API requests
     */
    getHeaders() {
        const headers = {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "orchestr8-mcp-server",
        };
        if (this.config.auth?.token) {
            headers["Authorization"] = `Bearer ${this.config.auth.token}`;
        }
        return headers;
    }
    // ========================================
    // Rate Limiting
    // ========================================
    /**
     * Update rate limit from API
     */
    async updateRateLimit() {
        const url = `${GITHUB_API_BASE}/rate_limit`;
        const response = await this.fetchWithRetry(url, {
            headers: this.getHeaders(),
            timeout: 10000,
        });
        if (!response.ok) {
            throw new ProviderError("Failed to check rate limit", this.name, "RATE_LIMIT_CHECK_FAILED", response.status);
        }
        const data = (await response.json());
        this.rateLimit = data.rate;
        this.rateLimitCheckedAt = new Date();
        this.logger.debug("Rate limit updated", {
            remaining: this.rateLimit.remaining,
            limit: this.rateLimit.limit,
            reset: new Date(this.rateLimit.reset * 1000),
        });
    }
    /**
     * Check rate limit from response headers
     */
    async checkRateLimit(response) {
        const remaining = response.headers.get("x-ratelimit-remaining");
        const limit = response.headers.get("x-ratelimit-limit");
        const reset = response.headers.get("x-ratelimit-reset");
        if (remaining && limit && reset) {
            this.rateLimit = {
                remaining: parseInt(remaining, 10),
                limit: parseInt(limit, 10),
                reset: parseInt(reset, 10),
                used: parseInt(limit, 10) - parseInt(remaining, 10),
            };
            this.rateLimitCheckedAt = new Date();
            // Warn if low
            if (this.rateLimit.remaining < 10) {
                this.logger.warn("GitHub rate limit low", {
                    remaining: this.rateLimit.remaining,
                    resetAt: new Date(this.rateLimit.reset * 1000),
                });
            }
            // Throw if exceeded
            if (this.rateLimit.remaining === 0) {
                const retryAfter = this.rateLimit.reset * 1000 - Date.now();
                throw new RateLimitError(this.name, retryAfter);
            }
        }
    }
    /**
     * Check authentication status
     */
    async checkAuthentication() {
        if (!this.config.auth?.token) {
            return;
        }
        const url = `${GITHUB_API_BASE}/user`;
        const response = await this.fetchWithRetry(url, {
            headers: this.getHeaders(),
            timeout: 10000,
        });
        if (response.status === 401) {
            throw new ProviderAuthenticationError(this.name, "Invalid token");
        }
        if (!response.ok) {
            throw new ProviderAuthenticationError(this.name, `Authentication check failed: ${response.statusText}`);
        }
        const user = (await response.json());
        this.logger.info("Authenticated as GitHub user", { login: user.login });
    }
    // ========================================
    // Search Utilities
    // ========================================
    /**
     * Extract keywords from query
     */
    extractKeywords(query) {
        const normalized = query.toLowerCase().replace(/[^\w\s-]/g, " ");
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
        const words = normalized
            .split(/\s+/)
            .filter((word) => word.length > 1 && !stopWords.has(word));
        return Array.from(new Set(words));
    }
    /**
     * Calculate relevance score for a resource
     */
    calculateScore(resource, keywords, options) {
        let score = 0;
        // Required tags check
        if (options?.requiredTags && options.requiredTags.length > 0) {
            const hasAll = options.requiredTags.every((tag) => resource.tags?.includes(tag));
            if (!hasAll)
                return 0;
        }
        // Category bonus
        if (options?.categories?.includes(resource.category)) {
            score += 15;
        }
        // Keyword matching
        const tags = (resource.tags || []).map((t) => t.toLowerCase());
        const capabilities = (resource.capabilities || []).map((c) => c.toLowerCase());
        const useWhen = (resource.useWhen || []).map((u) => u.toLowerCase());
        for (const keyword of keywords) {
            // Tag matches
            if (tags.some((tag) => tag.includes(keyword))) {
                score += 10;
            }
            // Capability matches
            if (capabilities.some((cap) => cap.includes(keyword))) {
                score += 8;
            }
            // Use-when matches
            if (useWhen.some((use) => use.includes(keyword))) {
                score += 5;
            }
        }
        // Size preference (smaller resources)
        if ((resource.estimatedTokens || 0) < 1000) {
            score += 5;
        }
        return score;
    }
    /**
     * Get match reasons for a resource
     */
    getMatchReasons(resource, keywords) {
        const reasons = [];
        const tags = (resource.tags || []).map((t) => t.toLowerCase());
        const capabilities = (resource.capabilities || []).map((c) => c.toLowerCase());
        for (const keyword of keywords) {
            if (tags.some((tag) => tag.includes(keyword))) {
                reasons.push(`Tag match: ${keyword}`);
            }
            if (capabilities.some((cap) => cap.includes(keyword))) {
                reasons.push(`Capability match: ${keyword}`);
            }
        }
        return reasons;
    }
    // ========================================
    // Helper Methods
    // ========================================
    /**
     * Validate repository format (owner/repo)
     */
    isValidRepoFormat(repo) {
        return /^[\w-]+\/[\w.-]+$/.test(repo);
    }
    /**
     * Parse repository string into components
     */
    parseRepository(repoString) {
        const [owner, repo] = repoString.split("/");
        return {
            owner,
            repo,
            branch: this.config.branch || "main",
        };
    }
    /**
     * Build RemoteResource from cached data
     */
    buildRemoteResource(id, category, cached) {
        const parts = id.split("/");
        const owner = parts[0];
        const repo = parts[1];
        const path = parts.slice(2).join("/");
        return {
            id,
            category: category,
            title: cached.frontmatter.title || id,
            description: cached.frontmatter.description || "",
            tags: cached.frontmatter.tags || [],
            capabilities: cached.frontmatter.capabilities || [],
            useWhen: cached.frontmatter.useWhen || [],
            estimatedTokens: cached.frontmatter.estimatedTokens ||
                Math.ceil(cached.content.length / 4),
            source: `github:${owner}/${repo}`,
            sourceUri: `https://github.com/${owner}/${repo}/blob/${this.config.branch || "main"}/${path}`,
            content: cached.content,
            dependencies: cached.frontmatter.dependencies,
            related: cached.frontmatter.related,
        };
    }
    /**
     * Record request metrics
     */
    recordRequest(duration, success) {
        this.stats.totalRequests++;
        if (success) {
            this.stats.successfulRequests++;
        }
        else {
            this.stats.failedRequests++;
        }
        this.requestTimes.push(duration);
        // Keep only last 100 request times
        if (this.requestTimes.length > 100) {
            this.requestTimes.shift();
        }
        // Update average
        this.stats.avgResponseTime =
            this.requestTimes.reduce((sum, t) => sum + t, 0) /
                this.requestTimes.length;
    }
    /**
     * Update cache hit rate
     */
    updateCacheHitRate() {
        const total = this.cacheStats.hits + this.cacheStats.misses;
        this.cacheStats.hitRate = total > 0 ? this.cacheStats.hits / total : 0;
        this.stats.cacheHitRate = this.cacheStats.hitRate;
    }
    /**
     * Wrap errors in ProviderError
     */
    wrapError(error, message) {
        if (error instanceof ProviderError) {
            return error;
        }
        return new ProviderError(message, this.name, "UNKNOWN_ERROR", undefined, error);
    }
}
//# sourceMappingURL=github.js.map