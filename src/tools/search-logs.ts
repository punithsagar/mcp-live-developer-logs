
import { z } from "zod";
import { readLogs } from "../log-service.js";
import { logError } from "../logger.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sanitizeLogs } from "../security/sanitize-logs.js";

export function registerSearchLogsTool(server: McpServer): void {
  server.tool(
    "search_logs",
    "Search application logs by text",
    {
      query: z
        .string()
        .min(1)
        .describe("Text to search for in the logs"),
    },

    async ({ query }: { query: string }) => {
      try {
        const logs = await readLogs();

        const searchTerm = query.trim().toLowerCase();

        const matchingLogs = logs.filter((log) => {
          const searchableText = [
            log.message,
            log.service,
            log.level,
          ]
            .join(" ")
            .toLowerCase();

          return searchableText.includes(searchTerm);
        });

        const sanitizedResults = sanitizeLogs(matchingLogs);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  query,
                  searchTerm,
                  totalLogs: logs.length,
                  matches: sanitizedResults.length,
                  results: sanitizedResults,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        logError("Failed to search logs:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error:
                    error instanceof Error
                      ? error.message
                      : String(error),
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}

