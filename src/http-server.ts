import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { logError, logInfo } from "./logger.js";
import { createMcpServer } from "./server.js";

import { config } from "./config.js";

const PORT = config.port;

const transports = new Map<
  string,
  {
    transport: StreamableHTTPServerTransport;
    server: ReturnType<typeof createMcpServer>;
  }
>();

const httpServer = createServer(async (req, res) => {
  try {
    // Health check endpoint
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          status: "healthy",
          service: "mcp-log-server",
        })
      );

      return;
    }

    if (!req.url || !req.url.startsWith("/mcp")) {
      res.writeHead(404, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          error: "Not Found",
        })
      );

      return;
    }

    if (
      req.method !== "POST" &&
      req.method !== "GET" &&
      req.method !== "DELETE"
    ) {
      res.writeHead(405, {
        "Content-Type": "application/json",
        Allow: "GET, POST, DELETE",
      });

      res.end(
        JSON.stringify({
          error: "Method Not Allowed",
        })
      );

      return;
    }

    const sessionId = req.headers["mcp-session-id"];

    let transport: StreamableHTTPServerTransport | undefined;
    let mcpServer: ReturnType<typeof createMcpServer> | undefined;

    if (typeof sessionId === "string") {
      const existingSession = transports.get(sessionId);

      if (!existingSession) {
        res.writeHead(404, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            error: "Session not found",
          })
        );

        return;
      }

      transport = existingSession.transport;
      mcpServer = existingSession.server;
    } else {
      if (req.method !== "POST") {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            error: "Session ID required",
          })
        );

        return;
      }

      mcpServer = createMcpServer();

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      });

      transport.onclose = () => {
        const closedSessionId = transport?.sessionId;

        if (closedSessionId) {
          transports.delete(closedSessionId);
          logInfo(`MCP HTTP session closed: ${closedSessionId}`);
        }
      };

      transport.onerror = (error) => {
        logError("MCP HTTP transport error:", error);
      };

      await mcpServer.connect(transport);

      await transport.handleRequest(req, res);

      const newSessionId = transport.sessionId;

      if (newSessionId) {
        transports.set(newSessionId, {
          transport,
          server: mcpServer,
        });

        logInfo(`MCP HTTP session created: ${newSessionId}`);
      }

      return;
    }

    await transport.handleRequest(req, res);
  } catch (error) {
    logError("HTTP MCP request failed:", error);

    if (!res.headersSent) {
      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
});

async function shutdown(signal: string): Promise<void> {
  logInfo(`Received ${signal}. Shutting down gracefully...`);

  for (const [sessionId, session] of transports) {
    try {
      await session.transport.close();
      await session.server.close();

      logInfo(`Closed MCP session: ${sessionId}`);
    } catch (error) {
      logError(`Failed to close MCP session ${sessionId}:`, error);
    }
  }

  transports.clear();

  httpServer.close((error) => {
    if (error) {
      logError("HTTP server shutdown failed:", error);
      process.exitCode = 1;
      return;
    }

    logInfo("HTTP server shut down cleanly");
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

httpServer.listen(PORT, () => {
  logInfo(
    `MCP Streamable HTTP server listening on http://localhost:${PORT}/mcp`
  );
});