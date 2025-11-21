/**
 * Fuzzy matching system for dynamic resource assembly
 * Matches user queries against resource fragments and assembles relevant content
 */
/**
 * Resource fragment with metadata for matching
 */
export interface ResourceFragment {
    /** Unique identifier for the resource */
    id: string;
    /** Category of the resource */
    category: "agent" | "skill" | "example" | "pattern" | "workflow";
    /** Tags for keyword matching */
    tags: string[];
    /** Capabilities this resource provides */
    capabilities: string[];
    /** Use cases when this resource is relevant */
    useWhen: string[];
    /** Estimated token count for the resource */
    estimatedTokens: number;
    /** The actual content of the resource */
    content: string;
}
/**
 * Request for matching resources to a query
 */
export interface MatchRequest {
    /** User's query or request */
    query: string;
    /** Optional category filter (single category) */
    category?: string;
    /** Optional categories filter (multiple categories) */
    categories?: string[];
    /** Maximum tokens to include in result (default: 3000) */
    maxTokens?: number;
    /** Tags that must be present in matched resources */
    requiredTags?: string[];
    /** Response mode: 'full' returns content, 'catalog' returns lightweight index, 'index' uses useWhen index, 'minimal' returns ultra-compact JSON */
    mode?: 'full' | 'catalog' | 'index' | 'minimal';
    /** Maximum number of results to return in catalog mode */
    maxResults?: number;
    /** Minimum relevance score threshold (0-100) */
    minScore?: number;
}
/**
 * Result of fuzzy matching operation
 */
export interface MatchResult {
    /** Selected resource fragments */
    fragments: ResourceFragment[];
    /** Total tokens in assembled content */
    totalTokens: number;
    /** Relevance scores for each fragment */
    matchScores: number[];
    /** Assembled content ready for use */
    assembledContent: string;
}
/**
 * Scored resource fragment
 */
interface ScoredResource {
    resource: ResourceFragment;
    score: number;
}
/**
 * FuzzyMatcher class implements intelligent resource matching and assembly
 *
 * Matches user queries against a library of resource fragments and assembles
 * the most relevant content within a token budget.
 */
