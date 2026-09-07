import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readLogs, getLogIndex, updateLogIndex } from "./log-service.js";
import { calculateLogStatistics } from "./log-statistics.js";
import { watchLogs } from "./live-log-watcher.js";
import { z } from "zod";
import type { Log } from "./types.js";
import { logInfo, logWarn, logError } from "./logger.js";
const server = new McpServer(
  {
    name: "mcp-log-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      logging: {},
    },
  }
);




// Tool 1: Get recent logs
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
      .max(100)
      .default(10)
      .describe("Maximum number of logs to return"),
    minutes: z
      .number()
      .int()
      .min(1)
      .max(1440)
      .optional()
      .describe("Only include logs from the last N minutes"),
  },

  async ({ level, limit, minutes }) => {
    try {
    const logs = await readLogs();
    let filteredLogs = logs;

if (minutes !== undefined) {
  const cutoffTime = Date.now() - minutes * 60 * 1000;

  filteredLogs = filteredLogs.filter(
    (log) => new Date(log.timestamp).getTime() >= cutoffTime
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
          message: error instanceof Error ? error.message : String(error),
        }),
      },
    ],
    isError: true,
  };
}
  }
);

// Tool 2: Search logs
server.tool(
  "search_logs",
  "Search application logs by text",
  {
    query: z
      .string()
      .min(1)
      .describe("Text to search for in the logs"),
  },
  async ({ query }) => {
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
            message: error instanceof Error ? error.message : String(error),
          }),
        },
      ],
      isError: true,
    };
  }
}
);

// Tool 3: Analyze logs
server.tool(
  "analyze_logs",
  "Analyze application logs and return statistics",
  {
  minutes: z
    .number()
    .int()
    .min(1)
    .max(1440)
    .optional()
    .describe("Only analyze logs from the last N minutes"),
 },

  async ({ minutes }) => {
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

    const cutoff = Date.now() - minutes * 60 * 1000;

    const filteredLogs = logs.filter(
      (log) => new Date(log.timestamp).getTime() >= cutoff
    );

    const statistics = calculateLogStatistics(filteredLogs);

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
},
);
// 3 tail_live_logs
server.tool(
  "tail_live_logs",
  "Continuously watches the application log file and reports new logs as they arrive",
  {
    duration: z
      .number()
      .int()
      .min(1)
      .max(300)
      .default(30)
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
  .max(1000)
  .default(100)
  .describe("Maximum number of matching logs to collect"),
  },

  async ({ duration, level, service, max_logs }, extra) => {
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
            message: error instanceof Error ? error.message : String(error),
          }),
        },
      ],
      isError: true,
    };
  }
}
);
const transport = new StdioServerTransport();

await server.connect(transport);
logInfo("MCP server started");