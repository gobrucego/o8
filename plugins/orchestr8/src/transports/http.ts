import express, { Express, Request, Response } from "express";
import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { StatsCollector } from "../stats/collector.js";
import type { TokenTracker } from "../token/tracker.js";
import type { TokenStore } from "../token/store.js";
import type { TokenMetrics } from "../token/metrics.js";
import type { EfficiencyEngine } from "../token/efficiency.js";

export interface HTTPTransportConfig {
  port: number;
  staticPath: string;
  enableCORS?: boolean;
}

export interface MCPServerInterface {
  handleRequest(method: string, params: any): Promise<any>;
  getAvailableAgents(): Promise<any[]>;
  getAvailableSkills(): Promise<any[]>;
  getAvailableWorkflows(): Promise<any[]>;
  getAvailablePatterns(): Promise<any[]>;
  searchResources(query: string): Promise<any[]>;
  getResourceContent(uri: string): Promise<string>;

  // Provider methods
  getProviders(): Promise<any[]>;
  getProviderIndex(name: string): Promise<any>;
  searchAllProviders(query: string, options?: any): Promise<any[]>;
  getProviderHealth(name: string): Promise<any>;
  getAllProvidersHealth(): Promise<Record<string, any>>;
  getProviderStats(name: string): any;
  enableProvider(name: string): Promise<void>;
  disableProvider(name: string): Promise<void>;

  // Token tracking system
  tokenSystem?: {
    tracker: TokenTracker;
    store: TokenStore;
    metrics: TokenMetrics;
    efficiency: EfficiencyEngine;
  };
}

export class HTTPTransport {
  private app: Express;
  private httpServer: HTTPServer | null = null;
  private wsServer: WebSocketServer | null = null;
  private wsClients: Set<WebSocket> = new Set();
  private config: HTTPTransportConfig;
  private mcpServer: MCPServerInterface;
  private stats: StatsCollector;
  private statsInterval: NodeJS.Timeout | null = null;

