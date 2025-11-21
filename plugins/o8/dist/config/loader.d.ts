/**
 * Configuration loader with multi-source support
 * Loads configuration from environment variables, config files, and defaults
 */
import { Logger } from "../utils/logger.js";
import { Config } from "./schema.js";
export interface ConfigSource {
    name: string;
    priority: number;
    config: Partial<Config>;
}
export declare class ConfigLoader {
    private logger;
    private config;
    private configSources;
    private projectRoot;
    constructor(logger: Logger, projectRoot?: string);
    /**
     * Load configuration from all sources with priority order:
     * 1. Environment variables (highest priority)
     * 2. .orchestr8rc.json in project root
     * 3. orchestr8.config.json in user home
     * 4. Default configuration (fallback)
     */
    load(): Promise<Config>;
    /**
     * Load configuration from user home directory
     * ~/.orchestr8/config.json or ~/orchestr8.config.json
     */
    private loadUserConfig;
    /**
     * Load configuration from project root
     * .orchestr8rc.json or orchestr8.config.json
     */
    private loadProjectConfig;
    /**
     * Load configuration from environment variables
     * Supports ORCHESTR8_ prefixed variables
     */
    private loadEnvConfig;
    /**
     * Deep merge configuration objects with priority handling
     */
    private mergeConfigs;
    /**
     * Deep merge two objects
     */
    private deepMerge;
    /**
     * Check if value is a plain object
     */
    private isObject;
    /**
     * Log configuration summary
     */
    private logConfigSummary;
    /**
     * Get current configuration
     */
    getConfig(): Config;
    /**
     * Reload configuration from all sources
     */
    reload(): Promise<Config>;
    /**
     * Update configuration at runtime with validation
     */
    updateConfig(updates: Partial<Config>): Promise<Config>;
    /**
     * Check if a specific provider is enabled
     */
    isProviderEnabled(provider: "aitmpl" | "github" | "custom"): boolean;
    /**
     * Get configuration for a specific provider
     */
    getProviderConfig<T extends "aitmpl" | "github" | "custom">(provider: T): Config["resourceProviders"][T];
}
//# sourceMappingURL=loader.d.ts.map