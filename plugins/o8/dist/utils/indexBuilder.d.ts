/**
 * Index Builder: Generates useWhen-based indexes for efficient resource lookup
 *
 * Scans all fragment files, extracts useWhen scenarios, and builds:
 * 1. Main useWhen index (scenario hash -> metadata)
 * 2. Inverted keyword index (keyword -> scenario hashes)
 * 3. Quick lookup cache (common queries -> results)
 */
/**
 * Index entry for a single useWhen scenario
 */
export interface UseWhenIndexEntry {
    /** The useWhen scenario text */
    scenario: string;
    /** Extracted keywords for matching */
    keywords: string[];
    /** MCP URI to load the fragment */
    uri: string;
    /** Fragment category */
    category: "agent" | "skill" | "example" | "pattern" | "workflow";
    /** Estimated token count */
    estimatedTokens: number;
    /** Default relevance score */
    relevance: number;
}
/**
 * Main useWhen index structure
 */
export interface UseWhenIndex {
    /** Index version */
    version: string;
    /** Generation timestamp */
    generated: string;
    /** Total number of fragments indexed */
    totalFragments: number;
    /** Map of scenario hash -> metadata */
    index: Record<string, UseWhenIndexEntry>;
    /** Statistics about the index */
    stats: {
        totalScenarios: number;
        avgScenariosPerFragment: number;
        avgKeywordsPerScenario: number;
        indexSizeBytes: number;
    };
}
/**
 * Inverted keyword index structure
 */
export interface KeywordIndex {
    /** Index version */
    version: string;
    /** Map of keyword -> array of scenario hashes */
    keywords: Record<string, string[]>;
    /** Statistics */
    stats: {
        totalKeywords: number;
        avgScenariosPerKeyword: number;
    };
}
/**
 * Quick lookup cache entry
 */
export interface QuickLookupEntry {
    /** Array of MCP URIs for this query */
    uris: string[];
    /** Total estimated tokens */
    tokens: number;
}
/**
 * Quick lookup cache structure
 */
export interface QuickLookupCache {
    /** Cache version */
    version: string;
    /** Map of normalized query -> cached result */
    commonQueries: Record<string, QuickLookupEntry>;
}
/**
 * IndexBuilder class handles generation of all index files
 */
export declare class IndexBuilder {
    private resourcesPath;
    constructor(resourcesPath?: string);
    /**
     * Build all indexes from fragment files
     *
     * @returns Object containing all generated indexes
     */
    buildIndexes(): Promise<{
        useWhenIndex: UseWhenIndex;
        keywordIndex: KeywordIndex;
        quickLookup: QuickLookupCache;
    }>;
    /**
     * Scan all fragment files from resources directory
     *
     * @returns Array of ResourceFragment objects
     */
    private scanAllFragments;
    /**
     * Recursively scan a directory for fragment files
     *
     * @param dirPath - Directory to scan
     * @param category - Fragment category
     * @param categoryName - Category name for ID generation
     * @param fragments - Array to accumulate fragments
     */
    private scanFragmentsDirectory;
    /**
     * Parse a markdown file into a ResourceFragment
     *
     * @param content - File content
     * @param category - Fragment category
     * @param categoryName - Category name
     * @param filePath - Full file path
     * @returns ResourceFragment object
     */
    private parseResourceFragment;
    /**
     * Build main useWhen index from fragments
     *
     * @param fragments - Array of fragments
     * @returns UseWhen index and mapping of scenarios to fragments
     */
    private buildUseWhenIndex;
    /**
     * Build inverted keyword index from useWhen index
     *
     * @param useWhenIndex - Main useWhen index
     * @returns Keyword index
     */
    private buildKeywordIndex;
    /**
     * Build quick lookup cache for common queries
     *
     * @param fragments - Array of fragments
     * @param scenarioToFragment - Mapping of scenario hashes to fragments
     * @returns Quick lookup cache
     */
    private buildQuickLookup;
    /**
     * Generate stable hash for a scenario
     *
     * @param scenario - Scenario text
     * @param fragmentId - Fragment ID for additional uniqueness
     * @returns Hash string
     */
    private hashScenario;
    /**
     * Extract keywords from text (reuses fuzzyMatcher logic)
     *
     * @param text - Text to extract keywords from
     * @returns Array of keywords
     */
    extractKeywords(text: string): string[];
    /**
     * Convert fragment to MCP URI
     *
     * @param fragment - Resource fragment
     * @returns MCP URI string
     */
    private fragmentToURI;
    /**
     * Write index to file
     *
     * @param index - Index object to write
     * @param filePath - Target file path
     */
    writeIndex(index: any, filePath: string): Promise<void>;
}
//# sourceMappingURL=indexBuilder.d.ts.map