export declare class FuzzyMatcher {
    private resourceIndex;
    private indexLoaded;
    private indexLoadPromise;
    private resourcesPath;
    constructor();
    /**
     * Main matching algorithm
     *
     * @param request - The match request with query and filters
     * @returns Promise resolving to match result with assembled content
     *
     * @example
     * ```typescript
     * const matcher = new FuzzyMatcher();
     * const result = await matcher.match({
     *   query: "build typescript rest api",
     *   maxTokens: 2500
     * });
     * console.log(result.assembledContent);
     * ```
     */
    match(request: MatchRequest): Promise<MatchResult>;
    /**
     * Extract keywords from user query
     *
     * Normalizes query text and extracts meaningful keywords by:
     * - Converting to lowercase
     * - Removing common stop words
     * - Splitting on whitespace and punctuation
     * - Filtering out short words
     *
     * @param query - User's query string
     * @returns Array of extracted keywords
     *
     * @example
     * ```typescript
     * const keywords = matcher.extractKeywords("Build a TypeScript REST API");
     * // Returns: ["build", "typescript", "rest", "api"]
     * ```
     */
    extractKeywords(query: string): string[];
    /**
     * Calculate relevance score for a resource
     *
     * Scoring algorithm considers:
     * - EXACT matches in tags (+15 per match)
     * - EXACT matches in capabilities (+12 per match)
     * - EXACT matches in useWhen (+8 per match)
     * - FUZZY matches (Levenshtein-based, scaled by similarity)
     * - Multi-keyword phrase matching (+20 for phrases)
     * - Category filter bonus (+15 if matches)
     * - Required tags (must have all or score = 0)
     * - Size preference (smaller resources < 1000 tokens get +5)
     *
     * PERFORMANCE OPTIMIZATIONS:
     * - Pre-compute lowercase versions of resource fields (done once at index load)
     * - Use Sets for O(1) tag lookup instead of array.includes
     * - Batch keyword processing to reduce iterations
     * - Early exit on disqualification
     * - Fuzzy matching only for keywords without exact matches
     *
     * @param resource - Resource fragment to score
     * @param keywords - Extracted keywords from query
     * @param request - Original match request
     * @returns Relevance score (0 = no match, higher = more relevant)
     *
     * @example
     * ```typescript
     * const score = matcher.calculateScore(resource, ["typescript", "api"], request);
     * // Returns: 25+ (if resource has matching tags and capabilities)
     * ```
     */
    calculateScore(resource: ResourceFragment, keywords: string[], request: MatchRequest): number;
    /**
     * Calculate Levenshtein-based similarity between two strings
     * Returns a value between 0 (no similarity) and 1 (identical)
     *
     * Uses normalized Levenshtein distance for fuzzy matching.
     * This helps catch typos and minor variations in keywords.
     *
     * @param str1 - First string (keyword)
     * @param str2 - Second string (field word)
     * @returns Similarity score (0.0 to 1.0)
     *
     * @example
     * ```typescript
     * calculateLevenshteinSimilarity("typescript", "typscript") // Returns ~0.9
     * calculateLevenshteinSimilarity("async", "sync") // Returns ~0.6
     * calculateLevenshteinSimilarity("foo", "bar") // Returns ~0.0
     * ```
     */
    private calculateLevenshteinSimilarity;
    /**
     * Calculate Levenshtein distance between two strings
     * Returns the minimum number of single-character edits required
     *
     * Optimized implementation with single-row space complexity O(n)
     * instead of full matrix O(m*n)
     *
     * @param str1 - First string
     * @param str2 - Second string
     * @returns Edit distance (0 = identical)
     */
    private levenshteinDistance;
    /**
     * Select top resources within token budget
     *
     * Greedily selects highest-scoring resources while staying within budget.
     * Always includes top 3 resources even if they exceed 80% of budget.
     *
     * @param scored - Array of scored resources (should be sorted by score)
     * @param maxTokens - Maximum token budget
     * @returns Selected resources within budget
     *
     * @example
     * ```typescript
     * const selected = matcher.selectWithinBudget(scoredResources, 3000);
     * // Returns top resources totaling <= 3000 tokens
     * ```
     */
    selectWithinBudget(scored: ScoredResource[], maxTokens: number): ScoredResource[];
    /**
     * Assemble final content from selected fragments
     *
     * Orders fragments by category (agents -> skills -> patterns -> examples)
     * and formats them with clear separators and metadata.
     *
     * @param fragments - Selected scored resources
     * @returns Object with assembled content and total token count
     *
     * @example
     * ```typescript
     * const assembled = matcher.assembleContent(selectedFragments);
     * console.log(assembled.content); // Formatted content ready for use
     * console.log(assembled.tokens);  // Total token count
     * ```
     */
    assembleContent(fragments: ScoredResource[]): {
        content: string;
        tokens: number;
    };
    /**
     * Assemble catalog (lightweight index) from selected fragments
     *
     * Returns a compact listing with MCP URIs for on-demand loading.
     * Each entry includes: title, tags, capabilities, estimated tokens, and MCP URI.
     *
     * @param fragments - Selected scored resources
     * @returns Object with catalog content and total token count
     */
    assembleCatalog(fragments: ScoredResource[]): {
        content: string;
        tokens: number;
    };
    /**
     * Assemble minimal JSON response (ultra-compact)
     *
     * Returns bare minimum: URIs, scores, tokens, and top tags only.
     * Token cost: ~300-500 tokens (vs ~1500 for catalog mode)
     *
     * @param fragments - Selected scored resources
     * @returns Object with minimal JSON content and token count
     */
    assembleMinimal(fragments: ScoredResource[]): {
        content: string;
        tokens: number;
    };
    /**
     * Load resource index (cached)
     *
     * Scans the resources directory recursively for markdown files in category directories,
     * parses frontmatter metadata, and builds an in-memory index of ResourceFragment objects.
     * Results are cached for performance.
     *
     * @returns Promise resolving to array of resource fragments
     */
    private loadResourceIndex;
    /**
     * Internal implementation of resource index loading
     * Scans all category directories in parallel for optimal performance
     * @private
     */
    private _loadResourceIndexImpl;
    /**
     * Recursively scan a directory for fragment files
     * @private
     */
    private _scanFragmentsDirectory;
    /**
     * Parse a markdown file into a ResourceFragment
     * @private
     */
    private _parseResourceFragment;
    /**
     * Set resource index manually (useful for testing)
     *
     * @param resources - Array of resource fragments
     */
    setResourceIndex(resources: ResourceFragment[]): void;
    /**
     * Get human-readable label for resource category
     *
     * @param category - Resource category
     * @returns Formatted category label
     */
    private categoryLabel;
}
export {};
//# sourceMappingURL=fuzzyMatcher.d.ts.map