/**
 * Configuration loader with multi-source support
 * Loads configuration from environment variables, config files, and defaults
 */
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { safeValidateConfig, getDefaultConfig, } from "./schema.js";
export class ConfigLoader {
    logger;
    config = null;
    configSources = [];
    projectRoot;
    constructor(logger, projectRoot = process.cwd()) {
        this.logger = logger;
        this.projectRoot = projectRoot;
    }
    /**
     * Load configuration from all sources with priority order:
     * 1. Environment variables (highest priority)
     * 2. .orchestr8rc.json in project root
     * 3. orchestr8.config.json in user home
     * 4. Default configuration (fallback)
     */
    async load() {
        this.logger.info("Loading configuration from all sources");
        // Start with default configuration
        const defaultConfig = getDefaultConfig();
        this.configSources.push({
            name: "defaults",
            priority: 0,
            config: defaultConfig,
        });
        // Load from user home config file
        const userConfig = this.loadUserConfig();
        if (userConfig) {
            this.configSources.push({
                name: "user-config",
                priority: 1,
                config: userConfig,
            });
        }
        // Load from project config file
        const projectConfig = this.loadProjectConfig();
        if (projectConfig) {
            this.configSources.push({
                name: "project-config",
                priority: 2,
                config: projectConfig,
            });
        }
        // Load from environment variables
        const envConfig = this.loadEnvConfig();
        if (envConfig) {
            this.configSources.push({
                name: "environment",
                priority: 3,
                config: envConfig,
            });
        }
        // Merge configurations with priority order
        const mergedConfig = this.mergeConfigs();
        // Validate the final configuration
        const validationResult = safeValidateConfig(mergedConfig);
        if (!validationResult.success) {
            this.logger.error("Configuration validation failed", validationResult.errors);
            throw new Error(`Invalid configuration: ${validationResult.errors?.map((e) => `${e.path}: ${e.message}`).join(", ")}`);
        }
        this.config = validationResult.data;
        this.logConfigSummary();
        return this.config;
    }
    /**
     * Load configuration from user home directory
     * ~/.orchestr8/config.json or ~/orchestr8.config.json
     */
    loadUserConfig() {
        const userHome = homedir();
        const possiblePaths = [
            join(userHome, ".orchestr8", "config.json"),
            join(userHome, "orchestr8.config.json"),
        ];
        for (const configPath of possiblePaths) {
            if (existsSync(configPath)) {
                try {
                    this.logger.debug(`Loading user config from ${configPath}`);
                    const content = readFileSync(configPath, "utf-8");
                    const config = JSON.parse(content);
                    this.logger.info(`Loaded user configuration from ${configPath}`);
                    return config;
                }
                catch (error) {
                    this.logger.warn(`Failed to load user config from ${configPath}`, error);
                }
            }
        }
        this.logger.debug("No user configuration file found");
        return null;
    }
    /**
     * Load configuration from project root
     * .orchestr8rc.json or orchestr8.config.json
     */
    loadProjectConfig() {
        const possiblePaths = [
            join(this.projectRoot, ".orchestr8rc.json"),
            join(this.projectRoot, "orchestr8.config.json"),
        ];
        for (const configPath of possiblePaths) {
            if (existsSync(configPath)) {
                try {
                    this.logger.debug(`Loading project config from ${configPath}`);
                    const content = readFileSync(configPath, "utf-8");
                    const config = JSON.parse(content);
                    this.logger.info(`Loaded project configuration from ${configPath}`);
                    return config;
                }
                catch (error) {
                    this.logger.warn(`Failed to load project config from ${configPath}`, error);
                }
            }
        }
        this.logger.debug("No project configuration file found");
        return null;
    }
    /**
     * Load configuration from environment variables
     * Supports ORCHESTR8_ prefixed variables
     */
    loadEnvConfig() {
        const envConfig = {
            resourceProviders: {},
            providerDefaults: {},
        };
        let hasEnvConfig = false;
        // AITMPL provider configuration
        if (process.env.ORCHESTR8_AITMPL_ENABLED !== undefined) {
            envConfig.resourceProviders.aitmpl = envConfig.resourceProviders.aitmpl || {};
            envConfig.resourceProviders.aitmpl.enabled =
                process.env.ORCHESTR8_AITMPL_ENABLED === "true";
            hasEnvConfig = true;
        }
        if (process.env.ORCHESTR8_AITMPL_API_URL) {
            envConfig.resourceProviders.aitmpl = envConfig.resourceProviders.aitmpl || {};
            envConfig.resourceProviders.aitmpl.apiUrl =
                process.env.ORCHESTR8_AITMPL_API_URL;
            hasEnvConfig = true;
        }
        if (process.env.ORCHESTR8_AITMPL_CACHE_TTL) {
            envConfig.resourceProviders.aitmpl = envConfig.resourceProviders.aitmpl || {};
            envConfig.resourceProviders.aitmpl.cacheTTL = parseInt(process.env.ORCHESTR8_AITMPL_CACHE_TTL, 10);
            hasEnvConfig = true;
        }
        if (process.env.ORCHESTR8_AITMPL_TIMEOUT) {
            envConfig.resourceProviders.aitmpl = envConfig.resourceProviders.aitmpl || {};
            envConfig.resourceProviders.aitmpl.timeout = parseInt(process.env.ORCHESTR8_AITMPL_TIMEOUT, 10);
            hasEnvConfig = true;
        }
        if (process.env.ORCHESTR8_AITMPL_RETRY_ATTEMPTS) {
            envConfig.resourceProviders.aitmpl = envConfig.resourceProviders.aitmpl || {};
            envConfig.resourceProviders.aitmpl.retryAttempts = parseInt(process.env.ORCHESTR8_AITMPL_RETRY_ATTEMPTS, 10);
            hasEnvConfig = true;
        }
        // GitHub provider configuration
        if (process.env.ORCHESTR8_GITHUB_ENABLED !== undefined) {
            envConfig.resourceProviders.github = envConfig.resourceProviders.github || {};
            envConfig.resourceProviders.github.enabled =
                process.env.ORCHESTR8_GITHUB_ENABLED === "true";
            hasEnvConfig = true;
        }
        if (process.env.ORCHESTR8_GITHUB_TOKEN) {
            envConfig.resourceProviders.github = envConfig.resourceProviders.github || {};
            envConfig.resourceProviders.github.auth = {
                token: process.env.ORCHESTR8_GITHUB_TOKEN,
                type: process.env.ORCHESTR8_GITHUB_TOKEN_TYPE || "personal",
            };
            hasEnvConfig = true;
        }
        if (process.env.ORCHESTR8_GITHUB_REPOS) {
            envConfig.resourceProviders.github = envConfig.resourceProviders.github || {};
            envConfig.resourceProviders.github.repos =
                process.env.ORCHESTR8_GITHUB_REPOS.split(",").map((r) => r.trim());
            hasEnvConfig = true;
        }
        if (process.env.ORCHESTR8_GITHUB_BRANCH) {
            envConfig.resourceProviders.github = envConfig.resourceProviders.github || {};
            envConfig.resourceProviders.github.branch = process.env.ORCHESTR8_GITHUB_BRANCH;
            hasEnvConfig = true;
        }
        if (process.env.ORCHESTR8_GITHUB_CACHE_TTL) {
            envConfig.resourceProviders.github = envConfig.resourceProviders.github || {};
            envConfig.resourceProviders.github.cacheTTL = parseInt(process.env.ORCHESTR8_GITHUB_CACHE_TTL, 10);
            hasEnvConfig = true;
        }
        // Custom provider configuration
        if (process.env.ORCHESTR8_CUSTOM_ENABLED !== undefined) {
            envConfig.resourceProviders.custom = envConfig.resourceProviders.custom || {};
            envConfig.resourceProviders.custom.enabled =
                process.env.ORCHESTR8_CUSTOM_ENABLED === "true";
            hasEnvConfig = true;
        }
        // Provider defaults
        if (process.env.ORCHESTR8_PROVIDER_PRIORITY) {
            envConfig.providerDefaults.priority = parseInt(process.env.ORCHESTR8_PROVIDER_PRIORITY, 10);
            hasEnvConfig = true;
        }
        if (process.env.ORCHESTR8_PROVIDER_CACHE_TTL) {
            envConfig.providerDefaults.cacheTTL = parseInt(process.env.ORCHESTR8_PROVIDER_CACHE_TTL, 10);
            hasEnvConfig = true;
        }
        if (process.env.ORCHESTR8_PROVIDER_TIMEOUT) {
            envConfig.providerDefaults.timeout = parseInt(process.env.ORCHESTR8_PROVIDER_TIMEOUT, 10);
            hasEnvConfig = true;
        }
        if (process.env.ORCHESTR8_PROVIDER_RETRY_ATTEMPTS) {
            envConfig.providerDefaults.retryAttempts = parseInt(process.env.ORCHESTR8_PROVIDER_RETRY_ATTEMPTS, 10);
            hasEnvConfig = true;
        }
        if (hasEnvConfig) {
            this.logger.info("Loaded configuration from environment variables");
            return envConfig;
        }
        this.logger.debug("No environment variable configuration found");
        return null;
    }
    /**
     * Deep merge configuration objects with priority handling
     */
    mergeConfigs() {
        // Sort sources by priority (lowest to highest)
        const sortedSources = [...this.configSources].sort((a, b) => a.priority - b.priority);
        // Deep merge all configurations
        let merged = {};
        for (const source of sortedSources) {
            merged = this.deepMerge(merged, source.config);
            this.logger.debug(`Merged configuration from ${source.name}`);
        }
        return merged;
    }
    /**
     * Deep merge two objects
     */
    deepMerge(target, source) {
        const output = { ...target };
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach((key) => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        output[key] = source[key];
                    }
                    else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                }
                else {
                    output[key] = source[key];
                }
            });
        }
        return output;
    }
    /**
     * Check if value is a plain object
     */
    isObject(item) {
        return item && typeof item === "object" && !Array.isArray(item);
    }
    /**
     * Log configuration summary
     */
    logConfigSummary() {
        if (!this.config)
            return;
        this.logger.info("Configuration loaded successfully");
        this.logger.debug("Configuration sources:", {
            sources: this.configSources.map((s) => s.name),
        });
        const { resourceProviders } = this.config;
        // Log enabled providers
        const enabledProviders = [];
        if (resourceProviders.aitmpl.enabled)
            enabledProviders.push("aitmpl");
        if (resourceProviders.github.enabled)
            enabledProviders.push("github");
        if (resourceProviders.custom.enabled)
            enabledProviders.push("custom");
        this.logger.info(`Enabled providers: ${enabledProviders.join(", ") || "none"}`);
    }
    /**
     * Get current configuration
     */
    getConfig() {
        if (!this.config) {
            throw new Error("Configuration not loaded. Call load() first.");
        }
        return this.config;
    }
    /**
     * Reload configuration from all sources
     */
    async reload() {
        this.logger.info("Reloading configuration");
        this.config = null;
        this.configSources = [];
        return this.load();
    }
    /**
     * Update configuration at runtime with validation
     */
    async updateConfig(updates) {
        this.logger.info("Updating configuration at runtime");
        if (!this.config) {
            throw new Error("Configuration not loaded. Call load() first.");
        }
        // Merge updates with current config
        const updatedConfig = this.deepMerge(this.config, updates);
        // Validate updated configuration
        const validationResult = safeValidateConfig(updatedConfig);
        if (!validationResult.success) {
            this.logger.error("Configuration update validation failed", validationResult.errors);
            throw new Error(`Invalid configuration update: ${validationResult.errors?.map((e) => `${e.path}: ${e.message}`).join(", ")}`);
        }
        this.config = validationResult.data;
        this.logger.info("Configuration updated successfully");
        return this.config;
    }
    /**
     * Check if a specific provider is enabled
     */
    isProviderEnabled(provider) {
        if (!this.config) {
            throw new Error("Configuration not loaded. Call load() first.");
        }
        return this.config.resourceProviders[provider].enabled;
    }
    /**
     * Get configuration for a specific provider
     */
    getProviderConfig(provider) {
        if (!this.config) {
            throw new Error("Configuration not loaded. Call load() first.");
        }
        return this.config.resourceProviders[provider];
    }
}
//# sourceMappingURL=loader.js.map