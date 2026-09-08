import { z } from "zod";
import { watchLogs } from "../live-log-watcher.js";
import { config } from "../config.js";
import { logInfo, logWarn, logError } from "../logger.js";
import type { Log } from "../types.js";

export function registerTailLiveLogsTool(server: any): void {
  server.tool(
    "tail_live_logs",
    "Continuously watches the application log file and reports new logs as they arrive",
    {
      duration: z
        .number()
        .int()
        .min(1)
        .max(config.liveLogs.maxDuration)
        .default(config.liveLogs.defaultDuration)
        .describe("How long to watch for new logs, in seconds"),

      level: z
        .enum(["INFO", "WARN", "ERROR"])
        .optional()
        .describe("Only stream logs with this level"),

      service: z
        .string()
        .min(1)
        .optional()
        .describe("Only stream logs from this service"),

      max_logs: z
        .number()
        .int()
        .min(1)
        .max(config.liveLogs.maxLogs)
        .default(config.liveLogs.defaultMaxLogs)
        .describe("Maximum number of matching logs to collect"),
    },

    async (
  {
    duration,
    level,
    service,
    max_logs,
  }: {
    duration: number;
    level?: "INFO" | "WARN" | "ERROR";
    service?: string;
    max_logs: number;
  },
  extra: { signal: AbortSignal }
) =>  {
      try {
        const logs: Log[] = [];

        const stopWatching = await watchLogs(async (log) => {
          if (level && log.level !== level) {
            return;
          }

          if (service && log.service !== service) {
            return;
          }

          if (logs.length < max_logs) {
            logs.push(log);
          }

          logInfo("Live log:", log);

          await server.server.sendLoggingMessage({
            level: log.level.toLowerCase() as
              | "debug"
              | "info"
              | "notice"
              | "warning"
              | "error"
              | "critical"
              | "alert"
              | "emergency",
            data: JSON.stringify(log),
          });
        });

        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => {
            resolve();
          }, duration * 1000);

          extra.signal.addEventListener(
            "abort",
            () => {
              logWarn("MCP request cancelled");
              clearTimeout(timer);
              resolve();
            },
            { once: true }
          );
        });

        stopWatching();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  duration,
                  logsReceived: logs.length,
                  logs,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        logError("Failed to tail live logs:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Failed to stream live logs",
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