# GitHub Provider - Usage Examples

This document provides comprehensive examples for using the GitHubProvider to fetch resources from GitHub repositories.

## Table of Contents

- [Basic Setup](#basic-setup)
- [Configuration Options](#configuration-options)
- [Multi-Repository Setup](#multi-repository-setup)
- [Authentication](#authentication)
- [Fetching Resources](#fetching-resources)
- [Searching Resources](#searching-resources)
- [Health Monitoring](#health-monitoring)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Basic Setup

### Minimal Configuration

```typescript
import { GitHubProvider } from './providers';
import { Logger } from './utils/logger';

const logger = new Logger('github-example');

// Create provider with minimal configuration
const provider = new GitHubProvider({
  enabled: true,
  repos: ['davila7/claude-code-templates'],
  branch: 'main',
  cacheTTL: 3600000, // 1 hour
  timeout: 30000,
  retryAttempts: 3,
}, logger);

// Initialize the provider
await provider.initialize();

// Fetch the resource index
const index = await provider.fetchIndex();
console.log(`Found ${index.totalCount} resources`);
```

## Configuration Options

### Full Configuration Object

```typescript
import { GithubProviderConfig } from './config/schema';

const config: GithubProviderConfig = {
  // Enable/disable the provider
  enabled: true,

  // List of repositories to scan (format: owner/repo)
  repos: [
    'davila7/claude-code-templates',
    'awesome-claude/resources',
    'myorg/custom-agents',
  ],

  // Git branch to fetch from (default: main)
  branch: 'main',

  // Cache TTL in milliseconds (default: 1 hour)
  cacheTTL: 3600000,

  // Optional authentication
  auth: {
    token: process.env.GITHUB_TOKEN, // Personal access token
    type: 'personal', // 'personal' or 'oauth'
  },

  // Request timeout in milliseconds (default: 30 seconds)
  timeout: 30000,

  // Number of retry attempts on failure (default: 3)
  retryAttempts: 3,
};

const provider = new GitHubProvider(config, logger);
```

## Multi-Repository Setup

### Scanning Multiple Repositories

The GitHubProvider can scan multiple repositories in parallel and build a unified index:

```typescript
const provider = new GitHubProvider({
  enabled: true,
  repos: [
    'davila7/claude-code-templates',  // Community templates
    'awesome-claude/resources',       // Awesome list
    'mycompany/internal-agents',      // Private repo (requires auth)
  ],
  branch: 'main',
  auth: {
    token: process.env.GITHUB_TOKEN, // Required for private repos
    type: 'personal',
  },
}, logger);

await provider.initialize();

// Fetch unified index from all repositories
const index = await provider.fetchIndex();

console.log(`Total repositories: ${provider.getStats().resourcesFetched}`);
console.log(`Resources by category:`, index.stats.byCategory);

// Resources are identified by: {owner}/{repo}/{path}
for (const resource of index.resources) {
  console.log(`${resource.id} - ${resource.category} - ${resource.source}`);
}
```

### Repository Structure Auto-Detection

The provider automatically detects different repository structures:

**Orchestr8 Structure:**
```
agents/
skills/
workflows/
patterns/
examples/
```

**Claude Code Templates Structure:**
```
agents/
skills/
commands/
settings/
hooks/
mcps/
```

**Flat Structure:**
```
resource-1.md
resource-2.md
```

The provider will automatically categorize resources based on the detected structure.

## Authentication

### Why Use Authentication?

- **Higher Rate Limits**: 5000 requests/hour vs 60 unauthenticated
- **Private Repositories**: Access your private repos
- **Reliability**: Better API stability

### Setting Up Authentication

#### Personal Access Token

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Generate a new token with `repo` scope (for private repos) or `public_repo` (public only)
3. Set the token in your configuration:

```typescript
const provider = new GitHubProvider({
  enabled: true,
  repos: ['myorg/private-agents'],
  auth: {
    token: process.env.GITHUB_TOKEN,
    type: 'personal',
  },
}, logger);
```

#### Environment Variables

```bash
# .env file
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

```typescript
import dotenv from 'dotenv';
dotenv.config();

const provider = new GitHubProvider({
  enabled: true,
  repos: ['myorg/private-agents'],
  auth: {
    token: process.env.GITHUB_TOKEN!,
    type: 'personal',
  },
}, logger);
```

## Fetching Resources

### Fetch Resource Index

```typescript
// Get complete index of all resources
const index = await provider.fetchIndex();

console.log(`Total resources: ${index.totalCount}`);
console.log(`Categories: ${index.categories.join(', ')}`);
console.log(`Total tokens: ${index.stats.totalTokens}`);
console.log(`Top tags:`, index.stats.topTags);
```

### Fetch Individual Resource

```typescript
// Resource ID format: owner/repo/path
const resourceId = 'davila7/claude-code-templates/agents/typescript-expert.md';
const category = 'agent';

try {
  const resource = await provider.fetchResource(resourceId, category);
  
  console.log(`Title: ${resource.title}`);
  console.log(`Description: ${resource.description}`);
  console.log(`Tags: ${resource.tags.join(', ')}`);
  console.log(`Capabilities: ${resource.capabilities.join(', ')}`);
  console.log(`Tokens: ${resource.estimatedTokens}`);
  console.log(`Content length: ${resource.content.length}`);
  
  // Use the content
  console.log(resource.content);
} catch (error) {
  if (error instanceof ResourceNotFoundError) {
    console.error('Resource not found:', error.resourceId);
  } else {
    console.error('Failed to fetch resource:', error);
  }
}
```

### Caching Behavior

Resources are cached aggressively to protect rate limits:

- **Index cache**: 24 hours (configurable)
- **Resource cache**: 7 days
- **Tree cache**: 1 hour

```typescript
// First fetch - hits GitHub API
const resource1 = await provider.fetchResource(resourceId, category);

// Second fetch - returns from cache
const resource2 = await provider.fetchResource(resourceId, category);

// Check cache statistics
const stats = provider.getStats();
console.log(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
```

## Searching Resources

### Basic Search

```typescript
const results = await provider.search('typescript api development');

console.log(`Found ${results.totalMatches} matches`);
console.log(`Search time: ${results.searchTime}ms`);

for (const result of results.results) {
  console.log(`[${result.score}] ${result.resource.id}`);
  console.log(`  Category: ${result.resource.category}`);
  console.log(`  Tags: ${result.resource.tags.join(', ')}`);
  console.log(`  Match reasons: ${result.matchReason?.join(', ')}`);
}
```

### Advanced Search with Filters

```typescript
const results = await provider.search('error handling', {
  // Filter by categories
  categories: ['agent', 'skill'],
  
  // Required tags (all must be present)
  requiredTags: ['typescript'],
  
  // Minimum relevance score (0-100)
  minScore: 50,
  
  // Maximum number of results
  maxResults: 10,
  
  // Token budget for results
  maxTokens: 5000,
  
  // Sort order
  sortBy: 'relevance',
  sortOrder: 'desc',
});

console.log(`Found ${results.results.length} high-quality matches`);
```

### Search Scoring

The provider scores resources based on:
- **Tag matches**: +10 per match
- **Capability matches**: +8 per match
- **Use-when matches**: +5 per match
- **Category filter bonus**: +15 if matches
- **Size preference**: +5 for resources < 1000 tokens

```typescript
// High-score search (precise matching)
const precise = await provider.search('react testing library', {
  minScore: 40, // Only high-confidence matches
  maxResults: 5,
});

// Broad search (exploratory)
const broad = await provider.search('testing', {
  minScore: 10, // Include more results
  maxResults: 20,
});
```

## Health Monitoring

### Check Provider Health

```typescript
const health = await provider.healthCheck();

console.log(`Status: ${health.status}`); // healthy | degraded | unhealthy
console.log(`Reachable: ${health.reachable}`);
console.log(`Authenticated: ${health.authenticated}`);
console.log(`Response time: ${health.responseTime}ms`);

if (health.metrics) {
  console.log(`Success rate: ${(health.metrics.successRate * 100).toFixed(1)}%`);
  console.log(`Avg response time: ${health.metrics.avgResponseTime}ms`);
}

if (health.error) {
  console.error(`Health check error: ${health.error}`);
}
```

### Monitor Statistics

```typescript
const stats = provider.getStats();

console.log('Provider Statistics:');
console.log(`  Total requests: ${stats.totalRequests}`);
console.log(`  Successful: ${stats.successfulRequests}`);
console.log(`  Failed: ${stats.failedRequests}`);
console.log(`  Cached: ${stats.cachedRequests}`);
console.log(`  Resources fetched: ${stats.resourcesFetched}`);
console.log(`  Tokens fetched: ${stats.tokensFetched}`);
console.log(`  Avg response time: ${stats.avgResponseTime.toFixed(0)}ms`);
console.log(`  Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
console.log(`  Uptime: ${(stats.uptime * 100).toFixed(1)}%`);

// Rate limit info
if (stats.rateLimit) {
  console.log(`\nRate Limit:`);
  console.log(`  Remaining: ${stats.rateLimit.remaining}/${stats.rateLimit.limit}`);
  console.log(`  Resets at: ${stats.rateLimit.resetAt.toLocaleString()}`);
  
  // Warn if low
  if (stats.rateLimit.remaining < 100) {
    console.warn('⚠️  GitHub rate limit is low!');
  }
}
```

### Reset Statistics

```typescript
// Reset stats after a test or benchmark
provider.resetStats();
```

## Error Handling

### Comprehensive Error Handling

```typescript
import {
  ProviderError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  ResourceNotFoundError,
  ProviderAuthenticationError,
  RateLimitError,
} from './providers';

try {
  const resource = await provider.fetchResource(resourceId, category);
  console.log('Resource fetched successfully');
} catch (error) {
  if (error instanceof ResourceNotFoundError) {
    console.error(`Resource not found: ${error.resourceId}`);
    console.error(`Category: ${error.category}`);
    // Handle missing resource (maybe try alternate source)
    
  } else if (error instanceof RateLimitError) {
    console.error('GitHub rate limit exceeded!');
    console.error(`Retry after: ${error.retryAfter}ms`);
    // Wait and retry, or use cached data
    
  } else if (error instanceof ProviderAuthenticationError) {
    console.error('GitHub authentication failed:', error.message);
    // Check token validity
    
  } else if (error instanceof ProviderTimeoutError) {
    console.error('Request timed out:', error.message);
    // Retry with longer timeout
    
  } else if (error instanceof ProviderUnavailableError) {
    console.error('GitHub is unavailable:', error.message);
    // Fall back to cache or alternate provider
    
  } else if (error instanceof ProviderError) {
    console.error('Provider error:', error.message);
    console.error('Error code:', error.code);
    console.error('Status code:', error.statusCode);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Retry Logic

The provider includes automatic retry with exponential backoff:

```typescript
// Retries are built-in
const provider = new GitHubProvider({
  enabled: true,
  repos: ['davila7/claude-code-templates'],
  timeout: 30000,
  retryAttempts: 3, // Will retry up to 3 times
}, logger);

// Exponential backoff: 1s, 2s, 4s, 8s, 10s (max)
```

## Best Practices

### 1. Use Authentication for Production

```typescript
// ✅ DO: Use authentication
const provider = new GitHubProvider({
  enabled: true,
  repos: ['davila7/claude-code-templates'],
  auth: {
    token: process.env.GITHUB_TOKEN!,
    type: 'personal',
  },
}, logger);

// ❌ DON'T: Run without auth in production (rate limits!)
```

### 2. Cache Aggressively

```typescript
// ✅ DO: Use long cache TTL for stable resources
const provider = new GitHubProvider({
  enabled: true,
  repos: ['davila7/claude-code-templates'],
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
}, logger);

// Index will be cached for 24 hours, protecting rate limits
```

### 3. Monitor Rate Limits

```typescript
// Check rate limit periodically
setInterval(async () => {
  const stats = provider.getStats();
  
  if (stats.rateLimit) {
    const percentRemaining = 
      stats.rateLimit.remaining / stats.rateLimit.limit;
    
    if (percentRemaining < 0.2) {
      console.warn(`Rate limit low: ${stats.rateLimit.remaining} remaining`);
    }
  }
}, 60000); // Check every minute
```

### 4. Handle Errors Gracefully

```typescript
// ✅ DO: Provide fallbacks
try {
  const resource = await provider.fetchResource(id, category);
  return resource.content;
} catch (error) {
  if (error instanceof ResourceNotFoundError) {
    // Try alternate source
    return await fallbackProvider.fetchResource(id, category);
  } else if (error instanceof RateLimitError) {
    // Return cached version if available
    return getCachedResource(id);
  }
  throw error;
}
```

### 5. Use Provider Registry for Multi-Provider Setup

```typescript
import { ProviderRegistry } from './providers';

// Create registry
const registry = new ProviderRegistry({
  enableHealthChecks: true,
  autoDisableUnhealthy: true,
});

// Register multiple providers
await registry.register(localProvider);    // Priority: 0
await registry.register(githubProvider);   // Priority: 15
await registry.register(aitmplProvider);   // Priority: 10

// Search across all providers
const results = await registry.searchAll('typescript api');

// Fetch from first available provider
const resource = await registry.fetchResourceAny(id, category);
```

### 6. Log and Monitor

```typescript
// Enable detailed logging
const logger = new Logger('github-provider');
process.env.LOG_LEVEL = 'debug';

const provider = new GitHubProvider(config, logger);

// Monitor health regularly
setInterval(async () => {
  const health = await provider.healthCheck();
  const stats = provider.getStats();
  
  // Send to monitoring system
  metrics.gauge('github.health', health.status === 'healthy' ? 1 : 0);
  metrics.gauge('github.cache_hit_rate', stats.cacheHitRate);
  metrics.gauge('github.avg_response_time', stats.avgResponseTime);
  metrics.gauge('github.rate_limit_remaining', stats.rateLimit?.remaining || 0);
}, 60000);
```

### 7. Optimize Repository Selection

```typescript
// ✅ DO: Be selective with repositories
const provider = new GitHubProvider({
  enabled: true,
  repos: [
    'davila7/claude-code-templates', // High-quality, focused repo
  ],
}, logger);

// ❌ DON'T: Add too many large repos (impacts performance and rate limits)
const provider = new GitHubProvider({
  enabled: true,
  repos: [
    'repo1/huge-monorepo',
    'repo2/another-big-one',
    'repo3/massive-archive',
    // ... 20 more repos
  ],
}, logger);
```

## Complete Example: Production Setup

```typescript
import { GitHubProvider } from './providers';
import { Logger } from './utils/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create logger
const logger = new Logger('github-provider');

// Configure provider
const provider = new GitHubProvider({
  enabled: true,
  repos: [
    'davila7/claude-code-templates',
    'awesome-claude/resources',
  ],
  branch: 'main',
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
  auth: {
    token: process.env.GITHUB_TOKEN!,
    type: 'personal',
  },
  timeout: 30000,
  retryAttempts: 3,
}, logger);

// Initialize
await provider.initialize();

// Fetch index
const index = await provider.fetchIndex();
logger.info(`Loaded ${index.totalCount} resources from ${provider.repos.length} repositories`);

// Search for relevant resources
const results = await provider.search('typescript api development', {
  categories: ['agent', 'skill'],
  minScore: 30,
  maxResults: 10,
});

// Fetch top result
if (results.results.length > 0) {
  const topResult = results.results[0];
  const resource = await provider.fetchResource(
    topResult.resource.id,
    topResult.resource.category
  );
  
  console.log('Top resource:', resource.title);
  console.log('Content:', resource.content);
}

// Monitor health
const health = await provider.healthCheck();
logger.info('Provider health:', health.status);

// Get statistics
const stats = provider.getStats();
logger.info('Statistics:', {
  requests: stats.totalRequests,
  cacheHitRate: `${(stats.cacheHitRate * 100).toFixed(1)}%`,
  avgResponseTime: `${stats.avgResponseTime.toFixed(0)}ms`,
});

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  await provider.shutdown();
  process.exit(0);
});
```

## Testing

### Unit Test Example

```typescript
import { GitHubProvider } from './providers';
import { Logger } from './utils/logger';

describe('GitHubProvider', () => {
  let provider: GitHubProvider;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('test');
    provider = new GitHubProvider({
      enabled: true,
      repos: ['davila7/claude-code-templates'],
      branch: 'main',
      timeout: 10000,
      retryAttempts: 1,
    }, logger);
  });

  afterEach(async () => {
    await provider.shutdown();
  });

  test('should initialize successfully', async () => {
    await provider.initialize();
    expect(provider.enabled).toBe(true);
  });

  test('should fetch index', async () => {
    await provider.initialize();
    const index = await provider.fetchIndex();
    
    expect(index.totalCount).toBeGreaterThan(0);
    expect(index.resources).toBeDefined();
    expect(index.categories).toContain('agent');
  });

  test('should search resources', async () => {
    await provider.initialize();
    const results = await provider.search('typescript', {
      maxResults: 5,
    });
    
    expect(results.results.length).toBeGreaterThan(0);
    expect(results.results[0].score).toBeGreaterThan(0);
  });

  test('should handle health check', async () => {
    await provider.initialize();
    const health = await provider.healthCheck();
    
    expect(health.provider).toBe('github');
    expect(health.reachable).toBe(true);
  });
});
```

## Troubleshooting

### Problem: Rate limit exceeded

**Solution**: Enable authentication or increase cache TTL

```typescript
const provider = new GitHubProvider({
  repos: ['davila7/claude-code-templates'],
  auth: { token: process.env.GITHUB_TOKEN!, type: 'personal' },
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
}, logger);
```

### Problem: Slow initial load

**Solution**: This is expected - GitHub API fetches repository trees. Subsequent loads use cache.

```typescript
// First load: ~5-10 seconds (fetches from GitHub)
const index1 = await provider.fetchIndex();

// Second load: <100ms (from cache)
const index2 = await provider.fetchIndex();
```

### Problem: Resources not found

**Solution**: Check repository structure and branch name

```typescript
// Verify branch name
const provider = new GitHubProvider({
  repos: ['owner/repo'],
  branch: 'main', // or 'master', 'develop', etc.
}, logger);

// Check provider logs for structure detection
provider.logger.info('Repository structure detected');
```

### Problem: Authentication fails

**Solution**: Verify token has correct scopes

- For public repos: No token needed (but recommended)
- For private repos: Token needs `repo` scope
- Check token validity: https://github.com/settings/tokens

---

For more information, see:
- [Provider Types Documentation](./src/providers/types.ts)
- [Configuration Schema](./src/config/schema.ts)
- [GitHub API Documentation](https://docs.github.com/en/rest)
