# Provider Configuration Guide

> **Complete reference for configuring resource providers**

This guide covers all configuration options for the Orchestr8 provider system, including provider-specific settings, environment variables, and advanced configuration patterns.

## Table of Contents

- [Configuration Files](#configuration-files)
- [Environment Variables](#environment-variables)
- [Provider Configuration](#provider-configuration)
  - [LocalProvider](#localprovider-configuration)
  - [AITMPLProvider](#aitmplprovider-configuration)
  - [GitHubProvider](#githubprovider-configuration)
- [Registry Configuration](#registry-configuration)
- [Cache Configuration](#cache-configuration)
- [Rate Limiting](#rate-limiting)
- [Authentication](#authentication)
- [Advanced Patterns](#advanced-patterns)
- [Validation](#validation)
- [Troubleshooting](#troubleshooting)

## Configuration Files

### File Locations (Priority Order)

The provider system looks for configuration files in the following order:

1. **Project-specific** (highest priority)
   - `./orchestr8.config.json`
   - `./.orchestr8/config.json`

2. **User-level**
   - `~/.orchestr8/config.json`
   - `~/.config/orchestr8/config.json`

3. **Built-in defaults** (fallback)

### Basic Configuration File

Create `orchestr8.config.json` in your project root:

```json
{
  "providers": {
    "local": {
      "enabled": true
    },
    "aitmpl": {
      "enabled": true
    },
    "github": {
      "enabled": true,
      "repos": ["davila7/claude-code-templates"]
    }
  }
}
```

### Complete Configuration Schema

```json
{
  "providers": {
    "local": {
      "enabled": true,
      "resourcesPath": "./resources",
      "cacheSize": 200,
      "cacheTTL": 14400000,
      "indexCacheTTL": 86400000,
      "enableCache": true
    },
    "aitmpl": {
      "enabled": true,
      "apiUrl": "https://api.aitmpl.com",
      "cacheTTL": 86400000,
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
      "enabled": true,
      "repos": [
        "davila7/claude-code-templates",
        "myorg/internal-resources"
      ],
      "branch": "main",
      "cacheTTL": 86400000,
      "auth": {
        "token": "${GITHUB_TOKEN}",
        "type": "personal"
      },
      "timeout": 30000,
      "retryAttempts": 3
    }
  },
  "registry": {
    "enableHealthChecks": true,
    "healthCheckInterval": 60000,
    "autoDisableUnhealthy": true,
    "maxConsecutiveFailures": 3,
    "enableEvents": true
  },
  "providerDefaults": {
    "priority": 100,
    "cacheTTL": 3600000,
    "timeout": 30000,
    "retryAttempts": 3
  }
}
```

## Environment Variables

### Core Variables

```bash
# Resource paths
export RESOURCES_PATH="./resources"         # Local resources directory
export PROMPTS_PATH="./prompts"            # Prompts directory

# Cache configuration
export CACHE_SIZE="200"                    # LRU cache size
export CACHE_TTL="14400000"               # Cache TTL in milliseconds

# Logging
export LOG_LEVEL="info"                    # debug|info|warn|error
export NODE_ENV="production"               # production|development|test
```

### Provider-Specific Variables

```bash
# GitHub authentication
export GITHUB_TOKEN="ghp_your_personal_access_token"
export GITHUB_REPOS="davila7/claude-code-templates,myorg/resources"

# AITMPL configuration
export AITMPL_ENABLED="true"
export AITMPL_CACHE_TTL="86400000"

# HTTP transport
export O8_HTTP="true"              # Enable HTTP transport
export O8_HTTP_PORT="3000"         # HTTP server port
```

### Environment Variable Substitution

Configuration files support environment variable substitution:

```json
{
  "providers": {
    "github": {
      "auth": {
        "token": "${GITHUB_TOKEN}"        // Replaced at runtime
      },
      "repos": "${GITHUB_REPOS}"          // Can be comma-separated list
    },
    "aitmpl": {
      "cacheTTL": "${AITMPL_CACHE_TTL:-86400000}"  // With default value
    }
  }
}
```

**Syntax**:
- `${VAR}` - Required variable (fails if not set)
- `${VAR:-default}` - Optional variable with default
- `${VAR:?error message}` - Required with custom error

## Provider Configuration

### LocalProvider Configuration

**Purpose**: Configure access to local filesystem resources

```json
{
  "providers": {
    "local": {
      "enabled": true,
      "resourcesPath": "./resources",
      "cacheSize": 200,
      "cacheTTL": 14400000,
      "indexCacheTTL": 86400000,
      "enableCache": true
    }
  }
}
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable LocalProvider |
| `resourcesPath` | string | `"./resources"` | Path to resources directory |
| `cacheSize` | number | `200` | Maximum cached resources |
| `cacheTTL` | number | `14400000` | Cache TTL (4 hours) |
| `indexCacheTTL` | number | `86400000` | Index cache TTL (24 hours) |
| `enableCache` | boolean | `true` | Enable/disable caching |

#### Examples

**Development setup** (frequent changes):
```json
{
  "providers": {
    "local": {
      "enabled": true,
      "resourcesPath": "./resources",
      "cacheTTL": 60000,           // 1 minute cache
      "indexCacheTTL": 300000      // 5 minute index
    }
  }
}
```

**Production setup** (stable resources):
```json
{
  "providers": {
    "local": {
      "enabled": true,
      "resourcesPath": "/opt/orchestr8/resources",
      "cacheSize": 500,            // Larger cache
      "cacheTTL": 86400000,        // 24 hour cache
      "indexCacheTTL": 86400000    // 24 hour index
    }
  }
}
```

**Custom resource path**:
```json
{
  "providers": {
    "local": {
      "enabled": true,
      "resourcesPath": "${HOME}/.orchestr8/custom-resources"
    }
  }
}
```

---

### AITMPLProvider Configuration

**Purpose**: Configure access to aitmpl.com community resources

```json
{
  "providers": {
    "aitmpl": {
      "enabled": true,
      "apiUrl": "https://api.aitmpl.com",
      "cacheTTL": 86400000,
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
    }
  }
}
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable AITMPLProvider |
| `apiUrl` | string | `"https://api.aitmpl.com"` | AITMPL API base URL |
| `cacheTTL` | number | `86400000` | Cache TTL (24 hours) |
| `categories` | string[] | See below | Resource categories to fetch |
| `rateLimit.requestsPerMinute` | number | `60` | Requests per minute limit |
| `rateLimit.requestsPerHour` | number | `1000` | Requests per hour limit |
| `timeout` | number | `30000` | Request timeout (ms) |
| `retryAttempts` | number | `3` | Max retry attempts |

**Default Categories**:
```json
["agents", "skills", "workflows", "patterns", "examples", "best-practices"]
```

#### Examples

**Conservative rate limiting** (shared environments):
```json
{
  "providers": {
    "aitmpl": {
      "enabled": true,
      "rateLimit": {
        "requestsPerMinute": 30,   // Lower limits
        "requestsPerHour": 500
      },
      "retryAttempts": 5          // More retries
    }
  }
}
```

**Aggressive caching** (stable content):
```json
{
  "providers": {
    "aitmpl": {
      "enabled": true,
      "cacheTTL": 604800000,      // 7 days
      "timeout": 60000            // Longer timeout
    }
  }
}
```

**Filter categories** (specific needs):
```json
{
  "providers": {
    "aitmpl": {
      "enabled": true,
      "categories": ["agents", "skills"]  // Only these categories
    }
  }
}
```

**Disable for offline work**:
```json
{
  "providers": {
    "aitmpl": {
      "enabled": false            // Only use local resources
    }
  }
}
```

---

### GitHubProvider Configuration

**Purpose**: Configure access to GitHub repositories

```json
{
  "providers": {
    "github": {
      "enabled": true,
      "repos": [
        "davila7/claude-code-templates",
        "myorg/internal-resources"
      ],
      "branch": "main",
      "cacheTTL": 86400000,
      "auth": {
        "token": "${GITHUB_TOKEN}",
        "type": "personal"
      },
      "timeout": 30000,
      "retryAttempts": 3
    }
  }
}
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable GitHubProvider |
| `repos` | string[] | `[]` | Repository list (`owner/repo`) |
| `branch` | string | `"main"` | Default branch name |
| `cacheTTL` | number | `86400000` | Cache TTL (24 hours) |
| `auth.token` | string | `undefined` | GitHub token (PAT or OAuth) |
| `auth.type` | string | `"personal"` | Token type: `personal` or `oauth` |
| `timeout` | number | `30000` | Request timeout (ms) |
| `retryAttempts` | number | `3` | Max retry attempts |

#### Examples

**Single public repository** (no auth):
```json
{
  "providers": {
    "github": {
      "enabled": true,
      "repos": ["davila7/claude-code-templates"],
      "branch": "main"
    }
  }
}
```

**Multiple repositories with authentication**:
```json
{
  "providers": {
    "github": {
      "enabled": true,
      "repos": [
        "davila7/claude-code-templates",
        "mycompany/internal-agents",
        "mycompany/security-patterns"
      ],
      "auth": {
        "token": "${GITHUB_TOKEN}",
        "type": "personal"
      }
    }
  }
}
```

**Different branches per repo** (requires array of objects):
```json
{
  "providers": {
    "github": {
      "enabled": true,
      "repos": [
        {
          "owner": "davila7",
          "repo": "claude-code-templates",
          "branch": "main"
        },
        {
          "owner": "mycompany",
          "repo": "internal-resources",
          "branch": "production"
        }
      ]
    }
  }
}
```

**Long cache for stable repos**:
```json
{
  "providers": {
    "github": {
      "enabled": true,
      "repos": ["stable-org/patterns"],
      "cacheTTL": 604800000,      // 7 days
      "timeout": 60000            // Longer timeout for large repos
    }
  }
}
```

## Registry Configuration

**Purpose**: Configure global registry behavior

```json
{
  "registry": {
    "enableHealthChecks": true,
    "healthCheckInterval": 60000,
    "autoDisableUnhealthy": true,
    "maxConsecutiveFailures": 3,
    "enableEvents": true
  }
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableHealthChecks` | boolean | `true` | Enable periodic health checks |
| `healthCheckInterval` | number | `60000` | Health check interval (ms) |
| `autoDisableUnhealthy` | boolean | `true` | Auto-disable failing providers |
| `maxConsecutiveFailures` | number | `3` | Failures before auto-disable |
| `enableEvents` | boolean | `true` | Emit provider events |

### Examples

**Frequent health checks** (critical systems):
```json
{
  "registry": {
    "enableHealthChecks": true,
    "healthCheckInterval": 30000,     // Every 30 seconds
    "autoDisableUnhealthy": true,
    "maxConsecutiveFailures": 2       // Disable faster
  }
}
```

**Lenient monitoring** (development):
```json
{
  "registry": {
    "enableHealthChecks": true,
    "healthCheckInterval": 300000,    // Every 5 minutes
    "autoDisableUnhealthy": false,    // Don't auto-disable
    "maxConsecutiveFailures": 10      // Very tolerant
  }
}
```

**Disable health checks** (offline work):
```json
{
  "registry": {
    "enableHealthChecks": false       // No monitoring
  }
}
```

## Cache Configuration

### Per-Provider Cache Settings

Each provider can have independent cache configuration:

```json
{
  "providers": {
    "local": {
      "cacheSize": 200,
      "cacheTTL": 14400000,           // 4 hours
      "indexCacheTTL": 86400000,      // 24 hours
      "enableCache": true
    },
    "aitmpl": {
      "cacheTTL": 86400000            // 24 hours
    },
    "github": {
      "cacheTTL": 86400000            // 24 hours
    }
  }
}
```

### Cache Size Guidelines

**Memory-constrained** (<4GB RAM):
```json
{
  "providers": {
    "local": { "cacheSize": 50 },
    "aitmpl": { "cacheSize": 100 },
    "github": { "cacheSize": 100 }
  }
}
```

**Normal** (4-8GB RAM):
```json
{
  "providers": {
    "local": { "cacheSize": 200 },
    "aitmpl": { "cacheSize": 500 },
    "github": { "cacheSize": 500 }
  }
}
```

**High-performance** (>8GB RAM):
```json
{
  "providers": {
    "local": { "cacheSize": 1000 },
    "aitmpl": { "cacheSize": 2000 },
    "github": { "cacheSize": 2000 }
  }
}
```

### Cache TTL Strategy

```json
{
  "providers": {
    "local": {
      "cacheTTL": 3600000,            // 1 hour (frequently changed)
      "indexCacheTTL": 14400000       // 4 hours
    },
    "aitmpl": {
      "cacheTTL": 86400000            // 24 hours (stable community content)
    },
    "github": {
      "cacheTTL": 86400000            // 24 hours (version controlled)
    }
  }
}
```

## Rate Limiting

### AITMPL Rate Limiting

```json
{
  "providers": {
    "aitmpl": {
      "rateLimit": {
        "requestsPerMinute": 60,
        "requestsPerHour": 1000
      }
    }
  }
}
```

**Token Bucket Algorithm**:
- Smooth distribution of requests
- Prevents bursts from exceeding limits
- Automatic refill over time

### GitHub Rate Limiting

GitHub API has built-in rate limiting:

**Unauthenticated**:
- 60 requests per hour per IP

**Authenticated (Personal Access Token)**:
- 5000 requests per hour per user

```json
{
  "providers": {
    "github": {
      "auth": {
        "token": "${GITHUB_TOKEN}",   // Increases limit to 5000/hr
        "type": "personal"
      }
    }
  }
}
```

## Authentication

### GitHub Authentication

#### Personal Access Token (Recommended)

1. **Create token** at https://github.com/settings/tokens

2. **Set permissions**:
   - `repo` - For private repositories
   - `public_repo` - For public repositories only

3. **Configure**:
```bash
export GITHUB_TOKEN="ghp_your_personal_access_token"
```

```json
{
  "providers": {
    "github": {
      "auth": {
        "token": "${GITHUB_TOKEN}",
        "type": "personal"
      }
    }
  }
}
```

#### OAuth Token

For OAuth apps:

```json
{
  "providers": {
    "github": {
      "auth": {
        "token": "${GITHUB_OAUTH_TOKEN}",
        "type": "oauth"
      }
    }
  }
}
```

### Security Best Practices

1. **Never commit tokens** to version control
2. **Use environment variables** for sensitive data
3. **Rotate tokens regularly** (every 90 days)
4. **Minimum permissions** (only what's needed)
5. **Separate tokens** for dev/staging/production

## Advanced Patterns

### Multi-Environment Configuration

**development.json**:
```json
{
  "providers": {
    "local": {
      "enabled": true,
      "cacheTTL": 60000           // 1 minute (fast iteration)
    },
    "aitmpl": {
      "enabled": false            // Offline development
    },
    "github": {
      "enabled": false
    }
  }
}
```

**production.json**:
```json
{
  "providers": {
    "local": {
      "enabled": true,
      "cacheTTL": 86400000        // 24 hours (stable)
    },
    "aitmpl": {
      "enabled": true,
      "cacheTTL": 604800000       // 7 days
    },
    "github": {
      "enabled": true,
      "repos": ["mycompany/production-resources"]
    }
  }
}
```

**Load based on NODE_ENV**:
```typescript
const env = process.env.NODE_ENV || "development";
const configFile = `./${env}.orchestr8.config.json`;
```

### Conditional Provider Loading

```json
{
  "providers": {
    "local": {
      "enabled": true
    },
    "aitmpl": {
      "enabled": "${ENABLE_AITMPL:-true}"
    },
    "github": {
      "enabled": "${ENABLE_GITHUB:-false}"
    }
  }
}
```

```bash
# Enable all providers
export ENABLE_AITMPL=true
export ENABLE_GITHUB=true

# Disable remote providers (offline mode)
export ENABLE_AITMPL=false
export ENABLE_GITHUB=false
```

### Team Configuration

**`.orchestr8/team.config.json`** (committed to repo):
```json
{
  "providers": {
    "github": {
      "enabled": true,
      "repos": [
        "mycompany/shared-agents",
        "mycompany/security-patterns"
      ],
      "auth": {
        "token": "${TEAM_GITHUB_TOKEN}",
        "type": "personal"
      }
    }
  }
}
```

**`.orchestr8/personal.config.json`** (in .gitignore):
```json
{
  "providers": {
    "local": {
      "resourcesPath": "${HOME}/my-custom-resources"
    }
  }
}
```

**Merge strategy**:
```typescript
const teamConfig = loadConfig(".orchestr8/team.config.json");
const personalConfig = loadConfig(".orchestr8/personal.config.json");
const mergedConfig = merge(teamConfig, personalConfig);
```

## Validation

### Zod Schema Validation

Configuration is validated using Zod schemas:

```typescript
import { validateConfig, safeValidateConfig } from "./config/schema.js";

// Throws on validation failure
const config = validateConfig(rawConfig);

// Safe validation with error details
const result = safeValidateConfig(rawConfig);
if (!result.success) {
  console.error("Configuration errors:", result.errors);
  // [
  //   { path: "providers.github.repos", message: "Expected array" },
  //   { path: "providers.aitmpl.timeout", message: "Expected number" }
  // ]
}
```

### Common Validation Errors

**Missing required fields**:
```
Error: providers.github.repos: Required
```

**Invalid types**:
```
Error: providers.aitmpl.cacheTTL: Expected number, received string
```

**Invalid values**:
```
Error: providers.aitmpl.rateLimit.requestsPerMinute: Number must be positive
```

**URL validation**:
```
Error: providers.aitmpl.apiUrl: Invalid URL
```

## Troubleshooting

### Configuration Not Loading

1. **Check file location**:
```bash
# Debug configuration loading
LOG_LEVEL=debug npm run dev

# Expected output:
# [ConfigLoader] Looking for config at: ./orchestr8.config.json
# [ConfigLoader] Config file found: ./orchestr8.config.json
# [ConfigLoader] Config loaded and validated
```

2. **Validate JSON syntax**:
```bash
# Use jq to validate JSON
jq . orchestr8.config.json
```

3. **Check permissions**:
```bash
ls -la orchestr8.config.json
# Should be readable by current user
```

### Environment Variables Not Substituting

1. **Check variable is set**:
```bash
echo $GITHUB_TOKEN
# Should output your token (not empty)
```

2. **Use correct syntax**:
```json
"token": "${GITHUB_TOKEN}"     // Correct
"token": "$GITHUB_TOKEN"       // Wrong (missing braces)
"token": "GITHUB_TOKEN"        // Wrong (no $)
```

3. **Debug substitution**:
```typescript
console.log("GITHUB_TOKEN:", process.env.GITHUB_TOKEN);
```

### Provider Not Initializing

1. **Check enabled flag**:
```json
{
  "providers": {
    "github": {
      "enabled": true    // Must be true
    }
  }
}
```

2. **Check provider logs**:
```bash
LOG_LEVEL=debug npm run dev
# Look for: [GitHubProvider] Initializing...
```

3. **Verify authentication**:
```bash
# Test GitHub token
curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user
```

### Rate Limit Issues

**Symptoms**: 429 errors, slow responses

**Solutions**:

1. **Increase rate limits** (if allowed):
```json
{
  "providers": {
    "aitmpl": {
      "rateLimit": {
        "requestsPerMinute": 120,
        "requestsPerHour": 2000
      }
    }
  }
}
```

2. **Enable aggressive caching**:
```json
{
  "providers": {
    "aitmpl": {
      "cacheTTL": 604800000    // 7 days
    }
  }
}
```

3. **Use authentication** (GitHub):
```bash
export GITHUB_TOKEN="your_token"
# Increases limit from 60/hr to 5000/hr
```

---

## Next Steps

- **[Usage Guide](./usage.md)** - Practical usage examples
- **[API Reference](./api.md)** - HTTP API documentation
- **[Architecture](./architecture.md)** - System design deep-dive
- **[Development Guide](./development.md)** - Build custom providers

---

**Configuration questions?** Check the [troubleshooting guide](../guides/troubleshooting.md) or open an issue.
