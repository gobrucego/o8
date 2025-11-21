/**
 * Provider configuration module
 * Manages runtime configuration for resource providers
 */
import { Logger } from "../utils/logger.js";
import { ConfigLoader } from "./loader.js";
import { Config, AitmplProviderConfig, GithubProviderConfig, CustomProviderConfig } from "./schema.js";
export interface ProviderInfo {
    name: string;
    enabled: boolean;
    configured: boolean;
}
export declare class ProviderConfigManager {
    private logger;
    private configLoader;
    private config;
    constructor(logger: Logger, configLoader: ConfigLoader);
    /**
     * Initialize provider configuration
     */
    initialize(): Promise<void>;
    /**
     * Get list of all available providers
     */
    getAvailableProviders(): ProviderInfo[];
    /**
     * Get list of enabled providers
     */
    getEnabledProviders(): string[];
    /**
     * Check if AITMPL provider is properly configured
     */
    private isAitmplConfigured;
    /**
     * Check if GitHub provider is properly configured
     */
    private isGithubConfigured;
    /**
     * Check if Custom provider is properly configured
     */
    private isCustomConfigured;
    /**
     * Get AITMPL provider configuration
     */
    getAitmplConfig(): AitmplProviderConfig;
    /**
     * Get GitHub provider configuration
     */
    getGithubConfig(): GithubProviderConfig;
    /**
     * Get Custom provider configuration
     */
    getCustomConfig(): CustomProviderConfig;
    /**
     * Get provider defaults configuration
     */
    getProviderDefaults(): {
        cacheTTL: number;
        timeout: number;
        retryAttempts: number;
        priority: number;
    };
    /**
     * Enable a provider at runtime
     */
    enableProvider(provider: "aitmpl" | "github" | "custom"): Promise<void>;
    /**
     * Disable a provider at runtime
     */
    disableProvider(provider: "aitmpl" | "github" | "custom"): Promise<void>;
    /**
     * Update rate limits for a provider at runtime
     */
    updateRateLimits(provider: "aitmpl", limits: {
        requestsPerMinute?: number;
        requestsPerHour?: number;
    }): Promise<void>;
    /**
     * Update cache TTL for a provider at runtime
     */
    updateCacheTTL(provider: "aitmpl" | "github" | "custom", cacheTTL: number): Promise<void>;
    /**
     * Update timeout for a provider at runtime
     */
    updateTimeout(provider: "aitmpl" | "github" | "custom", timeout: number): Promise<void>;
    /**
     * Update retry attempts for a provider at runtime
     */
    updateRetryAttempts(provider: "aitmpl" | "github" | "custom", retryAttempts: number): Promise<void>;
    /**
     * Reload configuration from all sources
     */
    reload(): Promise<void>;
    /**
     * Get complete configuration
     */
    getConfig(): Config;
    /**
     * Ensure configuration is initialized
     */
    private ensureInitialized;
    /**
     * Validate provider configuration and log warnings
     */
    validateConfiguration(): {
        valid: boolean;
        warnings: string[];
        errors: string[];
    };
}
//# sourceMappingURL=providers.d.ts.map