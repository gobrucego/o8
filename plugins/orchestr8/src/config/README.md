# Configuration Module

This module provides a comprehensive configuration system for remote resource providers in the orchestr8 MCP server.

## Quick Start

```typescript
import { Logger } from "../utils/logger.js";
import { ConfigLoader, ProviderConfigManager } from "./index.js";

// Initialize
const logger = new Logger("app");
const configLoader = new ConfigLoader(logger);
const providerManager = new ProviderConfigManager(logger, configLoader);

await providerManager.initialize();

// Use configuration
const aitmplConfig = providerManager.getAitmplConfig();
console.log(aitmplConfig.apiUrl);
```

## Files

- **schema.ts** - Zod schemas and TypeScript types for configuration validation
- **loader.ts** - Multi-source configuration loader (env vars, config files, defaults)
- **providers.ts** - Runtime provider configuration management
- **index.ts** - Barrel exports for public API

## Features

- Multi-source configuration (environment variables, config files, defaults)
- Runtime configuration updates with validation
- Type-safe configuration access
- Zod-based schema validation
- Hot reload support
- Provider enable/disable at runtime
- Rate limit, cache TTL, timeout, and retry configuration

## Configuration Sources (Priority)

1. Environment variables (highest)
2. `.orchestr8rc.json` in project root
3. `~/.orchestr8/config.json` or `~/orchestr8.config.json`
4. Default configuration (lowest)

## See Also

- `/plugins/orchestr8/CONFIGURATION.md` - Complete configuration documentation
- `/plugins/orchestr8/.env.example` - Environment variable examples
- `/plugins/orchestr8/.orchestr8rc.example.json` - Config file example
