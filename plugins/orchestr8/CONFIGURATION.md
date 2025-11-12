# Configuration System Documentation

## Overview

The orchestr8 MCP server uses a flexible, multi-source configuration system for managing remote resource providers. Configuration can be loaded from environment variables, config files, or use sensible defaults.

## Configuration Sources (Priority Order)

Configuration is loaded from multiple sources in the following priority order (highest to lowest):

1. **Environment Variables** (highest priority)
2. **Project Config File** (`.orchestr8rc.json` in project root)
3. **User Config File** (`~/.orchestr8/config.json` or `~/orchestr8.config.json`)
4. **Default Configuration** (fallback)

Higher priority sources override lower priority sources during configuration merge.

## Configuration Structure

### Complete Configuration Schema

```typescript
{
  resourceProviders: {
    aitmpl: {
      enabled: boolean;              // Enable/disable provider
      apiUrl: string;                // API endpoint URL
      cacheTTL: number;              // Cache time-to-live in ms
      categories: string[];          // Resource categories to fetch
      rateLimit: {
        requestsPerMinute: number;   // Rate limit per minute
        requestsPerHour: number;     // Rate limit per hour
      };
      timeout: number;               // Request timeout in ms
      retryAttempts: number;         // Number of retry attempts
    },
    github: {
      enabled: boolean;
      repos: string[];               // List of repos (owner/repo)
      branch: string;                // Branch to fetch from
      cacheTTL: number;
      auth?: {
        token: string;               // GitHub token
        type: 'personal' | 'oauth';  // Token type
      };
      timeout: number;
      retryAttempts: number;
    },
    custom: {
      enabled: boolean;
      endpoints: Array<{
        name: string;                // Endpoint name
        url: string;                 // Endpoint URL
        headers?: Record<string, string>; // Custom headers
      }>;
      cacheTTL: number;
      timeout: number;
      retryAttempts: number;
    }
  },
  providerDefaults: {
    priority: number;                // Default priority (0-1000)
    cacheTTL: number;                // Default cache TTL in ms
    timeout: number;                 // Default timeout in ms
    retryAttempts: number;           // Default retry attempts
  }
}
```

## Environment Variables

All environment variables are prefixed with `ORCHESTR8_`.

### AITMPL Provider

```bash
ORCHESTR8_AITMPL_ENABLED=true
ORCHESTR8_AITMPL_API_URL=https://api.aitmpl.com
ORCHESTR8_AITMPL_CACHE_TTL=3600000
ORCHESTR8_AITMPL_TIMEOUT=30000
ORCHESTR8_AITMPL_RETRY_ATTEMPTS=3
```

### GitHub Provider

```bash
ORCHESTR8_GITHUB_ENABLED=false
ORCHESTR8_GITHUB_TOKEN=ghp_your_token_here
ORCHESTR8_GITHUB_TOKEN_TYPE=personal
ORCHESTR8_GITHUB_REPOS=username/repo1,username/repo2
ORCHESTR8_GITHUB_BRANCH=main
ORCHESTR8_GITHUB_CACHE_TTL=3600000
```

### Custom Provider

```bash
ORCHESTR8_CUSTOM_ENABLED=false
# Note: Custom endpoints must be configured via config files
```

### Provider Defaults

```bash
ORCHESTR8_PROVIDER_PRIORITY=100
ORCHESTR8_PROVIDER_CACHE_TTL=3600000
ORCHESTR8_PROVIDER_TIMEOUT=30000
ORCHESTR8_PROVIDER_RETRY_ATTEMPTS=3
```

## Configuration Files

### Project Configuration

Create `.orchestr8rc.json` in your project root:

```json
{
  "resourceProviders": {
    "aitmpl": {
      "enabled": true,
      "apiUrl": "https://api.aitmpl.com",
      "cacheTTL": 3600000,
      "categories": ["agents", "skills", "workflows"],
      "rateLimit": {
        "requestsPerMinute": 60,
        "requestsPerHour": 1000
      },
      "timeout": 30000,
      "retryAttempts": 3
    },
    "github": {
      "enabled": true,
      "repos": ["myorg/prompts", "myorg/agents"],
      "branch": "main",
      "cacheTTL": 3600000,
      "auth": {
        "token": "ghp_your_token_here",
        "type": "personal"
      }
    }
  }
}
```

### User Configuration

Create `~/.orchestr8/config.json` or `~/orchestr8.config.json`:

```json
{
  "resourceProviders": {
    "github": {
      "auth": {
        "token": "ghp_your_personal_token",
        "type": "personal"
      }
    }
  },
  "providerDefaults": {
    "cacheTTL": 7200000
  }
}
```

## Default Configuration

If no configuration is provided, the following defaults are used:

```json
{
  "resourceProviders": {
    "aitmpl": {
      "enabled": true,
      "apiUrl": "https://api.aitmpl.com",
      "cacheTTL": 3600000,
      "categories": [
        "agents",
        "skills",
        "workflows",
        "patterns",
        "examples",
        "best-practices"
      ],
      "rateLimit": {
        "requestsPerMinute": 60,
        "requestsPerHour": 1000
      },
      "timeout": 30000,
      "retryAttempts": 3
    },
    "github": {
      "enabled": false,
      "repos": [],
      "branch": "main",
      "cacheTTL": 3600000,
      "timeout": 30000,
      "retryAttempts": 3
    },
    "custom": {
      "enabled": false,
      "endpoints": [],
      "cacheTTL": 3600000,
      "timeout": 30000,
      "retryAttempts": 3
    }
  },
  "providerDefaults": {
    "priority": 100,
    "cacheTTL": 3600000,
    "timeout": 30000,
    "retryAttempts": 3
  }
}
```

