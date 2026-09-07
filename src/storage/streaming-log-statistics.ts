import type { Log } from "../types.js";
import { streamLogs } from "./streaming-log-reader.js";

export interface StreamingStatistics {
  totalLogs: number;
  info: number;
  warnings: number;
  errors: number;
  byService: Record<string, number>;
  errorsByService: Record<string, number>;
}

export async function calculateStreamingStatistics(): Promise<StreamingStatistics> {
  let totalLogs = 0;
  let info = 0;
  let warnings = 0;
  let errors = 0;

  const byService: Record<string, number> = {};
  const errorsByService: Record<string, number> = {};

  await streamLogs((log: Log) => {
    totalLogs++;

    if (log.level === "INFO") info++;
    if (log.level === "WARN") warnings++;
    if (log.level === "ERROR") errors++;

    byService[log.service] =
      (byService[log.service] ?? 0) + 1;

    if (log.level === "ERROR") {
      errorsByService[log.service] =
        (errorsByService[log.service] ?? 0) + 1;
    }
  });

  return {
    totalLogs,
    info,
    warnings,
    errors,
    byService,
    errorsByService,
  };
}