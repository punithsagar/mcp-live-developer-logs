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

      service: z
        .string()
        .min(1)
        .optional()
        .describe("Only analyze logs from the specified service"),
    },

    async ({
      minutes,
      service,
    }: {
      minutes?: number;
      service?: string;
    }) => {
      try {
        const logIndex = await getLogIndex();

        await updateLogIndex();

        if (minutes === undefined && service === undefined) {
          const cachedMetrics = logIndex.getCachedMetrics();

          if (!cachedMetrics) {
            throw new Error("Metrics cache is not initialized");
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  cachedMetrics.aggregation,
                  null,
                  2
                ),
              },
            ],
          };
        }

        let logs = logIndex.getRecentLogs();

        if (service !== undefined) {
          logs = logIndex.getLogsByService(service);
        }

        if (minutes !== undefined) {
          const cutoff =
            Date.now() - minutes * 60 * 1000;

          logs = logs.filter(
            (log) =>
              new Date(log.timestamp).getTime() >= cutoff
          );
        }

        const statistics =
          calculateLogStatistics(logs);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ...(minutes !== undefined
                    ? { minutes }
                    : {}),
                  ...(service !== undefined
                    ? { service }
                    : {}),
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