import { stat } from "node:fs/promises";
import { config } from "./config.js";

const startedAt = Date.now();

export interface SystemHealth {
  status: "HEALTHY" | "WARNING";
  logFile: string;
  logFileSize: number;
  uptimeSeconds: number;
  timestamp: string;
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const fileStats = await stat(config.logFile);

  return {
    status: "HEALTHY",
    logFile: config.logFile,
    logFileSize: fileStats.size,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  };
}