/**
 * GitHub-specific types for the GitHubProvider
 *
 * These types define the structure for GitHub API responses,
 * repository metadata, and internal caching structures.
 *
 * @module providers/github-types
 */
/**
 * GitHub API tree entry (file or directory)
 */
export interface GitHubTreeEntry {
    path: string;
    mode: string;
    type: "blob" | "tree" | "commit";
    sha: string;
    size?: number;
    url: string;
}
/**
 * GitHub API tree response
 */
export interface GitHubTreeResponse {
    sha: string;
    url: string;
    tree: GitHubTreeEntry[];
    truncated: boolean;
}
/**
 * GitHub API content response (file content)
 */
export interface GitHubContentResponse {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string | null;
    type: "file" | "dir" | "symlink" | "submodule";
    content?: string;
    encoding?: "base64";
    _links: {
        self: string;
        git: string;
        html: string;
    };
}
/**
 * GitHub API rate limit response
 */
export interface GitHubRateLimitResponse {
    resources: {
        core: GitHubRateLimit;
        search: GitHubRateLimit;
        graphql: GitHubRateLimit;
    };
    rate: GitHubRateLimit;
}
/**
 * GitHub rate limit details
 */
export interface GitHubRateLimit {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
    resource?: string;
}
/**
 * Parsed repository identifier
 */
export interface RepositoryIdentifier {
    owner: string;
    repo: string;
    branch: string;
}
/**
 * Resource directory structure detected in a repository
 */
export interface RepositoryStructure {
    /** Repository identifier */
    repo: RepositoryIdentifier;
    /** Detected directory structure type */
    structureType: "orchestr8" | "claude-code-templates" | "flat" | "custom";
    /** Resource directories found */
    directories: {
        category: "agent" | "skill" | "example" | "pattern" | "workflow";
        path: string;
        fileCount: number;
    }[];
    /** Total markdown files found */
    totalFiles: number;
    /** Last scan timestamp */
    lastScanned: Date;
}
/**
 * Repository index entry
 */
export interface RepositoryIndex {
    /** Repository identifier */
    repo: RepositoryIdentifier;
    /** Repository structure */
    structure: RepositoryStructure;
    /** Resource metadata from this repository */
    resources: GitHubResourceMetadata[];
    /** Index version (tree SHA) */
    version: string;
    /** Timestamp of index build */
    timestamp: Date;
    /** ETag for cache validation */
    etag?: string;
}
/**
 * GitHub resource metadata (before full fetch)
 */
export interface GitHubResourceMetadata {
    /** Unique resource identifier: {owner}/{repo}/{path} */
    id: string;
    /** Resource category */
    category: "agent" | "skill" | "example" | "pattern" | "workflow";
    /** File path in repository */
    path: string;
    /** Repository identifier */
    repo: RepositoryIdentifier;
    /** Git SHA for cache validation */
    sha: string;
    /** File size in bytes */
    size: number;
    /** Tags (parsed from frontmatter after fetch) */
    tags?: string[];
    /** Capabilities (parsed from frontmatter after fetch) */
    capabilities?: string[];
    /** Use when scenarios */
    useWhen?: string[];
    /** Estimated token count */
    estimatedTokens?: number;
    /** Title from frontmatter */
    title?: string;
    /** Description from frontmatter */
    description?: string;
}
/**
 * Cached resource entry
 */
export interface CachedResource {
    /** Full resource content */
    content: string;
    /** Parsed frontmatter */
    frontmatter: Record<string, any>;
    /** Git SHA for validation */
    sha: string;
    /** Cache timestamp */
    cachedAt: Date;
    /** ETag from GitHub */
    etag?: string;
}
/**
 * Cache statistics
 */
export interface CacheStats {
    /** Total cache entries */
    totalEntries: number;
    /** Cache hits */
    hits: number;
    /** Cache misses */
    misses: number;
    /** Cache evictions */
    evictions: number;
    /** Hit rate (0-1) */
    hitRate: number;
    /** Total cache size in bytes (estimated) */
    estimatedSize: number;
}
/**
 * GitHub API error response
 */
export interface GitHubErrorResponse {
    message: string;
    documentation_url?: string;
    errors?: Array<{
        resource: string;
        field: string;
        code: string;
    }>;
}
/**
 * Repository scan result
 */
export interface RepositoryScanResult {
    /** Repository identifier */
    repo: RepositoryIdentifier;
    /** Success status */
    success: boolean;
    /** Number of resources found */
    resourceCount: number;
    /** Structure type detected */
    structureType: RepositoryStructure["structureType"];
    /** Error message if failed */
    error?: string;
    /** Scan duration in milliseconds */
    duration: number;
}
/**
 * Known directory mappings for different repository structures
 */
export declare const KNOWN_DIRECTORY_STRUCTURES: {
    readonly orchestr8: {
        readonly agents: "agent";
        readonly skills: "skill";
        readonly workflows: "workflow";
        readonly patterns: "pattern";
        readonly examples: "example";
        readonly guides: "pattern";
        readonly "best-practices": "pattern";
    };
    readonly "claude-code-templates": {
        readonly agents: "agent";
        readonly skills: "skill";
        readonly commands: "skill";
        readonly settings: "pattern";
        readonly hooks: "pattern";
        readonly mcps: "example";
        readonly plugins: "example";
    };
};
/**
 * Category type for resource classification
 */
export type ResourceCategory = "agent" | "skill" | "example" | "pattern" | "workflow";
/**
 * HTTP fetch options for GitHub API requests
 */
export interface GitHubFetchOptions {
    /** Request method */
    method?: "GET" | "POST" | "PUT" | "DELETE";
    /** Request headers */
    headers?: Record<string, string>;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Retry on failure */
    retryCount?: number;
    /** ETag for conditional requests */
    etag?: string;
}
//# sourceMappingURL=github-types.d.ts.map