/**
 * URI Parser for o8:// protocol
 * Handles both static and dynamic (match-based) URIs
 *
 * @example Static URI
 * o8://agents/typescript-developer
 *
 * @example Dynamic URI
 * o8://agents/match?query=build+api&maxTokens=2000&tags=typescript,async
 */
/**
 * Query parameters for dynamic URI matching
 */
export interface MatchParams {
    /** Search query for fuzzy matching */
    query: string;
    /** Maximum tokens to include in assembled response (default: 3000) */
    maxTokens?: number;
    /** Required tags filter (comma-separated) */
    tags?: string[];
    /** Categories to search within (comma-separated) */
    categories?: string[];
    /** Response mode: 'full' returns content, 'catalog' returns lightweight index, 'index' uses useWhen index (default: 'catalog') */
    mode?: 'full' | 'catalog' | 'index';
    /** Maximum number of results to return in catalog mode (default: 15) */
    maxResults?: number;
    /** Minimum relevance score threshold (0-100, default: 10) */
    minScore?: number;
}
/**
 * Parsed static URI result
 */
export interface StaticURI {
    /** Discriminator for union type */
    type: "static";
    /** Resource category (e.g., 'agents', 'skills', 'examples', 'patterns') */
    category: string;
    /** Specific resource identifier */
    resourceId: string;
}
/**
 * Parsed dynamic URI result
 */
export interface DynamicURI {
    /** Discriminator for union type */
    type: "dynamic";
    /** Optional category filter for matching */
    category?: string;
    /** Match parameters extracted from query string */
    matchParams: MatchParams;
}
/**
 * Discriminated union of parsed URI types
 */
export type ParsedURI = StaticURI | DynamicURI;
/**
 * URI Parser for o8:// protocol
 *
 * Parses both static resource URIs and dynamic match URIs with query parameters.
 *
 * @example
 * ```typescript
 * const parser = new URIParser();
 *
 * // Parse static URI
 * const static = parser.parse('o8://agents/typescript-developer');
 * // { type: 'static', category: 'agents', resourceId: 'typescript-developer' }
 *
 * // Parse dynamic URI
 * const dynamic = parser.parse('o8://agents/match?query=build+api&maxTokens=2000');
 * // { type: 'dynamic', category: 'agents', matchParams: { query: 'build api', maxTokens: 2000 } }
 * ```
 */
export declare class URIParser {
    private static readonly PROTOCOL;
    private static readonly MATCH_PATH;
    private static readonly DEFAULT_MAX_TOKENS;
    /**
     * Parse an o8:// URI into its components
     *
     * @param uri - The URI to parse (e.g., 'o8://agents/typescript-developer')
     * @returns Parsed URI with discriminated type
     * @throws {Error} If URI format is invalid
     */
    parse(uri: string): ParsedURI;
    /**
     * Parse a static resource URI
     *
     * @param path - URI path without protocol (e.g., 'agents/typescript-developer')
     * @returns StaticURI object
     * @throws {Error} If path format is invalid
     * @private
     */
    private parseStaticURI;
    /**
     * Parse a dynamic matching URI with query parameters
     *
     * @param path - URI path without protocol (e.g., 'agents/match?query=build+api')
     * @returns DynamicURI object
     * @throws {Error} If path or query format is invalid
     * @private
     */
    private parseDynamicURI;
    /**
     * Parse query string parameters into MatchParams
     *
     * @param queryString - URL query string (without '?')
     * @returns MatchParams object
     * @throws {Error} If query parameter is missing
     * @private
     */
    private parseQueryParams;
    /**
     * Check if a URI is a dynamic match URI
     *
     * @param uri - The URI to check
     * @returns true if URI contains match path with query parameters
     */
    isDynamicURI(uri: string): boolean;
    /**
     * Check if a URI is a static resource URI
     *
     * @param uri - The URI to check
     * @returns true if URI is not a dynamic match URI
     */
    isStaticURI(uri: string): boolean;
}
/**
 * Default export of URIParser class
 */
export default URIParser;
//# sourceMappingURL=uriParser.d.ts.map