import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readLogs } from "./log-service.js";
import { watchLogs } from "./live-log-watcher.js";
import { z } from "zod";
const server = new McpServer({
    name: "mcp-log-server",
    version: "1.0.0",
}, {
    capabilities: {
        logging: {},
    },
});
// Tool 1: Get recent logs
server.tool("get_recent_logs", "Returns recent application logs, optionally filtered by log level", {
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
}, async ({ level, limit, minutes }) => {
    const logs = await readLogs();
    let filteredLogs = logs;
    if (minutes !== undefined) {
        const cutoffTime = Date.now() - minutes * 60 * 1000;
        filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp).getTime() >= cutoffTime);
    }
    if (level) {
        filteredLogs = filteredLogs.filter((log) => log.level === level);
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
});
// Tool 2: Search logs
server.tool("search_logs", "Search application logs by text", {
    query: z
        .string()
        .min(1)
        .describe("Text to search for in the logs"),
}, async ({ query }) => {
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
                text: JSON.stringify({
                    query,
                    searchTerm,
                    totalLogs: logs.length,
                    matches: matchingLogs.length,
                    results: matchingLogs,
                }, null, 2),
            },
        ],
    };
});
server.tool("tail_live_logs", "Continuously watches the application log file and reports new logs as they arrive", {
    duration: z
        .number()
        .int()
        .min(1)
        .max(300)
        .default(30)
        .describe("How long to watch for new logs, in seconds"),
}, async ({ duration }, extra) => {
    const logs = [];
    const stopWatching = await watchLogs(async (log) => {
        logs.push(log);
        console.error("Live log:", log);
        await server.server.sendLoggingMessage({
            level: log.level.toLowerCase(),
            data: JSON.stringify(log),
        });
    });
    await new Promise((resolve) => {
        const timer = setTimeout(() => {
            resolve();
        }, duration * 1000);
        extra.signal.addEventListener("abort", () => {
            console.error("MCP request cancelled");
            clearTimeout(timer);
            resolve();
        }, { once: true });
    });
    stopWatching();
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    duration,
                    logsReceived: logs.length,
                    logs,
                }, null, 2),
            },
        ],
    };
});
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map