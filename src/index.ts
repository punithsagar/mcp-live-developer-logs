import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logInfo } from "./logger.js";
import { createMcpServer } from "./server.js";

const server = createMcpServer();

const transport = new StdioServerTransport();

await server.connect(transport);

logInfo("MCP server started with stdio transport");