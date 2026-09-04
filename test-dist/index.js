import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFile } from "node:fs/promises";
import { z } from "zod";
const server = new McpServer({
    name: "mcp-log-server",
    version: "1.0.0",
});
const logFile = "logs/app.jsonl";
async function readLogs() {
    const file = await readFile(logFile, "utf-8");
    const lines = file
        .split("\n")
        .filter((line) => line.trim().length > 0);
    return lines.map((line) => JSON.parse(line));
}
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
}, async ({ level, limit }) => {
    const logs = await readLogs();
    const filteredLogs = level
        ? logs.filter((log) => log.level === level)
        : logs;
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
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map