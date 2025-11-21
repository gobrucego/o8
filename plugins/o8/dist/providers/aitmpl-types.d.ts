/**
 * AITMPL-specific type definitions
 *
 * Defines types for the AITMPL (AI Templates) provider that fetches
 * community-contributed components from aitmpl.com / claude-code-templates.
 *
 * @module providers/aitmpl-types
 */
/**
 * Raw component data from AITMPL components.json
 *
 * This represents the structure of components as stored in the
 * davila7/claude-code-templates repository.
 */
export interface AitmplComponent {
    /** Unique component identifier */
    name: string;
    /** File path in the repository */
    path: string;
    /** Component category (e.g., "ai-specialists", "api-graphql") */
    category: string;
    /** Component type (agent, command, skill, etc.) */
    type: "agent" | "command" | "skill" | "mcp" | "hook" | "setting" | "template";
    /** Full markdown content including YAML frontmatter */
    content: string;
    /** Brief description (may be empty) */
    description?: string;
    /** Number of times this component has been downloaded */
    downloads: number;
    /** Security validation results */
    security?: AitmplSecurityValidation;
}
/**
 * Security validation metadata for AITMPL components
 */
export interface AitmplSecurityValidation {
    /** Overall validation status */
    validated: boolean;
    /** Whether component passed validation */
    valid: boolean;
    /** Validation score (0-100) */
    score: number;
    /** Number of errors found */
    errorCount: number;
    /** Number of warnings found */
    warningCount: number;
    /** ISO timestamp of last validation */
    lastValidated: string;
    /** Detailed validator results */
    validators?: {
        structural?: ValidationResult;
        integrity?: ValidationResult;
        semantic?: ValidationResult;
        reference?: ValidationResult;
        provenance?: ValidationResult;
    };
    /** SHA256 hash of component content */
    hash?: string;
}
/**
 * Individual validator result
 */
export interface ValidationResult {
    /** Validation status */
    status: "pass" | "warning" | "error";
    /** Error messages */
    errors?: string[];
    /** Warning messages */
    warnings?: string[];
    /** Additional validation details */
    details?: Record<string, any>;
}
/**
 * Parsed frontmatter from AITMPL component markdown
 *
 * Components use YAML frontmatter for metadata extraction.
 */
export interface AitmplFrontmatter {
    /** Component name */
    name?: string;
    /** Component description */
    description?: string;
    /** Tags/keywords */
    tags?: string[];
    /** Author information */
    author?: string;
    /** Version identifier */
    version?: string;
    /** License type */
    license?: string;
    /** Creation date */
    created?: string;
    /** Last update date */
    updated?: string;
    /** Capabilities provided */
    capabilities?: string[];
    /** Use cases / when to use this component */
    useWhen?: string[];
    /** Estimated token count */
    estimatedTokens?: number;
    /** Dependencies on other components */
    dependencies?: string[];
    /** Related components */
    related?: string[];
    /** Additional custom fields */
    [key: string]: any;
}
/**
 * Category mapping from AITMPL to orchestr8 resource types
 */
export declare const CATEGORY_MAPPING: Record<AitmplComponent["type"], "agent" | "skill" | "example" | "pattern" | "workflow">;
/**
 * AITMPL API response structure
 */
export interface AitmplApiResponse {
    /** Array of components */
    components?: AitmplComponent[];
    /** Metadata about the response */
    metadata?: {
        /** Total number of components */
        total: number;
        /** Timestamp of data generation */
        timestamp: string;
        /** Data version */
        version?: string;
    };
    /** Error information if request failed */
    error?: {
        /** Error code */
        code: string;
        /** Error message */
        message: string;
    };
}
/**
 * Cache entry for AITMPL data
 */
export interface AitmplCacheEntry<T> {
    /** Cached data */
    data: T;
    /** Timestamp when data was cached */
    cachedAt: Date;
    /** Time-to-live in milliseconds */
    ttl: number;
    /** ETag for HTTP caching */
    etag?: string;
}
/**
 * Rate limit bucket for token bucket algorithm
 */
export interface RateLimitBucket {
    /** Current number of tokens in bucket */
    tokens: number;
    /** Maximum capacity of bucket */
    capacity: number;
    /** Timestamp of last token refill */
    lastRefill: Date;
    /** Refill rate (tokens per millisecond) */
    refillRate: number;
}
/**
 * HTTP request options for AITMPL API
 */
export interface AitmplRequestOptions {
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Number of retry attempts */
    retries?: number;
    /** Whether to use cache */
    useCache?: boolean;
    /** Custom headers */
    headers?: Record<string, string>;
    /** ETag for conditional requests */
    etag?: string;
}
/**
 * Statistics for AITMPL provider operations
 */
export interface AitmplProviderMetrics {
    /** Total API requests made */
    apiRequests: number;
    /** Successful API responses */
    apiSuccesses: number;
    /** Failed API responses */
    apiFailures: number;
    /** Requests served from cache */
    cacheHits: number;
    /** Requests that missed cache */
    cacheMisses: number;
    /** Total bytes downloaded */
    bytesDownloaded: number;
    /** Average response time (ms) */
    avgResponseTime: number;
    /** Rate limit hits */
    rateLimitHits: number;
    /** Last API error */
    lastError?: {
        /** Error message */
        message: string;
        /** Timestamp */
        timestamp: Date;
        /** Error code */
        code?: string;
    };
}
/**
 * Data source URLs for AITMPL
 */
export declare const AITMPL_DATA_SOURCES: {
    /** Main components catalog */
    readonly COMPONENTS_JSON: "https://raw.githubusercontent.com/davila7/claude-code-templates/main/docs/components.json";
    /** Component metadata (developers, companies, technologies) */
    readonly METADATA_JSON: "https://raw.githubusercontent.com/davila7/claude-code-templates/main/docs/components-metadata.json";
    /** Trending data */
    readonly TRENDING_JSON: "https://raw.githubusercontent.com/davila7/claude-code-templates/main/docs/trending-data.json";
    /** GitHub repository */
    readonly GITHUB_REPO: "https://github.com/davila7/claude-code-templates";
    /** GitHub API endpoint */
    readonly GITHUB_API: "https://api.github.com/repos/davila7/claude-code-templates";
};
/**
 * Default configuration values
 */
export declare const AITMPL_DEFAULTS: {
    /** Default cache TTL (24 hours) */
    readonly CACHE_TTL: number;
    /** Default resource cache TTL (7 days) */
    readonly RESOURCE_CACHE_TTL: number;
    /** Default request timeout (30 seconds) */
    readonly TIMEOUT: 30000;
    /** Default retry attempts */
    readonly MAX_RETRIES: 3;
    /** Default rate limit (per minute) */
    readonly RATE_LIMIT_PER_MINUTE: 60;
    /** Default rate limit (per hour) */
    readonly RATE_LIMIT_PER_HOUR: 1000;
    /** User agent for HTTP requests */
    readonly USER_AGENT: "orchestr8-mcp/8.0.0";
    /** Maximum cache size (number of entries) */
    readonly MAX_CACHE_SIZE: 500;
    /** Minimum estimated tokens if not provided */
    readonly MIN_ESTIMATED_TOKENS: 100;
    /** Exponential backoff base (ms) */
    readonly BACKOFF_BASE: 1000;
    /** Maximum backoff delay (ms) */
    readonly MAX_BACKOFF: 60000;
};
//# sourceMappingURL=aitmpl-types.d.ts.map