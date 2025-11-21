import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
export class HTTPTransport {
    app;
    httpServer = null;
    wsServer = null;
    wsClients = new Set();
    config;
    mcpServer;
    stats;
    statsInterval = null;
    constructor(config, mcpServer, stats) {
        this.config = config;
        this.mcpServer = mcpServer;
        this.stats = stats;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // Parse JSON bodies
        this.app.use(express.json());
        // CORS support
        if (this.config.enableCORS) {
            this.app.use((req, res, next) => {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                res.header("Access-Control-Allow-Headers", "Content-Type");
                if (req.method === "OPTIONS") {
                    res.sendStatus(200);
                }
                else {
                    next();
                }
            });
        }
        // Serve static files
        this.app.use(express.static(this.config.staticPath));
    }
    setupRoutes() {
        // Health check
        this.app.get("/health", (req, res) => {
            res.json({ status: "ok", uptime: process.uptime() });
        });
        // MCP API endpoints
        this.app.post("/api/mcp/request", async (req, res) => {
            const startTime = Date.now();
            try {
                const { method, params } = req.body;
                if (!method) {
                    res.status(400).json({ error: "Missing method parameter" });
                    return;
                }
                const result = await this.mcpServer.handleRequest(method, params);
                const latency = Date.now() - startTime;
                this.stats.trackRequest(method, latency);
                res.json({ result });
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // Resource discovery endpoints
        this.app.get("/api/agents", async (req, res) => {
            const startTime = Date.now();
            try {
                const agents = await this.mcpServer.getAvailableAgents();
                const latency = Date.now() - startTime;
                this.stats.trackRequest("list_agents", latency);
                res.json({ agents });
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        this.app.get("/api/skills", async (req, res) => {
            const startTime = Date.now();
            try {
                const skills = await this.mcpServer.getAvailableSkills();
                const latency = Date.now() - startTime;
                this.stats.trackRequest("list_skills", latency);
                res.json({ skills });
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        this.app.get("/api/workflows", async (req, res) => {
            const startTime = Date.now();
            try {
                const workflows = await this.mcpServer.getAvailableWorkflows();
                const latency = Date.now() - startTime;
                this.stats.trackRequest("list_workflows", latency);
                res.json({ workflows });
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        this.app.get("/api/patterns", async (req, res) => {
            const startTime = Date.now();
            try {
                const patterns = await this.mcpServer.getAvailablePatterns();
                const latency = Date.now() - startTime;
                this.stats.trackRequest("list_patterns", latency);
                res.json({ patterns });
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        this.app.get("/api/search", async (req, res) => {
            const startTime = Date.now();
            try {
                const query = req.query.q;
                if (!query) {
                    res.status(400).json({ error: "Missing query parameter" });
                    return;
                }
                const results = await this.mcpServer.searchResources(query);
                const latency = Date.now() - startTime;
                this.stats.trackRequest("search_resources", latency);
                res.json({ results });
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        this.app.get("/api/resource", async (req, res) => {
            const startTime = Date.now();
            try {
                const uri = req.query.uri;
                if (!uri) {
                    res.status(400).json({ error: "Missing uri parameter" });
                    return;
                }
                const content = await this.mcpServer.getResourceContent(uri);
                const latency = Date.now() - startTime;
                this.stats.trackRequest("get_resource", latency);
                res.json({ content });
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        this.app.get("/api/stats", async (req, res) => {
            try {
                const snapshot = await this.stats.getSnapshot();
                res.json(snapshot);
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // ============================================================================
        // Provider Endpoints
        // ============================================================================
        // GET /api/providers - List all registered providers with status
        this.app.get("/api/providers", async (req, res) => {
            const startTime = Date.now();
            try {
                const providers = await this.mcpServer.getProviders();
                const latency = Date.now() - startTime;
                this.stats.trackRequest("list_providers", latency);
                res.json({ providers });
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // GET /api/providers/:name/resources - Get resources from a specific provider
        this.app.get("/api/providers/:name/resources", async (req, res) => {
            const startTime = Date.now();
            try {
                const { name } = req.params;
                const { category } = req.query;
                const index = await this.mcpServer.getProviderIndex(name);
                let resources = index.resources;
                if (category) {
                    resources = resources.filter((r) => r.category === category);
                }
                const latency = Date.now() - startTime;
                this.stats.trackRequest("provider_resources", latency);
                res.json({
                    provider: name,
                    totalCount: resources.length,
                    resources,
                });
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // GET /api/search/multi - Search across all providers
        this.app.get("/api/search/multi", async (req, res) => {
            const startTime = Date.now();
            try {
                const query = req.query.q;
                const sources = req.query.sources?.split(",") || ["all"];
                const categories = req.query.categories?.split(",");
                const maxResults = parseInt(req.query.maxResults) || 50;
                const minScore = parseInt(req.query.minScore) || 15;
                if (!query) {
                    res.status(400).json({ error: "Missing query parameter" });
                    return;
                }
                const results = await this.mcpServer.searchAllProviders(query, {
                    sources,
                    categories,
                    maxResults,
                    minScore,
                });
                // Group by provider
                const byProvider = results.reduce((acc, result) => {
                    const provider = result.source || result.resource?.source || "unknown";
                    if (!acc[provider])
                        acc[provider] = [];
                    acc[provider].push(result);
                    return acc;
                }, {});
                const latency = Date.now() - startTime;
                this.stats.trackRequest("multi_provider_search", latency);
                res.json({
                    query,
                    totalResults: results.length,
                    byProvider,
                    results,
                });
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // GET /api/providers/:name/health - Get health status for a specific provider
        this.app.get("/api/providers/:name/health", async (req, res) => {
            const startTime = Date.now();
            try {
                const { name } = req.params;
                const health = await this.mcpServer.getProviderHealth(name);
                const latency = Date.now() - startTime;
                this.stats.trackRequest("provider_health", latency);
                res.json(health);
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // GET /api/providers/health/all - Get health status for all providers
        this.app.get("/api/providers/health/all", async (req, res) => {
            const startTime = Date.now();
            try {
                const health = await this.mcpServer.getAllProvidersHealth();
                const latency = Date.now() - startTime;
                this.stats.trackRequest("all_providers_health", latency);
                res.json(health);
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // GET /api/providers/:name/stats - Get statistics for a specific provider
        this.app.get("/api/providers/:name/stats", async (req, res) => {
            const startTime = Date.now();
            try {
                const { name } = req.params;
                const stats = this.mcpServer.getProviderStats(name);
                const latency = Date.now() - startTime;
                this.stats.trackRequest("provider_stats", latency);
                res.json(stats);
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // POST /api/providers/:name/enable - Enable a provider
        this.app.post("/api/providers/:name/enable", async (req, res) => {
            const startTime = Date.now();
            try {
                const { name } = req.params;
                await this.mcpServer.enableProvider(name);
                const latency = Date.now() - startTime;
                this.stats.trackRequest("enable_provider", latency);
                res.json({ success: true, message: `Provider ${name} enabled` });
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // POST /api/providers/:name/disable - Disable a provider
        this.app.post("/api/providers/:name/disable", async (req, res) => {
            const startTime = Date.now();
            try {
                const { name } = req.params;
                await this.mcpServer.disableProvider(name);
                const latency = Date.now() - startTime;
                this.stats.trackRequest("disable_provider", latency);
                res.json({ success: true, message: `Provider ${name} disabled` });
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // ============================================================================
        // Token Efficiency API Endpoints
        // ============================================================================
        // GET /api/tokens/efficiency - Get efficiency snapshot
        this.app.get("/api/tokens/efficiency", async (req, res) => {
            try {
                if (!this.mcpServer.tokenSystem) {
                    res.status(503).json({ error: "Token tracking system not initialized" });
                    return;
                }
                const period = req.query.period || "last_hour";
                const snapshot = await this.mcpServer.tokenSystem.metrics.getEfficiencySnapshot({
                    period: period,
                });
                res.json(snapshot);
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // GET /api/tokens/summary - Get summary with recent stats
        this.app.get("/api/tokens/summary", async (req, res) => {
            try {
                if (!this.mcpServer.tokenSystem) {
                    res.status(503).json({ error: "Token tracking system not initialized" });
                    return;
                }
                const period = req.query.period || "last_hour";
                const summary = await this.mcpServer.tokenSystem.metrics.getSummary({
                    period: period,
                });
                res.json(summary);
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // GET /api/tokens/sessions/:id - Get session details
        this.app.get("/api/tokens/sessions/:id", async (req, res) => {
            try {
                if (!this.mcpServer.tokenSystem) {
                    res.status(503).json({ error: "Token tracking system not initialized" });
                    return;
                }
                const { id } = req.params;
                const session = this.mcpServer.tokenSystem.store.getSessionData(id);
                if (!session) {
                    res.status(404).json({ error: `Session ${id} not found` });
                    return;
                }
                // Convert Set to Array for JSON serialization
                const sessionData = {
                    ...session,
                    trackedMessageIds: Array.from(session.trackedMessageIds),
                };
                res.json(sessionData);
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // GET /api/tokens/by-category - Get metrics by category
        this.app.get("/api/tokens/by-category", async (req, res) => {
            try {
                if (!this.mcpServer.tokenSystem) {
                    res.status(503).json({ error: "Token tracking system not initialized" });
                    return;
                }
                const period = req.query.period || "last_hour";
                const snapshot = await this.mcpServer.tokenSystem.metrics.getEfficiencySnapshot({
                    period: period,
                });
                res.json({
                    categories: snapshot.byCategory,
                    timestamp: snapshot.timestamp,
                });
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // GET /api/tokens/cost-savings - Get cost savings report
        this.app.get("/api/tokens/cost-savings", async (req, res) => {
            try {
                if (!this.mcpServer.tokenSystem) {
                    res.status(503).json({ error: "Token tracking system not initialized" });
                    return;
                }
                const period = req.query.period || "last_hour";
                const summary = await this.mcpServer.tokenSystem.metrics.getSummary({
                    period: period,
                });
                const costReport = {
                    period,
                    totalCostUsd: summary.costUSD,
                    totalCostSavingsUsd: summary.costSavingsUSD,
                    baselineCostUsd: summary.costUSD + summary.costSavingsUSD,
                    efficiency: summary.efficiency,
                    tokensSaved: summary.tokensSaved,
                    timestamp: new Date(),
                };
                res.json(costReport);
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // GET /api/tokens/trends - Get trend data
        this.app.get("/api/tokens/trends", async (req, res) => {
            try {
                if (!this.mcpServer.tokenSystem) {
                    res.status(503).json({ error: "Token tracking system not initialized" });
                    return;
                }
                const period = req.query.period || "last_hour";
                const snapshot = await this.mcpServer.tokenSystem.metrics.getEfficiencySnapshot({
                    period: period,
                    includeTrend: true,
                });
                res.json({
                    trend: snapshot.trend,
                    overall: snapshot.overall,
                    timestamp: snapshot.timestamp,
                });
            }
            catch (error) {
                this.stats.trackError();
                res.status(500).json({ error: error.message });
            }
        });
        // Fallback to index.html for SPA routing
        this.app.get("*", (req, res) => {
            res.sendFile(path.join(this.config.staticPath, "index.html"));
        });
    }
    setupWebSocket(server) {
        this.wsServer = new WebSocketServer({ server });
        this.wsServer.on("connection", async (ws) => {
            console.error("[HTTP Transport] WebSocket client connected");
            this.wsClients.add(ws);
            // Send initial stats snapshot
            try {
                const snapshot = await this.stats.getSnapshot();
                ws.send(JSON.stringify({
                    type: "stats",
                    data: snapshot,
                }));
            }
            catch (error) {
                console.error("[HTTP Transport] Error sending initial stats:", error);
            }
            // Send activity history
            const activityHistory = this.stats.getActivityLog(100);
            ws.send(JSON.stringify({
                type: "activity_history",
                data: activityHistory,
            }));
            ws.on("close", () => {
                console.error("[HTTP Transport] WebSocket client disconnected");
                this.wsClients.delete(ws);
            });
            ws.on("error", (error) => {
                console.error("[HTTP Transport] WebSocket error:", error);
                this.wsClients.delete(ws);
            });
        });
        // Subscribe to stats updates and broadcast to all clients
        this.stats.subscribe((snapshot) => {
            this.broadcastStats(snapshot);
        });
        // Subscribe to activity events and broadcast to all clients
        this.stats.subscribeToActivity((event) => {
            this.broadcastActivity(event);
        });
        // Also send periodic updates every 2 seconds with provider health
        this.statsInterval = setInterval(async () => {
            const snapshot = this.stats.getSnapshot();
            // Include provider health if available
            try {
                const providersHealth = await this.mcpServer.getAllProvidersHealth();
                snapshot.providers = providersHealth;
            }
            catch (error) {
                // Provider system not initialized or error - continue without provider data
                console.debug("[HTTP Transport] Provider health unavailable:", error);
            }
            this.broadcastStats(snapshot);
        }, 2000);
    }
    broadcastStats(snapshot) {
        const message = JSON.stringify({
            type: "stats",
            data: snapshot,
        });
        this.wsClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    broadcastActivity(event) {
        const message = JSON.stringify({
            type: "activity",
            data: event,
        });
        this.wsClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.httpServer = this.app.listen(this.config.port, () => {
                    console.error(`[HTTP Transport] Server listening on port ${this.config.port}`);
                    console.error(`[HTTP Transport] Web UI: http://localhost:${this.config.port}`);
                    if (this.httpServer) {
                        this.setupWebSocket(this.httpServer);
                    }
                    resolve();
                });
                this.httpServer.on("error", (error) => {
                    console.error("[HTTP Transport] Server error:", error);
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async stop() {
        console.error("[HTTP Transport] Shutting down...");
        // Clear stats interval
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
        // Close WebSocket connections
        this.wsClients.forEach((client) => {
            client.close();
        });
        this.wsClients.clear();
        // Close WebSocket server
        if (this.wsServer) {
            await new Promise((resolve) => {
                this.wsServer.close(() => {
                    console.error("[HTTP Transport] WebSocket server closed");
                    resolve();
                });
            });
        }
        // Close HTTP server
        if (this.httpServer) {
            await new Promise((resolve) => {
                this.httpServer.close(() => {
                    console.error("[HTTP Transport] HTTP server closed");
                    resolve();
                });
            });
        }
    }
}
//# sourceMappingURL=http.js.map