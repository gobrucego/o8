/**
 * IndexLookup: Lightweight useWhen index-based resource matching
 *
 * Provides 85-95% token reduction compared to fuzzy matching by using
 * pre-built keyword indexes for O(1) lookups instead of O(n*m*k) scoring.
 *
 * Three-tier strategy:
 * 1. Quick lookup cache (O(1), ~10ms) - common queries
 * 2. Keyword-based index (O(k), ~50ms) - keyword intersection
 * 3. Fuzzy fallback (O(n), ~200ms) - edge cases
 */
import { promises as fs } from "fs";
import { join } from "path";
import { Logger } from "./logger.js";
import { FuzzyMatcher } from "./fuzzyMatcher.js";
const logger = new Logger("IndexLookup");
/**
 * IndexLookup class implements lightweight index-based resource matching
 */
export class IndexLookup {
    index = null;
    quickLookupCache = new Map();
    indexLoadPromise = null;
    fuzzyMatcher;
    resourcesPath;
    cacheTTL = 1000 * 60 * 15; // 15 minutes
    constructor(resourcesPath) {
        this.resourcesPath =
            resourcesPath || process.env.RESOURCES_PATH || join(process.cwd(), "resources");
        this.fuzzyMatcher = new FuzzyMatcher();
    }
    /**
     * Main lookup method with three-tier strategy
     *
     * @param query - User's search query
     * @param options - Lookup options
     * @returns Formatted result content
     */
    async lookup(query, options) {
        const startTime = Date.now();
        let tier = "index";
        try {
            // Ensure index is loaded
            if (!this.index) {
                await this.loadIndexes();
            }
            // TIER 1: Quick lookup cache
            const normalized = this.normalizeQuery(query);
            const cached = this.quickLookupCache.get(normalized);
            if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
                tier = "quick";
                const latencyMs = Date.now() - startTime;
                logger.debug("Quick lookup cache hit", { query, latencyMs });
                this.logMetrics({
                    query,
                    timestamp: Date.now(),
                    tier,
                    latencyMs,
                    resultsCount: 0, // Cached, don't count
                    tokenCost: Math.ceil(cached.content.length / 4),
                });
                return cached.content;
            }
            // TIER 2: Keyword-based index search
            const keywords = this.extractKeywords(query);
            logger.debug("Extracted keywords", { keywords });
            const matches = this.findMatchingScenarios(keywords, options.categories);
            logger.debug(`Found ${matches.length} matching scenarios`);
            // Check if we have enough matches
            const minResults = 2;
            if (matches.length >= minResults) {
                const result = this.formatCompactResult(matches, options);
                // Cache for next time
                this.quickLookupCache.set(normalized, {
                    content: result,
                    timestamp: Date.now(),
                });
                const latencyMs = Date.now() - startTime;
                this.logMetrics({
                    query,
                    timestamp: Date.now(),
                    tier,
                    latencyMs,
                    resultsCount: Math.min(matches.length, options.maxResults || 5),
                    tokenCost: Math.ceil(result.length / 4),
                });
                logger.info("Index lookup success", {
                    matches: matches.length,
                    latencyMs
                });
                return result;
            }
            // TIER 3: Fallback to fuzzy match
            tier = "fuzzy-fallback";
            logger.info("Index lookup fallback to fuzzy", {
                query,
                matchCount: matches.length,
                reason: "insufficient matches",
            });
            return await this.fuzzyFallback(query, options, startTime);
        }
        catch (error) {
            logger.error("Index lookup error", error);
            // Fallback to fuzzy on error
            tier = "fuzzy-fallback";
            return await this.fuzzyFallback(query, options, startTime);
        }
    }
    /**
     * Load all index files
     */
    async loadIndexes() {
        // If already loading, wait for that promise
        if (this.indexLoadPromise) {
            return this.indexLoadPromise;
        }
        // Start loading
        this.indexLoadPromise = this._loadIndexesImpl();
        await this.indexLoadPromise;
        this.indexLoadPromise = null;
    }
    /**
     * Internal implementation of index loading
     */
    async _loadIndexesImpl() {
        const indexPath = join(this.resourcesPath, ".index", "usewhen-index.json");
        const keywordIndexPath = join(this.resourcesPath, ".index", "keyword-index.json");
        logger.info("Loading useWhen indexes", { indexPath, keywordIndexPath });
        try {
            // Load main index
            const indexContent = await fs.readFile(indexPath, "utf-8");
            const parsedIndex = JSON.parse(indexContent);
            // Validate main index structure
            if (!parsedIndex || typeof parsedIndex !== 'object') {
                throw new Error("Invalid index format: not an object");
            }
            if (!parsedIndex.index || typeof parsedIndex.index !== 'object') {
                throw new Error("Invalid index format: missing 'index' property");
            }
            if (!parsedIndex.stats || typeof parsedIndex.stats !== 'object') {
                throw new Error("Invalid index format: missing 'stats' property");
            }
            // Load keyword index
            const keywordContent = await fs.readFile(keywordIndexPath, "utf-8");
            const parsedKeywords = JSON.parse(keywordContent);
            // Validate keyword index structure
            if (!parsedKeywords || typeof parsedKeywords !== 'object') {
                throw new Error("Invalid keyword index format: not an object");
            }
            if (!parsedKeywords.keywords || typeof parsedKeywords.keywords !== 'object') {
                throw new Error("Invalid keyword index format: missing 'keywords' property");
            }
            // Combine into single index structure
            this.index = {
                version: parsedIndex.version,
                generated: parsedIndex.generated,
                totalFragments: parsedIndex.totalFragments,
                index: parsedIndex.index,
                keywords: parsedKeywords.keywords,
                stats: parsedIndex.stats
            };
            logger.info("Indexes loaded successfully", {
                totalScenarios: this.index.stats.totalScenarios,
                totalKeywords: Object.keys(this.index.keywords).length,
                totalFragments: this.index.totalFragments,
            });
        }
        catch (error) {
            logger.error("Failed to load indexes", error);
            throw new Error(`Failed to load useWhen indexes: ${error}`);
        }
    }
    /**
     * Find matching scenarios using keyword intersection
     */
    findMatchingScenarios(keywords, categoryFilter) {
        if (!this.index) {
            throw new Error("Index not loaded");
        }
        const candidateHashes = new Set();
        // Intersect keyword matches from inverted index
        for (const keyword of keywords) {
            const hashes = this.index.keywords[keyword] || [];
            hashes.forEach((h) => candidateHashes.add(h));
        }
        logger.debug(`Found ${candidateHashes.size} candidate scenarios`);
        // Get full entries
        const candidates = Array.from(candidateHashes)
            .map((hash) => this.index.index[hash])
            .filter((entry) => entry !== undefined);
        // Filter by category if specified
        const filtered = categoryFilter && categoryFilter.length > 0
            ? candidates.filter((c) => categoryFilter.includes(c.category))
            : candidates;
        logger.debug(`Filtered to ${filtered.length} scenarios by category`);
        // Score by relevance
        const scored = this.scoreByRelevance(filtered, keywords);
        return scored;
    }
    /**
     * Score scenarios by keyword overlap
     */
    scoreByRelevance(scenarios, queryKeywords) {
        return scenarios
            .map((scenario) => {
            let score = 0;
            const scenarioKeywords = new Set(scenario.keywords);
            // Exact keyword matches (+20 each)
            for (const keyword of queryKeywords) {
                if (scenarioKeywords.has(keyword)) {
                    score += 20;
                }
            }
            // Partial keyword matches (+10 each)
            for (const keyword of queryKeywords) {
                for (const scenarioKeyword of scenarioKeywords) {
                    if (scenarioKeyword.includes(keyword) ||
                        keyword.includes(scenarioKeyword)) {
                        score += 10;
                        break; // Only count once per query keyword
                    }
                }
            }
            return { ...scenario, score };
        })
            .filter((s) => s.score > 0) // Only return matches with some score
            .sort((a, b) => b.score - a.score);
    }
    /**
     * Format compact result (50-120 tokens)
     */
    formatCompactResult(matches, options) {
        const maxResults = options.maxResults || 5;
        const topMatches = matches.slice(0, maxResults);
        const totalTokens = topMatches.reduce((sum, m) => sum + m.estimatedTokens, 0);
        let output = `# Resource Matches: ${options.query}\n\n`;
        output += `**Found ${topMatches.length} relevant resources (${totalTokens} tokens total)**\n\n`;
        output += `## Top Matches\n\n`;
        topMatches.forEach((match, idx) => {
            const categoryLabel = this.capitalize(match.category);
            const resourceName = match.uri.split("/").pop() || "unknown";
            output += `${idx + 1}. **${categoryLabel}: ${resourceName}** (~${match.estimatedTokens} tokens)\n`;
            output += `   @${match.uri}\n\n`;
        });
        output += `**To load:** Simply reference the o8:// URIs shown above\n`;
        output += `**To refine:** Add more specific keywords to query\n`;
        return output;
    }
    /**
     * Fallback to fuzzy matcher
     */
    async fuzzyFallback(query, options, startTime) {
        logger.info("Using fuzzy matcher fallback");
        const matchRequest = {
            query,
            mode: "catalog",
            maxResults: options.maxResults || 15,
            categories: options.categories,
            minScore: options.minScore,
        };
        const result = await this.fuzzyMatcher.match(matchRequest);
        const latencyMs = Date.now() - startTime;
        this.logMetrics({
            query,
            timestamp: Date.now(),
            tier: "fuzzy-fallback",
            latencyMs,
            resultsCount: result.fragments.length,
            tokenCost: Math.ceil(result.assembledContent.length / 4),
        });
        return result.assembledContent;
    }
    /**
     * Extract keywords from query
     */
    extractKeywords(query) {
        const normalized = query.toLowerCase().replace(/[^\w\s-]/g, " ");
        const stopWords = new Set([
            "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
            "been", "being", "have", "has", "had", "do", "does", "did", "will",
            "would", "should", "could", "may", "might", "can", "i", "you", "he",
            "she", "it", "we", "they", "this", "that", "these", "those",
        ]);
        const words = normalized
            .split(/\s+/)
            .filter((word) => word.length > 1 && !stopWords.has(word));
        return Array.from(new Set(words));
    }
    /**
     * Normalize query for cache key
     */
    normalizeQuery(query) {
        return query.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    }
    /**
     * Capitalize first letter
     */
    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
    /**
     * Log query metrics
     */
    logMetrics(metrics) {
        logger.info("IndexLookup query metrics", metrics);
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.quickLookupCache.size,
            hits: 0, // Could track this separately
            indexLoaded: this.index !== null,
        };
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.quickLookupCache.clear();
        logger.info("Index lookup cache cleared");
    }
}
//# sourceMappingURL=indexLookup.js.map