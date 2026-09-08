import { z } from "zod";
import { readLogs } from "../log-service.js";
import { logError } from "../logger.js";

export function registerSearchLogsTool(server: any): void {
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

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  query,
                  searchTerm,
                  totalLogs: logs.length,
                  matches: matchingLogs.length,
                  results: matchingLogs,
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
              text: JSON.stringify({
                error: "Failed to search logs",
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