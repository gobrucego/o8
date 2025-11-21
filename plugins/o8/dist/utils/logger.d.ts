/**
 * Logger utility for MCP server
 * IMPORTANT: Must write to stderr to avoid corrupting MCP protocol on stdout
 */
export declare class Logger {
    private name;
    private logLevel;
    constructor(name: string);
    private shouldLog;
    private formatMessage;
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, data?: any): void;
}
//# sourceMappingURL=logger.d.ts.map