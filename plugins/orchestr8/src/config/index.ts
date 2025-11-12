/**
 * Configuration module barrel exports
 * Centralized exports for all configuration-related functionality
 */

// Schema exports
export {
  configSchema,
  validateConfig,
  safeValidateConfig,
  getDefaultConfig,
  type RateLimitConfig,
  type AitmplProviderConfig,
  type GithubAuthConfig,
  type GithubProviderConfig,
  type CustomEndpointConfig,
  type CustomProviderConfig,
  type ResourceProvidersConfig,
  type ProviderDefaultsConfig,
  type Config,
} from "./schema.js";

// Loader exports
export {
  ConfigLoader,
  type ConfigSource,
} from "./loader.js";

// Provider configuration exports
export {
  ProviderConfigManager,
  type ProviderInfo,
} from "./providers.js";