## Usage Examples

### Basic Usage

```typescript
import { Logger } from "./utils/logger.js";
import { ConfigLoader, ProviderConfigManager } from "./config/index.js";

// Initialize logger
const logger = new Logger("config-example");

// Create config loader
const configLoader = new ConfigLoader(logger);

// Load configuration
const config = await configLoader.load();

// Create provider manager
const providerManager = new ProviderConfigManager(logger, configLoader);
await providerManager.initialize();

// Check enabled providers
const enabledProviders = providerManager.getEnabledProviders();
console.log("Enabled providers:", enabledProviders);

// Get specific provider config
const aitmplConfig = providerManager.getAitmplConfig();
console.log("AITMPL API URL:", aitmplConfig.apiUrl);
```

### Runtime Configuration Updates

```typescript
// Enable a provider at runtime
await providerManager.enableProvider("github");

// Update cache TTL
await providerManager.updateCacheTTL("aitmpl", 7200000); // 2 hours

// Update rate limits
await providerManager.updateRateLimits("aitmpl", {
  requestsPerMinute: 120,
  requestsPerHour: 2000
});

// Update timeout
await providerManager.updateTimeout("github", 60000); // 60 seconds

// Update retry attempts
await providerManager.updateRetryAttempts("custom", 5);

// Reload configuration from all sources
await providerManager.reload();
```

### Configuration Validation

```typescript
// Validate configuration
const validation = providerManager.validateConfiguration();

if (!validation.valid) {
  console.error("Configuration errors:", validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn("Configuration warnings:", validation.warnings);
}
```

### Provider Information

```typescript
// Get all available providers
const providers = providerManager.getAvailableProviders();
/*
[
  { name: "aitmpl", enabled: true, configured: true },
  { name: "github", enabled: false, configured: false },
  { name: "custom", enabled: false, configured: false }
]
*/

// Check if specific provider is enabled
const isEnabled = configLoader.isProviderEnabled("aitmpl");
```

## Integration Points

### For Provider Implementations (Wave 2)

Provider implementations should use the configuration system as follows:

```typescript
import { ProviderConfigManager } from "../config/index.js";

class AitmplProvider {
  constructor(private configManager: ProviderConfigManager) {}

  async initialize() {
    const config = this.configManager.getAitmplConfig();
    
    if (!config.enabled) {
      throw new Error("AITMPL provider is not enabled");
    }

    // Use configuration
    this.apiUrl = config.apiUrl;
    this.cacheTTL = config.cacheTTL;
    this.timeout = config.timeout;
    this.retryAttempts = config.retryAttempts;
    this.rateLimit = config.rateLimit;
  }
}
```

### For ResourceLoader (Wave 3)

The ResourceLoader should use the configuration system to initialize providers:

```typescript
import { ConfigLoader, ProviderConfigManager } from "../config/index.js";

class ResourceLoader {
  private configManager: ProviderConfigManager;

  async initialize() {
    // Initialize configuration
    const configLoader = new ConfigLoader(this.logger);
    this.configManager = new ProviderConfigManager(this.logger, configLoader);
    await this.configManager.initialize();

    // Validate configuration
    const validation = this.configManager.validateConfiguration();
    if (!validation.valid) {
      throw new Error("Invalid provider configuration");
    }

    // Initialize enabled providers
    const enabledProviders = this.configManager.getEnabledProviders();
    for (const providerName of enabledProviders) {
      await this.initializeProvider(providerName);
    }
  }
}
```

## Validation and Error Handling

The configuration system uses Zod for schema validation and provides detailed error messages:

```typescript
import { safeValidateConfig } from "./config/index.js";

const result = safeValidateConfig(userConfig);

if (!result.success) {
  // Handle validation errors
  result.errors?.forEach(error => {
    console.error(`${error.path}: ${error.message}`);
  });
}
```

### Common Validation Errors

1. **Invalid URL**: `apiUrl must be a valid URL`
2. **Invalid number**: `cacheTTL must be a positive integer`
3. **Invalid enum**: `type must be either 'personal' or 'oauth'`
4. **Missing required field**: `token is required when auth is provided`

## Best Practices

1. **Use environment variables for secrets**: Never commit tokens or sensitive data to config files
2. **Use project config for team settings**: Share `.orchestr8rc.json` with your team
3. **Use user config for personal settings**: Keep personal tokens in `~/.orchestr8/config.json`
4. **Validate configuration on startup**: Use `validateConfiguration()` to catch issues early
5. **Use sensible cache TTLs**: Balance between freshness and API rate limits
6. **Enable only needed providers**: Disable unused providers to reduce startup time
7. **Monitor rate limits**: Adjust `requestsPerMinute` and `requestsPerHour` based on your API limits

## Troubleshooting

### Configuration not loading

1. Check file permissions on config files
2. Verify JSON syntax in config files
3. Check environment variable names (must be prefixed with `ORCHESTR8_`)
4. Review logs for validation errors

### Provider not enabled

1. Check `enabled` flag in configuration
2. Verify provider is properly configured (e.g., repos for GitHub)
3. Check for validation warnings
4. Ensure authentication tokens are provided if required

### Rate limit errors

1. Increase `cacheTTL` to reduce API calls
2. Adjust `requestsPerMinute` and `requestsPerHour`
3. Add authentication tokens for higher rate limits (GitHub)
4. Enable fewer providers to reduce total API usage

## Future Enhancements

- Web UI for configuration management
- Configuration hot reload without server restart
- Provider health checks and auto-disable on failure
- Configuration export/import functionality
- Provider statistics and usage tracking
