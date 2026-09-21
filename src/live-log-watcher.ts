import { open, stat } from "node:fs/promises";
import { config } from "./config.js";
import { logInfo, logWarn, logError } from "./logger.js";

const logFile = config.logFile;
const POLL_INTERVAL_MS = 250;

export async function watchLogs(
  onLog: (log: any) => Promise<void> | void
) {
  let filePosition = 0;
  let remainder = "";
  let processing = false;
  let pending = false;
  let stopped = false;

  try {
    const fileStats = await stat(logFile);
    filePosition = fileStats.size;
  } catch (error) {
    logError("Failed to access log file:", logFile);
    logError("Error:", error);
    throw new Error(`Log file is not accessible: ${logFile}`);
  }

  logInfo("Starting from position:", filePosition);

  const processNewLogs = async () => {
    if (stopped) {
      return;
    }

    if (processing) {
      pending = true;
      return;
    }

    processing = true;

    try {
      do {
        pending = false;

        if (stopped) {
          return;
        }

        const newStats = await stat(logFile);

        if (newStats.size < filePosition) {
          logWarn(
            "Log file was truncated or replaced. Resetting position."
          );

          filePosition = 0;
          remainder = "";
        }

        if (newStats.size === filePosition) {
          continue;
        }

        const file = await open(logFile, "r");

        try {
          const bytesToRead = newStats.size - filePosition;

          const buffer = Buffer.alloc(bytesToRead);

          await file.read(
            buffer,
            0,
            bytesToRead,
            filePosition
          );

          filePosition = newStats.size;

          const content =
            remainder + buffer.toString("utf-8");

          const lines = content.split("\n");

          remainder = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) {
              continue;
            }

            try {
              const log = JSON.parse(line);
              await onLog(log);
            } catch (error) {
              logError(
                "Failed to parse log line:",
                line
              );

              logError(
                "Parse error:",
                error
              );
            }
          }
        } finally {
          await file.close();
        }
      } while (pending);
    } catch (error) {
      logError(
        "Failed to process new logs:",
        error
      );
    } finally {
      processing = false;
    }
  };

  const interval = setInterval(() => {
    void processNewLogs();
  }, POLL_INTERVAL_MS);

  logInfo(
    `Watching: ${logFile} using polling every ${POLL_INTERVAL_MS}ms`
  );

  return () => {
    stopped = true;
    clearInterval(interval);

    logInfo(
      "Stopped watching:",
      logFile
    );
  };
}