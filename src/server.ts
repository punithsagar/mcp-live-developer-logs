import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerRecentLogsTool } from "./tools/recent-logs.js";
import { registerSearchLogsTool } from "./tools/search-logs.js";
import { registerAnalyzeLogsTool } from "./tools/analyze-logs.js";
import { registerTailLiveLogsTool } from "./tools/tail-live-logs.js";
import { registerSystemHealthTool } from "./tools/system-health.js";
import { registerMetricsResources } from "./resources/metrics.js";

export function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "mcp-log-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        logging: {},
      },
    }
  );

  registerRecentLogsTool(server);
  registerSearchLogsTool(server);
  registerAnalyzeLogsTool(server);
  registerTailLiveLogsTool(server);
  registerSystemHealthTool(server);
  registerMetricsResources(server);

  return server;
}