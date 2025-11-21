/**
 * AITMPL-specific type definitions
 *
 * Defines types for the AITMPL (AI Templates) provider that fetches
 * community-contributed components from aitmpl.com / claude-code-templates.
 *
 * @module providers/aitmpl-types
 */
/**
 * Category mapping from AITMPL to orchestr8 resource types
 */
export const CATEGORY_MAPPING = {
    agent: "agent",
    skill: "skill",
    command: "workflow",
    template: "example",
    mcp: "pattern",
    hook: "pattern",
    setting: "pattern",
};
/**
 * Data source URLs for AITMPL
 */
export const AITMPL_DATA_SOURCES = {
    /** Main components catalog */
    COMPONENTS_JSON: "https://raw.githubusercontent.com/davila7/claude-code-templates/main/docs/components.json",
    /** Component metadata (developers, companies, technologies) */
    METADATA_JSON: "https://raw.githubusercontent.com/davila7/claude-code-templates/main/docs/components-metadata.json",
    /** Trending data */
    TRENDING_JSON: "https://raw.githubusercontent.com/davila7/claude-code-templates/main/docs/trending-data.json",
    /** GitHub repository */
    GITHUB_REPO: "https://github.com/davila7/claude-code-templates",
    /** GitHub API endpoint */
    GITHUB_API: "https://api.github.com/repos/davila7/claude-code-templates",
};
/**
 * Default configuration values
 */
export const AITMPL_DEFAULTS = {
    /** Default cache TTL (24 hours) */
    CACHE_TTL: 24 * 60 * 60 * 1000,
    /** Default resource cache TTL (7 days) */
    RESOURCE_CACHE_TTL: 7 * 24 * 60 * 60 * 1000,
    /** Default request timeout (30 seconds) */
    TIMEOUT: 30000,
    /** Default retry attempts */
    MAX_RETRIES: 3,
    /** Default rate limit (per minute) */
    RATE_LIMIT_PER_MINUTE: 60,
    /** Default rate limit (per hour) */
    RATE_LIMIT_PER_HOUR: 1000,
    /** User agent for HTTP requests */
    USER_AGENT: "orchestr8-mcp/8.0.0",
    /** Maximum cache size (number of entries) */
    MAX_CACHE_SIZE: 500,
    /** Minimum estimated tokens if not provided */
    MIN_ESTIMATED_TOKENS: 100,
    /** Exponential backoff base (ms) */
    BACKOFF_BASE: 1000,
    /** Maximum backoff delay (ms) */
    MAX_BACKOFF: 60000,
};
//# sourceMappingURL=aitmpl-types.js.map