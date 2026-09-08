import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { logInfo } from "./logger.js";
import { registerSystemHealthTool } from "./tools/system-health.js";

import { registerRecentLogsTool } from "./tools/recent-logs.js";
import { registerSearchLogsTool } from "./tools/search-logs.js";
import { registerAnalyzeLogsTool } from "./tools/analyze-logs.js";
import { registerTailLiveLogsTool } from "./tools/tail-live-logs.js";

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

const transport = new StdioServerTransport();

await server.connect(transport);

logInfo("MCP server started");