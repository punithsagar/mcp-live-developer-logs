import { z } from "zod";
import { getLogIndex, updateLogIndex, readLogs } from "../log-service.js";
import { calculateLogStatistics } from "../log-statistics.js";
import { config } from "../config.js";
import { logError } from "../logger.js";

export function registerAnalyzeLogsTool(server: any): void {
  server.tool(
    "analyze_logs",
    "Analyze application logs and return statistics",
    {
      minutes: z
        .number()
        .int()
        .min(1)
        .max(config.recentLogs.maxMinutes)
        .optional()
        .describe("Only analyze logs from the last N minutes"),
    },

    async ({ minutes }: { minutes?: number }) => {
      try {
        const index = await getLogIndex();

        // Pick up any new logs added since the last update.
        await updateLogIndex();

        const aggregation = index.getAggregation();

        if (minutes === undefined) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(aggregation, null, 2),
              },
            ],
          };
        }

        const logs = await readLogs();

        const cutoff =
          Date.now() - minutes * 60 * 1000;

        const filteredLogs = logs.filter(
          (log) =>
            new Date(log.timestamp).getTime() >= cutoff
        );

        const statistics =
          calculateLogStatistics(filteredLogs);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  minutes,
                  ...statistics,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        logError("Failed to analyze logs:", error);

        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Failed to analyze logs.",
            },
          ],
        };
      }
    }
  );
}