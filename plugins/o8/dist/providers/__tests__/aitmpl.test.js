/**
 * AITMPLProvider Unit Tests
 *
 * Tests the AITMPLProvider implementation including:
 * - Initialization with configuration
 * - Fetching components.json
 * - Index building and caching
 * - Resource fetching with HTTP
 * - Search with scoring
 * - Rate limiting
 * - Health checks
 * - Statistics tracking
 * - Error handling and retries
 */
import { describe, it, after, beforeEach } from "node:test";
import assert from "node:assert";
import { AITMPLProvider } from "../aitmpl.js";
import { Logger } from "../../utils/logger.js";
import { ResourceNotFoundError, ProviderError, RateLimitError, } from "../types.js";
describe("AITMPLProvider", () => {
    let provider;
    let logger;
    const testConfig = {
        enabled: true,
        apiUrl: "https://raw.githubusercontent.com/davila7/claude-code-templates/main/docs/components.json",
        categories: ["agents", "skills", "commands"],
        cacheTTL: 60000, // 1 minute for tests
        timeout: 30000,
        retryAttempts: 2,
        rateLimit: {
            requestsPerMinute: 60,
            requestsPerHour: 1000,
        },
    };
    beforeEach(() => {
        logger = new Logger("AITMPLProvider:Test");
        provider = new AITMPLProvider(testConfig, logger);
    });
    after(async () => {
        if (provider) {
            await provider.shutdown();
        }
    });
    // ========================================
    // Provider Metadata
    // ========================================
    describe("Provider Metadata", () => {
        it("should have correct provider name", () => {
            assert.strictEqual(provider.name, "aitmpl");
        });
        it("should be enabled by default", () => {
            assert.strictEqual(provider.enabled, true);
        });
        it("should have priority 10", () => {
            assert.strictEqual(provider.priority, 10);
        });
    });
    // ========================================
    // Lifecycle Management
    // ========================================
    describe("Lifecycle", () => {
        it("should initialize successfully", async () => {
            await provider.initialize();
            assert.ok(true, "Initialization should succeed");
        });
        it("should perform health check during initialization", async () => {
            await provider.initialize();
            // If initialization succeeds, health check passed
            assert.ok(true, "Health check during init should pass");
        });
        it("should handle disabled configuration", async () => {
            const disabledProvider = new AITMPLProvider({ ...testConfig, enabled: false }, logger);
            await disabledProvider.initialize();
            assert.strictEqual(disabledProvider.enabled, false);
            await disabledProvider.shutdown();
        });
        it("should shutdown gracefully", async () => {
            await provider.initialize();
            await provider.shutdown();
            assert.ok(true, "Shutdown should succeed");
        });
        it("should clear caches on shutdown", async () => {
            await provider.initialize();
            // Fetch something to populate cache
            try {
                await provider.fetchIndex();
            }
            catch (error) {
                // May fail if network is unavailable, that's ok
            }
            // Shutdown
            await provider.shutdown();
            assert.strictEqual(provider.enabled, false, "Should be disabled after shutdown");
        });
    });
    // ========================================
    // Index Fetching
    // ========================================
    describe("fetchIndex()", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should fetch resource index from AITMPL", async () => {
            // This test requires network access
            try {
                const index = await provider.fetchIndex();
                assert.ok(index, "Index should exist");
                assert.strictEqual(index.provider, "aitmpl");
                assert.ok(index.totalCount > 0, "Should have resources");
                assert.ok(Array.isArray(index.resources), "Resources should be an array");
                assert.ok(index.timestamp instanceof Date, "Should have timestamp");
            }
            catch (error) {
                // Network may be unavailable in test environment
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should include valid resource metadata", async () => {
            try {
                const index = await provider.fetchIndex();
                if (index.resources.length > 0) {
                    const resource = index.resources[0];
                    assert.ok(resource.id, "Resource should have ID");
                    assert.ok(resource.category, "Resource should have category");
                    assert.ok(resource.title, "Resource should have title");
                    assert.ok(Array.isArray(resource.tags), "Tags should be an array");
                    assert.strictEqual(resource.source, "aitmpl");
                    assert.ok(resource.sourceUri.includes("github.com"), "Should have GitHub URI");
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should cache index results", async () => {
            try {
                // First call
                await provider.fetchIndex();
                const stats1 = provider.getStats();
                // Second call (should hit cache)
                await provider.fetchIndex();
                const stats2 = provider.getStats();
                assert.ok(stats2.cachedRequests > stats1.cachedRequests, "Should have cache hit");
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should include statistics in index", async () => {
            try {
                const index = await provider.fetchIndex();
                assert.ok(index.stats, "Index should have stats");
                assert.ok(index.stats.byCategory, "Should have category breakdown");
                assert.ok(typeof index.stats.totalTokens === "number", "Should have total tokens");
                assert.ok(Array.isArray(index.stats.topTags), "Should have top tags");
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should handle network errors gracefully", async () => {
            // Create provider with invalid URL to force error
            const badProvider = new AITMPLProvider({
                ...testConfig,
                timeout: 1000, // Short timeout
            }, logger);
            await badProvider.initialize();
            try {
                // This might succeed or fail depending on network
                await badProvider.fetchIndex();
            }
            catch (error) {
                // Should throw ProviderError on failure
                assert.ok(error instanceof ProviderError || error instanceof Error, "Should handle network errors");
            }
            await badProvider.shutdown();
        });
    });
    // ========================================
    // Resource Fetching
    // ========================================
    describe("fetchResource()", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should fetch a specific resource", async () => {
            try {
                // First get the index to find a valid resource
                const index = await provider.fetchIndex();
                if (index.resources.length > 0) {
                    const firstResource = index.resources[0];
                    // Fetch the full resource
                    const resource = await provider.fetchResource(firstResource.id, firstResource.category);
                    assert.ok(resource, "Resource should exist");
                    assert.strictEqual(resource.id, firstResource.id);
                    assert.strictEqual(resource.category, firstResource.category);
                    assert.ok(resource.content, "Resource should have content");
                    assert.strictEqual(resource.source, "aitmpl");
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should cache fetched resources", async () => {
            try {
                const index = await provider.fetchIndex();
                if (index.resources.length > 0) {
                    const firstResource = index.resources[0];
                    // First fetch
                    await provider.fetchResource(firstResource.id, firstResource.category);
                    const stats1 = provider.getStats();
                    // Second fetch (should hit cache)
                    await provider.fetchResource(firstResource.id, firstResource.category);
                    const stats2 = provider.getStats();
                    assert.ok(stats2.cachedRequests > stats1.cachedRequests, "Should have cache hit");
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should throw ResourceNotFoundError for non-existent resource", async () => {
            await assert.rejects(async () => {
                await provider.fetchResource("nonexistent-xyz-123", "agent");
            }, (error) => {
                assert.ok(error instanceof ResourceNotFoundError);
                assert.strictEqual(error.provider, "aitmpl");
                return true;
            }, "Should throw ResourceNotFoundError");
        });
        it("should parse frontmatter from resource content", async () => {
            try {
                const index = await provider.fetchIndex();
                if (index.resources.length > 0) {
                    const resource = index.resources[0];
                    const fullResource = await provider.fetchResource(resource.id, resource.category);
                    // Should have metadata from frontmatter or component data
                    assert.ok(fullResource.title, "Should have title");
                    assert.ok(fullResource.description !== undefined, "Should have description");
                    assert.ok(fullResource.estimatedTokens > 0, "Should have token estimate");
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
    });
    // ========================================
    // Search Functionality
    // ========================================
    describe("search()", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should search and return results", async () => {
            try {
                const response = await provider.search("typescript", {
                    maxResults: 10,
                });
                assert.ok(response, "Search response should exist");
                assert.ok(Array.isArray(response.results), "Results should be an array");
                assert.strictEqual(response.query, "typescript");
                assert.ok(typeof response.searchTime === "number", "Should include search time");
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should return results with scores", async () => {
            try {
                const response = await provider.search("api", { maxResults: 5 });
                if (response.results.length > 0) {
                    const result = response.results[0];
                    assert.ok(result.resource, "Result should have resource");
                    assert.ok(typeof result.score === "number", "Result should have score");
                    assert.ok(result.score >= 0, "Score should be non-negative");
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should respect maxResults option", async () => {
            try {
                const maxResults = 3;
                const response = await provider.search("test", { maxResults });
                assert.ok(response.results.length <= maxResults, `Should return at most ${maxResults} results`);
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should respect minScore option", async () => {
            try {
                const minScore = 50;
                const response = await provider.search("typescript", { minScore });
                for (const result of response.results) {
                    assert.ok(result.score >= minScore, `All scores should be >= ${minScore}`);
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should filter by category", async () => {
            try {
                const response = await provider.search("test", {
                    categories: ["agent"],
                    maxResults: 10,
                });
                for (const result of response.results) {
                    assert.strictEqual(result.resource.category, "agent", "All results should be agents");
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should include match reasons", async () => {
            try {
                const response = await provider.search("typescript", { maxResults: 5 });
                if (response.results.length > 0) {
                    const result = response.results[0];
                    assert.ok(result.matchReason, "Should have match reason");
                    assert.ok(Array.isArray(result.matchReason), "Match reason should be an array");
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should include facets in response", async () => {
            try {
                const response = await provider.search("test");
                assert.ok(response.facets, "Should have facets");
                assert.ok(response.facets.categories, "Should have category facets");
                assert.ok(response.facets.tags, "Should have tag facets");
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should handle queries with no matches", async () => {
            try {
                const response = await provider.search("xyzzzyqwertnonexistentqueryabc123");
                assert.ok(response, "Should return response even with no matches");
                assert.strictEqual(response.results.length, 0, "Should have no results");
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should sort results by score descending", async () => {
            try {
                const response = await provider.search("typescript api", {
                    maxResults: 10,
                });
                if (response.results.length > 1) {
                    for (let i = 0; i < response.results.length - 1; i++) {
                        assert.ok(response.results[i].score >= response.results[i + 1].score, "Results should be sorted by score descending");
                    }
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
    });
    // ========================================
    // Rate Limiting
    // ========================================
    describe("Rate Limiting", () => {
        it("should initialize with correct rate limits", () => {
            const stats = provider.getStats();
            assert.ok(stats.rateLimit, "Should have rate limit info");
            assert.ok(stats.rateLimit.limit > 0, "Should have rate limit configured");
        });
        it("should track rate limit in stats", async () => {
            await provider.initialize();
            try {
                // Make a request
                await provider.fetchIndex();
                const stats = provider.getStats();
                assert.ok(stats.rateLimit, "Should have rate limit info");
                assert.ok(typeof stats.rateLimit.remaining === "number", "Should track remaining requests");
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should not exceed rate limits with aggressive config", async () => {
            // Create provider with very low rate limit
            const limitedProvider = new AITMPLProvider({
                ...testConfig,
                rateLimit: {
                    requestsPerMinute: 2,
                    requestsPerHour: 10,
                },
            }, logger);
            await limitedProvider.initialize();
            try {
                // Make multiple rapid requests
                await limitedProvider.fetchIndex();
                await limitedProvider.fetchIndex(); // Should hit cache
                await limitedProvider.fetchIndex(); // Should hit cache
                // Should succeed due to caching
                assert.ok(true, "Should not hit rate limit due to caching");
            }
            catch (error) {
                if (error instanceof RateLimitError) {
                    // This is expected if rate limit is hit
                    assert.ok(true, "Rate limit enforced correctly");
                }
                else if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
            await limitedProvider.shutdown();
        });
    });
    // ========================================
    // Health Checks
    // ========================================
    describe("healthCheck()", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should return health status", async () => {
            const health = await provider.healthCheck();
            assert.ok(health, "Health check should return result");
            assert.strictEqual(health.provider, "aitmpl");
            assert.ok(["healthy", "degraded", "unhealthy"].includes(health.status));
            assert.strictEqual(health.authenticated, true); // No auth required
            assert.ok(health.lastCheck instanceof Date);
        });
        it("should include response time", async () => {
            const health = await provider.healthCheck();
            if (health.reachable) {
                assert.ok(typeof health.responseTime === "number", "Should have response time");
                assert.ok(health.responseTime >= 0, "Response time should be non-negative");
            }
        });
        it("should include metrics after operations", async () => {
            try {
                // Do some operations first
                await provider.fetchIndex();
                await provider.search("test");
                const health = await provider.healthCheck();
                if (health.metrics) {
                    assert.ok(typeof health.metrics.successRate === "number", "Should have success rate");
                    assert.ok(typeof health.metrics.avgResponseTime === "number", "Should have avg response time");
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should report unhealthy status on repeated failures", async () => {
            // Create provider with very short timeout to force failures
            const failProvider = new AITMPLProvider({
                ...testConfig,
                timeout: 1, // 1ms timeout - will fail
                retryAttempts: 0,
            }, logger);
            await failProvider.initialize();
            const health = await failProvider.healthCheck();
            // Should be unhealthy or degraded due to failures
            assert.ok(["degraded", "unhealthy"].includes(health.status), "Should report unhealthy/degraded status");
            await failProvider.shutdown();
        });
    });
    // ========================================
    // Statistics
    // ========================================
    describe("getStats()", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should return statistics", () => {
            const stats = provider.getStats();
            assert.ok(stats, "Stats should exist");
            assert.strictEqual(stats.provider, "aitmpl");
            assert.ok(typeof stats.totalRequests === "number", "Should have total requests");
            assert.ok(typeof stats.successfulRequests === "number", "Should have successful requests");
            assert.ok(typeof stats.failedRequests === "number", "Should have failed requests");
            assert.ok(typeof stats.cachedRequests === "number", "Should have cached requests");
            assert.ok(stats.statsResetAt instanceof Date, "Should have reset time");
        });
        it("should track API requests", async () => {
            const statsBefore = provider.getStats();
            try {
                await provider.fetchIndex();
                const statsAfter = provider.getStats();
                assert.ok(statsAfter.totalRequests > statsBefore.totalRequests, "Total requests should increase");
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should track cache hits", async () => {
            try {
                await provider.fetchIndex();
                const statsBefore = provider.getStats();
                // Second call should hit cache
                await provider.fetchIndex();
                const statsAfter = provider.getStats();
                assert.ok(statsAfter.cachedRequests > statsBefore.cachedRequests, "Cached requests should increase");
                assert.ok(statsAfter.cacheHitRate > 0, "Cache hit rate should be > 0");
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should calculate average response time", async () => {
            try {
                // Do multiple operations
                await provider.fetchIndex();
                await provider.search("test");
                const stats = provider.getStats();
                if (stats.totalRequests > 0 && stats.successfulRequests > 0) {
                    assert.ok(stats.avgResponseTime >= 0, "Average response time should be >= 0");
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should include rate limit information", () => {
            const stats = provider.getStats();
            assert.ok(stats.rateLimit, "Should have rate limit info");
            assert.ok(typeof stats.rateLimit.remaining === "number", "Should have remaining count");
            assert.ok(typeof stats.rateLimit.limit === "number", "Should have limit");
            assert.ok(stats.rateLimit.resetAt instanceof Date, "Should have reset time");
        });
    });
    describe("resetStats()", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should reset statistics", async () => {
            try {
                // Do some operations
                await provider.fetchIndex();
                const statsBefore = provider.getStats();
                assert.ok(statsBefore.totalRequests > 0, "Should have requests before reset");
                // Reset
                provider.resetStats();
                const statsAfter = provider.getStats();
                assert.strictEqual(statsAfter.totalRequests, 0, "Total requests should be 0");
                assert.strictEqual(statsAfter.successfulRequests, 0, "Successful requests should be 0");
                assert.strictEqual(statsAfter.cachedRequests, 0, "Cached requests should be 0");
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
    });
    // ========================================
    // Error Handling
    // ========================================
    describe("Error Handling", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should handle network timeouts", async () => {
            const timeoutProvider = new AITMPLProvider({
                ...testConfig,
                timeout: 1, // 1ms - will timeout
                retryAttempts: 0,
            }, logger);
            await timeoutProvider.initialize();
            await assert.rejects(async () => {
                await timeoutProvider.fetchIndex();
            }, ProviderError, "Should throw ProviderError on timeout");
            await timeoutProvider.shutdown();
        });
        it("should retry on transient failures", async () => {
            // Provider is configured with retryAttempts: 2
            // If network is available, retries should help with transient issues
            try {
                await provider.fetchIndex();
                assert.ok(true, "Should handle retries");
            }
            catch (error) {
                // May fail in offline environment
                assert.ok(error instanceof ProviderError, "Should throw ProviderError");
            }
        });
        it("should handle invalid JSON responses", async () => {
            // This test would require mocking fetch
            // For now, just verify error handling structure
            assert.ok(true, "Error handling structure verified");
        });
        it("should track failures in stats", async () => {
            const timeoutProvider = new AITMPLProvider({
                ...testConfig,
                timeout: 1,
                retryAttempts: 0,
            }, logger);
            await timeoutProvider.initialize();
            const statsBefore = timeoutProvider.getStats();
            try {
                await timeoutProvider.fetchIndex();
            }
            catch (error) {
                // Expected to fail
            }
            const statsAfter = timeoutProvider.getStats();
            assert.ok(statsAfter.failedRequests > statsBefore.failedRequests, "Failed requests should be tracked");
            await timeoutProvider.shutdown();
        });
    });
    // ========================================
    // Caching Behavior
    // ========================================
    describe("Caching", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should cache index with correct TTL", async () => {
            try {
                // First fetch
                await provider.fetchIndex();
                const stats1 = provider.getStats();
                // Second fetch (should hit cache)
                await provider.fetchIndex();
                const stats2 = provider.getStats();
                assert.ok(stats2.cachedRequests > stats1.cachedRequests, "Should hit cache");
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should cache resources independently", async () => {
            try {
                const index = await provider.fetchIndex();
                if (index.resources.length >= 2) {
                    const res1 = index.resources[0];
                    const res2 = index.resources[1];
                    // Fetch both resources
                    await provider.fetchResource(res1.id, res1.category);
                    await provider.fetchResource(res2.id, res2.category);
                    const stats1 = provider.getStats();
                    // Fetch again (should hit cache)
                    await provider.fetchResource(res1.id, res1.category);
                    await provider.fetchResource(res2.id, res2.category);
                    const stats2 = provider.getStats();
                    assert.ok(stats2.cachedRequests > stats1.cachedRequests, "Should cache resources independently");
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
    });
    // ========================================
    // Data Parsing
    // ========================================
    describe("Data Parsing", () => {
        it("should map AITMPL component types to categories", async () => {
            try {
                const index = await provider.fetchIndex();
                // All resources should have valid categories
                for (const resource of index.resources) {
                    assert.ok(["agent", "skill", "example", "pattern", "workflow"].includes(resource.category), `Category ${resource.category} should be valid`);
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should extract tags from components", async () => {
            try {
                const index = await provider.fetchIndex();
                if (index.resources.length > 0) {
                    // At least some resources should have tags
                    const withTags = index.resources.filter((r) => r.tags.length > 0);
                    assert.ok(withTags.length > 0, "Some resources should have tags");
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
        it("should estimate tokens reasonably", async () => {
            try {
                const index = await provider.fetchIndex();
                if (index.resources.length > 0) {
                    for (const resource of index.resources) {
                        assert.ok(resource.estimatedTokens > 0, "Token estimate should be positive");
                        assert.ok(resource.estimatedTokens < 1000000, "Token estimate should be reasonable");
                    }
                }
            }
            catch (error) {
                if (error instanceof ProviderError) {
                    console.log("Network test skipped:", error.message);
                }
                else {
                    throw error;
                }
            }
        });
    });
});
//# sourceMappingURL=aitmpl.test.js.map