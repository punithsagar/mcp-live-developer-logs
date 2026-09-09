import { getSystemHealth } from "../system-health.js";
import { logError } from "../logger.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export function registerSystemHealthTool(server: McpServer): void {
  server.tool(
    "get_system_health",
    "Returns the current health and runtime status of the MCP log server",
    {},
    async () => {
      try {
        const health = await getSystemHealth();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(health, null, 2),
            },
          ],
        };
      } catch (error) {
        logError("Failed to get system health:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "WARNING",
                error: "Unable to determine system health",
                message:
                  error instanceof Error
                    ? error.message
                    : String(error),
              }),
            },
          ],
          isError: true,
        };
      }
    }
  );
}