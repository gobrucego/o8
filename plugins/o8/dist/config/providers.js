/**
 * Provider configuration module
 * Manages runtime configuration for resource providers
 */
export class ProviderConfigManager {
    logger;
    configLoader;
    config = null;
    constructor(logger, configLoader) {
        this.logger = logger;
        this.configLoader = configLoader;
    }
    /**
     * Initialize provider configuration
     */
    async initialize() {
        this.logger.info("Initializing provider configuration");
        this.config = await this.configLoader.load();
        this.logger.info("Provider configuration initialized");
    }
    /**
     * Get list of all available providers
     */
    getAvailableProviders() {
        this.ensureInitialized();
        return [
            {
                name: "aitmpl",
                enabled: this.config.resourceProviders.aitmpl.enabled,
                configured: this.isAitmplConfigured(),
            },
            {
                name: "github",
                enabled: this.config.resourceProviders.github.enabled,
                configured: this.isGithubConfigured(),
            },
            {
                name: "custom",
                enabled: this.config.resourceProviders.custom.enabled,
                configured: this.isCustomConfigured(),
            },
        ];
    }
    /**
     * Get list of enabled providers
     */
    getEnabledProviders() {
        return this.getAvailableProviders()
            .filter((p) => p.enabled && p.configured)
            .map((p) => p.name);
    }
    /**
     * Check if AITMPL provider is properly configured
     */
    isAitmplConfigured() {
        const config = this.config.resourceProviders.aitmpl;
        return !!(config.apiUrl && config.categories.length > 0);
    }
    /**
     * Check if GitHub provider is properly configured
     */
    isGithubConfigured() {
        const config = this.config.resourceProviders.github;
        return !!(config.repos.length > 0 && config.branch);
    }
    /**
     * Check if Custom provider is properly configured
     */
    isCustomConfigured() {
        const config = this.config.resourceProviders.custom;
        return config.endpoints.length > 0;
    }
    /**
     * Get AITMPL provider configuration
     */
    getAitmplConfig() {
        this.ensureInitialized();
        return this.config.resourceProviders.aitmpl;
    }
    /**
     * Get GitHub provider configuration
     */
    getGithubConfig() {
        this.ensureInitialized();
        return this.config.resourceProviders.github;
    }
    /**
     * Get Custom provider configuration
     */
    getCustomConfig() {
        this.ensureInitialized();
        return this.config.resourceProviders.custom;
    }
    /**
     * Get provider defaults configuration
     */
    getProviderDefaults() {
        this.ensureInitialized();
        return this.config.providerDefaults;
    }
    /**
     * Enable a provider at runtime
     */
    async enableProvider(provider) {
        this.ensureInitialized();
        this.logger.info(`Enabling provider: ${provider}`);
        const updates = {
            resourceProviders: {
                ...this.config.resourceProviders,
                [provider]: {
                    ...this.config.resourceProviders[provider],
                    enabled: true,
                },
            },
        };
        this.config = await this.configLoader.updateConfig(updates);
        this.logger.info(`Provider ${provider} enabled`);
    }
    /**
     * Disable a provider at runtime
     */
    async disableProvider(provider) {
        this.ensureInitialized();
        this.logger.info(`Disabling provider: ${provider}`);
        const updates = {
            resourceProviders: {
                ...this.config.resourceProviders,
                [provider]: {
                    ...this.config.resourceProviders[provider],
                    enabled: false,
                },
            },
        };
        this.config = await this.configLoader.updateConfig(updates);
        this.logger.info(`Provider ${provider} disabled`);
    }
    /**
     * Update rate limits for a provider at runtime
     */
    async updateRateLimits(provider, limits) {
        this.ensureInitialized();
        this.logger.info(`Updating rate limits for provider: ${provider}`, limits);
        const currentConfig = this.config.resourceProviders[provider];
        const updates = {
            resourceProviders: {
                ...this.config.resourceProviders,
                [provider]: {
                    ...currentConfig,
                    rateLimit: {
                        ...currentConfig.rateLimit,
                        ...limits,
                    },
                },
            },
        };
        this.config = await this.configLoader.updateConfig(updates);
        this.logger.info(`Rate limits updated for provider ${provider}`);
    }
    /**
     * Update cache TTL for a provider at runtime
     */
    async updateCacheTTL(provider, cacheTTL) {
        this.ensureInitialized();
        this.logger.info(`Updating cache TTL for provider: ${provider}`, { cacheTTL });
        const updates = {
            resourceProviders: {
                ...this.config.resourceProviders,
                [provider]: {
                    ...this.config.resourceProviders[provider],
                    cacheTTL,
                },
            },
        };
        this.config = await this.configLoader.updateConfig(updates);
        this.logger.info(`Cache TTL updated for provider ${provider}`);
    }
    /**
     * Update timeout for a provider at runtime
     */
    async updateTimeout(provider, timeout) {
        this.ensureInitialized();
        this.logger.info(`Updating timeout for provider: ${provider}`, { timeout });
        const updates = {
            resourceProviders: {
                ...this.config.resourceProviders,
                [provider]: {
                    ...this.config.resourceProviders[provider],
                    timeout,
                },
            },
        };
        this.config = await this.configLoader.updateConfig(updates);
        this.logger.info(`Timeout updated for provider ${provider}`);
    }
    /**
     * Update retry attempts for a provider at runtime
     */
    async updateRetryAttempts(provider, retryAttempts) {
        this.ensureInitialized();
        this.logger.info(`Updating retry attempts for provider: ${provider}`, { retryAttempts });
        const updates = {
            resourceProviders: {
                ...this.config.resourceProviders,
                [provider]: {
                    ...this.config.resourceProviders[provider],
                    retryAttempts,
                },
            },
        };
        this.config = await this.configLoader.updateConfig(updates);
        this.logger.info(`Retry attempts updated for provider ${provider}`);
    }
    /**
     * Reload configuration from all sources
     */
    async reload() {
        this.logger.info("Reloading provider configuration");
        this.config = await this.configLoader.reload();
        this.logger.info("Provider configuration reloaded");
    }
    /**
     * Get complete configuration
     */
    getConfig() {
        this.ensureInitialized();
        return this.config;
    }
    /**
     * Ensure configuration is initialized
     */
    ensureInitialized() {
        if (!this.config) {
            throw new Error("Provider configuration not initialized. Call initialize() first.");
        }
    }
    /**
     * Validate provider configuration and log warnings
     */
    validateConfiguration() {
        this.ensureInitialized();
        const warnings = [];
        const errors = [];
        // Check AITMPL configuration
        if (this.config.resourceProviders.aitmpl.enabled) {
            if (!this.isAitmplConfigured()) {
                warnings.push("AITMPL provider is enabled but not properly configured");
            }
        }
        // Check GitHub configuration
        if (this.config.resourceProviders.github.enabled) {
            if (!this.isGithubConfigured()) {
                warnings.push("GitHub provider is enabled but not properly configured (missing repos or branch)");
            }
            if (!this.config.resourceProviders.github.auth) {
                warnings.push("GitHub provider is enabled without authentication token (rate limits will apply)");
            }
        }
        // Check Custom configuration
        if (this.config.resourceProviders.custom.enabled) {
            if (!this.isCustomConfigured()) {
                warnings.push("Custom provider is enabled but has no endpoints configured");
            }
        }
        // Check if at least one provider is enabled
        const enabledProviders = this.getEnabledProviders();
        if (enabledProviders.length === 0) {
            warnings.push("No resource providers are enabled");
        }
        // Log warnings and errors
        warnings.forEach((warning) => this.logger.warn(warning));
        errors.forEach((error) => this.logger.error(error));
        return {
            valid: errors.length === 0,
            warnings,
            errors,
        };
    }
}
//# sourceMappingURL=providers.js.map