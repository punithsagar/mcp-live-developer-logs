import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
const server = new McpServer({
    name: "mcp-log-server",
    version: "1.0.0",
});
server.tool("hello", "Returns a greeting message", {}, async () => {
    return {
        content: [
            {
                type: "text",
                text: "Hello from my first MCP server!",
            },
        ],
    };
});
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map