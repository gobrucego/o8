import { Logger } from "../utils/logger.js";
import { PromptMetadata } from "../types.js";
export declare class PromptLoader {
    private logger;
    private promptsPath;
    private cache;
    private watcher?;
    constructor(logger: Logger);
    /**
     * Load all prompts from filesystem
     */
    loadAllPrompts(): Promise<PromptMetadata[]>;
    /**
     * Load prompts from a specific category directory
     */
    private loadPromptsFromCategory;
    /**
     * Load metadata from a prompt file
     */
    private loadPromptMetadata;
    /**
     * Load prompt content with argument substitution
     */
    loadPromptContent(metadata: PromptMetadata, args: Record<string, any>): Promise<string>;
    /**
     * Watch for changes in prompt files
     */
    watchForChanges(callback: () => void): void;
    /**
     * Stop watching for changes
     */
    stopWatching(): Promise<void>;
}
//# sourceMappingURL=promptLoader.d.ts.map