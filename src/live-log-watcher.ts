import { watch } from "node:fs";
import { stat, readFile } from "node:fs/promises";
import type { Log } from "./types.js";
import { logInfo, logWarn, logError } from "./logger.js";
const logFile = "logs/app.jsonl";

export async function watchLogs(
  onLog: (log: Log) => void | Promise<void>
): Promise<() => void> {
  let filePosition = 0;
  let processing = false;
  let pending = false;

  try {
    const fileStats = await stat(logFile);
    filePosition = fileStats.size;
  } catch (error) {
    logError("Failed to access log file:", logFile);
    logError("Error:", error);

    throw new Error(`Log file is not accessible: ${logFile}`);
  }

  logInfo("Starting from position:", filePosition);

  const watcher = watch(logFile, async () => {
    if (processing) {
      pending = true;
      return;
    }

     processing = true;

try {
  do {
    pending = false;

    const newStats = await stat(logFile);

    if (newStats.size < filePosition) {
       logWarn(
       "Log file was truncated or replaced. Resetting position."
               );
      filePosition = 0;
    }

    if (newStats.size === filePosition) {
      continue;
    }

    const fileContent = await readFile(logFile, "utf-8");

    const newContent = fileContent.slice(filePosition);

    filePosition = newStats.size;

    const newLines = newContent
      .split("\n")
      .filter((line) => line.trim().length > 0);

    for (const line of newLines) {
      try {
        const log = JSON.parse(line) as Log;

        await onLog(log);
      } catch (error) {
        logError("Failed to parse log line:", line);
        logError("Parse error:", error);
      }
    }
  } while (pending);
} finally {
  processing = false;
}
  });

  logInfo("Watching:", logFile);

  return () => {
    watcher.close();
    logInfo("Stopped watching:", logFile);
  };
}