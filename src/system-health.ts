import { stat } from "node:fs/promises";
import { config } from "./config.js";
import { getLogIndex } from "./log-service.js";

const startedAt = Date.now();

export interface SystemHealth {
  status: "HEALTHY" | "WARNING";
  logFile: string;
  logFileSize: number;
  uptimeSeconds: number;
  totalLogsProcessed: number;
  errors: number;
  warnings: number;
  errorRate: number;
  timestamp: string;
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const fileStats = await stat(config.logFile);

  const logIndex = await getLogIndex();
  await logIndex.update();
  const aggregation = logIndex.getAggregation();

  const errorRate =
    aggregation.totalLogs === 0
      ? 0
      : (aggregation.errors / aggregation.totalLogs) * 100;

  const status =
    errorRate >= 10
      ? "WARNING"
      : "HEALTHY";

  return {
    status,
    logFile: config.logFile,
    logFileSize: fileStats.size,
    uptimeSeconds: Math.floor(
      (Date.now() - startedAt) / 1000
    ),
    totalLogsProcessed: aggregation.totalLogs,
    errors: aggregation.errors,
    warnings: aggregation.warnings,
    errorRate: Number(errorRate.toFixed(2)),
    timestamp: new Date().toISOString(),
  };
}