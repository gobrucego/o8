/**
 * Example usage of the configuration system
 * This file demonstrates how to use the configuration module
 */

import { Logger } from "../utils/logger.js";
import { ConfigLoader, ProviderConfigManager, getDefaultConfig } from "./index.js";

/**
 * Example 1: Get default configuration
 */
export function exampleGetDefaults() {
  const defaultConfig = getDefaultConfig();
  console.log("Default AITMPL API URL:", defaultConfig.resourceProviders.aitmpl.apiUrl);
  console.log("Default cache TTL:", defaultConfig.providerDefaults.cacheTTL);
}

/**
 * Example 2: Load configuration from all sources
 */
export async function exampleLoadConfig() {
  const logger = new Logger("config-example");
  const configLoader = new ConfigLoader(logger);

  // Load configuration from all sources
  const config = await configLoader.load();

  console.log("Configuration loaded successfully");
  console.log("Enabled providers:", {
    aitmpl: config.resourceProviders.aitmpl.enabled,
    github: config.resourceProviders.github.enabled,
    custom: config.resourceProviders.custom.enabled,
  });

  return configLoader;
}

/**
 * Example 3: Use provider manager
 */
export async function exampleProviderManager() {
  const logger = new Logger("provider-example");
  const configLoader = new ConfigLoader(logger);
  const providerManager = new ProviderConfigManager(logger, configLoader);

  // Initialize configuration
  await providerManager.initialize();

  // Get enabled providers
  const enabledProviders = providerManager.getEnabledProviders();
  console.log("Enabled providers:", enabledProviders);

  // Get all provider info
  const providers = providerManager.getAvailableProviders();
  providers.forEach((provider) => {
    console.log(
      `Provider: ${provider.name}, Enabled: ${provider.enabled}, Configured: ${provider.configured}`
    );
  });

  // Get specific provider config
  const aitmplConfig = providerManager.getAitmplConfig();
  console.log("AITMPL API URL:", aitmplConfig.apiUrl);
  console.log("AITMPL Categories:", aitmplConfig.categories);

  // Validate configuration
  const validation = providerManager.validateConfiguration();
  console.log("Configuration valid:", validation.valid);
  if (validation.warnings.length > 0) {
    console.log("Warnings:", validation.warnings);
  }

  return providerManager;
}

/**
 * Example 4: Runtime configuration updates
 */
export async function exampleRuntimeUpdates() {
  const logger = new Logger("runtime-example");
  const configLoader = new ConfigLoader(logger);
  const providerManager = new ProviderConfigManager(logger, configLoader);

  await providerManager.initialize();

  // Update cache TTL
  console.log("Updating cache TTL...");
  await providerManager.updateCacheTTL("aitmpl", 7200000); // 2 hours

  // Update rate limits
  console.log("Updating rate limits...");
  await providerManager.updateRateLimits("aitmpl", {
    requestsPerMinute: 120,
    requestsPerHour: 2000,
  });

  // Update timeout
  console.log("Updating timeout...");
  await providerManager.updateTimeout("github", 60000); // 60 seconds

  // Enable provider
  console.log("Enabling GitHub provider...");
  await providerManager.enableProvider("github");

  const config = providerManager.getConfig();
  console.log("Updated configuration:", {
    aitmplCacheTTL: config.resourceProviders.aitmpl.cacheTTL,
    aitmplRateLimit: config.resourceProviders.aitmpl.rateLimit,
    githubTimeout: config.resourceProviders.github.timeout,
    githubEnabled: config.resourceProviders.github.enabled,
  });
}

/**
 * Example 5: Check provider configuration
 */
export async function exampleCheckProvider() {
  const logger = new Logger("check-example");
  const configLoader = new ConfigLoader(logger);
  const providerManager = new ProviderConfigManager(logger, configLoader);

  await providerManager.initialize();

  // Check if provider is enabled
  const isAitmplEnabled = configLoader.isProviderEnabled("aitmpl");
  console.log("Is AITMPL enabled?", isAitmplEnabled);

  // Get provider config
  const githubConfig = configLoader.getProviderConfig("github");
  console.log("GitHub repos:", githubConfig.repos);
  console.log("GitHub branch:", githubConfig.branch);
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log("\n=== Example 1: Get Defaults ===");
  exampleGetDefaults();

  console.log("\n=== Example 2: Load Config ===");
  await exampleLoadConfig();

  console.log("\n=== Example 3: Provider Manager ===");
  await exampleProviderManager();

  console.log("\n=== Example 4: Runtime Updates ===");
  await exampleRuntimeUpdates();

  console.log("\n=== Example 5: Check Provider ===");
  await exampleCheckProvider();
}

// Uncomment to run examples directly
// runAllExamples().catch(console.error);
