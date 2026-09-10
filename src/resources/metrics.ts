
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getLogIndex, updateLogIndex } from "../log-service.js";
import { calculateLogStatistics } from "../log-statistics.js";

function getServiceFromUri(uri: URL): string {
  return uri.href
    .replace("metrics://", "")
    .replace("/error-rate", "")
    .replace("/health", "")
    .replace("/summary", "");
}

export function registerMetricsResources(
  server: McpServer
): void {
  server.resource(
    "service-error-rate",
    "metrics://{service}/error-rate",
    {
      description: "Current error rate for a service",
      mimeType: "application/json",
    },
    async (uri) => {
      await updateLogIndex();

      const service = getServiceFromUri(uri);

      const logIndex = await getLogIndex();
      const logs = logIndex.getLogsByService(service);

      const totalLogs = logs.length;

      const errors = logs.filter(
        (log) => log.level === "ERROR"
      ).length;

      const errorRate =
        totalLogs === 0
          ? 0
          : Number(
              ((errors / totalLogs) * 100).toFixed(2)
            );

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                service,
                totalLogs,
                errors,
                errorRate,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.resource(
    "service-health",
    "metrics://{service}/health",
    {
      description: "Current health status for a service",
      mimeType: "application/json",
    },
    async (uri) => {
      await updateLogIndex();

      const service = getServiceFromUri(uri);

      const logIndex = await getLogIndex();
      const logs = logIndex.getLogsByService(service);

      const statistics = calculateLogStatistics(logs);

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                service,
                healthStatus:
                  statistics.serviceHealth[service] ??
                  "HEALTHY",
                errorRate:
                  statistics.errorRateByService[service] ??
                  0,
                errors:
                  statistics.errorsByService[service] ??
                  0,
                warnings:
                  statistics.warningsByService[service] ??
                  0,
                totalLogs: logs.length,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.resource(
    "service-summary",
    "metrics://{service}/summary",
    {
      description: "Detailed log summary for a service",
      mimeType: "application/json",
    },
    async (uri) => {
      await updateLogIndex();

      const service = getServiceFromUri(uri);

      const logIndex = await getLogIndex();
      const logs = logIndex.getLogsByService(service);

      const statistics = calculateLogStatistics(logs);

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                service,
                totalLogs: logs.length,
                info: statistics.info,
                warnings: statistics.warnings,
                errors: statistics.errors,
                errorRate: statistics.errorRate,
                warningRate: statistics.warningRate,
                healthStatus:
                  statistics.serviceHealth[service] ??
                  "HEALTHY",
                severityScore: statistics.severityScore,
                errorTrend: statistics.errorTrend,
                anomalies: statistics.anomalies,
                recommendations:
                  statistics.recommendations,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