  constructor(
    config: HTTPTransportConfig,
    mcpServer: MCPServerInterface,
    stats: StatsCollector,
  ) {
    this.config = config;
    this.mcpServer = mcpServer;
    this.stats = stats;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
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
        } else {
          next();
        }
      });
    }

    // Serve static files
    this.app.use(express.static(this.config.staticPath));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/health", (req: Request, res: Response) => {
      res.json({ status: "ok", uptime: process.uptime() });
    });

    // MCP API endpoints
    this.app.post("/api/mcp/request", async (req: Request, res: Response) => {
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
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    // Resource discovery endpoints
    this.app.get("/api/agents", async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const agents = await this.mcpServer.getAvailableAgents();
        const latency = Date.now() - startTime;
        this.stats.trackRequest("list_agents", latency);
        res.json({ agents });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/api/skills", async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const skills = await this.mcpServer.getAvailableSkills();
        const latency = Date.now() - startTime;
        this.stats.trackRequest("list_skills", latency);
        res.json({ skills });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/api/workflows", async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const workflows = await this.mcpServer.getAvailableWorkflows();
        const latency = Date.now() - startTime;
        this.stats.trackRequest("list_workflows", latency);
        res.json({ workflows });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/api/patterns", async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const patterns = await this.mcpServer.getAvailablePatterns();
        const latency = Date.now() - startTime;
        this.stats.trackRequest("list_patterns", latency);
        res.json({ patterns });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/api/search", async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const query = req.query.q as string;
        if (!query) {
          res.status(400).json({ error: "Missing query parameter" });
          return;
        }

        const results = await this.mcpServer.searchResources(query);
        const latency = Date.now() - startTime;
        this.stats.trackRequest("search_resources", latency);
        res.json({ results });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/api/resource", async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const uri = req.query.uri as string;
        if (!uri) {
          res.status(400).json({ error: "Missing uri parameter" });
          return;
        }

        const content = await this.mcpServer.getResourceContent(uri);
        const latency = Date.now() - startTime;
        this.stats.trackRequest("get_resource", latency);
        res.json({ content });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/api/stats", async (req: Request, res: Response) => {
      try {
        const snapshot = await this.stats.getSnapshot();
        res.json(snapshot);
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    // ============================================================================
    // Provider Endpoints
    // ============================================================================

    // GET /api/providers - List all registered providers with status
    this.app.get("/api/providers", async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const providers = await this.mcpServer.getProviders();

        const latency = Date.now() - startTime;
        this.stats.trackRequest("list_providers", latency);

        res.json({ providers });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    // GET /api/providers/:name/resources - Get resources from a specific provider
    this.app.get(
      "/api/providers/:name/resources",
      async (req: Request, res: Response) => {
        const startTime = Date.now();
        try {
          const { name } = req.params;
          const { category } = req.query;

          const index = await this.mcpServer.getProviderIndex(name);

          let resources = index.resources;
          if (category) {
            resources = resources.filter((r: any) => r.category === category);
          }

          const latency = Date.now() - startTime;
          this.stats.trackRequest("provider_resources", latency);

          res.json({
            provider: name,
            totalCount: resources.length,
            resources,
          });
        } catch (error: any) {
          this.stats.trackError();
          res.status(500).json({ error: error.message });
        }
      },
    );

    // GET /api/search/multi - Search across all providers
    this.app.get("/api/search/multi", async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const query = req.query.q as string;
        const sources = (req.query.sources as string)?.split(",") || ["all"];
        const categories = (req.query.categories as string)?.split(",");
        const maxResults = parseInt(req.query.maxResults as string) || 50;
        const minScore = parseInt(req.query.minScore as string) || 15;

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
        const byProvider = results.reduce(
          (acc: Record<string, any[]>, result: any) => {
            const provider =
              result.source || result.resource?.source || "unknown";
            if (!acc[provider]) acc[provider] = [];
            acc[provider].push(result);
            return acc;
          },
          {} as Record<string, any[]>,
        );

        const latency = Date.now() - startTime;
        this.stats.trackRequest("multi_provider_search", latency);

        res.json({
          query,
          totalResults: results.length,
          byProvider,
          results,
        });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    // GET /api/providers/:name/health - Get health status for a specific provider
    this.app.get(
      "/api/providers/:name/health",
      async (req: Request, res: Response) => {
        const startTime = Date.now();
        try {
          const { name } = req.params;
          const health = await this.mcpServer.getProviderHealth(name);

          const latency = Date.now() - startTime;
          this.stats.trackRequest("provider_health", latency);

          res.json(health);
        } catch (error: any) {
          this.stats.trackError();
          res.status(500).json({ error: error.message });
        }
      },
    );

    // GET /api/providers/health/all - Get health status for all providers
    this.app.get(
      "/api/providers/health/all",
      async (req: Request, res: Response) => {
        const startTime = Date.now();
        try {
          const health = await this.mcpServer.getAllProvidersHealth();

          const latency = Date.now() - startTime;
          this.stats.trackRequest("all_providers_health", latency);

          res.json(health);
        } catch (error: any) {
          this.stats.trackError();
          res.status(500).json({ error: error.message });
        }
      },
    );

    // GET /api/providers/:name/stats - Get statistics for a specific provider
    this.app.get(
      "/api/providers/:name/stats",
      async (req: Request, res: Response) => {
        const startTime = Date.now();
        try {
          const { name } = req.params;
          const stats = this.mcpServer.getProviderStats(name);

          const latency = Date.now() - startTime;
          this.stats.trackRequest("provider_stats", latency);

          res.json(stats);
        } catch (error: any) {
          this.stats.trackError();
          res.status(500).json({ error: error.message });
        }
      },
    );

    // POST /api/providers/:name/enable - Enable a provider
    this.app.post(
      "/api/providers/:name/enable",
      async (req: Request, res: Response) => {
        const startTime = Date.now();
        try {
          const { name } = req.params;
          await this.mcpServer.enableProvider(name);

          const latency = Date.now() - startTime;
          this.stats.trackRequest("enable_provider", latency);

          res.json({ success: true, message: `Provider ${name} enabled` });
        } catch (error: any) {
          this.stats.trackError();
          res.status(500).json({ error: error.message });
        }
      },
    );

    // POST /api/providers/:name/disable - Disable a provider
    this.app.post(
      "/api/providers/:name/disable",
      async (req: Request, res: Response) => {
        const startTime = Date.now();
        try {
          const { name } = req.params;
          await this.mcpServer.disableProvider(name);

          const latency = Date.now() - startTime;
          this.stats.trackRequest("disable_provider", latency);

          res.json({ success: true, message: `Provider ${name} disabled` });
        } catch (error: any) {
          this.stats.trackError();
          res.status(500).json({ error: error.message });
        }
      },
    );

    // ============================================================================
    // Token Efficiency API Endpoints
    // ============================================================================

    // GET /api/tokens/efficiency - Get efficiency snapshot
    this.app.get("/api/tokens/efficiency", async (req: Request, res: Response) => {
      try {
        if (!this.mcpServer.tokenSystem) {
          res.status(503).json({ error: "Token tracking system not initialized" });
          return;
        }

        const period = (req.query.period as string) || "last_hour";
        const snapshot = await this.mcpServer.tokenSystem.metrics.getEfficiencySnapshot({
          period: period as any,
        });

        res.json(snapshot);
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    // GET /api/tokens/summary - Get summary with recent stats
    this.app.get("/api/tokens/summary", async (req: Request, res: Response) => {
      try {
        if (!this.mcpServer.tokenSystem) {
          res.status(503).json({ error: "Token tracking system not initialized" });
          return;
        }

        const period = (req.query.period as string) || "last_hour";
        const summary = await this.mcpServer.tokenSystem.metrics.getSummary({
          period: period as any,
        });

        res.json(summary);
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    // GET /api/tokens/sessions/:id - Get session details
    this.app.get("/api/tokens/sessions/:id", async (req: Request, res: Response) => {
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
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    // GET /api/tokens/by-category - Get metrics by category
    this.app.get("/api/tokens/by-category", async (req: Request, res: Response) => {
      try {
        if (!this.mcpServer.tokenSystem) {
          res.status(503).json({ error: "Token tracking system not initialized" });
          return;
        }

        const period = (req.query.period as string) || "last_hour";
        const snapshot = await this.mcpServer.tokenSystem.metrics.getEfficiencySnapshot({
          period: period as any,
        });

        res.json({
          categories: snapshot.byCategory,
          timestamp: snapshot.timestamp,
        });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    // GET /api/tokens/cost-savings - Get cost savings report
    this.app.get("/api/tokens/cost-savings", async (req: Request, res: Response) => {
      try {
        if (!this.mcpServer.tokenSystem) {
          res.status(503).json({ error: "Token tracking system not initialized" });
          return;
        }

        const period = (req.query.period as string) || "last_hour";
        const summary = await this.mcpServer.tokenSystem.metrics.getSummary({
          period: period as any,
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
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    // GET /api/tokens/trends - Get trend data
    this.app.get("/api/tokens/trends", async (req: Request, res: Response) => {
      try {
        if (!this.mcpServer.tokenSystem) {
          res.status(503).json({ error: "Token tracking system not initialized" });
          return;
        }

        const period = (req.query.period as string) || "last_hour";
        const snapshot = await this.mcpServer.tokenSystem.metrics.getEfficiencySnapshot({
          period: period as any,
          includeTrend: true,
        });

        res.json({
          trend: snapshot.trend,
          overall: snapshot.overall,
          timestamp: snapshot.timestamp,
        });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    // Fallback to index.html for SPA routing
    this.app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(this.config.staticPath, "index.html"));
    });
  }

  private setupWebSocket(server: HTTPServer): void {
    this.wsServer = new WebSocketServer({ server });

    this.wsServer.on("connection", async (ws: WebSocket) => {
      console.log("[HTTP Transport] WebSocket client connected");
      this.wsClients.add(ws);

      // Send initial stats snapshot
      try {
        const snapshot = await this.stats.getSnapshot();
        ws.send(
          JSON.stringify({
            type: "stats",
            data: snapshot,
          }),
        );
      } catch (error) {
        console.error("[HTTP Transport] Error sending initial stats:", error);
      }

      // Send activity history
      const activityHistory = this.stats.getActivityLog(100);
      ws.send(
        JSON.stringify({
          type: "activity_history",
          data: activityHistory,
        }),
      );

      ws.on("close", () => {
        console.log("[HTTP Transport] WebSocket client disconnected");
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
        (snapshot as any).providers = providersHealth;
      } catch (error) {
        // Provider system not initialized or error - continue without provider data
        console.debug("[HTTP Transport] Provider health unavailable:", error);
      }

      this.broadcastStats(snapshot);
    }, 2000);
  }

  private broadcastStats(snapshot: any): void {
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

  private broadcastActivity(event: any): void {
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

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.httpServer = this.app.listen(this.config.port, () => {
          console.log(
            `[HTTP Transport] Server listening on port ${this.config.port}`,
          );
          console.log(
            `[HTTP Transport] Web UI: http://localhost:${this.config.port}`,
          );

          if (this.httpServer) {
            this.setupWebSocket(this.httpServer);
          }

          resolve();
        });

        this.httpServer.on("error", (error) => {
          console.error("[HTTP Transport] Server error:", error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    console.log("[HTTP Transport] Shutting down...");

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
      await new Promise<void>((resolve) => {
        this.wsServer!.close(() => {
          console.log("[HTTP Transport] WebSocket server closed");
          resolve();
        });
      });
    }

    // Close HTTP server
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => {
          console.log("[HTTP Transport] HTTP server closed");
          resolve();
        });
      });
    }
  }
}
