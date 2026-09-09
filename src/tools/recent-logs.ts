import { z } from "zod";
import { readLogs } from "../log-service.js";
import { config } from "../config.js";
import { logError } from "../logger.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerRecentLogsTool(server: McpServer): void {
  server.tool(
    "get_recent_logs",
    "Returns recent application logs, optionally filtered by log level",
    {
      level: z
        .enum(["INFO", "WARN", "ERROR"])
        .optional()
        .describe("Filter logs by level"),

      limit: z
        .number()
        .int()
        .min(1)
        .max(config.recentLogs.maxLimit)
        .default(config.recentLogs.defaultLimit)
        .describe("Maximum number of logs to return"),

      minutes: z
        .number()
        .int()
        .min(1)
        .max(config.recentLogs.maxMinutes)
        .optional()
        .describe("Only include logs from the last N minutes"),
    },

    async ({ level, limit, minutes }: {
      level?: "INFO" | "WARN" | "ERROR";
      limit: number;
      minutes?: number;
    }) => {
      try {
        const logs = await readLogs();

        let filteredLogs = logs;

        if (minutes !== undefined) {
          const cutoffTime =
            Date.now() - minutes * 60 * 1000;

          filteredLogs = filteredLogs.filter(
            (log) =>
              new Date(log.timestamp).getTime() >= cutoffTime
          );
        }

        if (level) {
          filteredLogs = filteredLogs.filter(
            (log) => log.level === level
          );
        }

        const recentLogs = filteredLogs
          .slice(-limit)
          .reverse();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(recentLogs, null, 2),
            },
          ],
        };
      } catch (error) {
        logError("Failed to get recent logs:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Failed to read logs",
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