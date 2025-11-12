# Custom Provider Development Guide

> **Build your own resource providers**

This guide explains how to create custom resource providers for Orchestr8, from basic implementation to production deployment.

## Table of Contents

- [Provider Interface](#provider-interface)
- [Creating a Provider](#creating-a-provider)
- [Implementation Guide](#implementation-guide)
- [Testing](#testing)
- [Registration](#registration)
- [Best Practices](#best-practices)
- [Example: S3Provider](#example-s3provider)

## Provider Interface

All providers must implement the `ResourceProvider` interface:

```typescript
interface ResourceProvider {
  // Metadata
  readonly name: string;
  enabled: boolean;
  readonly priority: number;

  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  // Resource Operations
  fetchIndex(): Promise<RemoteResourceIndex>;
  fetchResource(id: string, category: string): Promise<RemoteResource>;
  search(query: string, options?: SearchOptions): Promise<SearchResponse>;

  // Health & Monitoring
  healthCheck(): Promise<ProviderHealth>;
  getStats(): ProviderStats;
  resetStats(): void;
}
```

## Creating a Provider

### Step 1: Basic Structure

```typescript
import { LRUCache } from "lru-cache";
import { Logger } from "../utils/logger.js";
import {
  ResourceProvider,
  RemoteResourceIndex,
  RemoteResource,
  SearchResponse,
  SearchOptions,
  ProviderHealth,
  ProviderStats,
  ProviderError,
} from "./types.js";

export interface CustomProviderConfig {
  enabled: boolean;
  apiUrl: string;
  apiKey?: string;
  cacheTTL?: number;
  timeout?: number;
}

export class CustomProvider implements ResourceProvider {
  readonly name = "custom";
  enabled: boolean;
  readonly priority = 20; // Lower priority than built-in providers

  private config: CustomProviderConfig;
  private logger: Logger;
  private cache: LRUCache<string, RemoteResource>;
  private stats: ProviderStats;

  constructor(config: CustomProviderConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.enabled = config.enabled;

    // Initialize cache
    this.cache = new LRUCache({
      max: 500,
      ttl: config.cacheTTL || 3600000, // 1 hour default
    });

    // Initialize stats
    this.stats = {
      provider: this.name,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedRequests: 0,
      resourcesFetched: 0,
      tokensFetched: 0,
      avgResponseTime: 0,
      cacheHitRate: 0,
      uptime: 1.0,
      statsResetAt: new Date(),
    };
  }

  async initialize(): Promise<void> {
    this.logger.info("Initializing CustomProvider");
    
    // Verify configuration
    if (!this.config.apiUrl) {
      throw new ProviderError(
        "API URL is required",
        this.name,
        "INVALID_CONFIG"
      );
    }

    // Test connectivity
    try {
      await this.testConnection();
      this.logger.info("CustomProvider initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize CustomProvider", error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info("Shutting down CustomProvider");
    this.cache.clear();
  }

  async fetchIndex(): Promise<RemoteResourceIndex> {
    // Implementation details below
    throw new Error("Not implemented");
  }

  async fetchResource(id: string, category: string): Promise<RemoteResource> {
    // Implementation details below
    throw new Error("Not implemented");
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    // Implementation details below
    throw new Error("Not implemented");
  }

  async healthCheck(): Promise<ProviderHealth> {
    // Implementation details below
    throw new Error("Not implemented");
  }

  getStats(): ProviderStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      provider: this.name,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedRequests: 0,
      resourcesFetched: 0,
      tokensFetched: 0,
      avgResponseTime: 0,
      cacheHitRate: 0,
      uptime: 1.0,
      statsResetAt: new Date(),
    };
  }

  private async testConnection(): Promise<void> {
    // Test API connectivity
  }
}
```

### Step 2: Implement fetchIndex()

```typescript
async fetchIndex(): Promise<RemoteResourceIndex> {
  this.logger.debug("Fetching resource index");
  this.stats.totalRequests++;
  const startTime = Date.now();

  try {
    // Fetch from your API
    const response = await fetch(`${this.config.apiUrl}/resources`, {
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    });

    if (!response.ok) {
      throw new ProviderError(
        `HTTP ${response.status}: ${response.statusText}`,
        this.name,
        "HTTP_ERROR",
        response.status
      );
    }

    const data = await response.json();

    // Transform to RemoteResourceIndex format
    const resources: RemoteResourceMetadata[] = data.resources.map(
      (item: any) => ({
        id: item.id,
        category: item.category as any,
        title: item.title || item.id,
        description: item.description || "",
        tags: item.tags || [],
        capabilities: item.capabilities || [],
        useWhen: item.useWhen || [],
        estimatedTokens: item.tokenCount || 0,
        source: this.name,
        sourceUri: `${this.config.apiUrl}/resources/${item.id}`,
      })
    );

    // Calculate statistics
    const byCategory: Record<string, number> = {};
    let totalTokens = 0;

    for (const resource of resources) {
      byCategory[resource.category] = (byCategory[resource.category] || 0) + 1;
      totalTokens += resource.estimatedTokens;
    }

    const index: RemoteResourceIndex = {
      provider: this.name,
      totalCount: resources.length,
      resources,
      version: data.version || new Date().toISOString(),
      timestamp: new Date(),
      categories: Object.keys(byCategory) as any[],
      stats: {
        byCategory,
        totalTokens,
        topTags: [], // Calculate if needed
      },
    };

    // Update stats
    this.stats.successfulRequests++;
    this.updateResponseTime(Date.now() - startTime);

    return index;
  } catch (error) {
    this.stats.failedRequests++;
    this.updateResponseTime(Date.now() - startTime);
    throw this.wrapError(error, "Failed to fetch index");
  }
}
```

### Step 3: Implement fetchResource()

```typescript
async fetchResource(id: string, category: string): Promise<RemoteResource> {
  this.logger.debug("Fetching resource", { id, category });
  this.stats.totalRequests++;
  const startTime = Date.now();

  // Check cache first
  const cacheKey = `${category}:${id}`;
  const cached = this.cache.get(cacheKey);
  if (cached) {
    this.stats.cachedRequests++;
    this.logger.debug("Cache hit", { id });
    return cached;
  }

  try {
    // Fetch from API
    const response = await fetch(
      `${this.config.apiUrl}/resources/${category}/${id}`,
      {
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      }
    );

    if (response.status === 404) {
      throw new ResourceNotFoundError(this.name, id, category);
    }

    if (!response.ok) {
      throw new ProviderError(
        `HTTP ${response.status}: ${response.statusText}`,
        this.name,
        "HTTP_ERROR",
        response.status
      );
    }

    const data = await response.json();

    // Transform to RemoteResource format
    const resource: RemoteResource = {
      id: data.id,
      category: data.category as any,
      title: data.title || data.id,
      description: data.description || "",
      tags: data.tags || [],
      capabilities: data.capabilities || [],
      useWhen: data.useWhen || [],
      estimatedTokens: data.tokenCount || 0,
      source: this.name,
      sourceUri: `${this.config.apiUrl}/resources/${id}`,
      content: data.content,
      dependencies: data.dependencies,
      related: data.related,
    };

    // Cache it
    this.cache.set(cacheKey, resource);

    // Update stats
    this.stats.successfulRequests++;
    this.stats.resourcesFetched++;
    this.stats.tokensFetched += resource.estimatedTokens;
    this.updateResponseTime(Date.now() - startTime);

    return resource;
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      throw error; // Don't count as failed request
    }

    this.stats.failedRequests++;
    this.updateResponseTime(Date.now() - startTime);
    throw this.wrapError(error, `Failed to fetch resource ${id}`);
  }
}
```

### Step 4: Implement search()

```typescript
async search(
  query: string,
  options?: SearchOptions
): Promise<SearchResponse> {
  this.logger.debug("Searching resources", { query, options });
  this.stats.totalRequests++;
  const startTime = Date.now();

  try {
    // Build query parameters
    const params = new URLSearchParams({
      q: query,
      maxResults: (options?.maxResults || 50).toString(),
      minScore: (options?.minScore || 0).toString(),
    });

    if (options?.categories) {
      params.append("categories", options.categories.join(","));
    }

    // Fetch from API
    const response = await fetch(
      `${this.config.apiUrl}/search?${params}`,
      {
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      }
    );

    if (!response.ok) {
      throw new ProviderError(
        `Search failed: ${response.statusText}`,
        this.name,
        "SEARCH_FAILED",
        response.status
      );
    }

    const data = await response.json();

    // Transform results
    const results: SearchResult[] = data.results.map((item: any) => ({
      resource: {
        id: item.id,
        category: item.category,
        tags: item.tags || [],
        capabilities: item.capabilities || [],
        useWhen: item.useWhen || [],
        estimatedTokens: item.tokenCount || 0,
        content: "", // Not loaded in search results
      },
      score: item.score || 0,
      matchReason: item.matchReason || [],
    }));

    // Update stats
    this.stats.successfulRequests++;
    this.updateResponseTime(Date.now() - startTime);

    return {
      results,
      totalMatches: data.totalMatches || results.length,
      query,
      searchTime: Date.now() - startTime,
    };
  } catch (error) {
    this.stats.failedRequests++;
    this.updateResponseTime(Date.now() - startTime);
    throw this.wrapError(error, "Search failed");
  }
}
```

### Step 5: Implement healthCheck()

```typescript
async healthCheck(): Promise<ProviderHealth> {
  const startTime = Date.now();

  try {
    // Ping health endpoint
    const response = await fetch(`${this.config.apiUrl}/health`, {
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
      },
      signal: AbortSignal.timeout(5000), // Short timeout for health check
    });

    const responseTime = Date.now() - startTime;
    const reachable = response.ok;

    // Determine status
    let status: ProviderHealth["status"];
    const successRate = this.calculateSuccessRate();

    if (!reachable) {
      status = "unhealthy";
    } else if (successRate < 0.5) {
      status = "unhealthy";
    } else if (successRate < 0.9 || responseTime > 5000) {
      status = "degraded";
    } else {
      status = "healthy";
    }

    return {
      provider: this.name,
      status,
      lastCheck: new Date(),
      responseTime,
      reachable,
      authenticated: !!this.config.apiKey,
      metrics: {
        successRate,
        avgResponseTime: this.stats.avgResponseTime,
        consecutiveFailures: 0,
      },
    };
  } catch (error) {
    return {
      provider: this.name,
      status: "unhealthy",
      lastCheck: new Date(),
      responseTime: Date.now() - startTime,
      reachable: false,
      authenticated: false,
      error: (error as Error).message,
    };
  }
}

private calculateSuccessRate(): number {
  const total = this.stats.successfulRequests + this.stats.failedRequests;
  return total > 0 ? this.stats.successfulRequests / total : 1.0;
}

private updateResponseTime(time: number): void {
  const totalRequests = this.stats.totalRequests;
  this.stats.avgResponseTime =
    (this.stats.avgResponseTime * (totalRequests - 1) + time) / totalRequests;
}

private wrapError(error: unknown, message: string): ProviderError {
  if (error instanceof ProviderError) {
    return error;
  }
  return new ProviderError(
    message,
    this.name,
    "UNKNOWN_ERROR",
    undefined,
    error as Error
  );
}
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { CustomProvider } from "./custom.js";
import { Logger } from "../utils/logger.js";

describe("CustomProvider", () => {
  let provider: CustomProvider;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger("test");
    provider = new CustomProvider(
      {
        enabled: true,
        apiUrl: "https://api.example.com",
        apiKey: "test-key",
      },
      logger
    );
  });

  it("should initialize successfully", async () => {
    await expect(provider.initialize()).resolves.not.toThrow();
  });

  it("should fetch index", async () => {
    const index = await provider.fetchIndex();
    expect(index.provider).toBe("custom");
    expect(Array.isArray(index.resources)).toBe(true);
  });

  it("should fetch resource", async () => {
    const resource = await provider.fetchResource("test-agent", "agent");
    expect(resource.id).toBe("test-agent");
    expect(resource.content).toBeDefined();
  });

  it("should search resources", async () => {
    const results = await provider.search("test query");
    expect(Array.isArray(results.results)).toBe(true);
    expect(results.query).toBe("test query");
  });

  it("should handle health check", async () => {
    const health = await provider.healthCheck();
    expect(health.provider).toBe("custom");
    expect(health.status).toMatch(/healthy|degraded|unhealthy/);
  });

  it("should track statistics", () => {
    const stats = provider.getStats();
    expect(stats.provider).toBe("custom");
    expect(typeof stats.totalRequests).toBe("number");
  });
});
```

### Integration Tests

```typescript
describe("CustomProvider Integration", () => {
  let registry: ProviderRegistry;
  let provider: CustomProvider;

  beforeEach(async () => {
    registry = new ProviderRegistry();
    provider = new CustomProvider(config, logger);
    await registry.register(provider);
  });

  it("should integrate with registry", async () => {
    const providers = registry.getProviders();
    expect(providers).toContain(provider);
  });

  it("should appear in multi-provider search", async () => {
    const results = await registry.searchAll("test query");
    expect(results.results.length).toBeGreaterThan(0);
  });

  it("should fallback to other providers on failure", async () => {
    provider.enabled = false;
    const resource = await registry.fetchResourceAny("test-id", "agent");
    expect(resource).toBeDefined(); // Should come from another provider
  });
});
```

## Registration

### Add to Configuration Schema

```typescript
// In config/schema.ts
const customProviderSchema = z.object({
  enabled: z.boolean().default(false),
  apiUrl: z.string().url(),
  apiKey: z.string().optional(),
  cacheTTL: z.number().int().positive().default(3600000),
  timeout: z.number().int().positive().default(30000),
});

const resourceProvidersSchema = z.object({
  aitmpl: aitmplProviderSchema.default({}),
  github: githubProviderSchema.default({}),
  custom: customProviderSchema.default({}), // Add here
});
```

### Register in ResourceLoader

```typescript
// In loaders/resourceLoader.ts
async initializeProviders(): Promise<void> {
  // ... existing providers ...

  // Register custom provider
  const customConfig = this.providerConfigManager.getCustomConfig();
  if (customConfig.enabled) {
    this.logger.info("Initializing CustomProvider");
    try {
      const customProvider = new CustomProvider(customConfig, this.logger);
      await this.registry.register(customProvider);
      this.logger.info("CustomProvider registered successfully");
    } catch (error) {
      this.logger.error("Failed to initialize CustomProvider:", error);
    }
  }
}
```

## Best Practices

### 1. Error Handling

```typescript
// Always wrap errors in ProviderError
try {
  const data = await fetchData();
  return data;
} catch (error) {
  throw new ProviderError(
    "Operation failed",
    this.name,
    "OPERATION_FAILED",
    undefined,
    error as Error
  );
}
```

### 2. Caching

```typescript
// Cache aggressively, invalidate carefully
const cacheKey = `${category}:${id}`;

// Check cache
const cached = this.cache.get(cacheKey);
if (cached) {
  return cached;
}

// Fetch and cache
const data = await fetch();
this.cache.set(cacheKey, data);
return data;
```

### 3. Statistics Tracking

```typescript
// Track all metrics
async operation() {
  this.stats.totalRequests++;
  const startTime = Date.now();
  
  try {
    const result = await doWork();
    this.stats.successfulRequests++;
    return result;
  } catch (error) {
    this.stats.failedRequests++;
    throw error;
  } finally {
    this.updateResponseTime(Date.now() - startTime);
  }
}
```

### 4. Health Monitoring

```typescript
// Comprehensive health checks
async healthCheck(): ProviderHealth {
  // Check connectivity
  const reachable = await this.ping();
  
  // Check authentication
  const authenticated = await this.verifyAuth();
  
  // Calculate metrics
  const successRate = this.calculateSuccessRate();
  
  // Determine status
  const status = this.determineStatus(reachable, authenticated, successRate);
  
  return { provider: this.name, status, ... };
}
```

## Example: S3Provider

Complete example of an S3-based provider:

```typescript
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

export class S3Provider implements ResourceProvider {
  readonly name = "s3";
  enabled = true;
  readonly priority = 25;

  private s3Client: S3Client;
  private bucketName: string;
  private cache: LRUCache<string, RemoteResource>;
  
  constructor(config: S3ProviderConfig, logger: Logger) {
    this.bucketName = config.bucketName;
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    
    this.cache = new LRUCache({ max: 500, ttl: 3600000 });
  }

  async initialize(): Promise<void> {
    // Verify bucket access
    try {
      await this.s3Client.send(new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1,
      }));
    } catch (error) {
      throw new ProviderError(
        `Cannot access S3 bucket: ${this.bucketName}`,
        this.name,
        "BUCKET_ACCESS_DENIED",
        undefined,
        error as Error
      );
    }
  }

  async fetchIndex(): Promise<RemoteResourceIndex> {
    // List all objects in bucket
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
    });
    
    const response = await this.s3Client.send(command);
    const resources: RemoteResourceMetadata[] = [];
    
    for (const object of response.Contents || []) {
      if (object.Key?.endsWith(".md")) {
        // Parse key to extract category and id
        // s3://bucket/agents/typescript-developer.md
        const parts = object.Key.split("/");
        const category = parts[0];
        const id = parts[1].replace(".md", "");
        
        resources.push({
          id,
          category: category as any,
          title: id,
          description: "",
          tags: [],
          capabilities: [],
          useWhen: [],
          estimatedTokens: Math.ceil((object.Size || 0) / 4),
          source: this.name,
          sourceUri: `s3://${this.bucketName}/${object.Key}`,
        });
      }
    }
    
    return {
      provider: this.name,
      totalCount: resources.length,
      resources,
      version: new Date().toISOString(),
      timestamp: new Date(),
      categories: [...new Set(resources.map(r => r.category))],
      stats: { byCategory: {}, totalTokens: 0, topTags: [] },
    };
  }

  async fetchResource(id: string, category: string): Promise<RemoteResource> {
    const key = `${category}/${id}.md`;
    
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    
    const response = await this.s3Client.send(command);
    const content = await response.Body?.transformToString() || "";
    
    // Parse markdown with frontmatter
    const parsed = matter(content);
    
    return {
      id,
      category: category as any,
      title: parsed.data.title || id,
      description: parsed.data.description || "",
      tags: parsed.data.tags || [],
      capabilities: parsed.data.capabilities || [],
      useWhen: parsed.data.useWhen || [],
      estimatedTokens: Math.ceil(content.length / 4),
      source: this.name,
      sourceUri: `s3://${this.bucketName}/${key}`,
      content: parsed.content,
    };
  }

  // ... implement other methods
}
```

---

## Next Steps

- **[Architecture](./architecture.md)** - Understand the system design
- **[Configuration](./configuration.md)** - Configure your provider
- **[Usage Guide](./usage.md)** - Use your provider in workflows

---

**Development questions?** Check the [main documentation](../README.md) or open an issue.
