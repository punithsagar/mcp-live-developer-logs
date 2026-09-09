import { z } from "zod";
import { getLogIndex, updateLogIndex } from "../log-service.js";
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
       const logIndex = await getLogIndex();

await updateLogIndex();

const cachedMetrics = logIndex.getCachedMetrics();

if (!cachedMetrics) {
  throw new Error("Metrics cache is not initialized");
}

const aggregation = cachedMetrics.aggregation;

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

      const recentLogs = logIndex.getRecentLogs();

const cutoff =
  Date.now() - minutes * 60 * 1000;

const filteredLogs = recentLogs.filter(
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