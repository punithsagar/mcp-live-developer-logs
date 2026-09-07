import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import type { Log } from "../types.js";

const logFile = "logs/app.jsonl";

export async function streamLogs(
  onLog: (log: Log) => void
): Promise<void> {
  const stream = createReadStream(logFile, {
    encoding: "utf-8",
  });

  const readline = createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  try {
    for await (const line of readline) {
      if (!line.trim()) {
        continue;
      }

      try {
        const log = JSON.parse(line) as Log;
        onLog(log);
      } catch {
        // Ignore malformed log lines.
      }
    }
  } finally {
    readline.close();
    stream.destroy();
  }
}