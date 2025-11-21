/**
 * GitHub-specific types for the GitHubProvider
 *
 * These types define the structure for GitHub API responses,
 * repository metadata, and internal caching structures.
 *
 * @module providers/github-types
 */
/**
 * Known directory mappings for different repository structures
 */
export const KNOWN_DIRECTORY_STRUCTURES = {
    orchestr8: {
        agents: "agent",
        skills: "skill",
        workflows: "workflow",
        patterns: "pattern",
        examples: "example",
        guides: "pattern",
        "best-practices": "pattern",
    },
    "claude-code-templates": {
        agents: "agent",
        skills: "skill",
        commands: "skill",
        settings: "pattern",
        hooks: "pattern",
        mcps: "example",
        plugins: "example",
    },
};
//# sourceMappingURL=github-types.js.map