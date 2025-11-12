/**
 * Configuration schema with Zod validation
 * Defines the structure and validation rules for resource provider configuration
 */

import { z } from "zod";

/**
 * Rate limit configuration schema
 */
const rateLimitSchema = z.object({
  requestsPerMinute: z.number().int().positive().default(60),
  requestsPerHour: z.number().int().positive().default(1000),
});

/**
 * AITMPL provider configuration schema
 */
const aitmplProviderSchema = z.object({
  enabled: z.boolean().default(true),
  apiUrl: z.string().url().default("https://api.aitmpl.com"),
  cacheTTL: z.number().int().positive().default(3600000), // 1 hour in ms
  categories: z.array(z.string()).default([
    "agents",
    "skills",
    "workflows",
    "patterns",
    "examples",
    "best-practices",
  ]),
  rateLimit: rateLimitSchema.default({
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  }),
  timeout: z.number().int().positive().default(30000), // 30 seconds
  retryAttempts: z.number().int().min(0).default(3),
});

/**
 * GitHub provider authentication schema
 */
const githubAuthSchema = z.object({
  token: z.string().min(1),
  type: z.enum(["personal", "oauth"]).default("personal"),
});

/**
 * GitHub provider configuration schema
 */
const githubProviderSchema = z.object({
  enabled: z.boolean().default(false),
  repos: z.array(z.string()).default([]),
  branch: z.string().default("main"),
  cacheTTL: z.number().int().positive().default(3600000), // 1 hour in ms
  auth: githubAuthSchema.optional(),
  timeout: z.number().int().positive().default(30000),
  retryAttempts: z.number().int().min(0).default(3),
});

/**
 * Custom endpoint configuration schema
 */
const customEndpointSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
});

/**
 * Custom provider configuration schema
 */
const customProviderSchema = z.object({
  enabled: z.boolean().default(false),
  endpoints: z.array(customEndpointSchema).default([]),
  cacheTTL: z.number().int().positive().default(3600000),
  timeout: z.number().int().positive().default(30000),
  retryAttempts: z.number().int().min(0).default(3),
});

/**
 * Resource providers configuration schema
 */
const resourceProvidersSchema = z.object({
  aitmpl: aitmplProviderSchema.default({}),
  github: githubProviderSchema.default({}),
  custom: customProviderSchema.default({}),
});

/**
 * Provider defaults configuration schema
 */
const providerDefaultsSchema = z.object({
  priority: z.number().int().min(0).default(100),
  cacheTTL: z.number().int().positive().default(3600000),
  timeout: z.number().int().positive().default(30000),
  retryAttempts: z.number().int().min(0).default(3),
});

/**
 * Complete configuration schema
 */
export const configSchema = z.object({
  resourceProviders: resourceProvidersSchema.default({}),
  providerDefaults: providerDefaultsSchema.default({}),
});

/**
 * Inferred TypeScript types from Zod schemas
 */
export type RateLimitConfig = z.infer<typeof rateLimitSchema>;
export type AitmplProviderConfig = z.infer<typeof aitmplProviderSchema>;
export type GithubAuthConfig = z.infer<typeof githubAuthSchema>;
export type GithubProviderConfig = z.infer<typeof githubProviderSchema>;
export type CustomEndpointConfig = z.infer<typeof customEndpointSchema>;
export type CustomProviderConfig = z.infer<typeof customProviderSchema>;
export type ResourceProvidersConfig = z.infer<typeof resourceProvidersSchema>;
export type ProviderDefaultsConfig = z.infer<typeof providerDefaultsSchema>;
export type Config = z.infer<typeof configSchema>;

/**
 * Validate configuration object
 * @param config - Configuration object to validate
 * @returns Validated and typed configuration
 * @throws ZodError if validation fails
 */
export function validateConfig(config: unknown): Config {
  return configSchema.parse(config);
}

/**
 * Safely validate configuration with detailed error messages
 * @param config - Configuration object to validate
 * @returns Result object with success status and data or errors
 */
export function safeValidateConfig(config: unknown): {
  success: boolean;
  data?: Config;
  errors?: Array<{ path: string; message: string }>;
} {
  const result = configSchema.safeParse(config);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => ({
    path: err.path.join("."),
    message: err.message,
  }));

  return { success: false, errors };
}

/**
 * Get default configuration
 * @returns Default configuration object
 */
export function getDefaultConfig(): Config {
  return configSchema.parse({});
}
